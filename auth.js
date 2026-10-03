/* ===========================================================
   auth.js
   Handles: seed data, signup, login, logout, session/route guarding.

   Storage keys:
     - "users"          -> [{name, email, password, role}]
     - "currentUser"    -> the logged-in user object (session)
     - "portfolios"     -> { [email]: {name, role, about, skills:[], projects:[], resumeLink} }
     - "vacancies"      -> [{id, title, company, location, skillsRequired:[], description, postedDate}]
     - "applications"   -> [{id, vacancyId, userEmail, status, date}]
     - "notifications"  -> [{id, userEmail, vacancyId, message, date, read}]
   =========================================================== */

const DB = {
  USERS: "users",
  CURRENT: "currentUser",
  PORTFOLIOS: "portfolios",
  VACANCIES: "vacancies",
  APPLICATIONS: "applications",
  NOTIFICATIONS: "notifications",
};

/* ---------- One-time seed data ---------- */

function seedDatabase() {
  if (!localStorage.getItem(DB.USERS)) {
    const defaultUsers = [
      { name: "Placement Admin", email: "admin@portal.com", password: "admin123", role: "admin" },
    ];
    localStorage.setItem(DB.USERS, JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(DB.PORTFOLIOS)) {
    localStorage.setItem(DB.PORTFOLIOS, JSON.stringify({}));
  }

  if (!localStorage.getItem(DB.VACANCIES)) {
    const defaultVacancies = [
      {
        id: 1,
        title: "Frontend Developer Intern",
        company: "Nimbus Labs",
        location: "Remote",
        skillsRequired: ["HTML", "CSS", "JavaScript"],
        description: "Help build customer-facing UI components and fix bugs across our web app.",
        postedDate: new Date().toISOString(),
      },
      {
        id: 2,
        title: "Junior Web Developer",
        company: "Bluepeak Systems",
        location: "Hyderabad, IN",
        skillsRequired: ["JavaScript", "Git", "Responsive Design"],
        description: "Entry-level role building and maintaining internal dashboards.",
        postedDate: new Date().toISOString(),
      },
    ];
    localStorage.setItem(DB.VACANCIES, JSON.stringify(defaultVacancies));
  }

  if (!localStorage.getItem(DB.APPLICATIONS)) {
    localStorage.setItem(DB.APPLICATIONS, JSON.stringify([]));
  }

  if (!localStorage.getItem(DB.NOTIFICATIONS)) {
    localStorage.setItem(DB.NOTIFICATIONS, JSON.stringify([]));
  }
}

seedDatabase();

/* ---------- Users ---------- */

function getUsers() {
  return JSON.parse(localStorage.getItem(DB.USERS)) || [];
}
function saveUsers(users) {
  localStorage.setItem(DB.USERS, JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(DB.CURRENT));
}
function setCurrentUser(user) {
  localStorage.setItem(DB.CURRENT, JSON.stringify(user));
}

function logout() {
  localStorage.removeItem(DB.CURRENT);
  window.location.href = "index.html";
}

/* ---------- Portfolios (one per user) ---------- */

function getPortfolios() {
  return JSON.parse(localStorage.getItem(DB.PORTFOLIOS)) || {};
}
function savePortfolios(portfolios) {
  localStorage.setItem(DB.PORTFOLIOS, JSON.stringify(portfolios));
}
function ensurePortfolio(email, name) {
  const portfolios = getPortfolios();
  if (!portfolios[email]) {
    portfolios[email] = { name: name || email, role: "", about: "", skills: [], projects: [], resumeLink: "" };
    savePortfolios(portfolios);
  }
}

/* ---------- Signup ---------- */

function handleSignup(event) {
  event.preventDefault();
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim().toLowerCase();
  const password = document.getElementById("signup-password").value;
  const errorBox = document.getElementById("form-message");

  if (!name || !email || !password) {
    showMessage(errorBox, "Please fill in every field.", "error");
    return;
  }

  const users = getUsers();
  if (users.some((u) => u.email === email)) {
    showMessage(errorBox, "An account with this email already exists. Please log in instead.", "error");
    return;
  }

  users.push({ name, email, password, role: "user" });
  saveUsers(users);
  ensurePortfolio(email, name);

  showMessage(errorBox, "Account created! Redirecting to login…", "success");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 900);
}

/* ---------- Login ---------- */

function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const errorBox = document.getElementById("form-message");

  const users = getUsers();
  const match = users.find((u) => u.email === email && u.password === password);

  if (!match) {
    showMessage(errorBox, "Incorrect email or password.", "error");
    return;
  }

  setCurrentUser(match);

  if (match.role === "admin") {
    window.location.href = "admin-dashboard.html";
  } else {
    ensurePortfolio(match.email, match.name);
    window.location.href = "user-dashboard.html";
  }
}

/* ---------- Route guarding ---------- */

function protectPage(requiredRole) {
  const current = getCurrentUser();
  if (!current) {
    window.location.href = "login.html";
    return null;
  }
  if (requiredRole && current.role !== requiredRole) {
    window.location.href = current.role === "admin" ? "admin-dashboard.html" : "user-dashboard.html";
    return null;
  }
  return current;
}

function showMessage(box, text, type) {
  if (!box) return;
  box.textContent = text;
  box.className = "alert " + (type === "error" ? "alert-error" : "alert-success");
  box.style.display = "block";
}

/* ---------- Shared navbar user tag ---------- */

function renderNavSession(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const current = getCurrentUser();
  if (current) {
    el.innerHTML = `<span class="user-tag">${current.name} · ${current.role}</span>
      <button onclick="logout()">Logout</button>`;
  } else {
    el.innerHTML = `<a href="login.html">Login</a>
      <a href="signup.html" class="pill">Sign Up</a>`;
  }
}

/* ---------- Shared utility ---------- */

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
