// js/adminCabinet.js
import { adminApi } from "./adminApi.js";

// IMPORTANT: Backend URL where images are served
const BACKEND_URL = "http://localhost:5000";

/* ------------------------------------------
   Helper: Build modal
--------------------------------------------- */
function buildModal(html) {
  const existing = document.getElementById("raweclub_modal");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "raweclub_modal";
  overlay.style = `
    position:fixed;
    inset:0;
    display:flex;
    align-items:flex-start;
    justify-content:center;
    padding-top:40px;
    background:rgba(0,0,0,0.45);
    z-index:9999;
  `;

  const box = document.createElement("div");
  box.style = `
    background:#fff;
    padding:18px;
    border-radius:8px;
    max-width:960px;
    width:94%;
    max-height:80vh;
    overflow:auto;
  `;
  box.innerHTML = html;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  return box;
}

/* ------------------------------------------
   Helper: Full image URL
--------------------------------------------- */
function getImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}${path.startsWith("/") ? path : "/" + path}`;
}

/* ------------------------------------------
   Open Admin Cabinet Modal
--------------------------------------------- */
export async function openAdminCabinet() {
  const html = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3 style="margin:0 0 8px;font-weight:700">Users' Designs</h3>
      <button id="rawe_close_admin_btn" style="
        background:#fff;border:1px solid #ccc;
        padding:8px 16px;border-radius:4px;cursor:pointer;
      ">Close</button>
    </div>
    <div id="rawe_admin_designs_list" style="
      margin-top:12px;
      display:grid;
      grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
      gap:12px;
    ">Loading...</div>
  `;

  const box = buildModal(html);
  const listDiv = box.querySelector("#rawe_admin_designs_list");

  box.querySelector("#rawe_close_admin_btn").onclick = () => box.parentElement.remove();

  try {
    const res = await adminApi.getAllDesigns();
    const designs = res.designs || [];
    if (designs.length === 0) {
      listDiv.innerHTML = "<div style='color:#666'>No designs yet</div>";
      return;
    }

    listDiv.innerHTML = "";

    designs.forEach((d) => {
      const card = document.createElement("div");
      card.style = `
        border:1px solid #eee;
        padding:8px;
        border-radius:6px;
        background:#fff;
        display:flex;
        flex-direction:column;
        gap:6px;
        cursor:pointer;
        transition:box-shadow 0.2s;
      `;
      card.onmouseenter = () => card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      card.onmouseleave = () => card.style.boxShadow = "none";

      const img = document.createElement("img");
      img.style = "width:100%;height:120px;object-fit:cover;border-radius:4px;background:#f5f5f5";
      img.src = getImageUrl(d.frontImageUrl || "");
      img.onerror = () => {
        img.style.display = "none";
        const placeholder = document.createElement("div");
        placeholder.style = "width:100%;height:120px;display:flex;align-items:center;justify-content:center;background:#f5f5f5;border-radius:4px;color:#999";
        placeholder.textContent = "No preview";
        img.parentElement.insertBefore(placeholder, img);
      };

      const title = document.createElement("div");
      title.textContent = `${d.title} (${d.owner.firstname || ''} ${d.owner.lastname || ''})`;
      title.style = "font-weight:600;font-size:13px";

      const row = document.createElement("div");
      row.style = "display:flex;gap:6px";

      const loadBtn = document.createElement("button");
      loadBtn.textContent = "View";
      loadBtn.style = `
        flex:1;
        background:#000;color:#fff;
        padding:6px;
        border:none;
        border-radius:4px;
        cursor:pointer;
        font-size:12px;
      `;
      loadBtn.onclick = (e) => {
        e.stopPropagation();
        openDesignPreview(d);
      };

      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.style = `
        flex:1;
        background:#fff;color:#dc2626;
        padding:6px;
        border:1px solid #dc2626;
        border-radius:4px;
        cursor:pointer;
        font-size:12px;
      `;
      delBtn.onclick = async (e) => {
        e.stopPropagation();
        if (!confirm("Delete this design?")) return;
        try {
          await adminApi.deleteDesign(d._id);
          card.remove();
        } catch (err) {
          alert(err.message || "Delete failed");
        }
      };

      row.appendChild(loadBtn);
      row.appendChild(delBtn);

      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(row);

      listDiv.appendChild(card);
    });

  } catch (err) {
    console.error("Failed to load admin designs", err);
    listDiv.innerHTML = "<div style='color:#900'>Failed to load designs</div>";
  }
}

/* ------------------------------------------
   Open design preview modal
--------------------------------------------- */
function openDesignPreview(d) {
  const html = `
    <h3 style="margin:0 0 8px;font-weight:700">${d.title}</h3>
    <div style="display:flex;gap:12px">
      <div style="flex:1">
        <div style="font-size:12px;color:#555;margin-bottom:4px">Owner:</div>
        <div style="font-size:14px;font-weight:600;margin-bottom:8px">
          ${d.owner.firstname || ""} ${d.owner.lastname || ""} (${d.owner.email || ""})
        </div>
        <img src="${getImageUrl(d.frontImageUrl || "")}" style="width:100%;border-radius:6px;margin-bottom:6px" />
        <img src="${getImageUrl(d.backImageUrl || "")}" style="width:100%;border-radius:6px" />
      </div>
      <div style="flex:1">
        <div style="font-size:12px;color:#555;margin-bottom:4px">Description:</div>
        <div style="font-size:14px">${d.description || "No description"}</div>
      </div>
    </div>
  `;
  buildModal(html);
}

// Expose to window for admin navbar
window.openAdminCabinet = openAdminCabinet;
