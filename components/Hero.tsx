import { ArrowDown, ArrowUpRight, ShieldCheck } from "lucide-react";
import { Typewriter } from "./ui";
export function Hero({
  onBuy,
  dead = false,
}: {
  onBuy: () => void;
  dead?: boolean;
}) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <span className="token-badge">
          <span className="badge-dot" />A meme token on Uniswap v4
        </span>
        <h1 id="hero-title">
          {dead ? "Your exit" : "Make your"}
          <br className="desktop-break" />{" "}
          <span>{dead ? "is open." : "case."}</span>
        </h1>
        <Typewriter
          line={
            dead
              ? "The Cabal is dead. Trade PLEA freely, forever."
              : "Buying is open. Selling needs a plea."
          }
        />
        <p className="hero-description">
          {dead ? (
            <>
              No verdict for 33 hours.
              <br />
              Pleas and objections are closed.
            </>
          ) : (
            <>
              A meme token built by the swarm.
              <br />
              Thirty AI judges decide if you can sell.
            </>
          )}
        </p>
        <div className="hero-actions">
          {dead ? (
            <button className="button button-yellow" onClick={onBuy}>
              Trade PLEA
              <ArrowUpRight size={18} />
            </button>
          ) : (
            <a className="button button-yellow" href="#plead">
              Plead to sell
              <ArrowDown size={18} />
            </a>
          )}
          {dead ? (
            <a className="button button-outline" href="#deadman">
              Why is it open?
              <ArrowDown size={18} />
            </a>
          ) : (
            <button className="button button-outline" onClick={onBuy}>
              Buy PLEA
              <ArrowUpRight size={18} />
            </button>
          )}
        </div>
        <div className="hero-note">
          <ShieldCheck size={16} />
          All actions are simulated. Try it without a wallet.
        </div>
      </div>
      <div className="hero-art" aria-hidden="true">
        <img src="./cabal-letter.svg" width={480} height={420} alt="" />
      </div>
    </section>
  );
}
