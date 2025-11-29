// js/cabinet.js
import { designApi } from "./api.js";

// IMPORTANT: Backend URL where images are served
const BACKEND_URL = "http://localhost:5000";

function buildModal(html) {
  const existing = document.getElementById("raweclub_modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "raweclub_modal";
  overlay.style =
    "position:fixed;inset:0;display:flex;align-items:flex-start;justify-content:center;padding-top:40px;background:rgba(0,0,0,0.45);z-index:9999;overflow-y:auto;";

  const box = document.createElement("div");
  box.style =
    "background:#fff;padding:18px;border-radius:8px;max-width:960px;width:94%;max-height:80vh;overflow:auto;margin-bottom:40px;";
  box.innerHTML = html;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  return box;
}

// Helper: render a side into a DataURL (for preview thumbnails)
function renderSideToDataURL(side) {
  return new Promise((resolve, reject) => {
    if (typeof fabric === "undefined") return reject(new Error("fabric not found"));

    const off = document.createElement("canvas");
    off.width = canvas.getWidth();
    off.height = canvas.getHeight();
    const offCanvas = new fabric.StaticCanvas(off, { backgroundColor: "#f9fafb" });

    const templatePath = side === "front" ? "./img/white-shirt.png" : "./img/back-side.png";

    fabric.Image.fromURL(
      templatePath,
      (tplImg) => {
        if (tplImg && tplImg.width) {
          const scale = Math.min(offCanvas.width / tplImg.width, offCanvas.height / tplImg.height) * 0.85;
          tplImg.scale(scale);
          tplImg.set({
            left: offCanvas.width / 2,
            top: offCanvas.height / 2,
            originX: "center",
            originY: "center",
            selectable: false,
            evented: false,
          });
          offCanvas.add(tplImg);
          offCanvas.sendToBack(tplImg);
        }

        const objectsArr = side === "front" ? window.frontObjects || [] : window.backObjects || [];
        let pending = objectsArr.length;

        if (pending === 0) {
          try {
            const d = offCanvas.toDataURL({ format: "png", quality: 1, multiplier: 2 });
            resolve(d);
          } catch (err) {
            reject(err);
          }
          return;
        }

        objectsArr.forEach((objData) => {
          try {
            const obj = fabric.util.object.clone(objData);
            fabric.Image.fromObject(
              obj,
              function (img) {
                img.set({ selectable: false, evented: false });
                offCanvas.add(img);
                pending--;
                if (pending === 0) {
                  setTimeout(() => {
                    try {
                      const d = offCanvas.toDataURL({ format: "png", quality: 1, multiplier: 2 });
                      resolve(d);
                    } catch (err) {
                      reject(err);
                    }
                  }, 150);
                }
              },
              { crossOrigin: "anonymous" }
            );
          } catch (e) {
            console.warn("object load error", e);
            pending--;
            if (pending === 0) {
              try {
                const d = offCanvas.toDataURL({ format: "png", quality: 1, multiplier: 2 });
                resolve(d);
              } catch (err) {
                reject(err);
              }
            }
          }
        });
      },
      { crossOrigin: "anonymous" }
    );
  });
}

async function openSaveDialog() {
  const html = `
    <h3 style="margin:0 0 8px;font-weight:700">Save Design</h3>
    <div style="display:flex;flex-direction:column;gap:10px">
      <input id="rawe_design_title" placeholder="Title (required)" style="border:1px solid #ccc;padding:8px;border-radius:4px" />
      <textarea id="rawe_design_desc" rows="3" placeholder="Description (optional)" style="border:1px solid #ccc;padding:8px;border-radius:4px"></textarea>
      <div style="display:flex;gap:8px">
        <button id="rawe_save_btn" style="background:#000;color:#fff;padding:8px 16px;border:none;border-radius:4px;cursor:pointer">Save</button>
        <button id="rawe_cancel_btn" style="background:#fff;border:1px solid #ccc;padding:8px 16px;border-radius:4px;cursor:pointer">Cancel</button>
      </div>
      <small style="color:#666">This will save your design with front and back images and the selected T-shirt color.</small>
    </div>
  `;
  const box = buildModal(html);
  box.querySelector("#rawe_cancel_btn").onclick = () => box.parentElement.remove();
  box.querySelector("#rawe_save_btn").onclick = async () => {
    const title = box.querySelector("#rawe_design_title").value.trim();
    const description = box.querySelector("#rawe_design_desc").value.trim();
    if (!title) return alert("Title required");

    try {
      const currentObjs = canvas
        .getObjects()
        .filter((o) => o !== window.tshirtTemplate)
        .map((o) => o.toObject());
      if (window.currentSide === "front") window.frontObjects = currentObjs;
      else window.backObjects = currentObjs;

      const frontData = await renderSideToDataURL("front");
      const backData = await renderSideToDataURL("back");

      const payload = {
        title,
        description,
        tshirtColor: window.currentColor || "#FFFFFF",
        frontImageBase64: frontData,
        backImageBase64: backData,
        frontObjects: window.frontObjects || [],
        backObjects: window.backObjects || [],
      };

      const res = await designApi.create(payload);
      if (res && res.design) {
        alert("Design saved successfully!");
        box.parentElement.remove();
        if (window.openMyDesignsPanel) window.openMyDesignsPanel();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Save failed");
    }
  };
}

// Open "My Designs" panel
async function openMyDesignsPanel() {
  const html = `
    <div class="flex items-center justify-between">
      <h3 class="text-md font-bold">My Designs</h3>
      <div class="flex gap-2">
        <button id="rawe_new_design_btn" class="p-2 bg-black text-white font-bold text-xs md:text-base rounded-md">Save Current</button>
        <button id="rawe_close_list_btn"  class="p-2 bg-black text-white font-bold text-xs md:text-base rounded-md">Close</button>
      </div>
    </div>
    <div id="rawe_designs_list" style="margin-top:12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px"></div>
  `;

  const box = buildModal(html);
  box.querySelector("#rawe_close_list_btn").onclick = () => box.parentElement.remove();
  box.querySelector("#rawe_new_design_btn").onclick = openSaveDialog;

  const listDiv = box.querySelector("#rawe_designs_list");
  listDiv.innerHTML = "Loading...";

  try {
    const res = await designApi.getMyDesigns();
    const designs = res.designs || [];
    console.log("Designs from API:", designs);

    if (designs.length === 0) {
      listDiv.innerHTML = "<div style='color:#666;padding:20px;text-align:center'>No designs yet. Create your first design!</div>";
    } else {
      listDiv.innerHTML = "";
      designs.forEach((d) => {
        const card = document.createElement("div");
        card.style =
          "border:1px solid #bbbbbbff;padding:8px;border-radius:6px;background:#fff;display:flex;flex-direction:column;gap:8px;cursor:pointer;transition:box-shadow 0.2s";
        card.onmouseenter = () => (card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)");
        card.onmouseleave = () => (card.style.boxShadow = "none");

        const imgWrapper = document.createElement("div");
        imgWrapper.style =
          "width:100%;height:150px;position:relative;background:#f5f5f5;border-radius:4px;overflow:hidden";

        const img = document.createElement("img");
        img.style = "width:100%;height:100%;object-fit:cover;display:block";
        img.alt = d.title;

        // FIXED: Properly construct the image URL
        if (d.frontImageUrl) {
          // Make sure the URL starts with http://
          const imageUrl = d.frontImageUrl.startsWith('http') 
            ? d.frontImageUrl 
            : `${BACKEND_URL}${d.frontImageUrl}`;
          
          img.src = imageUrl;
          
          // Add error handling for images
          img.onerror = function() {
            console.error('Failed to load image:', imageUrl);
            const placeholder = document.createElement("div");
            placeholder.style =
              "width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f5f5f5;color:#999;font-size:12px;";
            placeholder.textContent = "Image not available";
            imgWrapper.innerHTML = '';
            imgWrapper.appendChild(placeholder);
          };
          
          img.onload = function() {
            console.log('Image loaded successfully:', imageUrl);
          };
        } else {
          const placeholder = document.createElement("div");
          placeholder.style =
            "width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f5f5f5;color:#999;font-size:12px;";
          placeholder.textContent = "No preview";
          imgWrapper.appendChild(placeholder);
        }

        imgWrapper.appendChild(img);
        card.appendChild(imgWrapper);

        const title = document.createElement("div");
        title.textContent = d.title;
        title.style = "font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";

        const colorDot = document.createElement("div");
        colorDot.style = `width:16px;height:16px;border-radius:50%;background:${d.tshirtColor || '#FFFFFF'};border:1px solid #ddd;display:inline-block;vertical-align:middle;margin-left:4px;`;
        title.appendChild(colorDot);

        const row = document.createElement("div");
        row.style = "display:flex;gap:6px";

        const loadBtn = document.createElement("button");
        loadBtn.textContent = "Load";
        loadBtn.style =
          "flex:1;background:#000;color:#fff;padding:6px;border:none;border-radius:4px;cursor:pointer;font-size:12px";
        loadBtn.onclick = (e) => {
          e.stopPropagation();
          loadDesignToCanvas(d._id);
        };

        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.style =
          "flex:1;background:#fff;color:#dc2626;padding:6px;border:1px solid #dc2626;border-radius:4px;cursor:pointer;font-size:12px";
        delBtn.onclick = async (e) => {
          e.stopPropagation();
          if (!confirm(`Delete "${d.title}"?`)) return;
          try {
            await designApi.delete(d._id);
            card.remove();
            alert("Design deleted successfully!");
          } catch (err) {
            alert(err.message || "Delete failed");
          }
        };

        row.appendChild(loadBtn);
        row.appendChild(delBtn);

        card.appendChild(title);
        card.appendChild(row);
        listDiv.appendChild(card);
      });
    }
  } catch (err) {
    console.error("Error loading designs:", err);
    listDiv.innerHTML = `<div style='color:#900;padding:20px;text-align:center'>Failed to load designs: ${err.message || 'Unknown error'}</div>`;
  }
}

// Load design by id from server and restore to canvas
async function loadDesignToCanvas(id) {
  try {
    const res = await designApi.getDesign(id);
    const d = res.design;
    if (!d) return alert("Design not found");

    console.log("Loading design:", d);

    // Clear canvas first
    if (window.clearCanvas) window.clearCanvas();
    
    // Apply T-shirt color
    if (d.tshirtColor && window.changeColor) {
      window.changeColor(d.tshirtColor);
    }

    // Set the objects arrays
    if (d.frontObjects && Array.isArray(d.frontObjects)) {
      window.frontObjects = d.frontObjects;
    } else {
      window.frontObjects = [];
    }
    
    if (d.backObjects && Array.isArray(d.backObjects)) {
      window.backObjects = d.backObjects;
    } else {
      window.backObjects = [];
    }

    // Switch to front view
    if (window.switchSide) {
      window.switchSide("front");
    }

    // Load front objects onto canvas
    if (d.frontObjects && d.frontObjects.length > 0) {
      let pending = d.frontObjects.length;
      d.frontObjects.forEach((objData) => {
        fabric.Image.fromObject(
          objData,
          (img) => {
            img.set({
              cornerColor: "#000",
              cornerSize: 10,
              transparentCorners: false,
              borderColor: "#000",
              cornerStyle: "circle",
            });
            canvas.add(img);
            pending--;
            if (pending === 0) {
              canvas.renderAll();
            }
          },
          { crossOrigin: "anonymous" }
        );
      });
    } else {
      canvas.renderAll();
    }

    // Close modal
    const mod = document.getElementById("raweclub_modal");
    if (mod) mod.remove();

    alert("Design loaded successfully! Switch to back view to see back design.");
  } catch (err) {
    console.error("Error loading design:", err);
    alert(err.message || "Failed to load design");
  }
}

// Expose functions to window
window.openMyDesignsPanel = openMyDesignsPanel;
window.openSaveDialog = openSaveDialog;

export { openSaveDialog, openMyDesignsPanel, renderSideToDataURL };