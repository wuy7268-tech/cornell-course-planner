import {
  courseMap,
  courses,
  getCourse,
  interestLabel,
  mathByCollege,
  mathIds,
  overlapGroups,
  trackMap,
  tracks,
} from "./data";
import type {
  College,
  Course,
  Filters,
  PlannerState,
  Req,
  Semester,
  Slot,
  TermName,
  TrackId,
} from "./types";

export type Severity = "block" | "warn";

export type CourseFlag = {
  courseId: string;
  severity: Severity;
  text: string;
};

export type TermReport = {
  credits: number;
  workload: number;
  notes: string[];
  flags: CourseFlag[];
};

export type ProgressItem = {
  id: string;
  label: string;
  done: boolean;
  detail: string;
};

export type Report = {
  issues: { severity: Severity; text: string; term?: number; courseId?: string }[];
  terms: TermReport[];
  progress: ProgressItem[];
};

export type ChoiceView = {
  ids: string[];
  label: string;
  blocked: string | null;
};

export type ResolvedItem = {
  key: string;
  ids: string[];
  why: string;
  reason: string;
  blocked: string | null;
  choices: ChoiceView[];
};

export type ResolvedTerm = {
  items: ResolvedItem[];
};

const CORE_GROUPS: { id: string; label: string; ids: string[]; junior: boolean }[] = [
  { id: "intro", label: "Introductory programming", ids: ["CS 1110", "CS 1112"], junior: false },
  { id: "ds", label: "OOP and data structures", ids: ["CS 2110", "CS 2112"], junior: false },
  { id: "calc1", label: "First calculus", ids: ["MATH 1110", "MATH 1910"], junior: false },
  { id: "calc2", label: "Second calculus", ids: ["MATH 1120", "MATH 1920"], junior: false },
  { id: "linalg", label: "Linear algebra", ids: ["MATH 2210", "MATH 2940"], junior: false },
  { id: "discrete", label: "Discrete math", ids: ["CS 2800", "CS 2802"], junior: true },
  { id: "fp", label: "Functional programming", ids: ["CS 3110"], junior: true },
  { id: "org", label: "Computer organization", ids: ["CS 3410", "CS 3420"], junior: true },
  { id: "aicore", label: "AI or machine learning", ids: ["CS 3700", "CS 3780"], junior: true },
  { id: "os", label: "Operating systems", ids: ["CS 4410", "CS 4414"], junior: true },
  { id: "algo", label: "Algorithms", ids: ["CS 4820"], junior: true },
];

const EXCLUDED_ELECTIVES = new Set(["CS 4090", "CS 4997", "CS 4998", "CS 4999"]);

export function expandIds(ids: Iterable<string>): Set<string> {
  const out = new Set<string>();
  const queue = [...ids];
  while (queue.length) {
    const id = queue.pop();
    if (!id || out.has(id)) continue;
    out.add(id);
    const course = courseMap.get(id);
    if (!course) continue;
    for (const alias of course.alsoSatisfies) queue.push(alias);
  }
  return out;
}

export function formatReq(req: Req | null): string {
  if (!req) return "None";
  if (req.op === "course") return req.id;
  const parts = req.of.map((part) => {
    const text = formatReq(part);
    return part.op === "any" || part.op === "all" ? `(${text})` : text;
  });
  return req.op === "any" ? parts.join(" or ") : parts.join(" + ");
}

export function gaps(req: Req | null, done: Set<string>): string[] {
  if (!req) return [];
  if (req.op === "course") return done.has(req.id) ? [] : [req.id];
  if (req.op === "all") return req.of.flatMap((part) => gaps(part, done));
  if (req.of.some((part) => gaps(part, done).length === 0)) return [];
  return [`one of ${req.of.map((part) => formatReq(part)).join(", ")}`];
}

export function leaves(req: Req | null): string[] {
  if (!req) return [];
  if (req.op === "course") return [req.id];
  return req.of.flatMap(leaves);
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const right = new Set(b);
  return a.every((id) => right.has(id));
}

function joinHard(messages: string[]): string | null {
  return messages.length ? messages.join("; ") : null;
}

