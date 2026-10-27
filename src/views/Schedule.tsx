import { useMemo, useState } from "react";
import { getCourse, mathByCollege, trackMap } from "../data";
import { coursesToAdd, creditsLabel, expandIds, semesterLabel, workloadWord } from "../logic";
import { usePlanner } from "../store";
import type { Course } from "../types";

function shortName(title: string): string {
  return title.split(":")[0].split("—")[0].trim();
}

export function Schedule() {
  const { state, report, editSemesters, undo, applyPathway, openCourse } = usePlanner();
  const [adding, setAdding] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [showLocked, setShowLocked] = useState(false);
  const [pending, setPending] = useState<null | "apply" | "clear">(null);
  const filled = state.semesters.some((semester) => semester.courseIds.length > 0);
  const track = trackMap.get(state.trackId)!;
  const math = mathByCollege[state.college];

  function add(index: number, id: string) {
    editSemesters((semesters) =>
      semesters.map((semester, semesterIndex) =>
        semesterIndex === index && !semester.courseIds.includes(id)
          ? { ...semester, courseIds: [...semester.courseIds, id] }
          : semester,
      ),
    );
  }

  function remove(index: number, id: string) {
    editSemesters((semesters) =>
      semesters.map((semester, semesterIndex) =>
        semesterIndex === index
          ? { ...semester, courseIds: semester.courseIds.filter((courseId) => courseId !== id) }
          : semester,
      ),
    );
  }

  function move(from: number, id: string, to: number) {
    if (from === to) return;
    editSemesters((semesters) =>
      semesters.map((semester, index) => {
        if (index === from) return { ...semester, courseIds: semester.courseIds.filter((courseId) => courseId !== id) };
        if (index === to && !semester.courseIds.includes(id)) return { ...semester, courseIds: [...semester.courseIds, id] };
        return semester;
      }),
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Schedule</p>
        <h1>Iterate until the sequence holds together.</h1>
        <p className="lede">
          Add, move, and remove courses. The rules under the semesters use your completed courses, your {state.creditComfort}
          -credit comfort, and the {state.college === "arts" ? "arts" : "engineering"} math sequence.
        </p>
      </header>

      {!filled ? (
        <section className="empty-plan">
          <h2>Start from a pathway, or build term by term.</h2>
          <p>The {track.name.toLowerCase()} pathway is selected. Completed courses are left out.</p>
          <button type="button" className="primary" onClick={() => applyPathway(state.trackId)}>
            Use the {track.name.toLowerCase()} pathway
          </button>
        </section>
      ) : (
        <div className="toolbar">
          {pending === "apply" ? (
            <div className="row-actions">
              <span>Replace every semester with the {track.name.toLowerCase()} pathway?</span>
              <button type="button" className="primary" onClick={() => { applyPathway(state.trackId); setPending(null); }}>
                Replace
              </button>
              <button type="button" className="ghost" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          ) : pending === "clear" ? (
            <div className="row-actions">
              <span>Remove every course from the schedule?</span>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  editSemesters((semesters) => semesters.map((semester) => ({ ...semester, courseIds: [] })));
                  setPending(null);
                }}
              >
                Clear
              </button>
              <button type="button" className="ghost" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="row-actions">
              <button type="button" className="primary" onClick={() => setPending("apply")}>
                Replace with {track.name.toLowerCase()}
              </button>
              <button type="button" className="ghost" onClick={undo} disabled={state.history.length === 0}>
                Undo
              </button>
              <button type="button" className="ghost" onClick={() => setPending("clear")}>
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      <ol className="progress">
        {report.progress.map((item) => (
          <li key={item.id} data-done={item.done}>
            <span>{item.done ? "Met" : "Open"}</span>
            <strong>{item.label}</strong>
            <em>{item.detail}</em>
          </li>
        ))}
      </ol>

      {report.issues.length === 0 ? (
        <p className="ok-line">No rule breaks in this schedule.</p>
      ) : (
        <ul className="banner" aria-live="polite">
          {report.issues.map((issue, index) => (
            <li key={`${issue.text}-${index}`} data-severity={issue.severity}>
              {issue.text}
            </li>
          ))}
        </ul>
      )}

      <section className="rules">
        <h2>Rules in effect</h2>
        <ul className="plain">
          <li>Prerequisites must be finished earlier. Corequisites share the semester. CS 2800 may sit beside CS 3110, and a practicum may sit beside its lecture when the catalog allows it.</li>
          <li>
            Comfort cap is {state.creditComfort} credits. Two heavy courses in one term, or a workload that piles up, gets a warning.
          </li>
          <li>The major asks for at least three of the six CS core courses by the end of junior spring.</li>
          <li>
            Math sequence: {math.calc1}, {math.calc2}, {math.linalg}.
            {state.ece2300 ? " ECE 2300 is marked done." : ""}
            {state.probabilityDone ? " Probability is marked done outside this planner." : ""}
          </li>
        </ul>
      </section>

      <div className="years">
        {[0, 1, 2, 3].map((year) => (
          <section key={year} className="year-block">
            <h3>Year {year + 1}</h3>
            <div className="pair">
              {[0, 1].map((half) => {
                const index = year * 2 + half;
                return (
                  <SemesterCard
                    key={index}
                    index={index}
                    adding={adding === index}
                    query={adding === index ? query : ""}
                    showLocked={showLocked}
                    onQuery={setQuery}
                    onToggleLocked={() => setShowLocked((value) => !value)}
                    onOpenAdd={() => {
                      setAdding(index);
                      setQuery("");
                      setShowLocked(false);
                    }}
                    onCloseAdd={() => setAdding(null)}
                    onAdd={(id) => add(index, id)}
                    onRemove={(id) => remove(index, id)}
                    onMove={(id, to) => move(index, id, to)}
                    onOpenCourse={openCourse}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function SemesterCard({
  index,
  adding,
  query,
  showLocked,
  onQuery,
  onToggleLocked,
  onOpenAdd,
  onCloseAdd,
  onAdd,
  onRemove,
  onMove,
  onOpenCourse,
}: {
  index: number;
  adding: boolean;
  query: string;
  showLocked: boolean;
  onQuery: (value: string) => void;
  onToggleLocked: () => void;
  onOpenAdd: () => void;
  onCloseAdd: () => void;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, to: number) => void;
  onOpenCourse: (id: string) => void;
}) {
  const { state, report } = usePlanner();
  const semester = state.semesters[index];
  const termReport = report.terms[index];
  const groups = useMemo(() => coursesToAdd(state, index), [state, index]);
  const needle = query.toLowerCase().replace(/\s+/g, "");
  const match = (course: Course) =>
    !needle ||
    course.id.toLowerCase().replace(/\s+/g, "").includes(needle) ||
    course.title.toLowerCase().includes(query.toLowerCase());
  const fit = groups.fit.filter(match);
  const offTerm = groups.offTerm.filter(match);
  const overlap = groups.overlap.filter(match);
  const locked = groups.locked.filter((item) => match(item.course));
  const suggestions = groups.fit
    .filter((course) => {
      const earlier = expandIds([
        ...state.completed,
        ...state.semesters.slice(0, index).flatMap((item) => item.courseIds),
      ]);
      return course.recommended.every((id) => earlier.has(id));
    })
    .slice(0, 3);

  return (
    <article className="term-card">
      <header>
        <h4>{semesterLabel(semester)}</h4>
        <span>
          {creditsLabel(termReport?.credits ?? 0)} cr
        </span>
      </header>
      {semester.courseIds.length === 0 ? <p className="room">Nothing planned.</p> : null}
      <ul className="planned">
        {semester.courseIds.map((id) => {
          const course = getCourse(id);
          const flags = termReport?.flags.filter((flag) => flag.courseId === id) ?? [];
          return (
            <li key={id} data-severity={flags.some((flag) => flag.severity === "block") ? "block" : flags.length ? "warn" : undefined}>
              <button type="button" className="course-link" onClick={() => onOpenCourse(id)}>
                <b>{id}</b>
                <span>{course ? shortName(course.title) : id}</span>
              </button>
              <div className="course-actions">
                <select
                  aria-label={`Move ${id}`}
                  value={index}
                  onChange={(event) => onMove(id, Number(event.target.value))}
                >
                  {state.semesters.map((item, itemIndex) => (
                    <option key={semesterLabel(item)} value={itemIndex}>
                      {semesterLabel(item)}
                    </option>
                  ))}
                </select>
                <button type="button" className="icon" aria-label={`Remove ${id}`} onClick={() => onRemove(id)}>
                  ×
                </button>
              </div>
              {flags.map((flag) => (
                <p key={flag.text} className={flag.severity === "block" ? "flag" : "warn-line"}>
                  {flag.text}
                </p>
              ))}
            </li>
          );
        })}
      </ul>
      {termReport?.notes.map((note) => (
        <p key={note} className="room">
          {note}
        </p>
      ))}
      {suggestions.length > 0 ? (
        <div className="suggest">
          <span>Fits next</span>
          {suggestions.map((course) => (
            <button key={course.id} type="button" onClick={() => onAdd(course.id)}>
              {course.id}
            </button>
          ))}
        </div>
      ) : null}
      {adding ? (
        <div className="add-panel">
          <label className="search">
            <span className="sr">Search courses to add</span>
            <input
              autoFocus
              type="search"
              value={query}
              placeholder="Add a course"
              onChange={(event) => onQuery(event.target.value)}
            />
          </label>
          <AddGroup title="Fits this semester" courses={fit} onAdd={onAdd} />
          <AddGroup title="Usually the other term" courses={offTerm} onAdd={onAdd} />
          {needle ? <AddGroup title="Same requirement you already have" courses={overlap} onAdd={onAdd} /> : null}
          {locked.length > 0 ? (
            <div>
              <button type="button" className="text-btn" onClick={onToggleLocked}>
                {showLocked ? "Hide" : "Show"} {locked.length} with missing prerequisites
              </button>
              {showLocked ? (
                <ul className="add-list">
                  {locked.map((item) => (
                    <li key={item.course.id}>
                      <button type="button" onClick={() => onAdd(item.course.id)}>
                        <b>{item.course.id}</b> {shortName(item.course.title)}
                      </button>
                      <span>{item.reason}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          <button type="button" className="ghost" onClick={onCloseAdd}>
            Done
          </button>
        </div>
      ) : (
        <button type="button" className="ghost add" onClick={onOpenAdd}>
          Add a course
        </button>
      )}
    </article>
  );
}

function AddGroup({ title, courses, onAdd }: { title: string; courses: Course[]; onAdd: (id: string) => void }) {
  if (courses.length === 0) return null;
  return (
    <div>
      <h5>{title}</h5>
      <ul className="add-list">
        {courses.map((course) => (
          <li key={course.id}>
            <button type="button" onClick={() => onAdd(course.id)}>
              <b>{course.id}</b> {shortName(course.title)}
            </button>
            <span>
              {creditsLabel(course.credits)} cr · {workloadWord(course.workload)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
