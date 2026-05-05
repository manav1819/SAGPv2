# SAGP POC — 5-Minute Video Script
**Speakers:** Manav Patel (M) · Nirav (N)
**Target Runtime:** ~5 minutes (~700 words at a comfortable dubbing pace)

---

> **Dubbing Tips:**
> - Read at a measured, clear pace — not too fast.
> - Pause briefly at the `[PAUSE]` markers to let the screen visually catch up.
> - Bold text = emphasis — stress those words naturally.
> - Alternate speaking whenever the label changes.

---

## SECTION 1 — Introduction (0:00 – 0:40)
**[MANAV]**

Hello, and welcome to our Proof of Concept demo for **SAGP** — the **Security Awareness Gamification Platform**.

My name is Manav, and together with Nirav, we built SAGP to solve a very real problem in organizations today: traditional security training is boring, ineffective, and employees simply don't engage with it.

SAGP changes that by turning security education into an **interactive, game-driven experience** — with leaderboards, badges, streaks, and real-time risk analytics — all built on a production-ready, full-stack platform.

[PAUSE]

---

## SECTION 2 — Employee Experience (0:40 – 1:45)
**[MANAV]**

Let's start from the employee's perspective. When an employee logs in, they're greeted by their **personal dashboard** — showing their security persona, their daily streak, and a list of assigned training modules.

[PAUSE — show dashboard]

Each module is linked to a **game experience**. SAGP features four distinct game types. First, the **Casino Quiz** — a multiple-choice game with three lives, where every wrong answer costs a life. Second, the **Phishing Inbox Simulator** — employees sort real-looking emails, identifying phishing threats before clicking. Third, **Branching Scenarios** — story-based decision trees where choices have real security consequences. And fourth, **Drag and Drop** — matching threats to the correct mitigations under time pressure.

[PAUSE — show game types]

**[NIRAV]**

Points aren't just flat numbers. The scoring engine applies **difficulty multipliers**, a speed bonus for fast completions, a first-attempt bonus, and a daily streak multiplier — rewarding consistent, engaged learners. After completing a module, employees can see their updated **badge collection** and their position on a **four-scope leaderboard** — global, organization, department, and weekly.

[PAUSE — show leaderboard]

---

## SECTION 3 — Admin & Analytics (1:45 – 3:00)
**[NIRAV]**

Now let's look at the administrator's view. The **Org Admin dashboard** shows the Company Security Score at a glance — a zero-to-one-hundred composite metric that reflects overall organizational health. Admins can drill into a **thirty-day trend line** to see if the organization is improving or declining.

[PAUSE — show admin dashboard]

The **Analytics page** gives a comprehensive breakdown — a heatmap of module completions by department, a risk distribution histogram showing how many employees fall into Low, Medium, High, or Critical risk tiers, and a persona distribution chart.

[PAUSE — show analytics]

Every employee also receives an individual **risk score** — calculated from four weighted factors: phishing susceptibility, incorrect answer rate, reaction time deviation, and remediation failure rate. Based on behavioral patterns, each employee is assigned one of five **security personas** — from the Careful Defender to the Speed Runner to the Clicker — giving managers actionable insight into who needs attention.

[PAUSE — show risk profile]

**[MANAV]**

Admins can also launch **phishing simulation campaigns** — with tracking pixels, fake login forms, and per-employee event logs showing who opened, clicked, entered credentials, or correctly reported the phishing attempt. Employees who fall for a campaign are automatically assigned a remediation module.

[PAUSE — show phishing campaigns]

---

## SECTION 4 — Compliance & Architecture (3:00 – 4:15)
**[NIRAV]**

For compliance-focused organizations, SAGP includes a full **compliance reporting module** supporting NIST, ISO 27001, SOC2, PCI-DSS, and HIPAA frameworks. Admins can generate a matrix showing exactly which employees have completed the required training controls — and export it to CSV or PDF for auditors.

[PAUSE — show compliance matrix]

**[MANAV]**

Under the hood, SAGP is built with **Next.js and TypeScript** on the frontend — fully type-safe with App Router. The backend runs on **Supabase** — a PostgreSQL database with Row-Level Security policies, Realtime WebSocket subscriptions for live leaderboard updates, and secure OAuth-based authentication.

The game server is a separate **Phaser.js** service. The main platform issues a short-lived **JWT token** to the game server, and results are returned via an **HMAC-SHA256 signed callback** — ensuring score integrity cannot be tampered with.

[PAUSE — show architecture]

---

## SECTION 5 — Closing (4:15 – 5:00)
**[NIRAV]**

In total, SAGP spans **five fully completed phases** — from the authentication foundation, through the training engine, game bridge, gamification system, and analytics engine — totaling over **fourteen thousand eight hundred lines of production-ready code**.

**[MANAV]**

This platform demonstrates that security awareness training doesn't have to be a checkbox exercise. It can be engaging, measurable, and genuinely effective.

Thank you for watching our POC demo of SAGP. We're happy to answer any questions.

**[BOTH — optional sign-off]**

Thank you.

---

## Timing Reference

| Section | Speaker | Duration |
|---|---|---|
| Introduction | Manav | ~0:40 |
| Employee Experience – Games | Manav | ~0:40 |
| Scoring & Gamification | Nirav | ~0:25 |
| Admin Dashboard & Analytics | Nirav | ~0:55 |
| Phishing Campaigns | Manav | ~0:20 |
| Compliance Reporting | Nirav | ~0:25 |
| Architecture | Manav | ~0:30 |
| Closing | Nirav + Manav | ~0:45 |
| **Total** | | **~5:00** |