export function prerequisitePool(priorIds: Iterable<string>, currentIds: Iterable<string>, concurrent: string[]): Set<string> {
  const pool = expandIds(priorIds);
  const concurrentKeys = new Set(concurrent);
  for (const id of currentIds) {
    const names = expandIds([id]);
    if ([...names].some((name) => concurrentKeys.has(name))) {
      for (const name of names) pool.add(name);
    }
  }
  return pool;
}

export function hardBlocks(
  course: Course,
  priorIds: Iterable<string>,
  currentIds: Iterable<string>,
  term: TermName,
  opts: { ece2300: boolean; allowGrad: boolean; checkOffering?: boolean },
): string[] {
  const messages: string[] = [];
  if (course.grad && !opts.allowGrad) {
    messages.push("M.Eng. enrollment — include graduate courses to plan it");
  }
  if (course.waivers.includes("ece2300") && !opts.ece2300) {
    messages.push("needs ECE 2300 or ENGRD 2300");
  }
  if (opts.checkOffering !== false && !course.terms.includes(term)) {
    messages.push(`usually offered in ${course.terms.join(" and ")}`);
  }
  const pool = prerequisitePool(priorIds, currentIds, course.concurrent);
  for (const missing of gaps(course.prereqs, pool)) {
    messages.push(missing.startsWith("one of ") ? `needs ${missing}` : `needs ${missing}`);
  }
  const current = expandIds(currentIds);
  const prior = expandIds(priorIds);
  for (const coreq of course.coreqs) {
    if (!current.has(coreq) && !prior.has(coreq)) {
      messages.push(`must be taken with ${coreq}`);
    }
  }
  return messages;
}

function coreqWarnings(course: Course, priorIds: Iterable<string>, currentIds: Iterable<string>): string[] {
  const current = expandIds(currentIds);
  const prior = expandIds(priorIds);
  return course.coreqs
    .filter((coreq) => prior.has(coreq) && !current.has(coreq))
    .map((coreq) => `${course.id} is usually taken in the same semester as ${coreq}.`);
}

function recommendedWarnings(course: Course, priorIds: Iterable<string>, currentIds: Iterable<string>): string[] {
  const have = expandIds([...priorIds, ...currentIds]);
  return course.recommended
    .filter((id) => !have.has(id))
    .map((id) => `${id} is recommended before ${course.id}.`);
}

export function workloadWord(workload: number): string {
  if (workload >= 5) return "Heavy";
  if (workload === 4) return "Demanding";
  if (workload === 3) return "Moderate";
  return "Lighter";
}

export function creditsLabel(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1).replace(/\.0$/, "");
}

export function semesterLabel(semester: Semester): string {
  const season = semester.term === "fall" ? "Fall" : "Spring";
  return `${season} ${semester.year}`;
}

export function yearIndex(termIndex: number): number {
  return Math.floor(termIndex / 2) + 1;
}

export function defaultSemesters(startYear: number): Semester[] {
  return Array.from({ length: 8 }, (_, index) => {
    const term: TermName = index % 2 === 0 ? "fall" : "spring";
    const year = startYear + Math.floor(index / 2) + (term === "spring" ? 1 : 0);
    return { term, year, courseIds: [] };
  });
}

export function shiftStartYear(semesters: Semester[], startYear: number): Semester[] {
  return semesters.map((semester, index) => {
    const term: TermName = index % 2 === 0 ? "fall" : "spring";
    const year = startYear + Math.floor(index / 2) + (term === "spring" ? 1 : 0);
    return { ...semester, term, year };
  });
}

export function retargetMath(ids: string[], from: College, to: College): string[] {
  if (from === to) return ids;
  const source = mathIds(from);
  const target = mathIds(to);
  const map = new Map(source.map((id, index) => [id, target[index]]));
  return ids.map((id) => map.get(id) ?? id);
}

function interestPhrase(optionInterests: string[], selected: string[]): string {
  const labels = optionInterests
    .filter((id) => selected.includes(id))
    .map((id) => interestLabel.get(id) ?? id);
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0].toLowerCase();
  return `${labels.slice(0, -1).join(", ").toLowerCase()} and ${labels[labels.length - 1].toLowerCase()}`;
}

