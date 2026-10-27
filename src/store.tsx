import { createContext, useContext } from "react";
import type { College, PlannerState, Semester, TrackId } from "./types";
import type { Report } from "./logic";

export type Store = {
  state: PlannerState;
  report: Report;
  selectedId: string | null;
  update: (fn: (state: PlannerState) => PlannerState) => void;
  editSemesters: (fn: (semesters: Semester[]) => Semester[]) => void;
  undo: () => void;
  setCollege: (college: College) => void;
  setStartYear: (year: number) => void;
  openCourse: (id: string) => void;
  setSelected: (id: string | null) => void;
  applyPathway: (trackId: TrackId) => void;
  toggleInterest: (id: string) => void;
  setOverride: (key: string, ids: string[]) => void;
  useTrackInterests: () => void;
};

export const PlannerContext = createContext<Store | null>(null);

export function usePlanner(): Store {
  const value = useContext(PlannerContext);
  if (!value) throw new Error("Planner context missing");
  return value;
}
