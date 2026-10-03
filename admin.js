/* ===========================================================
   admin.js — Admin Module
   - Post/edit/delete job vacancies
   - Browse all registered users and their portfolios
   - Review applications and update their status
   - Notify a specific user about a vacancy that fits them
   =========================================================== */

let ADMIN = null;

document.addEventListener("DOMContentLoaded", () => {
  ADMIN = protectPage("admin");
  if (!ADMIN) return;

  renderNavSession("nav-session");
  setupSidebar();
  renderVacancyForm();
  renderVacancies();
  renderUsers();
  renderApplications();
  populateNotifySelectors();

  document.getElementById("vacancy-form").addEventListener("submit", addVacancy);
  document.getElementById("notify-form").addEventListener("submit", sendNotification);
});

function setupSidebar() {
  const buttons = document.querySelectorAll(".sidebar button[data-panel]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      document.getElementById(btn.dataset.panel).classList.add("active");
      if (btn.dataset.panel === "panel-users") renderUsers();
      if (btn.dataset.panel === "panel-applications") renderApplications();
    });
  });
}

/* ---------- Vacancies ---------- */

function getVacancies() {
  return JSON.parse(localStorage.getItem("vacancies")) || [];
}
function saveVacancies(v) {
  localStorage.setItem("vacancies", JSON.stringify(v));
}

function renderVacancyForm() {
  // placeholder in case of future prefill needs
}

function addVacancy(event) {
  event.preventDefault();
  const title = document.getElementById("vacancy-title").value.trim();
  const company = document.getElementById("vacancy-company").value.trim();
  const location = document.getElementById("vacancy-location").value.trim();
  const skillsRaw = document.getElementById("vacancy-skills").value.trim();
  const description = document.getElementById("vacancy-desc").value.trim();

  if (!title || !company || !description) return;

  const vacancies = getVacancies();
  vacancies.push({
    id: Date.now(),
    title,
    company,
    location: location || "Not specified",
    skillsRequired: skillsRaw ? skillsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [],
    description,
    postedDate: new Date().toISOString(),
  });
  saveVacancies(vacancies);

  event.target.reset();
  renderVacancies();
  populateNotifySelectors();
}

function deleteVacancy(id) {
  const vacancies = getVacancies().filter((v) => v.id !== id);
  saveVacancies(vacancies);
  renderVacancies();
  populateNotifySelectors();
}

function renderVacancies() {
  const vacancies = getVacancies();
  const container = document.getElementById("vacancies-list");
  if (vacancies.length === 0) {
    container.innerHTML = `<div class="empty-state">No vacancies posted yet.</div>`;
    return;
  }
  container.innerHTML = vacancies
    .slice()
    .reverse()
    .map(
      (v) => `
      <div class="list-row">
        <div style="flex:1">
          <strong>${escapeHtml(v.title)}</strong>
          <div class="meta">${escapeHtml(v.company)} · ${escapeHtml(v.location)}</div>
          <div class="meta">${escapeHtml(v.description)}</div>
          <div style="margin-top:0.4rem;">${v.skillsRequired.map((s) => `<span class="tag">${escapeHtml(s)}</span>`).join("")}</div>
        </div>
        <div class="row-actions">
          <button class="btn btn-danger btn-small" onclick="deleteVacancy(${v.id})">Delete</button>
        </div>
      </div>`
    )
    .join("");
}

/* ---------- Users & portfolios (read-only) ---------- */

function renderUsers() {
  const users = getUsers().filter((u) => u.role === "user");
  const portfolios = getPortfolios();
  const container = document.getElementById("users-list");

  if (users.length === 0) {
    container.innerHTML = `<div class="empty-state">No users have signed up yet.</div>`;
    return;
  }

  container.innerHTML = users
    .map((u) => {
      const p = portfolios[u.email] || { role: "", skills: [], projects: [] };
      const skillTags = (p.skills || []).map((s) => `<span class="tag">${escapeHtml(s.name)}</span>`).join("");
      return `
      <div class="list-row">
        <div style="flex:1">
          <strong>${escapeHtml(u.name)}</strong> <span class="meta">&lt;${escapeHtml(u.email)}&gt;</span>
          ${p.role ? `<div class="meta">${escapeHtml(p.role)}</div>` : ""}
          <div class="meta">${(p.projects || []).length} project(s)</div>
          <div style="margin-top:0.4rem;">${skillTags || '<span class="meta">No skills listed yet</span>'}</div>
        </div>
      </div>`;
    })
    .join("");
}

