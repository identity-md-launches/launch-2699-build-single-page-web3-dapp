import { Fragment, useEffect, useState } from "react";
import { ArrowUpRight, CircleAlert, HeartPulse, Skull } from "lucide-react";
import { DEADMAN_WINDOW } from "@/lib/mock-contract";
import { formatDuration } from "@/lib/validation";
import { useMockContract } from "./demo-context";
import { SectionTitle } from "./ui";
export function Deadman({ onBuy }: { onBuy: () => void }) {
  const { contract, mode, changeMode } = useMockContract();
  const [remaining, setRemaining] = useState(DEADMAN_WINDOW);
  const dead = mode === "cabal-dead";
  useEffect(() => {
    const update = () => {
      const next = contract.getDeadmanRemaining();
      setRemaining(next);
      if (next === 0 && mode !== "cabal-dead") changeMode("cabal-dead");
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [mode]);
  const displayTime = dead ? "00:00:00" : formatDuration(remaining, true);
  return (
    <section
      className={`deadman-section ${dead ? "is-dead" : ""}`}
      id="deadman"
    >
      <SectionTitle
        number="05"
        aside={dead ? <Skull size={24} /> : <HeartPulse size={24} />}
      >
        The Cabal’s dead-man
      </SectionTitle>
      <div className="deadman-card card">
        <div className="deadman-main">
          <span className={`status-tag ${dead ? "tag-dead" : "tag-alive"}`}>
            <span className="badge-dot" />
            {dead ? "Cabal dead" : "The Cabal is alive"}
          </span>
          <div
            className="deadman-timer mono"
            role="timer"
            aria-label="Time until free trading"
          >
            {displayTime.split(":").map((part, i) => (
              <Fragment key={i}>
                <span className="timer-part">
                  {part}
                  {i < 2 ? ":" : ""}
                </span>
                {i < 2 && <wbr />}
              </Fragment>
            ))}
          </div>
          <p className="small muted">
            Time since last verdict resets this 33-hour clock.
          </p>
          <div
            className="deadman-seats"
            role="img"
            aria-label={
              dead ? "30 inactive judge seats" : "30 active judge seats"
            }
          >
            {Array.from({ length: 30 }, (_, i) => (
              <span key={i} />
            ))}
          </div>
        </div>
        <div className="deadman-copy">
          <h3>
            When the Cabal dies,
            <br />
            selling is open.
            <br />
            <span>Forever.</span>
          </h3>
          <p>
            If no verdict arrives for 33 hours, PLEA trades freely forever.
            Pleas and objections close.
          </p>
          {dead ? (
            <button className="button button-yellow" onClick={onBuy}>
              Sell on the Buy page
              <ArrowUpRight size={18} />
            </button>
          ) : (
            <div className="small deadman-note">
              <CircleAlert size={17} />
              No reset button. No going back.
              <br className="hidden" />
              That’s the rule in the real protocol.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
