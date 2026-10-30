import { useState } from "react";
import { ArrowUpRight, Crown, Trophy } from "lucide-react";
import { useMockContract } from "./demo-context";
import { formatNumber } from "@/lib/validation";
import { SectionTitle } from "./ui";
export function Leaderboard() {
  const [past, setPast] = useState(false);
  const { contract } = useMockContract();
  const players = contract.getLeaderboard();
  return (
    <section id="leaderboard" className="leaderboard-section">
      <SectionTitle number="04" aside={<Trophy size={25} />}>
        {past ? "Past seasons" : "Season 7 leaderboard"}
      </SectionTitle>
      <div className="leaderboard-top">
        <div>
          <p className="pot-line">
            <strong className="mono">12,400 IMD + 10,000,000 PLEA</strong>
          </p>
          <p className="small muted">
            Top 25 with 60+ points · sample standings
          </p>
        </div>
        <div
          className="season-tabs"
          role="group"
          aria-label="Leaderboard season"
        >
          <button
            className={!past ? "selected" : ""}
            onClick={() => setPast(false)}
          >
            This season
          </button>
          <button
            className={past ? "selected" : ""}
            onClick={() => setPast(true)}
          >
            Past seasons
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
      {past ? (
        <div className="past-seasons">
          {[6, 5, 4].map((season, i) => (
            <div className="past-season card" key={season}>
              <span className="season-icon">
                <Trophy size={23} />
              </span>
              <div>
                <h3>Season {season}</h3>
                <p className="small muted">
                  25 winners · {(9800 - i * 1600).toLocaleString("en-US")} IMD
                  shared
                </p>
              </div>
              <span className="paid-stamp">PRIZE PAID</span>
              <span className="small muted">Demo history</span>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="leaderboard-table-wrap card"
          role="region"
          aria-label="Season standings, scroll horizontally on a narrow screen"
          tabIndex={0}
        >
          <table className="leaderboard-table">
            <caption className="sr-only">
              Sample season 7 standings. All players and prizes are fictional
              demo data.
            </caption>
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Player</th>
                <th scope="col">Best three</th>
                <th scope="col">Points</th>
                <th scope="col">Prize</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr key={p.name}>
                  <td className="rank mono">
                    {i === 0 && <Crown size={15} />}{" "}
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td>
                    <div className="player">
                      <span
                        className={`avatar avatar-${i}`}
                        style={{ background: p.color }}
                        aria-hidden="true"
                      >
                        <i />
                        <i />
                      </span>
                      <div>
                        <strong>{p.name}</strong>
                        {p.seat && (
                          <span className="seat-badge">SEAT 1.2x</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="mono best-three">
                    {p.best.map((n) => (
                      <span key={n}>{n}</span>
                    ))}
                  </td>
                  <td className="mono points">{p.points}</td>
                  <td className="mono prize">
                    {formatNumber(p.prize)}
                    <span className="small"> IMD</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!past && (
        <p className="table-scroll-hint small muted">
          Scroll to see all scores and prizes →
        </p>
      )}
      <div className="leaderboard-foot">
        <p>Every win scores. Top 25 split the pot.</p>
        <span className="small muted">
          + 10,000,000 PLEA a season for the first six.
        </span>
      </div>
    </section>
  );
}
