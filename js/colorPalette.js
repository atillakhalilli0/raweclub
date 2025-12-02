const colorPicker = new iro.ColorPicker("#colorWheel", {
   width: 220,
   color: "#ffffff",
   borderWidth: 1,
   borderColor: "#ccc",
});

colorPicker.on("color:change", (color) => {
   const hex = color.hexString;
   window.changeColor(hex);
});

function selectColor(color) {
   window.changeColor(color);

   document.querySelectorAll(".color-preset").forEach((btn) => {
      btn.classList.remove("selected");
   });
   event.target.classList.add("selected");
}
