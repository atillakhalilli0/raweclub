// js/auth.js
import { authApi } from "./api.js";

/*  
  This file:

  ✔ Injects Login / Sign Up / My Designs / Logout buttons into your actual navbar
  ✔ Opens login & signup modals
  ✔ Stores JWT token in localStorage
  ✔ Loads current user with /api/auth/me
  ✔ Works with cabinet.js and adminCabinet.js
*/

let currentUser = null;

/* ------------------------------------------
   NAVBAR UI INJECTION
--------------------------------------------- */
function createAuthUI() {
   const rightSide = document.getElementById("right-side");
   if (!rightSide) {
      console.error("RAWECLUB Auth: Could not find navbar right side element.");
      return;
   }

   let ctl = document.getElementById("raweclub_auth_ui");
   if (!ctl) {
      ctl = document.createElement("div");
      ctl.id = "raweclub_auth_ui";
      ctl.className = "flex items-center space-x-4 ml-4";
      rightSide.appendChild(ctl);
   }

   renderAuthButtons();
}

/* ------------------------------------------
   AUTH BUTTON UI RENDERER
--------------------------------------------- */
function renderAuthButtons() {
   const ctl = document.getElementById("raweclub_auth_ui");
   if (!ctl) return;
   ctl.innerHTML = "";

   const token = localStorage.getItem("raweclub_token");

   /* -----------------------------
      NOT LOGGED IN
  ------------------------------ */
   if (!token) {
      const loginBtn = uiBtn("Sign In", () => openLoginModal());
      const signupBtn = uiBtn("Sign Up", () => openSignupModal());

      // loginBtn.classList.add("px-3", "py-1", "bg-black", "text-white", "rounded");
      // signupBtn.classList.add("px-3", "py-1", "border", "rounded");

      ctl.appendChild(loginBtn);
      ctl.appendChild(signupBtn);
      return;
   }

   /* -----------------------------
      LOGGED IN BUT NO USER YET
  ------------------------------ */
   if (!currentUser) {
      const logoutBtn = uiBtn("Logout", logout);
      ctl.appendChild(logoutBtn);
      return;
   }

   /* -----------------------------
      ADMIN LOGGED IN
  ------------------------------ */
   if (currentUser.role === "admin") {
      const adminBtn = uiBtn("Show All Designs", () => {
         if (window.openAdminCabinet) window.openAdminCabinet();
         else alert("Admin cabinet not loaded");
      });
      const logoutBtn = uiBtn("Logout", logout);

      // adminBtn.classList.add("px-3", "py-1", "bg-black", "text-white", "rounded");
      // logoutBtn.classList.add("px-3", "py-1", "border", "rounded");

      ctl.appendChild(adminBtn);
      ctl.appendChild(logoutBtn);
      return;
   }

   /* -----------------------------
      REGULAR USER LOGGED IN
  ------------------------------ */
   const myDesignsBtn = uiBtn("My Designs", openMyDesigns);
   const userBtn = uiBtn(currentUser.firstname, () => {
      openUserProfileModal();
   });
   const logoutBtn = uiBtn("Logout", logout);

   myDesignsBtn.classList.add("px-3", "py-1", "bg-black", "text-white", "rounded");
   userBtn.classList.add("px-3", "py-1", "border", "rounded");
   logoutBtn.classList.add("px-3", "py-1", "border", "rounded");

   ctl.appendChild(myDesignsBtn);
   ctl.appendChild(userBtn);
   ctl.appendChild(logoutBtn);
}

function uiBtn(label, action) {
   const b = document.createElement("button");
   b.className = "text-sm font-medium px-3 border-2 border-black text-white py-2 rounded-lg bg-black hover:bg-white hover:text-black transition-all duration-300";
   b.textContent = label;
   b.onclick = action;
   return b;
}

/* ------------------------------------------
   LOGOUT
--------------------------------------------- */
async function logout() {
   localStorage.removeItem("raweclub_token");
   currentUser = null;
   try {
      await authApi.logout();
   } catch (err) {
      /* ignore */
   }
   renderAuthButtons();
   alert("Logged out");
}

/* ------------------------------------------
   MODAL BUILDER
--------------------------------------------- */
function buildModal(html) {
   const old = document.getElementById("raweclub_modal");
   if (old) old.remove();

   const overlay = document.createElement("div");
   overlay.id = "raweclub_modal";
   overlay.style = `
    position:fixed;
    inset:0;
    display:flex;
    align-items:center;
    justify-content:center;
    background:rgba(0,0,0,0.5);
    z-index:10000;
  `;

   const box = document.createElement("div");
   box.style = "background:white;padding:22px;border-radius:10px;width:90%;max-width:400px";
   box.innerHTML = html;

   overlay.appendChild(box);
   document.body.appendChild(overlay);

   overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
   });

   return box;
}