/* ---------- Applications ---------- */

function getApplications() {
  return JSON.parse(localStorage.getItem("applications")) || [];
}
function saveApplications(apps) {
  localStorage.setItem("applications", JSON.stringify(apps));
}

function renderApplications() {
  const apps = getApplications();
  const vacancies = getVacancies();
  const users = getUsers();
  const container = document.getElementById("applications-list");

  if (apps.length === 0) {
    container.innerHTML = `<div class="empty-state">No applications submitted yet.</div>`;
    return;
  }

  container.innerHTML = apps
    .slice()
    .reverse()
    .map((a) => {
      const vacancy = vacancies.find((v) => v.id === a.vacancyId);
      const user = users.find((u) => u.email === a.userEmail);
      return `
      <div class="list-row">
        <div style="flex:1">
          <strong>${escapeHtml(user ? user.name : a.userEmail)}</strong>
          → ${vacancy ? escapeHtml(vacancy.title) + " (" + escapeHtml(vacancy.company) + ")" : "Vacancy removed"}
          <div class="meta">Applied ${new Date(a.date).toLocaleString()}</div>
        </div>
        <div class="row-actions">
          <span class="status status-${a.status}">${a.status}</span>
          <select onchange="updateApplicationStatus(${a.id}, this.value)">
            <option value="applied" ${a.status === "applied" ? "selected" : ""}>Applied</option>
            <option value="shortlisted" ${a.status === "shortlisted" ? "selected" : ""}>Shortlisted</option>
            <option value="rejected" ${a.status === "rejected" ? "selected" : ""}>Rejected</option>
          </select>
        </div>
      </div>`;
    })
    .join("");
}

function updateApplicationStatus(appId, status) {
  const apps = getApplications();
  const app = apps.find((a) => a.id === appId);
  if (app) app.status = status;
  saveApplications(apps);
  renderApplications();
}

/* ---------- Notify a user about a vacancy ---------- */

function populateNotifySelectors() {
  const users = getUsers().filter((u) => u.role === "user");
  const vacancies = getVacancies();

  const userSelect = document.getElementById("notify-user");
  const vacancySelect = document.getElementById("notify-vacancy");

  userSelect.innerHTML = users.length
    ? users.map((u) => `<option value="${escapeHtml(u.email)}">${escapeHtml(u.name)} (${escapeHtml(u.email)})</option>`).join("")
    : `<option value="">No users yet</option>`;

  vacancySelect.innerHTML = vacancies.length
    ? vacancies.map((v) => `<option value="${v.id}">${escapeHtml(v.title)} — ${escapeHtml(v.company)}</option>`).join("")
    : `<option value="">No vacancies yet</option>`;
}

function sendNotification(event) {
  event.preventDefault();
  const userEmail = document.getElementById("notify-user").value;
  const vacancyId = Number(document.getElementById("notify-vacancy").value);
  const message = document.getElementById("notify-message").value.trim();
  const statusBox = document.getElementById("notify-status");

  if (!userEmail || !vacancyId || !message) {
    showMessage(statusBox, "Please choose a user, a vacancy, and write a message.", "error");
    return;
  }

  const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
  notifications.push({
    id: Date.now(),
    userEmail,
    vacancyId,
    message,
    date: new Date().toISOString(),
    read: false,
  });
  localStorage.setItem("notifications", JSON.stringify(notifications));

  document.getElementById("notify-message").value = "";
  showMessage(statusBox, "Notification sent to the user.", "success");
}