function optionBlocks(
  ids: string[],
  prior: string[],
  term: TermName,
  opts: { ece2300: boolean; allowGrad: boolean },
): string[] {
  const messages: string[] = [];
  for (const id of ids) {
    const course = getCourse(id);
    if (!course) {
      messages.push(`unknown course ${id}`);
      continue;
    }
    messages.push(
      ...hardBlocks(course, prior, ids, term, { ...opts, checkOffering: true }).map((text) =>
        text.startsWith("needs") || text.startsWith("must") || text.startsWith("usually") || text.startsWith("M.Eng")
          ? `${course.id} ${text}`
          : `${course.id} ${text}`,
      ),
    );
  }
  return messages;
}

function slotToFixed(slot: Slot, college: College): { ids: string[]; why: string } | null {
  if (slot.kind === "courses") return { ids: slot.ids, why: slot.why };
  if (slot.kind === "math") return { ids: [mathByCollege[college][slot.slot]], why: slot.why };
  return null;
}

export function resolveTrack(
  trackId: TrackId,
  college: College,
  selectedInterests: string[],
  overrides: Record<string, string[]>,
  opts: { ece2300: boolean; allowGrad: boolean },
): ResolvedTerm[] {
  const track = trackMap.get(trackId);
  if (!track) return [];
  const taken = new Set<string>();
  return track.terms.map((slots, termIndex) => {
    const term: TermName = termIndex % 2 === 0 ? "fall" : "spring";
    const prior = [...taken];
    const items: ResolvedItem[] = slots.map((slot, index) => {
      const key = `${trackId}:${termIndex}:${index}`;
      if (slot.kind !== "pick") {
        const fixed = slotToFixed(slot, college);
        const ids = fixed?.ids ?? [];
        const blocked = joinHard(optionBlocks(ids, prior, term, opts));
        for (const id of ids) taken.add(id);
        return { key, ids, why: slot.why, reason: "", blocked, choices: [] };
      }

      const ranked = slot.options.map((option, optionIndex) => {
        const blockedList = optionBlocks(option.ids, prior, term, opts);
        const already = option.ids.some((id) => taken.has(id));
        if (already) blockedList.push("already placed earlier in this pathway");
        return {
          option,
          optionIndex,
          blocked: joinHard(blockedList),
          score: option.interests.filter((id) => selectedInterests.includes(id)).length,
        };
      });
      ranked.sort((a, b) => b.score - a.score || a.optionIndex - b.optionIndex);
      const override = overrides[key];
      const forced = override ? ranked.find((entry) => sameSet(entry.option.ids, override)) : undefined;
      const ready = ranked.filter((entry) => !entry.blocked);
      const chosen = forced ?? ready[0] ?? ranked[0];
      const best = ranked[0];
      let reason = "Default for this track.";
      if (forced) reason = "You picked this.";
      else if (!chosen.blocked && chosen === best) {
        const phrase = interestPhrase(chosen.option.interests, selectedInterests);
        reason = phrase ? `Matches ${phrase}.` : "Default for this track.";
      } else if (!chosen.blocked && best?.blocked) {
        const phrase = interestPhrase(best.option.interests, selectedInterests);
        reason = phrase
          ? `${best.option.label} matches ${phrase}, but ${best.blocked}. ${chosen.option.label} fits this semester.`
          : `${best.option.label} does not fit this semester (${best.blocked}). ${chosen.option.label} fits.`;
      } else if (chosen.blocked) {
        reason = chosen.blocked;
      }
      for (const id of chosen.option.ids) taken.add(id);
      return {
        key,
        ids: chosen.option.ids,
        why: slot.why,
        reason,
        blocked: chosen.blocked,
        choices: ranked.map((entry) => ({
          ids: entry.option.ids,
          label: entry.option.label,
          blocked: entry.blocked,
        })),
      };
    });
    return { items };
  });
}

export function applyResolved(semesters: Semester[], resolved: ResolvedTerm[], completed: string[]): Semester[] {
  const done = new Set(completed);
  return semesters.map((semester, index) => {
    const courseIds: string[] = [];
    for (const item of resolved[index]?.items ?? []) {
      for (const id of item.ids) {
        if (done.has(id) || courseIds.includes(id)) continue;
        courseIds.push(id);
        done.add(id);
      }
    }
    return { ...semester, courseIds };
  });
}

function unique(ids: string[]): string[] {
  return [...new Set(ids)];
}

function matchesGroup(id: string, groupIds: string[]): boolean {
  if (groupIds.includes(id)) return true;
  const course = courseMap.get(id);
  return Boolean(course?.alsoSatisfies.some((alias) => groupIds.includes(alias)));
}

