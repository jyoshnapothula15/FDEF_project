# PortfolioConnect — SDC Project

A portfolio-and-placement platform built with **only HTML, CSS, and JavaScript** (no
frameworks, no backend, no build tools). Every user builds their own portfolio, and the
admin manages a job board and matches users to openings.

## 1. Problem Statement

Students building a portfolio often also want a way to be discovered for jobs, but keeping
a portfolio *and* tracking job openings separately is disconnected. Meanwhile, whoever is
recruiting (a placement admin, a mentor, a hiring coordinator) needs one place to see every
candidate's profile, post openings, and reach out about a good fit. This project solves
both in a single static web app:

- **Users** create an account, build and maintain their **own** portfolio (About, Skills,
  Projects), browse job vacancies posted by the admin, apply to the ones they want, and
  see notifications when the admin flags an opening that matches their skills.
- **The Admin** posts and manages job vacancies, browses every registered user's portfolio,
  reviews applications and updates their status (applied / shortlisted / rejected), and can
  directly notify a specific user about a vacancy worth applying to.

Because there is no server, all data — accounts, portfolios, vacancies, applications,
notifications — lives in the browser's **Local Storage**, and JavaScript alone handles
authentication, page protection, and navigation between modules.

## 2. Business System & Modules

| Module | Who uses it | Key features |
|---|---|---|
| **User Module** | Anyone who signs up | Edit own About/Skills/Projects, browse vacancies, apply, track application status, view notifications from the admin |
| **Admin Module** | Placement admin (seeded account) | Post/delete vacancies, browse all users' portfolios, review & update application status, send a targeted notification to a user about a vacancy |

Shared features: Signup, Login, Logout, role-based redirection, route protection (a user
can't open the admin dashboard by typing the URL, and vice versa).

**Default admin login** (seeded automatically on first run):
- Email: `admin@portal.com`
- Password: `admin123`

Any new signup through `signup.html` is created as a `user` role account, with an empty
portfolio automatically created for them to fill in.

## 3. Tech & Architecture

- **HTML** — one file per page (`index`, `login`, `signup`, `admin-dashboard`, `user-dashboard`)
- **CSS** — single stylesheet (`style.css`) using **CSS Grid** (page shell, dashboard layout,
  card grids) and **Flexbox** (navbar, forms, list rows)
- **JavaScript** — no frameworks:
  - `auth.js` — seed data, signup, login, logout, session/route guarding, shared navbar
  - `user.js` — User Module logic: edit own portfolio, browse/apply to vacancies, view own
    applications and notifications
  - `admin.js` — Admin Module logic: manage vacancies, browse user portfolios, manage
    applications, send notifications
- **Data store** — `localStorage`, keys:
  - `users` — all accounts `{name, email, password, role}`
  - `portfolios` — one entry per user email `{name, role, about, skills[], projects[], resumeLink}`
  - `vacancies` — job postings `{id, title, company, location, skillsRequired[], description}`
  - `applications` — `{id, vacancyId, userEmail, status, date}`
  - `notifications` — `{id, userEmail, vacancyId, message, date, read}`

## 4. File Structure

```
portfolio-project/
├── index.html              # Public landing page
├── login.html               # Login (redirects by role)
├── signup.html                # Signup (creates a "user" account + empty portfolio)
├── admin-dashboard.html         # Admin Module
├── user-dashboard.html            # User Module
├── style.css                       # Grid + Flexbox layout, all styling
├── auth.js                          # Auth + Local Storage + route guarding
├── admin.js                          # Admin Module logic
├── user.js                            # User Module logic
└── README.md
```

## 5. How to Run It Locally

**Option A — with a local server (recommended)**
```bash
cd portfolio-project
npx serve .
```
Open the URL it prints (usually `http://localhost:3000`).

**Option B — just open it**
Double-click `index.html` to open it directly in your browser.

The app seeds an admin account and two sample vacancies into Local Storage automatically —
no manual setup needed.

### Try the full flow
1. **Sign up** as a new user → you land on your own dashboard → fill in About, add a couple
   of Skills and Projects.
2. Go to **Browse Vacancies** → apply to one.
3. **Log out**, log back in as the admin (`admin@portal.com` / `admin123`).
4. In the admin dashboard: check **Users & Portfolios** to see the profile you just built,
   check **Applications** to see your application and change its status to "Shortlisted",
   then go to **Notify a User** and send yourself a message about a matching vacancy.
5. **Log out**, log back in as your user account → see the updated application status under
   **My Applications** and the new message under **Notifications**.

## 6. Push the Project to GitHub

```bash
git init
git add .
git commit -m "Initial commit: PortfolioConnect (HTML, CSS, JS)"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

## 7. Notes for the Review

- Local Storage is per-browser: data won't transfer between different browsers/computers.
- To reset all data during a demo, run in the browser console: `localStorage.clear();`
  then refresh — the admin account and sample vacancies are recreated automatically.
- Route protection is handled by `protectPage()` in `auth.js`.
- Each user's portfolio is isolated by their email key inside the `portfolios` object, so
  one user can never see or edit another user's portfolio data — only the admin can browse
  all of them (read-only).
