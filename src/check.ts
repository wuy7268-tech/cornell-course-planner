import { courses, getCourse, trackOrder, tracks } from "./data";
import type { College, PlannerState, TrackId } from "./types";
import {
  applyResolved,
  defaultSemesters,
  evaluate,
  expandIds,
  gaps,
  hardBlocks,
  initialState,
  progressFor,
  resolveTrack,
} from "./logic";

const failures: string[] = [];

function expect(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

const ids = courses.map((course) => course.id);
expect(new Set(ids).size === ids.length, "duplicate course ids");

for (const track of tracks) {
  expect(track.terms.length === 8, `${track.id} does not have 8 terms`);
  for (const term of track.terms) {
    for (const slot of term) {
      const slotIds = slot.kind === "pick" ? slot.options.flatMap((option) => option.ids) : slot.kind === "courses" ? slot.ids : [];
      for (const id of slotIds) expect(Boolean(getCourse(id)), `${track.id} references missing ${id}`);
    }
  }
}

const done = expandIds(["CS 2112", "CS 2800"]);
expect(gaps(getCourse("CS 3110")!.prereqs, done).length === 0, "CS 2112 should satisfy CS 2110 for CS 3110");

const concurrent = hardBlocks(getCourse("CS 3110")!, ["CS 2110"], ["CS 3110", "CS 2800"], "fall", {
  ece2300: false,
  allowGrad: false,
});
expect(concurrent.length === 0, `CS 2800 should be allowed beside CS 3110: ${concurrent.join("; ")}`);

const missingCoreq = hardBlocks(getCourse("CS 4411")!, [], ["CS 4411"], "spring", { ece2300: false, allowGrad: false });
expect(missingCoreq.some((item) => item.includes("CS 4410")), "CS 4411 should require CS 4410");

const withCoreq = hardBlocks(getCourse("CS 4411")!, [], ["CS 4410", "CS 4411"], "spring", {
  ece2300: false,
  allowGrad: false,
});
expect(withCoreq.length === 0, `CS 4411 with CS 4410 should be clear: ${withCoreq.join("; ")}`);

function planState(trackId: TrackId, college: College, interests: string[]): PlannerState {
  const base = initialState();
  const resolved = resolveTrack(trackId, college, interests, {}, { ece2300: false, allowGrad: false });
  return {
    ...base,
    college,
    trackId,
    interests,
    semesters: applyResolved(defaultSemesters(2026), resolved, []),
  };
}

for (const college of ["arts", "engineering"] as const) {
  for (const track of tracks) {
    const resolved = resolveTrack(track.id, college, track.defaultInterests, {}, { ece2300: false, allowGrad: false });
    resolved.forEach((term, index) => {
      for (const item of term.items) {
        if (item.blocked) failures.push(`${college} ${track.id} term ${index} blocked: ${item.ids.join(", ")} — ${item.blocked}`);
        for (const id of item.ids) {
          const course = getCourse(id);
          const season = index % 2 === 0 ? "fall" : "spring";
          if (course && !course.terms.includes(season)) {
            failures.push(`${track.id} places ${id} in ${season}`);
          }
        }
      }
    });
    const state = planState(track.id, college, track.defaultInterests);
    const report = evaluate(state);
    for (const issue of report.issues) failures.push(`${college} ${track.id}: ${issue.severity} ${issue.text}`);
    const progress = progressFor(state.semesters.flatMap((semester) => semester.courseIds), false);
    for (const item of progress) {
      if (item.id === "probability") {
        expect(!item.done, `${track.id} should leave probability open`);
      } else if (!item.done) {
        failures.push(`${college} ${track.id} missing ${item.label}`);
      }
    }
    const credits = report.terms.map((term) => term.credits).join(", ");
    console.log(`${college} ${track.id}: ${credits}`);
  }
}

const artsVision = resolveTrack("ai", "arts", ["vision"], {}, { ece2300: false, allowGrad: false });
const artsPick = artsVision[7].items.find((item) => item.choices.length > 0);
expect(Boolean(artsPick && !artsPick.ids.includes("CS 4670")), "arts vision interest should not place CS 4670");
expect(Boolean(artsPick?.choices.find((choice) => choice.ids.includes("CS 4670"))?.blocked), "CS 4670 should explain the arts lock");
expect(Boolean(artsPick?.reason.toLowerCase().includes("vision")), "reason should mention the vision mismatch");

const engVision = resolveTrack("ai", "engineering", ["vision"], {}, { ece2300: false, allowGrad: false });
const engPick = engVision[7].items.find((item) => item.choices.length > 0);
expect(Boolean(engPick?.ids.includes("CS 4670")), `engineering vision interest should place CS 4670, got ${engPick?.ids.join(", ")}`);

const robotics = resolveTrack("ai", "engineering", ["robotics"], {}, { ece2300: false, allowGrad: false });
const roboticsPick = robotics[4].items.find((item) => item.choices.some((choice) => choice.ids.includes("CS 4750")));
expect(Boolean(roboticsPick && !roboticsPick.ids.includes("CS 4750")), "robotics should stay locked without CS 1112");

expect(trackOrder.length === 4, "expected four tracks");

  if (failures.length) {
  console.error(`\n${failures.length} failure(s)`);
  for (const failure of failures) console.error(`- ${failure}`);
  throw new Error(`${failures.length} pathway check failure(s)`);
}

console.log("\nAll pathway checks passed.");