/* ------------------------------------------
   LOGIN MODAL
--------------------------------------------- */
function openLoginModal() {
   const html = `
    <h2 style="font-weight:700;margin-bottom:12px;font-size:18px">Login</h2>
    <div style="display:flex;flex-direction:column;gap:10px">
      <input id="auth_email" placeholder="Email" class="border p-2 rounded" />
      <input id="auth_password" type="password" placeholder="Password" class="border p-2 rounded" />
      <button id="auth_login_btn" class="bg-black text-white p-2 rounded">Login</button>
      <button id="auth_cancel_btn" class="p-2 border rounded">Cancel</button>
    </div>
  `;

   const box = buildModal(html);
   box.querySelector("#auth_cancel_btn").onclick = () => box.parentElement.remove();
   box.querySelector("#auth_login_btn").onclick = async () => {
      const email = box.querySelector("#auth_email").value.trim();
      const password = box.querySelector("#auth_password").value.trim();
      if (!email || !password) return alert("Enter email and password");

      try {
         const res = await authApi.login({ email, password });
         localStorage.setItem("raweclub_token", res.token);
         currentUser = res.user;
         renderAuthButtons();
         box.parentElement.remove();
         alert("Login successful");
      } catch (err) {
         alert(err.message || "Login failed");
      }
   };
}

/* ------------------------------------------
   SIGNUP MODAL
--------------------------------------------- */
function openSignupModal() {
   const html = `
    <h2 style="font-weight:700;margin-bottom:12px;font-size:18px">Create Account</h2>
    <div style="display:flex;flex-direction:column;gap:10px">
      <input id="auth_fname" placeholder="First Name" class="border p-2 rounded" />
      <input id="auth_lname" placeholder="Last Name" class="border p-2 rounded" />
      <input id="auth_email" placeholder="Email" class="border p-2 rounded" />
      <input id="auth_password" type="password" placeholder="Password (min 8)" class="border p-2 rounded" />
      <button id="auth_create_btn" class="bg-black text-white p-2 rounded">Sign Up</button>
      <button id="auth_cancel_btn" class="p-2 border rounded">Cancel</button>
    </div>
  `;
   const box = buildModal(html);
   box.querySelector("#auth_cancel_btn").onclick = () => box.parentElement.remove();
   box.querySelector("#auth_create_btn").onclick = async () => {
      const firstname = box.querySelector("#auth_fname").value.trim();
      const lastname = box.querySelector("#auth_lname").value.trim();
      const email = box.querySelector("#auth_email").value.trim();
      const password = box.querySelector("#auth_password").value.trim();
      if (!firstname || !lastname || !email || !password) return alert("Fill all fields");

      try {
         const res = await authApi.signup({ firstname, lastname, email, password });
         localStorage.setItem("raweclub_token", res.token);
         currentUser = res.user;
         renderAuthButtons();
         box.parentElement.remove();
         alert("Account created successfully!");
      } catch (err) {
         alert(err.message || "Signup failed");
      }
   };
}

/* ------------------------------------------
   OPEN My Designs (for regular users)
--------------------------------------------- */
function openMyDesigns() {
   if (window.openMyDesignsPanel) {
      return window.openMyDesignsPanel();
   }
   alert("Design cabinet is not loaded.");
}

/* ------------------------------------------
   USER PROFILE MODAL
--------------------------------------------- */
function openUserProfileModal() {
   if (!currentUser) {
      return alert("No user loaded");
   }

   const html = `
    <h2 style="font-weight:700;margin-bottom:16px;font-size:20px">
      My Profile
    </h2>

    <div style="display:flex;flex-direction:column;gap:12px;font-size:15px">
      <div style="display:flex;justify-content:space-between">
        <span style="font-weight:600">First Name:</span>
        <span>${currentUser.firstname}</span>
      </div>

      <div style="display:flex;justify-content:space-between">
        <span style="font-weight:600">Last Name:</span>
        <span>${currentUser.lastname}</span>
      </div>

      <div style="display:flex;justify-content:space-between">
        <span style="font-weight:600">Email:</span>
        <span>${currentUser.email}</span>
      </div>
    </div>

    <button id="profile_close_btn" class="w-full bg-black text-white mt-5 py-3 border rounded-lg">
      Close
    </button>
  `;

   const box = buildModal(html);
   box.querySelector("#profile_close_btn").onclick = () => box.parentElement.remove();
}

// Make it available globally
window.openUserProfileModal = openUserProfileModal;

/* ------------------------------------------
   INIT AUTH ON PAGE LOAD
--------------------------------------------- */
async function initAuth() {
   createAuthUI();
   const token = localStorage.getItem("raweclub_token");
   if (!token) return renderAuthButtons();

   try {
      const res = await authApi.me();
      currentUser = res.user;
   } catch (err) {
      console.warn("Invalid token, clearing...");
      localStorage.removeItem("raweclub_token");
   }

   renderAuthButtons();
}

// Expose init to window so index.html can call it
window.__raweclub_auth_init = initAuth;

export { initAuth, openMyDesigns };