export function plannedIds(state: Pick<PlannerState, "completed" | "semesters">, throughTerm?: number): string[] {
  const scheduled = state.semesters
    .slice(0, throughTerm ?? state.semesters.length)
    .flatMap((semester) => semester.courseIds);
  return unique([...state.completed, ...scheduled]);
}

function isElective(course: Course): boolean {
  return course.dept === "CS" && course.level >= 4000 && course.credits >= 3 && !EXCLUDED_ELECTIVES.has(course.id);
}

export function progressFor(ids: string[], probabilityDone: boolean): ProgressItem[] {
  const used = new Set<string>();
  const items: ProgressItem[] = [];
  for (const group of CORE_GROUPS) {
    const direct = ids.find((id) => matchesGroup(id, group.ids));
    if (direct) used.add(direct);
    items.push({
      id: group.id,
      label: group.label,
      done: Boolean(direct),
      detail: direct ?? group.ids.join(" or "),
    });
  }

  const electives = ids.filter((id) => {
    const course = courseMap.get(id);
    return course && isElective(course) && !used.has(id);
  });
  items.push({
    id: "electives",
    label: "Two CS electives at 4000+",
    done: electives.length >= 2,
    detail: electives.length ? electives.join(", ") : "Any two CS courses at 4000+ of at least 3 credits, beyond the core",
  });

  const practica = ids.filter((id) => courseMap.get(id)?.practicum);
  items.push({
    id: "practicum",
    label: "Practicum or project",
    done: practica.length >= 1,
    detail: practica.length ? practica.join(", ") : "One practicum, such as CS 4411, CS 4321, CS 4701, or CS 4740",
  });

  const probability = ids.includes("CS 4850") || probabilityDone;
  items.push({
    id: "probability",
    label: "Probability",
    done: probability,
    detail: ids.includes("CS 4850")
      ? "CS 4850"
      : probabilityDone
        ? "Marked done outside this planner"
        : "CS 4850, or STSCI 3080, MATH 4710, ECON 3130, ECE 3100, or ENGRD 2700",
  });

  return items;
}

