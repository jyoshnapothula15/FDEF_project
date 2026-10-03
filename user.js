/* ===========================================================
   user.js — User Module
   - Edit MY OWN portfolio (about, skills, projects)
   - Browse vacancies posted by the admin and apply to them
   - Track my applications and see notifications the admin sent me
   =========================================================== */

let CURRENT = null;

document.addEventListener("DOMContentLoaded", () => {
  CURRENT = protectPage("user");
  if (!CURRENT) return;

  ensurePortfolio(CURRENT.email, CURRENT.name);

  renderNavSession("nav-session");
  setupSidebar();
  loadAboutForm();
  renderSkills();
  renderProjects();
  renderVacancies();
  renderMyApplications();
  renderNotifications();

  document.getElementById("about-form").addEventListener("submit", saveAbout);
  document.getElementById("skill-form").addEventListener("submit", addSkill);
  document.getElementById("project-form").addEventListener("submit", addProject);
});

function setupSidebar() {
  const buttons = document.querySelectorAll(".sidebar button[data-panel]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      document.getElementById(btn.dataset.panel).classList.add("active");
    });
  });
}

/* ---------- My portfolio (own data only) ---------- */

function getMyPortfolio() {
  const portfolios = getPortfolios();
  return portfolios[CURRENT.email];
}
function saveMyPortfolio(data) {
  const portfolios = getPortfolios();
  portfolios[CURRENT.email] = data;
  savePortfolios(portfolios);
}

function loadAboutForm() {
  const data = getMyPortfolio();
  document.getElementById("about-name").value = data.name || CURRENT.name;
  document.getElementById("about-role").value = data.role || "";
  document.getElementById("about-bio").value = data.about || "";
  document.getElementById("about-resume").value = data.resumeLink || "";
}

function saveAbout(event) {
  event.preventDefault();
  const data = getMyPortfolio();
  data.name = document.getElementById("about-name").value.trim();
  data.role = document.getElementById("about-role").value.trim();
  data.about = document.getElementById("about-bio").value.trim();
  data.resumeLink = document.getElementById("about-resume").value.trim();
  saveMyPortfolio(data);
  flash("about-status", "Saved.");
  renderNavSession("nav-session");
}

function addSkill(event) {
  event.preventDefault();
  const nameInput = document.getElementById("skill-name");
  const levelInput = document.getElementById("skill-level");
  const name = nameInput.value.trim();
  const level = Number(levelInput.value);
  if (!name || !level || level < 1 || level > 100) return;

  const data = getMyPortfolio();
  data.skills.push({ name, level });
  saveMyPortfolio(data);

  nameInput.value = "";
  levelInput.value = "";
  renderSkills();
}

function deleteSkill(index) {
  const data = getMyPortfolio();
  data.skills.splice(index, 1);
  saveMyPortfolio(data);
  renderSkills();
}

function renderSkills() {
  const data = getMyPortfolio();
  const container = document.getElementById("skills-list");
  if (data.skills.length === 0) {
    container.innerHTML = `<div class="empty-state">You haven't added any skills yet.</div>`;
    return;
  }
  container.innerHTML = data.skills
    .map(
      (s, i) => `
      <div class="list-row">
        <div style="flex:1"><strong>${escapeHtml(s.name)}</strong><div class="meta">${s.level}%</div></div>
        <div class="row-actions"><button class="btn btn-danger btn-small" onclick="deleteSkill(${i})">Remove</button></div>
      </div>`
    )
    .join("");
}

function addProject(event) {
  event.preventDefault();
  const title = document.getElementById("project-title").value.trim();
  const description = document.getElementById("project-desc").value.trim();
  const link = document.getElementById("project-link").value.trim() || "#";
  if (!title || !description) return;

  const data = getMyPortfolio();
  data.projects.push({ title, description, link });
  saveMyPortfolio(data);

  event.target.reset();
  renderProjects();
}

function deleteProject(index) {
  const data = getMyPortfolio();
  data.projects.splice(index, 1);
  saveMyPortfolio(data);
  renderProjects();
}

function renderProjects() {
  const data = getMyPortfolio();
  const container = document.getElementById("projects-list");
  if (data.projects.length === 0) {
    container.innerHTML = `<div class="empty-state">You haven't added any projects yet.</div>`;
    return;
  }
  container.innerHTML = data.projects
    .map(
      (p, i) => `
      <div class="list-row">
        <div style="flex:1"><strong>${escapeHtml(p.title)}</strong><div class="meta">${escapeHtml(p.description)}</div></div>
        <div class="row-actions"><button class="btn btn-danger btn-small" onclick="deleteProject(${i})">Remove</button></div>
      </div>`
    )
    .join("");
}

/* ---------- Vacancies & applications ---------- */

