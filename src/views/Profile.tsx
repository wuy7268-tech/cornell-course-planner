import { useEffect, useRef, useState } from "react";
import { courses, interests, mathByCollege } from "../data";
import { firstYearDone } from "../logic";
import { usePlanner } from "../store";

export function Profile({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, update, setCollege, setStartYear, toggleInterest } = usePlanner();
  const ref = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const math = mathByCollege[state.college];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const needle = query.toLowerCase().replace(/\s+/g, "");
  const visible = courses.filter((course) => {
    if (!needle) return true;
    return (
      course.id.toLowerCase().replace(/\s+/g, "").includes(needle) ||
      course.title.toLowerCase().includes(query.toLowerCase())
    );
  });

  return (
    <dialog ref={ref} className="profile" onClose={onClose} aria-labelledby="profile-title">
      <header>
        <h2 id="profile-title">Profile and rules</h2>
        <button type="button" className="icon" aria-label="Close profile" onClick={onClose}>
          ×
        </button>
      </header>
      <div className="profile-body">
        <section>
          <h3>Math sequence</h3>
          <div className="segmented" role="group" aria-label="College math sequence">
            <button type="button" aria-pressed={state.college === "arts"} onClick={() => setCollege("arts")}>
              Arts & Sciences
            </button>
            <button type="button" aria-pressed={state.college === "engineering"} onClick={() => setCollege("engineering")}>
              Engineering
            </button>
          </div>
          <p className="note">
            {math.calc1}, {math.calc2}, and {math.linalg}. Changing this rewrites those courses wherever they already appear.
          </p>
        </section>
        <section>
          <h3>Starting fall</h3>
          <label>
            First year
            <select value={state.startYear} onChange={(event) => setStartYear(Number(event.target.value))}>
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                <option key={year} value={year}>
                  Fall {year}
                </option>
              ))}
            </select>
          </label>
        </section>
        <section>
          <h3>Credit comfort</h3>
          <label>
            Flag a term above {state.creditComfort} credits
            <input
              type="range"
              min={14}
              max={22}
              step={1}
              value={state.creditComfort}
              onChange={(event) => update((current) => ({ ...current, creditComfort: Number(event.target.value) }))}
            />
          </label>
        </section>
        <section>
          <h3>Interests</h3>
          <div className="chip-row">
            {interests.map((interest) => (
              <button
                key={interest.id}
                type="button"
                className="chip"
                aria-pressed={state.interests.includes(interest.id)}
                onClick={() => toggleInterest(interest.id)}
              >
                {interest.label}
              </button>
            ))}
          </div>
        </section>
        <section>
          <h3>Already satisfied</h3>
          <label className="check-label">
            <input
              type="checkbox"
              checked={state.ece2300}
              onChange={(event) => update((current) => ({ ...current, ece2300: event.target.checked }))}
            />
            ECE 2300 or ENGRD 2300 (unlocks CS 3420)
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={state.probabilityDone}
              onChange={(event) => update((current) => ({ ...current, probabilityDone: event.target.checked }))}
            />
            Probability requirement taken outside this planner
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={state.showGrad}
              onChange={(event) => update((current) => ({ ...current, showGrad: event.target.checked }))}
            />
            Include M.Eng. courses such as CS 5150 and CS 5430
          </label>
        </section>
        <section>
          <div className="section-row">
            <h3>Completed courses</h3>
            <button
              type="button"
              className="text-btn"
              onClick={() =>
                update((current) => {
                  const done = new Set([...current.completed, ...firstYearDone(current.college)]);
                  return {
                    ...current,
                    completed: [...done],
                    semesters: current.semesters.map((semester) => ({
                      ...semester,
                      courseIds: semester.courseIds.filter((id) => !done.has(id)),
                    })),
                  };
                })
              }
            >
              Mark first year done
            </button>
          </div>
          <label className="search">
            <span className="sr">Filter completed courses</span>
            <input
              type="search"
              value={query}
              placeholder="Filter the list"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <ul className="complete-list">
            {visible.map((course) => (
              <li key={course.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={state.completed.includes(course.id)}
                    onChange={(event) =>
                      update((current) => ({
                        ...current,
                        completed: event.target.checked
                          ? [...current.completed, course.id]
                          : current.completed.filter((id) => id !== course.id),
                        semesters: event.target.checked
                          ? current.semesters.map((semester) => ({
                              ...semester,
                              courseIds: semester.courseIds.filter((id) => id !== course.id),
                            }))
                          : current.semesters,
                      }))
                    }
                  />
                  <span>
                    <b>{course.id}</b> {course.title}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </dialog>
  );
}
