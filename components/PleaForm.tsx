import { useState, type FormEvent } from "react";
import {
  Check,
  X,
  ArrowUpRight,
  ArrowRight,
  FileText,
  Hourglass,
  Stamp as StampIcon,
  Info,
  ShieldCheck,
} from "lucide-react";
import {
  calculateFacts,
  formatNumber,
  maximumSell,
  utf8Bytes,
  validateAmount,
  validateText,
} from "@/lib/validation";
import { MOCK_PRICE, ORACLE_FEE } from "@/lib/mock-contract";
import { useMockContract } from "./demo-context";
import { Modal, SectionTitle } from "./ui";
export function PleaForm() {
  const {
    contract,
    active,
    mode,
    busy,
    run,
    submitPlea,
    setNotice,
    actionError,
  } = useMockContract();
  const [amount, setAmount] = useState("90000");
  const [text, setText] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const checks = validateText(text),
    bytes = utf8Bytes(text),
    amountError = validateAmount(amount, contract.balance);
  const value = Number(amount) || 0,
    estimate = value * MOCK_PRICE;
  const dead = mode === "cabal-dead";
  const hasOpenCase =
    active && ["pending", "approved", "objecting"].includes(active.status);
  async function send() {
    const result = await submitPlea(value, text);
    if (result) {
      setApproveOpen(false);
      setTimeout(() => {
        document.getElementById("cabal")?.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
          block: "start",
        });
      }, 50);
    }
  }
  function validateAndSend(e: FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (amountError) {
      document.getElementById("plea-amount")?.focus();
      return;
    }
    if (!checks.every((c) => c.valid)) {
      document.getElementById("plea-text")?.focus();
      return;
    }
    if (!contract.allowance) setApproveOpen(true);
    else void send();
  }
  async function approveAndSend() {
    const result = await run("approve", () => {
      contract.approveFee();
      return true;
    });
    if (result) await send();
  }
  return (
    <section id="plead" className="plead-section">
      <SectionTitle
        number="01"
        aside={
          <span className="small muted section-aside">
            A good case goes a long way.
          </span>
        }
      >
        Plead to sell
      </SectionTitle>
      <p className="section-description">
        Write why you want to sell. The Cabal, 30 judges, scores it from 0 to
        45. You pass if the score reaches your need.
      </p>
      <div className="plea-card card">
        <form className="plea-form" onSubmit={validateAndSend} noValidate>
          <div className="form-heading">
            <h3>New plea</h3>
            <span className="small form-balance">
              Demo balance{" "}
              <strong className="mono">{formatNumber(contract.balance)}</strong>{" "}
              PLEA
            </span>
          </div>
          <div className="amount-label">
            <label htmlFor="plea-amount">Amount to sell</label>
            <span className="small muted">
              Up to {formatNumber(maximumSell(contract.balance))}
            </span>
          </div>
          <div
            className={`amount-field ${attempted && amountError ? "field-error" : ""}`}
          >
            <input
              id="plea-amount"
              name="amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={attempted && !!amountError}
              aria-describedby="amount-help amount-error"
            />
            <span className="mono">PLEA</span>
          </div>
          <div
            className="quick-pills"
            aria-label="Choose a percentage of your balance"
          >
            {[1, 10, 20, 35, 50].map((p) => (
              <button
                type="button"
                key={p}
                className={
                  Number(amount) ===
                  Math.min(
                    Math.floor((contract.balance * p) / 100),
                    maximumSell(contract.balance),
                  )
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setAmount(
                    String(
                      Math.min(
                        Math.floor((contract.balance * p) / 100),
                        maximumSell(contract.balance),
                      ),
                    ),
                  )
                }
              >
                {p === 50 ? "Max" : `${p}%`}
              </button>
            ))}
          </div>
          <p id="amount-help" className="small muted">
            From 1 to max: at most 50% and 2,500,000 PLEA.
          </p>
          <p id="amount-error" className="inline-error" role="status">
            {attempted ? amountError : ""}
          </p>
          <div className="textarea-label">
            <label htmlFor="plea-text">Make your case</label>
            <span className={`mono small ${bytes > 280 ? "error-text" : ""}`}>
              {bytes} / 280 bytes
            </span>
          </div>
          <textarea
            id="plea-text"
            name="plea"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Your honor, my rent is due. My conviction remains…"
            aria-invalid={attempted && !checks.every((c) => c.valid)}
            aria-describedby="text-help text-checks"
          />
          <div
            className="byte-progress"
            role="progressbar"
            aria-label="Plea bytes used"
            aria-valuenow={Math.min(bytes, 280)}
            aria-valuetext={`${bytes} of 280 bytes`}
            aria-valuemin={0}
            aria-valuemax={280}
          >
            <span
              style={{
                width: `${Math.min(100, bytes / 2.8)}%`,
                background: bytes > 280 ? "var(--denied)" : undefined,
              }}
            />
          </div>
          <p className="small muted" id="text-help">
            280 Latin · 140 Cyrillic · 93 CJK characters
          </p>
          <ul className="text-checks" id="text-checks">
            {checks.map((c) => (
              <li
                key={c.label}
                className={c.valid ? "check-valid" : "check-invalid"}
              >
                {c.valid ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  <X size={16} aria-hidden="true" />
                )}
                <span>{c.label}</span>
                <span className="sr-only">
                  {c.valid ? ": valid" : ": not met"}
                </span>
              </li>
            ))}
          </ul>
          <div className="receipt">
            <div>
              <span>Oracle fee</span>
              <i />
              <strong className="mono">0.50 IMD</strong>
            </div>
            <div className="small muted">
              <span>
                {contract.allowance
                  ? "Fee spending approved"
                  : "Approve once before your first case"}
              </span>
              {contract.allowance && <ShieldCheck size={15} />}
            </div>
            <div>
              <span>Extra fee</span>
              <i />
              <span>None</span>
            </div>
            <div>
              <span>You get if approved & sold</span>
              <i />
              <strong className="mono">~{estimate.toFixed(2)} IMD</strong>
            </div>
            <div className="small muted">
              <span>At least with 1% slippage</span>
              <i />
              <span className="mono">~{(estimate * 0.99).toFixed(2)} IMD</span>
            </div>
          </div>
          <button
            type="submit"
            className="button button-yellow submit-button"
            disabled={dead || !!busy || !!hasOpenCase}
          >
            {dead
              ? "Cabal dead · pleas closed"
              : busy === "submit"
                ? "Submitting plea…"
                : hasOpenCase
                  ? "Your case is in progress"
                  : "Submit plea · 0.50 IMD"}
            <ArrowUpRight size={21} />
          </button>
          {actionError &&
            ["submit", "approve"].includes(actionError.action) && (
              <p className="inline-error" role="status">
                {actionError.message}
              </p>
            )}
          <p className="small muted form-foot">
            {dead
              ? "Open Buy PLEA to sell freely."
              : "Demo tokens and fees have no value."}
          </p>
        </form>
        <aside className="next-steps">
          <h3>What happens next</h3>
          <ol className="stepper">
            <li>
              <span className="step-icon">
                <FileText size={19} />
              </span>
              <div>
                <h4>Submitted</h4>
                <p>
                  The contract checks your text, amount and need before taking
                  the fee.
                </p>
              </div>
            </li>
            <li>
              <span className="step-icon yellow">
                <Hourglass size={19} />
              </span>
              <div>
                <h4>Waiting for the Cabal</h4>
                <p>
                  Up to 20 minutes, usually 3–6.
                  <br />
                  30 judges. 17 must agree.
                </p>
                <span className="small demo-speed">
                  About 5 seconds in this demo
                </span>
              </div>
            </li>
            <li>
              <span className="step-icon">
                <StampIcon size={19} />
              </span>
              <div>
                <h4>The verdict</h4>
                <p>
                  <strong>Approved?</strong> Sell within 7 minutes.
                  <br />
                  <strong>Denied?</strong> One appeal within 4 hours.
                  <br />
                  <strong>No verdict?</strong> No cooldown, no fee back.
                </p>
              </div>
            </li>
          </ol>
          <div className="need-preview">
            <div className="flex items-center justify-between gap-3">
              <span>Your score to beat</span>
              <Info size={17} />
            </div>
            <div className="need-value">
              <strong className="mono">
                {calculateFacts(value, contract.balance).need}
              </strong>
              <span>
                / 45
                <br />
                score to pass
              </span>
            </div>
            <p className="small muted">
              Your amount, held time, profit or loss and the 24h trend set your
              need.
            </p>
            <a className="text-link" href="#the-bar">
              See how it adds up
              <ArrowRight size={16} />
            </a>
          </div>
          <div className="no-bribes">
            <span className="asterisk">✳</span>
            <p>
              The Cabal takes no bribes.
              <br />
              <strong>Just a 0.5 IMD fee.</strong>
            </p>
          </div>
        </aside>
      </div>
      <Modal
        open={approveOpen}
        onClose={() => {
          if (!busy) setApproveOpen(false);
        }}
        title="Approve the oracle fee"
      >
        <div className="fee-summary">
          <span>One case</span>
          <strong className="mono">{ORACLE_FEE.toFixed(2)} IMD</strong>
        </div>
        <p>
          Approve simulated fee spending once. Your case is checked before the
          fee is taken. There is no refund if no verdict arrives.
        </p>
        <p className="small muted">
          This demo never sends a wallet transaction.
        </p>
        {actionError && ["submit", "approve"].includes(actionError.action) && (
          <p className="inline-error" role="status">
            {actionError.message}
          </p>
        )}
        <button
          className="button button-yellow full-width"
          onClick={approveAndSend}
          disabled={!!busy}
        >
          {busy ? "Preparing your case…" : "Approve & submit · 0.50 IMD"}
          <ArrowUpRight size={18} />
        </button>
        <button
          className="text-link modal-cancel"
          onClick={() => {
            setApproveOpen(false);
            setNotice("");
          }}
          disabled={!!busy}
        >
          Keep editing
        </button>
      </Modal>
    </section>
  );
}