export function evaluate(state: PlannerState): Report {
  const terms: TermReport[] = [];
  const issues: Report["issues"] = [];
  const seen = new Map<string, number>();

  state.semesters.forEach((semester, termIndex) => {
    const prior = [
      ...state.completed,
      ...state.semesters.slice(0, termIndex).flatMap((item) => item.courseIds),
    ];
    const flags: CourseFlag[] = [];
    let credits = 0;
    let workload = 0;
    const heavy: string[] = [];
    const localCount = new Map<string, number>();

    for (const id of semester.courseIds) {
      localCount.set(id, (localCount.get(id) ?? 0) + 1);
      const course = getCourse(id);
      if (!course) {
        flags.push({ courseId: id, severity: "warn", text: `${id} is not in this catalog.` });
        continue;
      }
      credits += course.credits;
      workload += course.workload;
      if (course.workload >= 5) heavy.push(course.id);

      if (state.completed.includes(id)) {
        flags.push({ courseId: id, severity: "block", text: `${id} is already in your completed courses.` });
      }
      const earlier = seen.get(id);
      if (earlier !== undefined) {
        flags.push({
          courseId: id,
          severity: "block",
          text: `${id} is also in ${semesterLabel(state.semesters[earlier])}.`,
        });
      } else if (localCount.get(id)! > 1) {
        flags.push({ courseId: id, severity: "block", text: `${id} is listed twice in this semester.` });
      }

      for (const text of hardBlocks(course, prior, semester.courseIds, semester.term, {
        ece2300: state.ece2300,
        allowGrad: state.showGrad,
        checkOffering: false,
      })) {
        const sentence = text.charAt(0).toUpperCase() + text.slice(1);
        flags.push({ courseId: id, severity: "block", text: `${course.id}: ${sentence}.` });
      }
      if (!course.terms.includes(semester.term)) {
        flags.push({
          courseId: id,
          severity: "warn",
          text: `${course.id} is usually offered in ${course.terms.join(" and ")}, not ${semester.term}.`,
        });
      }
      for (const text of coreqWarnings(course, prior, semester.courseIds)) {
        flags.push({ courseId: id, severity: "warn", text });
      }
      for (const text of recommendedWarnings(course, prior, semester.courseIds)) {
        flags.push({ courseId: id, severity: "warn", text });
      }
      if (course.grad && state.showGrad) {
        flags.push({
          courseId: id,
          severity: "warn",
          text: `${course.id} limits enrollment to M.Eng. students.`,
        });
      }
      if (!seen.has(id)) seen.set(id, termIndex);
    }

    if (heavy.length >= 2) {
      issues.push({
        severity: "warn",
        term: termIndex,
        text: `${semesterLabel(semester)} pairs heavy courses (${heavy.join(" and ")}). Split them if you can.`,
      });
    }
    if (workload >= 14) {
      issues.push({
        severity: "warn",
        term: termIndex,
        text: `${semesterLabel(semester)} has a heavy combined workload.`,
      });
    }
    if (credits > state.creditComfort) {
      issues.push({
        severity: "warn",
        term: termIndex,
        text: `${semesterLabel(semester)} is ${creditsLabel(credits)} credits, above your ${state.creditComfort}-credit comfort.`,
      });
    }
    if (credits > 21) {
      issues.push({
        severity: "warn",
        term: termIndex,
        text: `${semesterLabel(semester)} is above a typical Cornell term maximum.`,
      });
    }

    const notes: string[] = [];
    if (semester.courseIds.length > 0 && credits < 12) {
      notes.push(
        `${creditsLabel(credits)} CS credits — room for college requirements and courses outside this planner.`,
      );
    }
    for (const flag of flags) {
      issues.push({ severity: flag.severity, term: termIndex, courseId: flag.courseId, text: flag.text });
    }
    terms.push({ credits, workload, notes, flags });
  });

  const allIds = plannedIds(state);
  for (const group of overlapGroups) {
    const present = group.ids.filter((id) => allIds.includes(id));
    if (present.length > 1) {
      issues.push({ severity: "warn", text: group.reason });
    }
  }

  const juniorIds = unique([
    ...state.completed,
    ...state.semesters.slice(0, 6).flatMap((semester) => semester.courseIds),
  ]);
  const juniorDone = CORE_GROUPS.filter((group) => group.junior).filter((group) =>
    juniorIds.some((id) => matchesGroup(id, group.ids)),
  ).length;
  if (allIds.length > 0 && juniorDone < 3) {
    issues.push({
      severity: "warn",
      text: `By the end of junior year this plan has ${juniorDone} of the 6 CS core courses. The major asks for at least 3.`,
    });
  }

  return {
    issues,
    terms,
    progress: progressFor(allIds, state.probabilityDone),
  };
}

export function unlocks(course: Course): Course[] {
  const keys = new Set([course.id, ...course.alsoSatisfies]);
  return courses.filter((other) => {
    if (other.id === course.id) return false;
    const mentioned = new Set([...leaves(other.prereqs), ...other.coreqs, ...other.concurrent, ...other.recommended]);
    for (const key of keys) if (mentioned.has(key)) return true;
    return false;
  });
}

export function readiness(
  course: Course,
  completed: string[],
  scheduled: string[],
  opts: { ece2300: boolean },
): "completed" | "scheduled" | "now" | "later" | "locked" {
  if (completed.includes(course.id)) return "completed";
  if (scheduled.includes(course.id)) return "scheduled";
  const now = hardBlocks(course, completed, [], "fall", {
    ece2300: opts.ece2300,
    allowGrad: true,
    checkOffering: false,
  });
  if (now.length === 0) return "now";
  const later = hardBlocks(course, [...completed, ...scheduled], [], "fall", {
    ece2300: opts.ece2300,
    allowGrad: true,
    checkOffering: false,
  });
  return later.length === 0 ? "later" : "locked";
}

function suggestionScore(course: Course, state: PlannerState, openCores: Set<string>, practicumOpen: boolean, electivesOpen: boolean, workload: number): number {
  let score = 0;
  for (const group of CORE_GROUPS) {
    if (!openCores.has(group.id)) continue;
    if (group.ids.includes(course.id) || course.alsoSatisfies.some((alias) => group.ids.includes(alias))) score += 8;
  }
  if (practicumOpen && course.practicum) score += 5;
  if (electivesOpen && isElective(course)) score += 4;
  const tag = course.tracks[state.trackId];
  if (tag === "track") score += 5;
  if (tag === "core") score += 2;
  score += course.interests.filter((id) => state.interests.includes(id)).length * 3;
  if (workload >= 10 && course.workload >= 5) score -= 4;
  return score;
}

