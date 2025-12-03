let canvas;
let tshirtTemplate = null;
let isLoadingTemplate = false;

// USE WINDOW GLOBALS - This is critical for cabinet.js to work
window.currentSide = "front";
window.currentColor = "#FFFFFF";
window.frontObjects = [];
window.backObjects = [];

// Initialize canvas with proper sizing
function initCanvas() {
   const container = document.getElementById("canvasContainer");
   const containerWidth = container.offsetWidth;

   // Set canvas size based on screen
   let canvasWidth, canvasHeight;
   if (window.innerWidth < 1024) {
      // Mobile: use full container width
      canvasWidth = Math.min(containerWidth, 400);
      canvasHeight = canvasWidth * 1.2;
   } else {
      // Desktop: fixed size
      canvasWidth = 500;
      canvasHeight = 600;
   }

   canvas = new fabric.Canvas("canvas", {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#f9fafb",
   });

   createTshirtTemplate();
}

// Reinitialize on resize
let resizeTimeout;
window.addEventListener("resize", function () {
   clearTimeout(resizeTimeout);
   resizeTimeout = setTimeout(function () {
      const container = document.getElementById("canvasContainer");
      const containerWidth = container.offsetWidth;

      let canvasWidth, canvasHeight;
      if (window.innerWidth < 1024) {
         canvasWidth = Math.min(containerWidth, 400);
         canvasHeight = canvasWidth * 1.2;
      } else {
         canvasWidth = 500;
         canvasHeight = 600;
      }

      canvas.setWidth(canvasWidth);
      canvas.setHeight(canvasHeight);

      // Reload template with new size
      createTshirtTemplate();
   }, 250);
});

// Load T-shirt template
function createTshirtTemplate(side = "front", callback) {
   if (isLoadingTemplate) return;
   isLoadingTemplate = true;

   const imagePath = side === "front" ? "./img/white-shirt.png" : "./img/back-side.png";

   fabric.Image.fromURL(
      imagePath,
      function (img) {
         if (!img || !img.width) {
            console.error("Failed to load image:", imagePath);
            isLoadingTemplate = false;
            return;
         }

         const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.85;

         img.scale(scale);
         img.set({
            left: canvas.width / 2,
            top: canvas.height / 2,
            originX: "center",
            originY: "center",
            selectable: false,
            evented: false,
         });

         if (tshirtTemplate) {
            canvas.remove(tshirtTemplate);
         }

         tshirtTemplate = img;
         applyColorToTemplate(window.currentColor);

         canvas.add(tshirtTemplate);
         canvas.sendToBack(tshirtTemplate);
         canvas.renderAll();

         isLoadingTemplate = false;

         if (callback) callback();
      },
      { crossOrigin: "anonymous" }
   );
}

// Apply color filter
function applyColorToTemplate(color) {
   if (!tshirtTemplate) return;

   tshirtTemplate.filters = [];

   if (color !== "#FFFFFF") {
      tshirtTemplate.filters.push(
         new fabric.Image.filters.BlendColor({
            color: color,
            mode: "tint",
            alpha: 0.83,
         })
      );
   }

   tshirtTemplate.applyFilters();
}

