import { useState } from "react";
import { ArrowDown, ArrowUpRight, Check } from "lucide-react";
import { MOCK_PRICE } from "@/lib/mock-contract";
import { formatNumber } from "@/lib/validation";
import { useMockContract } from "./demo-context";
import { Modal } from "./ui";
export function BuyModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { contract, mode, busy, run, actionError } = useMockContract();
  const [amount, setAmount] = useState("1"),
    [tab, setTab] = useState<"buy" | "sell">("buy"),
    [result, setResult] = useState(""),
    [error, setError] = useState("");
  const dead = mode === "cabal-dead";
  const selling = dead && tab === "sell";
  async function swap() {
    setError("");
    setResult("");
    const value = Number(amount);
    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      !/^\d+(\.\d{1,6})?$/.test(amount)
    ) {
      setError(
        "Enter an amount greater than zero, with up to 6 decimal places.",
      );
      return;
    }
    if (value > (selling ? contract.balance : contract.imdBalance)) {
      setError("Enter an amount within your demo balance.");
      return;
    }
    const received = await run("swap", () =>
      selling ? contract.freeSell(value) : contract.buy(value),
    );
    if (received !== null)
      setResult(
        selling
          ? `Sold ${formatNumber(value)} PLEA. Received ${formatNumber(received, 4)} IMD.`
          : `Bought ${formatNumber(received)} PLEA. Your demo balance is updated.`,
      );
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={dead ? "Trade freely" : "Buy PLEA"}
    >
      <p className="muted">
        {dead
          ? "The Cabal is dead. Buying and selling are open forever."
          : "Buying is always open. No case required."}
      </p>
      <p className="small demo-callout">
        Simulated swap · no real tokens or transactions
      </p>
      {dead && (
        <div className="trade-tabs" role="group" aria-label="Trade direction">
          <button
            className={tab === "buy" ? "selected" : ""}
            onClick={() => {
              setTab("buy");
              setResult("");
              setError("");
            }}
          >
            Buy
          </button>
          <button
            className={tab === "sell" ? "selected" : ""}
            onClick={() => {
              setTab("sell");
              setResult("");
              setError("");
            }}
          >
            Sell
          </button>
        </div>
      )}
      <div className="amount-label">
        <label htmlFor="swap-amount">You pay</label>
        <span className="small muted">
          Balance{" "}
          {formatNumber(selling ? contract.balance : contract.imdBalance, 4)}
        </span>
      </div>
      <div className="amount-field">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          id="swap-amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={!!error}
          aria-describedby="swap-error"
        />
        <span className="mono">{selling ? "PLEA" : "IMD"}</span>
      </div>
      <div className="swap-arrow">
        <ArrowDown size={20} />
      </div>
      <div className="swap-receive">
        <span className="small muted">
          You receive {selling ? "(1% slippage)" : "(estimate)"}
        </span>
        <strong className="mono">
          {formatNumber(
            Math.max(0, Number(amount) || 0) *
              (selling ? MOCK_PRICE * 0.99 : 1 / MOCK_PRICE),
            selling ? 4 : 0,
          )}{" "}
          {selling ? "IMD" : "PLEA"}
        </strong>
      </div>
      <p className="small muted">Demo rate: 1 PLEA = 0.000024 IMD</p>
      <p id="swap-error" role="status" className="inline-error">
        {error || (actionError?.action === "swap" ? actionError.message : "")}
      </p>
      {result && (
        <p role="status" className="swap-success">
          <Check size={19} />
          {result}
        </p>
      )}
      <button
        className="button button-yellow full-width"
        onClick={swap}
        disabled={!!busy}
      >
        {busy === "swap"
          ? "Swapping…"
          : selling
            ? "Sell PLEA · demo"
            : "Buy PLEA · demo"}
        <ArrowUpRight size={18} />
      </button>
    </Modal>
  );
}