export type AddGroups = {
  fit: Course[];
  offTerm: Course[];
  overlap: Course[];
  locked: { course: Course; reason: string }[];
};

export function coursesToAdd(state: PlannerState, termIndex: number): AddGroups {
  const semester = state.semesters[termIndex];
  const prior = [
    ...state.completed,
    ...state.semesters.slice(0, termIndex).flatMap((item) => item.courseIds),
  ];
  const taken = new Set([...state.completed, ...state.semesters.flatMap((item) => item.courseIds)]);
  const progress = progressFor(plannedIds(state), state.probabilityDone);
  const openCores = new Set(progress.filter((item) => !item.done && CORE_GROUPS.some((group) => group.id === item.id)).map((item) => item.id));
  const practicumOpen = !progress.find((item) => item.id === "practicum")?.done;
  const electivesOpen = !progress.find((item) => item.id === "electives")?.done;
  const workload = state.semesters[termIndex].courseIds.reduce((sum, id) => sum + (getCourse(id)?.workload ?? 0), 0);

  const fit: Course[] = [];
  const offTerm: Course[] = [];
  const overlap: Course[] = [];
  const locked: { course: Course; reason: string }[] = [];

  for (const course of courses) {
    if (taken.has(course.id)) continue;
    if (course.grad && !state.showGrad) continue;
    const sameRequirement = overlapGroups.some(
      (group) => group.ids.includes(course.id) && group.ids.some((id) => id !== course.id && taken.has(id)),
    );
    if (sameRequirement) {
      overlap.push(course);
      continue;
    }
    const blocks = hardBlocks(course, prior, semester.courseIds, semester.term, {
      ece2300: state.ece2300,
      allowGrad: state.showGrad,
      checkOffering: false,
    });
    const offered = course.terms.includes(semester.term);
    if (blocks.length === 0 && offered) fit.push(course);
    else if (blocks.length === 0) offTerm.push(course);
    else locked.push({ course, reason: blocks[0] });
  }

  const byScore = (a: Course, b: Course) =>
    suggestionScore(b, state, openCores, practicumOpen, electivesOpen, workload) -
      suggestionScore(a, state, openCores, practicumOpen, electivesOpen, workload) ||
    a.level - b.level ||
    a.id.localeCompare(b.id);

  fit.sort(byScore);
  offTerm.sort(byScore);
  overlap.sort((a, b) => a.level - b.level || a.id.localeCompare(b.id));
  locked.sort((a, b) => a.course.level - b.course.level || a.course.id.localeCompare(b.course.id));
  return { fit, offTerm, overlap, locked };
}

export function filterCourses(state: PlannerState): Course[] {
  const filters: Filters = state.filters;
  const scheduled = state.semesters.flatMap((semester) => semester.courseIds);
  const query = filters.query.toLowerCase().replace(/\s+/g, "");
  return courses
    .filter((course) => state.showGrad || !course.grad)
    .filter((course) => {
      if (!query) return true;
      const hay = [course.id, course.title, course.summary, ...course.skills, ...course.interests]
        .join(" ")
        .toLowerCase()
        .replace(/\s+/g, "");
      return hay.includes(query);
    })
    .filter((course) => filters.track === "all" || Boolean(course.tracks[filters.track]))
    .filter((course) => filters.interest === "all" || course.interests.includes(filters.interest))
    .filter((course) => filters.level === "all" || levelBand(course.level) === filters.level)
    .filter((course) => filters.term === "all" || course.terms.includes(filters.term))
    .filter((course) => {
      if (filters.status === "all") return true;
      return readiness(course, state.completed, scheduled, { ece2300: state.ece2300 }) === filters.status;
    })
    .sort((a, b) => a.level - b.level || a.id.localeCompare(b.id));
}

function levelBand(level: number): Filters["level"] {
  if (level < 2000) return "1000";
  if (level < 3000) return "2000";
  if (level < 4000) return "3000";
  if (level < 5000) return "4000";
  return "5000";
}