// Side switch
function switchSide(side) {
   if (isLoadingTemplate || window.currentSide === side) return;

   const currentObjects = canvas.getObjects().filter((obj) => obj !== tshirtTemplate);
   const serializedObjects = currentObjects.map((obj) => obj.toObject(["selectable", "evented", "cornerColor", "cornerSize", "transparentCorners", "borderColor", "cornerStyle"]));

   // Save current side's objects to global array
   if (window.currentSide === "front") {
      window.frontObjects = serializedObjects;
   } else {
      window.backObjects = serializedObjects;
   }

   // Remove all objects except template
   canvas.getObjects().forEach((obj) => {
      if (obj !== tshirtTemplate) {
         canvas.remove(obj);
      }
   });

   // Update current side
   window.currentSide = side;

   // Load template for new side
   createTshirtTemplate(side, function () {
      const objectsToLoad = side === "front" ? window.frontObjects : window.backObjects;

      // console.log(`Switching to ${side} side. Loading ${objectsToLoad.length} objects`);

      if (objectsToLoad.length === 0) {
         canvas.renderAll();
         return;
      }

      let loadedCount = 0;
      objectsToLoad.forEach((objData) => {
         fabric.Image.fromObject(objData, function (img) {
            img.set({
               cornerColor: "#000",
               cornerSize: 10,
               transparentCorners: false,
               borderColor: "#000",
               cornerStyle: "circle",
            });
            canvas.add(img);
            loadedCount++;

            if (loadedCount === objectsToLoad.length) {
               canvas.renderAll();
               // console.log(`Successfully loaded ${loadedCount} objects on ${side} side`);
            }
         });
      });
   });

   // Update button styles
   const frontBtn = document.getElementById("frontBtn");
   const backBtn = document.getElementById("backBtn");

   if (side === "front") {
      frontBtn.className = "py-2.5 border-2 border-black bg-black text-white rounded-full font-medium transition-all text-sm";
      backBtn.className = "py-2.5 border-2 border-gray-300 bg-white text-black rounded-full font-medium hover:border-black transition-all text-sm";
   } else {
      backBtn.className = "py-2.5 border-2 border-black bg-black text-white rounded-full font-medium transition-all text-sm";
      frontBtn.className = "py-2.5 border-2 border-gray-300 bg-white text-black rounded-full font-medium hover:border-black transition-all text-sm";
   }
}

// Photo upload
document.getElementById("imageUpload").addEventListener("change", function (e) {
   const file = e.target.files[0];
   if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
         fabric.Image.fromURL(event.target.result, function (img) {
            const maxWidth = canvas.width * 0.4;
            img.scaleToWidth(maxWidth);
            img.set({
               left: canvas.width / 2,
               top: canvas.height / 2,
               originX: "center",
               originY: "center",
               cornerColor: "#000",
               cornerSize: 10,
               transparentCorners: false,
               borderColor: "#000",
               cornerStyle: "circle",
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
         });
      };
      reader.readAsDataURL(file);
   }
   e.target.value = "";
});

function changeColor(color) {
   window.currentColor = color;
   applyColorToTemplate(color);
   canvas.renderAll();
}

function centerImage() {
   const activeObject = canvas.getActiveObject();
   if (activeObject && activeObject.type === "image" && activeObject !== tshirtTemplate) {
      activeObject.set({
         left: canvas.width / 2,
         top: canvas.height / 2,
         originX: "center",
         originY: "center",
      });
      canvas.renderAll();
   } else {
      alert("Please select a photo first!");
   }
}

function deleteSelected() {
   const activeObject = canvas.getActiveObject();
   if (activeObject && activeObject !== tshirtTemplate) {
      canvas.remove(activeObject);
      canvas.renderAll();
   }
}

function clearCanvas() {
   const objects = canvas.getObjects();
   objects.forEach((obj) => {
      if (obj !== tshirtTemplate) {
         canvas.remove(obj);
      }
   });

   // Clear the global arrays based on current side
   if (window.currentSide === "front") {
      window.frontObjects = [];
   } else {
      window.backObjects = [];
   }

   canvas.renderAll();
}

