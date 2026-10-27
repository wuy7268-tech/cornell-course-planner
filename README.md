# Cornell Course Planner

A planner that maps Cornell CS courses onto four career tracks — software engineering, artificial intelligence, systems, and data — and checks a schedule against prerequisites, offerings, and workload.

Pick a track, set the interests you actually have, and the elective slots follow. The catalog filters by track, interest, level, term, and whether a course is unlocked. The schedule lets you add, move, and replace courses; broken prerequisites, unusual terms, heavy pairings, and the junior-year core rule show up as you edit.

Titles, credits, prerequisites, and typical terms follow the Cornell catalog for the CS major (students who entered in fall 2024 or later). Offerings change. Confirm the class roster before you enroll. Technical electives and the external specialization are left open on purpose: this is a sequencing tool, not a degree audit.

## Run

```bash
npm install
npm run dev
```

`npm run check` verifies that each default pathway satisfies its own prerequisites on both the arts and engineering math sequences.
