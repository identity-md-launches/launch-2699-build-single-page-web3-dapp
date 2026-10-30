import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Clock3,
  Mail,
  Scale,
  Send,
} from "lucide-react";
import {
  APPEAL_WINDOW,
  judgeScores,
  MOCK_PRICE,
  OBJECTION_WINDOW,
  SELL_WINDOW,
} from "@/lib/mock-contract";
import {
  calculateFacts,
  formatDuration,
  formatNumber,
  utf8Bytes,
  validateText,
} from "@/lib/validation";
import { useMockContract } from "./demo-context";
import { CountUp, Modal, SectionTitle, Stamp } from "./ui";
export function CasePanel() {
  const {
    active: storedActive,
    mode,
    busy,
    contract,
    sampleCase,
    resolve,
    sell,
    object,
    appeal,
    updateStatus,
    actionError,
  } = useMockContract();
  const active = mode === "cabal-dead" ? null : storedActive;
  const [revealed, setRevealed] = useState(0),
    [sorted, setSorted] = useState(false),
    [now, setNow] = useState(0);
  const [appealOpen, setAppealOpen] = useState(false),
    [appealText, setAppealText] = useState(""),
    [appealError, setAppealError] = useState("");
  const reduced = useReducedMotion(),
    pending = active?.status === "pending" || active?.status === "objecting";
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => {
      setNow(Date.now());
      updateStatus();
    }, 1000);
    return () => clearInterval(timer);
  }, [active?.id, active?.status]);
  useEffect(() => {
    if (!pending || mode === "cabal-dead") {
      if (active) {
        setRevealed(30);
        setSorted(true);
      }
      return;
    }
    setRevealed(0);
    setSorted(false);
    const reveal = setInterval(
      () => setRevealed((v) => Math.min(30, v + 1)),
      95,
    );
    const sort = setTimeout(() => setSorted(true), 3300);
    const finish = setTimeout(resolve, 4600);
    return () => {
      clearInterval(reveal);
      clearTimeout(sort);
      clearTimeout(finish);
    };
  }, [active?.id, active?.status, mode]);
  useEffect(() => {
    if (!sorted) return;
    const grid = document.querySelector<HTMLElement>(".judges-sorted");
    const median = grid?.querySelector<HTMLElement>(".judge-median");
    if (grid && median && grid.scrollWidth > grid.clientWidth)
      grid.scrollTo({
        left:
          grid.scrollLeft +
          median.getBoundingClientRect().left -
          grid.getBoundingClientRect().left -
          grid.clientWidth / 2 +
          median.clientWidth / 2,
        behavior: reduced ? "instant" : "smooth",
      });
  }, [sorted, reduced]);
  const facts = active?.facts ?? calculateFacts(90_000, 450_000);
  const score = active?.score ?? 35;
  const previewScore =
    mode === "denied" ||
    (active?.status === "objecting" && mode === "objection")
      ? Math.max(0, facts.need - 9)
      : facts.need;
  const scores = active?.judges.length
    ? active.judges
    : judgeScores(previewScore);
  const seats = scores.map((value, seat) => ({ value, seat }));
  if (sorted) seats.sort((a, b) => a.value - b.value);
  const saleRemaining = active
    ? Math.max(0, SELL_WINDOW - (now - (active.resolvedAt ?? now)))
    : 0;
  const appealRemaining = active
    ? Math.max(0, APPEAL_WINDOW - (now - (active.resolvedAt ?? now)))
    : 0;
  const objectRemaining = active
    ? Math.max(0, OBJECTION_WINDOW - (now - (active.soldAt ?? now)))
    : 0;
  const dead = mode === "cabal-dead";
  async function sendAppeal() {
    if (!validateText(appealText).every((c) => c.valid)) {
      setAppealError(
        "Use 1 to 280 bytes, one line, no hidden characters or reserved markers.",
      );
      return;
    }
    const result = await appeal(active!.id, appealText);
    if (result) {
      setAppealOpen(false);
      setAppealError("");
    }
  }
  return (
    <section id="cabal" className="cabal-section">
      <SectionTitle
        number="02"
        aside={
          <span className={`status-tag ${pending ? "tag-pending" : ""}`}>
            <span className="badge-dot" />
            {active
              ? pending
                ? `Pending · Plea #${active.id}`
                : `Plea #${active.id}`
              : dead
                ? "Panel closed"
                : "All 30 seats are waiting"}
          </span>
        }
      >
        The Cabal
      </SectionTitle>
      <div className="cabal-card card">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <Scale size={20} />
            <strong>
              {active
                ? `Judges plea #${active.id}`
                : dead
                  ? "The Cabal is closed"
                  : "Meet your jury"}
            </strong>
          </div>
          <span className="mono small muted">
            {active
              ? new Date(active.submittedAt).toISOString().slice(11, 16) +
                " UTC"
              : dead
                ? "Trading is open"
                : "17 must agree"}
          </span>
        </div>
        {!active && (
          <div className="empty-case">
            <div>
              <h3>{dead ? "No more cases." : "The panel is ready."}</h3>
              <p className="muted">
                {dead
                  ? "Buy and sell freely from the trading dialog."
                  : "Submit a case to see the AI panel score it."}
              </p>
            </div>
            <button
              className="button button-outline"
              disabled={!!busy || dead}
              onClick={() => sampleCase()}
            >
              {dead
                ? "Cabal dead · cases closed"
                : busy === "sample"
                  ? "Opening case…"
                  : "Try a sample case"}
              <ArrowRight size={17} />
            </button>
          </div>
        )}
        {pending && (
          <div className="pending-case">
            <div className="envelope-stack" aria-hidden="true">
              <Mail size={30} />
              <motion.span
                key={active?.id + String(active?.status)}
                initial={
                  reduced ? false : { x: -60, y: -25, rotate: -20, opacity: 0 }
                }
                animate={{ x: 0, y: 0, rotate: 5, opacity: 1 }}
                transition={{ duration: reduced ? 0 : 0.7 }}
              >
                <Mail size={30} />
              </motion.span>
            </div>
            <div>
              <strong>
                {active?.status === "objecting"
                  ? "A fresh panel is reviewing the sale."
                  : "Your case is in the right hands. Probably."}
              </strong>
              <p className="small muted">
                {active?.status === "objecting"
                  ? "The sale stands while the points are reviewed."
                  : "The Cabal takes no bribes. Just a 0.5 IMD fee."}
              </p>
            </div>
          </div>
        )}
        {active?.status === "objecting" && (
          <div className="objection-stamp">
            <Stamp kind="OBJECTION!" />
          </div>
        )}
        <div
          className={`judges-grid ${sorted && active ? "judges-sorted" : ""} ${dead ? "judges-dead" : ""}`}
          role="group"
          tabIndex={sorted ? 0 : undefined}
          aria-label="30 judge seats"
        >
          {seats.map(({ value, seat }, i) => (
            <motion.div
              layout={!reduced}
              key={seat}
              className={`judge ${active && i < revealed ? "judge-ready" : ""} ${active && sorted && i === 16 ? "judge-median" : ""}`}
              initial={false}
              animate={
                active && i < revealed && !reduced
                  ? { scale: i === 16 && sorted ? 1.12 : 1, opacity: 1 }
                  : { opacity: 1 }
              }
              transition={{ duration: 0.2 }}
            >
              <motion.span
                className="judge-seat"
                key={`${active?.id ?? "empty"}-${active && i < revealed ? "score" : "seat"}`}
                initial={
                  reduced || !active || i >= revealed
                    ? false
                    : { scale: 0.5, opacity: 0 }
                }
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {active && i < revealed ? (
                  <>
                    <span className="sr-only">Seat {seat + 1}: </span>
                    {value}
                  </>
                ) : (
                  <>
                    <span className="seat-word">seat </span>
                    {seat + 1}
                  </>
                )}
              </motion.span>
              {sorted && active && i === 16 && (
                <span className="sr-only">, panel answer</span>
              )}
            </motion.div>
          ))}
        </div>
        {sorted && active && (
          <p className="judge-scroll-hint small muted">
            Sorted by score. Scroll to see all 30 seats; the 17th sets the
            answer.
          </p>
        )}
        <div className="panel-answer">
          <span>
            {active && sorted
              ? "The panel’s answer"
              : dead
                ? "Pleas and objections are closed."
                : "30 judges. 17 must agree."}
          </span>
          {active && sorted ? (
            <strong className="mono">
              <CountUp value={pending ? previewScore : score} />
              <span className="small">/ 45</span>
            </strong>
          ) : (
            <span className="small muted">AI oracle panel · simulated</span>
          )}
        </div>
        {active && !pending && (
          <a href="#verdict" className="text-link panel-verdict-link">
            {active.status === "approved"
              ? "Approved · see verdict"
              : active.status === "denied"
                ? "Denied · see verdict"
                : "See sale status"}
            <ArrowDown size={16} />
          </a>
        )}
      </div>
      <div id="the-bar" className="bar-section">
        <div className="bar-heading">
          <h3>The facts set your bar.</h3>
          <span className="small muted">
            {active
              ? `Facts for plea #${active.id}`
              : "Example: selling 20% of a balance"}
          </span>
        </div>
        <div className="facts-grid">
          {[
            {
              name: "Share sold",
              value: `${active ? formatNumber((active.amount / active.balanceAtSubmission) * 100, 1) : "20"}%`,
              points: facts.share,
            },
            { name: "Held time", value: "14 days", points: facts.held },
            { name: "Profit or loss", value: "−12.4%", points: facts.pnl },
            { name: "24h trend", value: "−3.8%", points: facts.trend },
          ].map((f, i) => (
            <div className="fact-card" key={f.name}>
              <span className="small muted">{f.name}</span>
              <strong className="mono">{f.value}</strong>
              <span className="fact-points mono">+{f.points} pts</span>
            </div>
          ))}
        </div>
        <div className="need-calculation">
          <span className="mono">
            fact {facts.total} <ArrowRight size={16} /> need = 71 −{" "}
            {facts.total} = <strong>{facts.need}</strong>
          </span>
          <span className="small muted">Need is capped at 45.</span>
        </div>
        <div
          className="score-bar"
          role="meter"
          aria-label="Judges score"
          aria-valuemin={0}
          aria-valuemax={45}
          aria-valuenow={active && !pending ? score : 0}
        >
          <span
            style={{
              width: `${active ? ((pending ? Math.round((revealed / 30) * previewScore) : score) / 45) * 100 : 0}%`,
            }}
          />
          <i
            style={{ left: `${(facts.need / 45) * 100}%` }}
            title={`Need ${facts.need}`}
          />
        </div>
        <div className="bar-labels mono small">
          <span>0</span>
          <strong>
            judges {active && !pending ? score : "pending"} · need {facts.need}
          </strong>
          <span>45</span>
        </div>
      </div>
      {active && !pending && (
        <div id="verdict" className="verdict-card card" aria-live="polite">
          <div className="verdict-top">
            <span className="small muted">
              The case for {formatNumber(active.amount)} PLEA
            </span>
            <span className="mono small">#{active.id}</span>
          </div>
          <blockquote>“{active.text}”</blockquote>
          {actionError &&
            ["sell", "object", "appeal"].includes(actionError.action) && (
              <p className="inline-error" role="status">
                {actionError.message}
              </p>
            )}
          <div className="verdict-bottom">
            <Stamp
              kind={
                active.status === "approved"
                  ? "APPROVED"
                  : active.status === "denied"
                    ? "DENIED"
                    : active.status === "expired"
                      ? "EXPIRED"
                      : active.status === "no-verdict"
                        ? "NO VERDICT"
                        : active.status === "sustained"
                          ? "SUSTAINED"
                          : active.status === "overruled"
                            ? "OVERRULED"
                            : "SOLD"
              }
            >
              {active.status === "approved" || active.status === "denied"
                ? `${score} vs need ${facts.need}`
                : active.status === "sold"
                  ? `${formatNumber(active.amount)} PLEA`
                  : undefined}
            </Stamp>
            <div className="verdict-actions">
              {active.status === "approved" ? (
                <>
                  <span className="countdown">
                    <Clock3 size={17} />
                    Sell within{" "}
                    <strong className="mono">
                      {formatDuration(saleRemaining)}
                    </strong>
                  </span>
                  <button
                    className="button button-black"
                    disabled={!!busy || dead || !saleRemaining}
                    onClick={() => sell(active.id)}
                  >
                    {busy === "sell"
                      ? "Selling…"
                      : `Sell now ${formatNumber(active.amount)} PLEA`}
                    <ArrowRight size={18} />
                  </button>
                </>
              ) : active.status === "denied" ? (
                <>
                  <p>Denied: wait 4 hours, one appeal.</p>
                  <span className="mono small">
                    {formatDuration(appealRemaining, true)} remaining
                  </span>
                  <button
                    className="button button-black"
                    disabled={
                      !!busy || dead || active.appealed || !appealRemaining
                    }
                    onClick={() => setAppealOpen(true)}
                  >
                    {active.appealed
                      ? "Appeal already used"
                      : "Write an appeal · 0.50 IMD"}
                    <ArrowRight size={18} />
                  </button>
                </>
              ) : active.status === "sold" ? (
                <>
                  <p className="small muted">
                    Sale complete · ~
                    {(active.amount * MOCK_PRICE * 0.99).toFixed(2)} IMD
                    received
                  </p>
                  <p className="small">
                    Objections open for{" "}
                    <strong className="mono">
                      {formatDuration(objectRemaining)}
                    </strong>
                  </p>
                  <button
                    className="button button-outline"
                    disabled={!!busy || dead || !objectRemaining}
                    onClick={() => object(active.id)}
                  >
                    {busy === "object" ? "Objecting…" : "Object · 0.10 IMD"}
                    <Scale size={17} />
                  </button>
                </>
              ) : ["sustained", "overruled"].includes(active.status) ? (
                <>
                  <strong>Sale status: complete</strong>
                  <p className="small">
                    {active.status === "sustained"
                      ? "Sale stands, but the plea earns no points."
                      : "The original verdict stands. Your points are kept."}
                  </p>
                </>
              ) : (
                <p>
                  {active.status === "expired"
                    ? "The seven-minute sale window closed. Submit a new case."
                    : "No verdict arrived within 20 minutes. No cooldown, no fee back."}
                </p>
              )}
            </div>
          </div>
          {["sold", "sustained", "overruled"].includes(active.status) && (
            <p className="small muted verdict-note">
              <Check size={16} />
              For 20 minutes after a sale, anyone can object. A fresh panel
              re-scores the case.
            </p>
          )}
        </div>
      )}
      <Modal
        open={appealOpen}
        onClose={() => setAppealOpen(false)}
        title="One more chance"
      >
        <p className="muted">
          Make a new case. One appeal within four hours, with a fresh 0.50 IMD
          oracle fee.
        </p>
        <label className="appeal-label" htmlFor="appeal-text">
          Your appeal
        </label>
        <textarea
          id="appeal-text"
          rows={4}
          value={appealText}
          onChange={(e) => setAppealText(e.target.value)}
          aria-describedby="appeal-error"
          placeholder="I have reconsidered my argument…"
        />
        <p className="small mono">{utf8Bytes(appealText)} / 280 bytes</p>
        <p id="appeal-error" className="inline-error" role="status">
          {appealError ||
            (actionError?.action === "appeal" ? actionError.message : "")}
        </p>
        <button
          className="button button-yellow full-width"
          disabled={!!busy}
          onClick={sendAppeal}
        >
          {busy === "appeal"
            ? "Submitting appeal…"
            : "Submit appeal · 0.50 IMD"}
          <Send size={18} />
        </button>
      </Modal>
    </section>
  );
}