async function downloadAndSave() {
   // Save current side's objects before generating images
   const currentObjects = canvas.getObjects().filter((obj) => obj !== tshirtTemplate);
   const serializedObjects = currentObjects.map((obj) => obj.toObject(["selectable", "evented", "cornerColor", "cornerSize", "transparentCorners", "borderColor", "cornerStyle"]));

   if (window.currentSide === "front") {
      window.frontObjects = serializedObjects;
   } else {
      window.backObjects = serializedObjects;
   }

   // Remove selection box
   canvas.discardActiveObject();
   canvas.renderAll();

   // Generate current side PNG
   const currentSideDataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
   });

   // Download locally
   const link = document.createElement("a");
   link.download = `raweclub-tshirt-${window.currentSide}.png`;
   link.href = currentSideDataURL;
   link.click();

   // Check login
   const token = localStorage.getItem("raweclub_token");
   if (!token) {
      alert("Please login to save your design.");
      return;
   }

   // Generate both front and back preview images
   try {
      const frontPreview = await renderSidePreview("front");
      const backPreview = await renderSidePreview("back");

      const body = {
         title: prompt("Enter design title:", "My Design") || "My Design",
         description: prompt("Enter description:", "My Description") || "My Description",
         tshirtColor: window.currentColor,
         frontImageBase64: frontPreview,
         backImageBase64: backPreview,
         // Save the actual fabric.js objects for proper loading
         frontObjects: window.frontObjects,
         backObjects: window.backObjects,
      };

      const res = await fetch("https://rawnclub-back.onrender.com/api/designs", {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify(body),
      });

      const result = await res.json();

      if (result.success) {
         alert("Design saved to your cabinet!");
      } else {
         alert("Failed to save design: " + result.message);
      }
   } catch (error) {
      console.error("Save design error:", error);
      alert("Failed to save design.");
   }
}

// Helper function to render a side preview
async function renderSidePreview(side) {
   return new Promise((resolve, reject) => {
      // Create offscreen canvas
      const offCanvas = document.createElement("canvas");
      offCanvas.width = canvas.width;
      offCanvas.height = canvas.height;

      const tempCanvas = new fabric.Canvas(offCanvas, {
         backgroundColor: "#f9fafb",
      });

      const templatePath = side === "front" ? "./img/white-shirt.png" : "./img/back-side.png";

      // Load template
      fabric.Image.fromURL(
         templatePath,
         (tplImg) => {
            if (!tplImg || !tplImg.width) {
               reject(new Error("Failed to load template"));
               return;
            }

            const scale = Math.min(tempCanvas.width / tplImg.width, tempCanvas.height / tplImg.height) * 0.85;

            tplImg.scale(scale);
            tplImg.set({
               left: tempCanvas.width / 2,
               top: tempCanvas.height / 2,
               originX: "center",
               originY: "center",
               selectable: false,
               evented: false,
            });

            // Apply color filter
            if (window.currentColor !== "#FFFFFF") {
               tplImg.filters.push(
                  new fabric.Image.filters.BlendColor({
                     color: window.currentColor,
                     mode: "tint",
                     alpha: 0.83,
                  })
               );
               tplImg.applyFilters();
            }

            tempCanvas.add(tplImg);
            tempCanvas.sendToBack(tplImg);

            // Load objects for this side
            const objectsToLoad = side === "front" ? window.frontObjects : window.backObjects;

            if (objectsToLoad.length === 0) {
               tempCanvas.renderAll();
               const dataURL = tempCanvas.toDataURL({ format: "png", quality: 1, multiplier: 2 });
               resolve(dataURL);
               return;
            }

            let loadedCount = 0;
            objectsToLoad.forEach((objData) => {
               fabric.Image.fromObject(objData, (img) => {
                  img.set({
                     selectable: false,
                     evented: false,
                  });
                  tempCanvas.add(img);
                  loadedCount++;

                  if (loadedCount === objectsToLoad.length) {
                     tempCanvas.renderAll();
                     setTimeout(() => {
                        const dataURL = tempCanvas.toDataURL({ format: "png", quality: 1, multiplier: 2 });
                        resolve(dataURL);
                     }, 100);
                  }
               });
            });
         },
         { crossOrigin: "anonymous" }
      );
   });
}

document.addEventListener("keydown", function (e) {
   if (e.key === "Delete" || e.key === "Backspace") {
      const activeElement = document.activeElement;
      if (activeElement.tagName !== "INPUT" && activeElement.tagName !== "TEXTAREA") {
         e.preventDefault();
         deleteSelected();
      }
   }
});

// Expose functions to window for cabinet.js
window.canvas = canvas;
window.tshirtTemplate = tshirtTemplate;
window.switchSide = switchSide;
window.changeColor = changeColor;
window.clearCanvas = clearCanvas;

// Initialize
initCanvas();
