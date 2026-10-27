import { useEffect, useRef } from "react";
import { getCourse, interests, trackMap, trackOrder } from "../data";
import {
  creditsLabel,
  filterCourses,
  formatReq,
  hardBlocks,
  readiness,
  semesterLabel,
  unlocks,
  workloadWord,
} from "../logic";
import { usePlanner } from "../store";
import type { Course, Filters } from "../types";

function shortName(title: string): string {
  return title.split(":")[0].split("—")[0].trim();
}

const statusLabel: Record<ReturnType<typeof readiness>, string> = {
  now: "Ready now",
  later: "Ready later",
  locked: "Locked",
  scheduled: "Scheduled",
  completed: "Completed",
};

export function Catalog() {
  const { state, update, selectedId, setSelected, editSemesters } = usePlanner();
  const detailRef = useRef<HTMLElement>(null);
  const results = filterCourses(state);
  const selected = selectedId ? getCourse(selectedId) : undefined;
  const scheduled = state.semesters.flatMap((semester) => semester.courseIds);
  const hidden = Boolean(selected && !results.some((course) => course.id === selected.id));

  useEffect(() => {
    if (!selectedId || window.innerWidth > 960) return;
    detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedId]);

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    update((current) => ({ ...current, filters: { ...current.filters, [key]: value } }));
  }

  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Catalog</p>
        <h1>Filter the courses, then see what they unlock.</h1>
        <p className="lede">
          Search by number, title, or skill. Ready now means the prerequisites are already in your completed courses.
          Ready later means your current schedule unlocks them.
        </p>
      </header>

      <div className="filter-bar">
        <label className="search">
          <span className="sr">Search</span>
          <input
            type="search"
            value={state.filters.query}
            placeholder="Search courses, skills, or numbers"
            onChange={(event) => setFilter("query", event.target.value)}
          />
        </label>
        <label>
          Track
          <select value={state.filters.track} onChange={(event) => setFilter("track", event.target.value as Filters["track"])}>
            <option value="all">All tracks</option>
            {trackOrder.map((id) => (
              <option key={id} value={id}>
                {trackMap.get(id)!.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Interest
          <select value={state.filters.interest} onChange={(event) => setFilter("interest", event.target.value)}>
            <option value="all">Any interest</option>
            {interests.map((interest) => (
              <option key={interest.id} value={interest.id}>
                {interest.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Level
          <select value={state.filters.level} onChange={(event) => setFilter("level", event.target.value as Filters["level"])}>
            <option value="all">All levels</option>
            <option value="1000">1000</option>
            <option value="2000">2000</option>
            <option value="3000">3000</option>
            <option value="4000">4000</option>
            <option value="5000">5000</option>
          </select>
        </label>
        <label>
          Term
          <select value={state.filters.term} onChange={(event) => setFilter("term", event.target.value as Filters["term"])}>
            <option value="all">Any term</option>
            <option value="fall">Fall</option>
            <option value="spring">Spring</option>
          </select>
        </label>
        <label>
          Status
          <select
            value={state.filters.status}
            onChange={(event) => setFilter("status", event.target.value as Filters["status"])}
          >
            <option value="all">Any status</option>
            <option value="now">Ready now</option>
            <option value="later">Ready later</option>
            <option value="locked">Locked</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={state.showGrad}
            onChange={(event) => update((current) => ({ ...current, showGrad: event.target.checked }))}
          />
          M.Eng. courses
        </label>
      </div>

      <p className="result-count" aria-live="polite">
        {results.length} {results.length === 1 ? "course" : "courses"}
      </p>

      <div className="catalog-layout">
        <div className="course-list">
          {results.length === 0 ? (
            <p className="empty">Nothing matches these filters. Clear one of them to widen the list.</p>
          ) : (
            results.map((course) => {
              const status = readiness(course, state.completed, scheduled, { ece2300: state.ece2300 });
              return (
                <button
                  key={course.id}
                  type="button"
                  className="course-row"
                  aria-pressed={selectedId === course.id}
                  onClick={() => setSelected(course.id)}
                >
                  <span className="row-top">
                    <b>{course.id}</b>
                    <span className={`pill ${status}`}>{statusLabel[status]}</span>
                  </span>
                  <span className="row-title">{shortName(course.title)}</span>
                  <span className="row-meta">
                    {creditsLabel(course.credits)} cr · {course.terms.join(" / ")} · {workloadWord(course.workload)}
                  </span>
                </button>
              );
            })
          )}
        </div>
        <article className="detail" ref={detailRef}>
          {selected ? (
            <CourseDetail course={selected} hidden={hidden} />
          ) : (
            <p className="empty">Select a course to see its prerequisites, the courses it unlocks, and where it can sit.</p>
          )}
        </article>
      </div>
    </div>
  );

  function CourseDetail({ course, hidden }: { course: Course; hidden: boolean }) {
    const blocks = hardBlocks(course, [...state.completed, ...scheduled], [], "fall", {
      ece2300: state.ece2300,
      allowGrad: true,
      checkOffering: false,
    });
    const next = unlocks(course);
    const status = readiness(course, state.completed, scheduled, { ece2300: state.ece2300 });
    return (
      <>
        <p className={`pill ${status}`}>{statusLabel[status]}</p>
        <h2>
          {course.id}
          <span>{course.title}</span>
        </h2>
        <p className="row-meta">
          {creditsLabel(course.credits)} credits · {course.terms.map((term) => (term === "fall" ? "Fall" : "Spring")).join(" and ")} ·{" "}
          {workloadWord(course.workload)} workload
          {course.practicum ? " · Practicum" : ""}
          {course.grad ? " · M.Eng." : ""}
        </p>
        <p>{course.summary}</p>
        {course.note ? <p className="note">{course.note}</p> : null}
        {hidden ? (
          <p className="note">
            Hidden by the current filters.{" "}
            <button
              type="button"
              className="text-btn"
              onClick={() =>
                update((current) => ({
                  ...current,
                  showGrad: current.showGrad || course.grad,
                  filters: { ...current.filters, query: "", track: "all", interest: "all", level: "all", term: "all", status: "all" },
                }))
              }
            >
              Clear filters
            </button>
          </p>
        ) : null}
        <h3>Prerequisites</h3>
        <p>{formatReq(course.prereqs)}</p>
        {course.concurrent.length > 0 ? <p className="note">May be taken with {course.concurrent.join(", ")}.</p> : null}
        {course.coreqs.length > 0 ? <p className="note">Take with {course.coreqs.join(", ")}.</p> : null}
        {course.recommended.length > 0 ? <p className="note">Recommended first: {course.recommended.join(", ")}.</p> : null}
        {blocks.length > 0 ? (
          <>
            <h3>Still missing</h3>
            <ul className="plain">
              {blocks.map((block) => (
                <li key={block}>{block}</li>
              ))}
            </ul>
          </>
        ) : null}
        {course.skills.length > 0 ? (
          <>
            <h3>Skills</h3>
            <p>{course.skills.join(" · ")}</p>
          </>
        ) : null}
        <h3>Tracks</h3>
        <p>
          {trackOrder
            .filter((id) => course.tracks[id])
            .map((id) => `${trackMap.get(id)!.name} (${course.tracks[id] === "track" ? "depth" : "core"})`)
            .join(" · ") || "Outside the four pathways"}
        </p>
        <h3>Unlocks</h3>
        {next.length === 0 ? (
          <p className="note">No later course in this catalog lists this as a prerequisite.</p>
        ) : (
          <div className="choice-row">
            {next.slice(0, 8).map((item) => (
              <button key={item.id} type="button" className="choice" onClick={() => setSelected(item.id)}>
                {item.id}
              </button>
            ))}
          </div>
        )}
        <h3>Add to a semester</h3>
        {state.completed.includes(course.id) ? (
          <p className="note">Already in your completed courses.</p>
        ) : (
          <div className="choice-row">
            {state.semesters.map((semester, index) => {
              const placed = semester.courseIds.includes(course.id);
              const offered = course.terms.includes(semester.term);
              return (
                <button
                  key={semesterLabel(semester)}
                  type="button"
                  className="choice"
                  disabled={placed}
                  onClick={() =>
                    editSemesters((semesters) =>
                      semesters.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, courseIds: [...item.courseIds, course.id] } : item,
                      ),
                    )
                  }
                >
                  {placed ? `${semesterLabel(semester)} · added` : semesterLabel(semester)}
                  {!offered && !placed ? " · other term" : ""}
                </button>
              );
            })}
          </div>
        )}
      </>
    );
  }
}
