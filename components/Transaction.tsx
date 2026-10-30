import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, Braces, Check, Copy } from "lucide-react";
import { hexToString, stringToHex } from "viem";
import { DEMO_TEXT } from "@/lib/mock-contract";
import { SectionTitle } from "./ui";
export function Transaction() {
  const [decoded, setDecoded] = useState(false),
    [copyState, setCopyState] = useState("");
  const reduced = useReducedMotion();
  const data = stringToHex(DEMO_TEXT);
  async function copy() {
    try {
      await navigator.clipboard.writeText(data);
      setCopyState("Copied");
    } catch {
      setCopyState("Select the input data to copy it.");
    }
  }
  return (
    <section className="transaction-section" id="letterbox">
      <SectionTitle number="03" aside={<Braces size={24} />}>
        A letter, on-chain.
      </SectionTitle>
      <div className="transaction-card card">
        <div className="transaction-copy">
          <h3>
            No site? Plead
            <br />
            in a transaction.
          </h3>
          <p>If it wins, it sells itself.</p>
          <p className="small muted">
            Send your words to the Letterbox. This is an encoding example; a
            live contract is not deployed.
          </p>
          <button
            className="button button-black"
            onClick={() => setDecoded((v) => !v)}
          >
            {decoded ? "Show raw transaction" : "Decode the letter"}
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="transaction-example">
          <dl>
            <div>
              <dt>From</dt>
              <dd>
                Your wallet <span className="small muted">(demo)</span>
              </dd>
            </div>
            <div>
              <dt>To</dt>
              <dd>
                <span className="contract-label">Letterbox</span>
                <span className="small muted">Mock contract</span>
              </dd>
            </div>
            <div>
              <dt>Value</dt>
              <dd className="mono">0 ETH</dd>
            </div>
          </dl>
          <div className="input-data-label">
            <span className="small muted">Input data · UTF-8 hex</span>
            <button
              className="icon-button"
              aria-label="Copy input data"
              onClick={copy}
            >
              {copyState === "Copied" ? (
                <Check size={16} />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
          <code className="hex-data">{data}</code>
          <p className="small copy-status" role="status">
            {copyState}
          </p>
          {decoded && (
            <motion.div
              className="decoded-letter"
              initial={reduced ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ArrowDown size={19} />
              <p>“{hexToString(data)}”</p>
              <span className="small mono">
                {new TextEncoder().encode(DEMO_TEXT).length} bytes · decoded
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
