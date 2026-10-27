import { useMemo, useState } from "react";
import { getCourse, interests, mathByCollege, trackMap, trackOrder } from "../data";
import { creditsLabel, progressFor, resolveTrack, semesterLabel } from "../logic";
import { usePlanner } from "../store";
import type { TrackId } from "../types";

function shortName(title: string): string {
  return title.split(":")[0].split("—")[0].trim();
}

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

export function Pathways() {
  const { state, update, openCourse, applyPathway, toggleInterest, setOverride, setCollege, useTrackInterests } =
    usePlanner();
  const [confirm, setConfirm] = useState(false);
  const track = trackMap.get(state.trackId)!;
  const opts = { ece2300: state.ece2300, allowGrad: state.showGrad };
  const resolved = useMemo(
    () => resolveTrack(state.trackId, state.college, state.interests, state.overrides, opts),
    [state.trackId, state.college, state.interests, state.overrides, state.ece2300, state.showGrad],
  );
  const compared = useMemo(() => {
    if (!state.compare) return [];
    return trackOrder.map((id) => ({
      id,
      terms: resolveTrack(id, state.college, state.interests, state.overrides, opts).map((term) =>
        term.items.flatMap((item) => item.ids),
      ),
    }));
  }, [state.compare, state.college, state.interests, state.overrides, state.ece2300, state.showGrad]);

  const coverage = progressFor(
    resolved.flatMap((term) => term.items.flatMap((item) => item.ids)),
    state.probabilityDone,
  );
  const scheduled = state.semesters.some((semester) => semester.courseIds.length > 0);
  const math = mathByCollege[state.college];
  const usingDefaults =
    track.defaultInterests.length === state.interests.length &&
    track.defaultInterests.every((id) => state.interests.includes(id));

  const counts = new Map<string, number>();
  for (const plan of compared) {
    for (const id of new Set(plan.terms.flat())) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return (
    <div className="page">
      <header className="page-head">
        <p className="kicker">Career tracks</p>
        <h1>Map a goal onto a sequence you can schedule.</h1>
        <p className="lede">
          Four pathways share the CS core, then split toward software engineering, AI, systems, or data. Interests
          retarget the electives. Prerequisites decide what is actually available.
        </p>
      </header>

      <div className="toolbar">
        <div className="segmented" role="group" aria-label="College math sequence">
          <button type="button" aria-pressed={state.college === "arts"} onClick={() => setCollege("arts")}>
            Arts: {mathByCollege.arts.calc1.replace("MATH ", "")}–{mathByCollege.arts.linalg.replace("MATH ", "")}
          </button>
          <button
            type="button"
            aria-pressed={state.college === "engineering"}
            onClick={() => setCollege("engineering")}
          >
            Engineering: {mathByCollege.engineering.calc1.replace("MATH ", "")}–
            {mathByCollege.engineering.linalg.replace("MATH ", "")}
          </button>
        </div>
        <p className="toolbar-note">
          This pathway uses {math.calc1}, {math.calc2}, and {math.linalg}. Switching colleges rewrites those courses on
          your schedule.
        </p>
      </div>

      <fieldset className="interest-set">
        <legend>Interests</legend>
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
        <button type="button" className="text-btn" onClick={useTrackInterests} disabled={usingDefaults}>
          Reset to this track's interests
        </button>
      </fieldset>

      <div className="track-grid">
        {trackOrder.map((id) => {
          const item = trackMap.get(id)!;
          return (
            <button
              key={id}
              type="button"
              className="track-card"
              data-track={id}
              aria-pressed={state.trackId === id}
              onClick={() => update((current) => ({ ...current, trackId: id }))}
            >
              <span className="track-kicker">{item.name}</span>
              <span>{item.summary}</span>
            </button>
          );
        })}
      </div>

      <div className="section-row">
        <div>
          <h2>{track.name}</h2>
          <ul className="outcomes">
            {track.outcomes.map((outcome) => (
              <li key={outcome}>{outcome}</li>
            ))}
          </ul>
        </div>
        <div className="apply-box">
          {confirm ? (
            <>
              <p>Replace the courses currently on your schedule with this pathway?</p>
              <div className="row-actions">
                <button type="button" className="primary" onClick={() => { applyPathway(state.trackId); setConfirm(false); }}>
                  Replace schedule
                </button>
                <button type="button" className="ghost" onClick={() => setConfirm(false)}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p>Completed courses stay off the schedule. You can still move anything after.</p>
              <button
                type="button"
                className="primary"
                onClick={() => (scheduled ? setConfirm(true) : applyPathway(state.trackId))}
              >
                {scheduled ? "Replace schedule with this pathway" : "Use this pathway"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="pathway-body">
        <div className="years">
          {[0, 1, 2, 3].map((year) => (
            <section key={year} className="year-block">
              <h3>Year {year + 1}</h3>
              <div className="pair">
                {[0, 1].map((half) => {
                  const index = year * 2 + half;
                  const semester = state.semesters[index];
                  const term = resolved[index];
                  const credits = term.items.reduce(
                    (sum, item) => sum + item.ids.reduce((inner, id) => inner + (getCourse(id)?.credits ?? 0), 0),
                    0,
                  );
                  return (
                    <article key={index} className="term-card">
                      <header>
                        <h4>{semesterLabel(semester)}</h4>
                        <span>{creditsLabel(credits)} cr</span>
                      </header>
                      {term.items.map((item) => (
                        <div key={item.key} className={item.blocked ? "placed is-blocked" : "placed"}>
                          {item.ids.map((id) => {
                            const course = getCourse(id);
                            const done = state.completed.includes(id);
                            return (
                              <button key={id} type="button" className="course-link" onClick={() => openCourse(id)}>
                                <b>{id}</b>
                                <span>{course ? shortName(course.title) : id}</span>
                                {done ? <em>Done</em> : null}
                              </button>
                            );
                          })}
                          <p className="why">{item.why}</p>
                          {item.reason ? <p className="reason">{item.reason}</p> : null}
                          {item.blocked ? <p className="flag">{item.blocked}</p> : null}
                          {item.choices.length > 1 ? (
                            <div className="choice-row" role="group" aria-label="Elective options">
                              {item.choices.map((choice) => (
                                <button
                                  key={choice.label}
                                  type="button"
                                  className={choice.blocked ? "choice is-blocked" : "choice"}
                                  aria-pressed={sameIds(choice.ids, item.ids)}
                                  title={choice.blocked ?? undefined}
                                  onClick={() => setOverride(item.key, choice.ids)}
                                >
                                  {choice.label}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                      {credits < 12 ? <p className="room">Room left for courses outside this pathway.</p> : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <aside className="side-panel">
          <section>
            <h2>Progression rules</h2>
            <ul className="plain">
              {track.constraints.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
            <p className="later">{track.later}</p>
          </section>
          <section>
            <h2>What this pathway covers</h2>
            <ul className="checks">
              {coverage.map((item) => (
                <li key={item.id} data-done={item.done}>
                  <span>{item.done ? "Met" : "Open"}</span>
                  <div>
                    <strong>{item.label}</strong>
                    <em>{item.detail}</em>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <section className="compare-section">
        <div className="section-row">
          <div>
            <h2>Compare pathways</h2>
            <p className="lede tight">
              Shared courses are the major core. A colored code belongs to one pathway; a quiet code shows up in more
              than one.
            </p>
          </div>
          <button
            type="button"
            className="ghost"
            aria-pressed={state.compare}
            onClick={() => update((current) => ({ ...current, compare: !current.compare }))}
          >
            {state.compare ? "Hide comparison" : "Compare all four"}
          </button>
        </div>
        {state.compare ? (
          <div className="matrix-scroll">
            <table className="matrix">
              <thead>
                <tr>
                  <th scope="col">Term</th>
                  {compared.map((plan) => (
                    <th key={plan.id} scope="col" data-track={plan.id}>
                      <button type="button" className="text-btn" onClick={() => update((current) => ({ ...current, trackId: plan.id as TrackId }))}>
                        {trackMap.get(plan.id)!.name}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.semesters.map((semester, index) => (
                  <tr key={semesterLabel(semester)}>
                    <th scope="row">{semesterLabel(semester)}</th>
                    {compared.map((plan) => (
                      <td key={plan.id} data-track={plan.id}>
                        {plan.terms[index].map((id) => {
                          const count = counts.get(id) ?? 1;
                          const tone = count === 4 ? "shared" : count === 1 ? "only" : "some";
                          return (
                            <button key={id} type="button" className={`code ${tone}`} onClick={() => openCourse(id)}>
                              {id}
                            </button>
                          );
                        })}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
