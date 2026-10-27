export type TermName = "fall" | "spring";
export type College = "arts" | "engineering";
export type TrackId = "software" | "ai" | "systems" | "data";
export type MathSlot = "calc1" | "calc2" | "linalg";
export type Workload = 1 | 2 | 3 | 4 | 5;

export type Req =
  | { op: "course"; id: string }
  | { op: "all"; of: Req[] }
  | { op: "any"; of: Req[] };

export type Course = {
  id: string;
  title: string;
  credits: number;
  dept: "CS" | "INFO" | "MATH";
  level: number;
  summary: string;
  terms: TermName[];
  prereqs: Req | null;
  concurrent: string[];
  coreqs: string[];
  waivers: string[];
  alsoSatisfies: string[];
  recommended: string[];
  workload: Workload;
  interests: string[];
  skills: string[];
  tracks: Partial<Record<TrackId, "core" | "track">>;
  practicum: boolean;
  grad: boolean;
  note?: string;
};

export type Interest = { id: string; label: string };

export type Slot =
  | { kind: "courses"; ids: string[]; why: string }
  | { kind: "math"; slot: MathSlot; why: string }
  | {
      kind: "pick";
      why: string;
      options: { ids: string[]; interests: string[]; label: string }[];
    };

export type Track = {
  id: TrackId;
  name: string;
  summary: string;
  outcomes: string[];
  constraints: string[];
  later: string;
  defaultInterests: string[];
  terms: Slot[][];
};

export type Semester = {
  term: TermName;
  year: number;
  courseIds: string[];
};

export type Filters = {
  query: string;
  track: TrackId | "all";
  interest: string;
  level: "all" | "1000" | "2000" | "3000" | "4000" | "5000";
  term: "all" | TermName;
  status: "all" | "now" | "later" | "locked" | "scheduled" | "completed";
};

export type PlannerState = {
  view: "pathways" | "catalog" | "schedule";
  college: College;
  startYear: number;
  completed: string[];
  interests: string[];
  trackId: TrackId;
  compare: boolean;
  semesters: Semester[];
  creditComfort: number;
  showGrad: boolean;
  ece2300: boolean;
  probabilityDone: boolean;
  overrides: Record<string, string[]>;
  filters: Filters;
  history: Semester[][];
};
