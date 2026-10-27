import { useCallback, useEffect, useMemo, useState } from "react";
import { trackMap } from "./data";
import {
  applyResolved,
  evaluate,
  loadState,
  resolveTrack,
  retargetMath,
  saveState,
  shiftStartYear,
} from "./logic";
import type { College, PlannerState, Semester, TrackId } from "./types";
import { Catalog } from "./views/Catalog";
import { Pathways } from "./views/Pathways";
import { Profile } from "./views/Profile";
import { Schedule } from "./views/Schedule";
import { PlannerContext, type Store } from "./store";

export function App() {
  const [state, setState] = useState<PlannerState>(() => loadState());
  const [selectedId, setSelected] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const report = useMemo(() => evaluate(state), [state]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const update = useCallback((fn: (current: PlannerState) => PlannerState) => {
    setState(fn);
  }, []);

  const editSemesters = useCallback((fn: (semesters: Semester[]) => Semester[]) => {
    setState((current) => {
      const semesters = fn(current.semesters);
      return {
        ...current,
        history: [...current.history, current.semesters].slice(-20),
        semesters,
      };
    });
  }, []);

  const store = useMemo<Store>(() => {
    return {
      state,
      report,
      selectedId,
      update,
      editSemesters,
      undo: () => {
        setState((current) => {
          if (current.history.length === 0) return current;
          const history = current.history.slice(0, -1);
          return { ...current, history, semesters: current.history[current.history.length - 1] };
        });
      },
      setCollege: (college: College) => {
        setState((current) => {
          if (current.college === college) return current;
          return {
            ...current,
            college,
            completed: retargetMath(current.completed, current.college, college),
            semesters: current.semesters.map((semester) => ({
              ...semester,
              courseIds: retargetMath(semester.courseIds, current.college, college),
            })),
          };
        });
      },
      setStartYear: (year: number) => {
        setState((current) => ({
          ...current,
          startYear: year,
          semesters: shiftStartYear(current.semesters, year),
        }));
      },
      openCourse: (id: string) => {
        setSelected(id);
        setState((current) => ({ ...current, view: "catalog" }));
      },
      setSelected,
      applyPathway: (trackId: TrackId) => {
        setState((current) => {
          const resolved = resolveTrack(trackId, current.college, current.interests, current.overrides, {
            ece2300: current.ece2300,
            allowGrad: current.showGrad,
          });
          return {
            ...current,
            trackId,
            view: "schedule",
            history: [...current.history, current.semesters].slice(-20),
            semesters: applyResolved(current.semesters, resolved, current.completed),
          };
        });
      },
      toggleInterest: (id: string) => {
        setState((current) => ({
          ...current,
          interests: current.interests.includes(id)
            ? current.interests.filter((item) => item !== id)
            : [...current.interests, id],
        }));
      },
      setOverride: (key: string, ids: string[]) => {
        setState((current) => ({ ...current, overrides: { ...current.overrides, [key]: ids } }));
      },
      useTrackInterests: () => {
        setState((current) => ({
          ...current,
          interests: [...(trackMap.get(current.trackId)?.defaultInterests ?? current.interests)],
          overrides: Object.fromEntries(
            Object.entries(current.overrides).filter(([key]) => !key.startsWith(`${current.trackId}:`)),
          ),
        }));
      },
    };
  }, [state, report, selectedId, update, editSemesters]);

  const track = trackMap.get(state.trackId)!;
  const blocks = report.issues.filter((issue) => issue.severity === "block").length;
  const warns = report.issues.filter((issue) => issue.severity === "warn").length;

  return (
    <PlannerContext.Provider value={store}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="app">
        <aside className="side">
          <div className="brand">
            <span className="mark" aria-hidden="true">
              CS
            </span>
            <div>
              <strong>Cornell Course Planner</strong>
              <em>Ithaca</em>
            </div>
          </div>
          <nav aria-label="Sections">
            {(
              [
                ["pathways", "Pathways"],
                ["catalog", "Catalog"],
                ["schedule", "Schedule"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="nav-btn"
                aria-current={state.view === id ? "page" : undefined}
                onClick={() => update((current) => ({ ...current, view: id }))}
              >
                {label}
                {id === "schedule" && (blocks > 0 || warns > 0) ? (
                  <span className={blocks > 0 ? "badge block" : "badge"}>{blocks > 0 ? blocks : warns}</span>
                ) : null}
              </button>
            ))}
          </nav>
          <div className="side-foot">
            <p>{state.college === "arts" ? "Arts & Sciences math" : "Engineering math"}</p>
            <p>{track.name}</p>
            <p>
              {state.completed.length} completed · {state.creditComfort} credit comfort
            </p>
            <button type="button" className="profile-btn" onClick={() => setProfileOpen(true)}>
              Profile and rules
            </button>
          </div>
        </aside>
        <main id="main">
          {state.view === "pathways" ? <Pathways /> : null}
          {state.view === "catalog" ? <Catalog /> : null}
          {state.view === "schedule" ? <Schedule /> : null}
          <footer className="disclaimer">
            Titles, credits, prerequisites, and typical terms follow the Cornell CS catalog for students who entered in
            fall 2024 or later. Offerings change, so confirm the class roster. Technical electives and the external
            specialization are left open on purpose. This is a sequencing tool, not a degree audit.
          </footer>
        </main>
      </div>
      <Profile open={profileOpen} onClose={() => setProfileOpen(false)} />
    </PlannerContext.Provider>
  );
}
