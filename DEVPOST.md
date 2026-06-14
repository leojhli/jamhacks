# The Hub

## 💡 Inspiration
Students don't fall behind because they're lazy — they freeze. Staring at six assignments, a looming test, and only 90 minutes of energy left, the hardest part of studying is deciding what to even start. We wanted to kill that decision paralysis: tell The Hub your deadlines, weak spots, time, and energy, and it tells you exactly what to do tonight — then walks you through it.

## 📚 What it does
The Hub turns your deadlines, weak topics, available time, and energy level into the smartest plan for tonight.
- **Plan My Night** — pick your available time, energy, and goal, and get a realistic, *finishable* plan instead of an overwhelming to-do dump.
- **Guided Session** — a fullscreen, step-by-step focus mode that walks you through each task: the brief, materials to pull up, the rubric, key steps, then a focus block.
- **Assignment Radar & Learning Gaps** — see what's risky, what's due, and which topics need work, all color-coded by urgency.
- **Academic-integrity first** — it plans your night and teaches you how to *start*; it never writes your work for you.

## 🛠️ How we built it
- **Frontend:** vanilla HTML/CSS/JS — a single state object, no framework, no build step — wrapped in a playful "school-desk" design system (chalkboards, cork boards, sticky notes, pixel-art mascot).
- **Backend:** Node.js on the built-in `http` module (no Express) serving a JSON REST API plus static files.
- **The "brain":** a transparent heuristic scoring engine that ranks tasks by *deadline × mastery gap × energy × goal × risk* — explainable, not a black box.
- **Persistence:** MongoDB stores the data and saves every generated plan, with an automatic in-memory fallback so the demo never breaks.
- **Integrations:** Google Classroom OAuth to import real courses and coursework.

## 🧩 Challenges we ran into
- Designing a planner that produces *finishable* plans given limited time and low energy, not just a longer list.
- Real Google Classroom OAuth — wrangling consent screens, scopes, and test-user verification.
- MongoDB Atlas setup and auth under time pressure, while keeping the app fully working through an in-memory fallback.
- Hand-building an entire CSS design language (and a lot of pixel art) that feels fun without hurting readability.

## 🏆 Accomplishments that we're proud of
- A genuinely **explainable** recommendation engine — students always see *why* a task was chosen.
- A polished, end-to-end **guided study session**, not just a static checklist.
- A clean **MongoDB** layer with graceful fallback, so it runs anywhere Node runs — online or off.
- A cohesive, charming visual identity built entirely in CSS.

## 📖 What we learned
- How to turn messy real-life constraints (deadlines, energy, mastery) into a single ranked, defensible plan.
- The real friction of OAuth and cloud databases — and how much graceful fallbacks matter for a live demo.
- That delight (a dancing grape mascot, sticky notes) can make a productivity tool something students actually *want* to open.

## 🚀 What's next for The Hub
- Make the "Start here" pick fully data-driven and personalized per student.
- Two-way Google Classroom sync + Canvas support, and mastery tracking over time.
- Spaced repetition and adaptive difficulty inside the guided sessions.
- Accounts, cross-device sync, and a mobile-first build.