function getVacancies() {
  return JSON.parse(localStorage.getItem("vacancies")) || [];
}
function getApplications() {
  return JSON.parse(localStorage.getItem("applications")) || [];
}
function saveApplications(apps) {
  localStorage.setItem("applications", JSON.stringify(apps));
}

function renderVacancies() {
  const vacancies = getVacancies();
  const myPortfolio = getMyPortfolio();
  const mySkills = (myPortfolio.skills || []).map((s) => s.name.toLowerCase());
  const myApps = getApplications().filter((a) => a.userEmail === CURRENT.email);
  const container = document.getElementById("vacancies-list");

  if (vacancies.length === 0) {
    container.innerHTML = `<div class="empty-state">No open vacancies right now. Check back later.</div>`;
    return;
  }

  container.innerHTML = vacancies
    .map((v) => {
      const alreadyApplied = myApps.some((a) => a.vacancyId === v.id);
      const tags = v.skillsRequired
        .map((s) => `<span class="tag ${mySkills.includes(s.toLowerCase()) ? "match" : ""}">${escapeHtml(s)}</span>`)
        .join("");
      return `
      <div class="card" style="margin-bottom:1rem;">
        <h3>${escapeHtml(v.title)}</h3>
        <div class="meta" style="margin-bottom:0.5rem;">${escapeHtml(v.company)} · ${escapeHtml(v.location)}</div>
        <p>${escapeHtml(v.description)}</p>
        <div style="margin-bottom:0.9rem;">${tags}</div>
        <button class="btn ${alreadyApplied ? "btn-ghost" : "btn-primary"} btn-small" ${alreadyApplied ? "disabled" : ""} onclick="applyToVacancy(${v.id})">
          ${alreadyApplied ? "Applied ✓" : "Apply"}
        </button>
      </div>`;
    })
    .join("");
}

function applyToVacancy(vacancyId) {
  const apps = getApplications();
  if (apps.some((a) => a.vacancyId === vacancyId && a.userEmail === CURRENT.email)) return;

  apps.push({
    id: Date.now(),
    vacancyId,
    userEmail: CURRENT.email,
    status: "applied",
    date: new Date().toISOString(),
  });
  saveApplications(apps);
  renderVacancies();
  renderMyApplications();
}

function renderMyApplications() {
  const vacancies = getVacancies();
  const myApps = getApplications().filter((a) => a.userEmail === CURRENT.email);
  const container = document.getElementById("my-applications-list");

  if (myApps.length === 0) {
    container.innerHTML = `<div class="empty-state">You haven't applied to any vacancies yet.</div>`;
    return;
  }

  container.innerHTML = myApps
    .slice()
    .reverse()
    .map((a) => {
      const vacancy = vacancies.find((v) => v.id === a.vacancyId);
      const title = vacancy ? vacancy.title : "Vacancy removed";
      const company = vacancy ? vacancy.company : "";
      return `
      <div class="list-row">
        <div style="flex:1">
          <strong>${escapeHtml(title)}</strong> — <span class="meta">${escapeHtml(company)}</span>
          <div class="meta">Applied ${new Date(a.date).toLocaleDateString()}</div>
        </div>
        <span class="status status-${a.status}">${a.status}</span>
      </div>`;
    })
    .join("");
}

/* ---------- Notifications from admin ---------- */

function renderNotifications() {
  const notifications = JSON.parse(localStorage.getItem("notifications")) || [];
  const vacancies = getVacancies();
  const mine = notifications.filter((n) => n.userEmail === CURRENT.email);
  const container = document.getElementById("notifications-list");
  const navBadge = document.getElementById("notif-badge");

  const unreadCount = mine.filter((n) => !n.read).length;
  if (navBadge) navBadge.textContent = unreadCount > 0 ? unreadCount : "";
  if (navBadge) navBadge.style.display = unreadCount > 0 ? "inline-flex" : "none";

  if (mine.length === 0) {
    container.innerHTML = `<div class="empty-state">No notifications yet. The admin will let you know about vacancies that match your profile.</div>`;
    return;
  }

  container.innerHTML = mine
    .slice()
    .reverse()
    .map((n) => {
      const vacancy = vacancies.find((v) => v.id === n.vacancyId);
      const title = vacancy ? vacancy.title + " at " + vacancy.company : "";
      return `
      <div class="list-row">
        <div style="flex:1">
          ${title ? `<strong>${escapeHtml(title)}</strong><br>` : ""}
          <span>${escapeHtml(n.message)}</span>
          <div class="meta">${new Date(n.date).toLocaleString()}</div>
        </div>
      </div>`;
    })
    .join("");

  // Mark as read once viewed
  const updated = notifications.map((n) => (n.userEmail === CURRENT.email ? { ...n, read: true } : n));
  localStorage.setItem("notifications", JSON.stringify(updated));
}

/* ---------- Utility ---------- */

function flash(elementId, text) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = text;
  el.style.opacity = 1;
  setTimeout(() => (el.style.opacity = 0), 1500);
}