export function pathwayIds(trackId: TrackId, college: College, selectedInterests: string[], overrides: Record<string, string[]>, opts: { ece2300: boolean; allowGrad: boolean }): string[][] {
  return resolveTrack(trackId, college, selectedInterests, overrides, opts).map((term) => term.items.flatMap((item) => item.ids));
}

export function emptyFilters(): Filters {
  return { query: "", track: "all", interest: "all", level: "all", term: "all", status: "all" };
}

export function initialState(): PlannerState {
  const software = tracks[0];
  return {
    view: "pathways",
    college: "arts",
    startYear: 2026,
    completed: [],
    interests: [...software.defaultInterests],
    trackId: "software",
    compare: false,
    semesters: defaultSemesters(2026),
    creditComfort: 18,
    showGrad: false,
    ece2300: false,
    probabilityDone: false,
    overrides: {},
    filters: emptyFilters(),
    history: [],
  };
}

export const STORAGE_KEY = "ccp-state-v1";

export function loadState(): PlannerState {
  const base = initialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<PlannerState>;
    const college: College = parsed.college === "engineering" ? "engineering" : "arts";
    const startYear =
      typeof parsed.startYear === "number" && parsed.startYear >= 2020 && parsed.startYear <= 2035
        ? parsed.startYear
        : base.startYear;
    const trackId: TrackId = parsed.trackId && trackMap.has(parsed.trackId) ? parsed.trackId : base.trackId;
    const semesters = defaultSemesters(startYear).map((semester, index) => {
      const saved = Array.isArray(parsed.semesters) ? parsed.semesters[index] : undefined;
      const courseIds = Array.isArray(saved?.courseIds)
        ? saved.courseIds.filter((id): id is string => typeof id === "string" && courseMap.has(id))
        : [];
      return { ...semester, courseIds };
    });
    const filters = emptyFilters();
    const incoming = parsed.filters;
    if (incoming) {
      if (typeof incoming.query === "string") filters.query = incoming.query;
      if (incoming.track === "all" || (incoming.track && trackMap.has(incoming.track))) filters.track = incoming.track;
      if (typeof incoming.interest === "string") filters.interest = incoming.interest;
      if (
        incoming.level === "all" ||
        incoming.level === "1000" ||
        incoming.level === "2000" ||
        incoming.level === "3000" ||
        incoming.level === "4000" ||
        incoming.level === "5000"
      ) {
        filters.level = incoming.level;
      }
      if (incoming.term === "all" || incoming.term === "fall" || incoming.term === "spring") filters.term = incoming.term;
      if (
        incoming.status === "all" ||
        incoming.status === "now" ||
        incoming.status === "later" ||
        incoming.status === "locked" ||
        incoming.status === "scheduled" ||
        incoming.status === "completed"
      ) {
        filters.status = incoming.status;
      }
    }
    const overrides: Record<string, string[]> = {};
    if (parsed.overrides) {
      for (const [key, value] of Object.entries(parsed.overrides)) {
        if (Array.isArray(value) && value.every((id) => typeof id === "string")) overrides[key] = value;
      }
    }
    return {
      ...base,
      college,
      startYear,
      trackId,
      view: parsed.view === "catalog" || parsed.view === "schedule" ? parsed.view : "pathways",
      compare: Boolean(parsed.compare),
      completed: Array.isArray(parsed.completed)
        ? parsed.completed.filter((id): id is string => typeof id === "string" && courseMap.has(id))
        : [],
      interests: Array.isArray(parsed.interests)
        ? parsed.interests.filter((id): id is string => typeof id === "string" && interestLabel.has(id))
        : base.interests,
      semesters,
      creditComfort:
        typeof parsed.creditComfort === "number" ? Math.min(22, Math.max(12, parsed.creditComfort)) : base.creditComfort,
      showGrad: Boolean(parsed.showGrad),
      ece2300: Boolean(parsed.ece2300),
      probabilityDone: Boolean(parsed.probabilityDone),
      overrides,
      filters,
      history: [],
    };
  } catch {
    return base;
  }
}

export function saveState(state: PlannerState) {
  const { history: _history, ...rest } = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
}

export function firstYearDone(college: College): string[] {
  return ["CS 1110", "CS 2110", "CS 2800", mathByCollege[college].calc1, mathByCollege[college].calc2];
}

export function trackCourses(trackId: TrackId): Course[] {
  return courses.filter((course) => course.tracks[trackId]);
}
