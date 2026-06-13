# The Hub

**Know what to do next.**

The Hub turns deadlines, weak topics, available time, and energy level into the smartest plan for tonight.

## Problem

Students rarely struggle because they cannot find information. They struggle because they feel overwhelmed, do easy work first, avoid hard topics, underestimate time, and start too late.

## Solution

The Hub is a student-focused academic decision engine. It does not try to be a full LMS, homework solver, essay writer, or generic chatbot. Its core workflow is simple:

**Tell The Hub your time and energy. The Hub tells you exactly what to do next, why, what to skip, and how to start.**

## Why This Is Not NotebookLM

NotebookLM answers: "What is in my documents?"

ChatGPT answers: "What is the answer to my question?"

Google Classroom answers: "What is due?"

The Hub answers: **"What should I do tonight, and what should I ignore?"**

## Core Workflow: Plan My Night

The student selects:

- Available time: 30 min, 60 min, 2 hours, or custom
- Energy level: Focused, Normal, Tired, or Bare Minimum
- Goal: Stay on Track, Catch Up, Get Ahead, or Minimum Viable Night

The Hub generates:

- Next Best Action
- Tonight's Plan
- Why each task was chosen
- What not to do tonight
- Just Start Mode
- Panic prevention warnings
- Recovery Mode for tired or overwhelmed students

## Key Features

- **Plan My Night**: the polished main demo workflow.
- **Assignment Radar**: pressure-aware assignment cards with requirements, risks, materials, and first steps.
- **Learning Gaps**: weak concepts tied to upcoming consequences.
- **Calendar**: academic pressure timeline, not just dates.
- **Tonight's Progress**: a persistent progress bar appears after the student starts an activity and stays visible across every screen.
- **Hub Coach**: structured student support using the same planning logic.
- **Demo Mode**: realistic data loads instantly without Google Classroom.

## Demo Mode

Demo Mode uses Alex Chen, a Grade 12 student with a busy AP week:

- AP Calculus BC
- AP Chemistry
- AP World History
- AP English Literature
- Computer Science
- Economics

The demo includes Chemistry test pressure, Calculus due tomorrow, History essay risk, weak learning gaps, and recovery-style planning.

## Tech Stack

This MVP is intentionally dependency-light so it runs reliably during a hackathon pitch.

- Node.js local backend
- Native HTTP server
- Vanilla HTML/CSS/JS frontend
- Local in-memory demo data
- Explainable planning service
- Environment variable support via `PORT`

## Architecture

```text
The Hub.dc.html        App shell
public/styles.css      Premium UI styling
public/app.js          Frontend state and interactions
server/index.js        Local web server and API routes
server/demoData.js     Demo student data
server/academicData.js Assignment cards, intelligence, and learning-gap API shapes
server/tonightPlanData.js Assignment-specific Tonight's Plan demo work packages
server/planner.js      Planning and coach logic
```

## API Endpoints

- `POST /api/plan-night`
- `GET /api/assignments` - five lightweight Assignment Radar cards
- `GET /api/assignments/:id` - selected assignment and Assignment Intelligence
- `GET /api/learning-gaps` - learning gaps linked to assignments
- `GET /api/calendar`
- `POST /api/coach`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/sync/google-classroom`

## Setup

Requirements:

- Node.js 18 or newer

Run locally:

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

Optional:

```bash
PORT=5173 npm start
```

## Environment Variables

```text
PORT=3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

Google integration is a roadmap item. Demo Mode works without environment variables.

## Hackathon Demo Script

1. Open The Hub.
2. Show the Plan My Night page.
3. Select:
   - 60 minutes
   - Tired
   - Stay on track
4. Click Generate My Plan.
5. Show Next Best Action:
   - Chemistry Equilibrium Review
6. Show Tonight's Plan:
   - Chemistry
   - Calculus
   - Congress of Vienna
7. Show What Not To Do:
   - Do not polish Hamlet slides tonight.
8. Click Just Start.
9. Show tiny first step:
   - Complete one titration calculation or one calculus problem.
10. Open Assignment Radar.
11. Show danger/panic zones.
12. Open Congress of Vienna Essay.
13. Show requirements, outline, risk, and first step.
14. Open Learning Gaps.
15. Show Equilibrium weakness tied to upcoming test.
16. Ask Hub Coach:
   - "I have 45 minutes and I'm tired. What should I do?"
17. Show recovery-style plan.

This flow should make judges understand the product in under 3 minutes.

## Academic Integrity Philosophy

The Hub must not:

- Write essays
- Solve full problem sets
- Provide active test answers
- Generate final submissions
- Impersonate the student
- Encourage cheating

The Hub should:

- Help students plan
- Help students start
- Explain concepts
- Identify priorities
- Suggest what to skip
- Provide recovery plans

Visible product rule:

**The Hub helps you plan and start. You do the learning.**

## Future Roadmap

- Google Classroom full sync
- Teacher view
- Parent view
- Mobile app
- Long-term habit tracking
- Deeper personalized learning
- LMS integrations
- Calendar notifications

## Success Criteria

The MVP is successful when Demo Mode works instantly, Plan My Night is the main experience, the app gives a clear Next Best Action, the plan changes based on time and energy, every recommendation explains why, and the student leaves thinking:

**"I know exactly what to do now."**
