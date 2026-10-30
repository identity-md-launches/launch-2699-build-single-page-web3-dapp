import Head from "next/head";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  FlaskConical,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui";
import { ConnectWallet } from "@/components/ConnectWallet";
import { Hero } from "@/components/Hero";
import { PleaForm } from "@/components/PleaForm";
import { CasePanel } from "@/components/CasePanel";
import { Transaction } from "@/components/Transaction";
import { Leaderboard } from "@/components/Leaderboard";
import { Deadman } from "@/components/Deadman";
import { BuyModal } from "@/components/BuyModal";
import { useMockContract } from "@/components/demo-context";
import type { DemoState } from "@/lib/mock-contract";
export default function Home() {
  const [buyOpen, setBuyOpen] = useState(false);
  const { mode, changeMode, notice, busy, reset } = useMockContract();
  const dead = mode === "cabal-dead";
  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", dead);
    return () => document.documentElement.classList.remove("theme-dark");
  }, [dead]);
  return (
    <div className="site" id="top">
      <Head>
        <title>PLEA — Make your case.</title>
        <meta
          name="description"
          content="Buying is open. Selling needs a plea. Meet The Cabal: 30 AI judges, one verdict. Explore the PLEA token in a free, fully simulated demo."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="./favicon.svg" type="image/svg+xml" />
        <meta property="og:title" content="PLEA — Make your case." />
        <meta
          property="og:description"
          content="Buying is open. Selling needs a plea. Thirty AI judges. One chance to sell. Try the interactive demo."
        />
        <meta property="og:image" content="./og-image.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="theme-color" content={dead ? "#111111" : "#F6F4F0"} />
      </Head>
      <a href="#plead" className="skip-link">
        Skip to plea form
      </a>
      <div className="ca-banner">CA: Coming soon</div>
      {dead && (
        <div className="dead-banner" role="alert">
          <strong>CABAL DEAD</strong>
          <span>
            No verdict for 33 hours. PLEA trades freely forever. Pleas and
            objections are closed; sell on the Buy page.
          </span>
          <button onClick={() => setBuyOpen(true)}>
            Trade PLEA
            <ArrowRight size={17} />
          </button>
        </div>
      )}
      <header className="header content-width">
        <Logo />
        <nav aria-label="Main navigation">
          <a href="#plead">Plead</a>
          <a href="#cabal">The Cabal</a>
          <a href="#leaderboard">Leaderboard</a>
        </nav>
        <div className="header-utilities">
          <span className="ca-badge">CA: Coming soon</span>
          <ConnectWallet />
        </div>
      </header>
      <main className="content-width">
        <Hero onBuy={() => setBuyOpen(true)} dead={dead} />
        <div className="demo-controls">
          <div className="demo-label">
            <FlaskConical size={17} />
            <strong>Take it for a spin</strong>
            <span className="small muted">Choose your next verdict.</span>
          </div>
          <div className="demo-options">
            <label className="small" htmlFor="demo-outcome">
              Demo outcome
            </label>
            <select
              id="demo-outcome"
              value={mode}
              onChange={(e) => changeMode(e.target.value as DemoState)}
              disabled={!!busy}
            >
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="objection">Objection</option>
              <option value="cabal-dead">Cabal dead</option>
            </select>
            <button
              className="reset-button"
              onClick={reset}
              disabled={!!busy}
              aria-label="Reset demo"
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
          </div>
        </div>
        <p className="global-notice" role="status" aria-live="polite">
          {notice}
        </p>
        <PleaForm />
        <CasePanel />
        <Transaction />
        <Leaderboard />
        <Deadman onBuy={() => setBuyOpen(true)} />
        <section className="build-section">
          <div className="build-title">
            <Sparkles size={22} />
            <h2>Built in public by the swarm.</h2>
          </div>
          <div className="build-stats">
            <div>
              <span className="mono stat-number">30</span>
              <span className="small muted">Local checks passed</span>
            </div>
            <div>
              <span className="mono stat-number">0</span>
              <span className="small muted">Independent audit rounds</span>
            </div>
            <div>
              <span className="mono stat-number">0</span>
              <span className="small muted">Days live on testnet</span>
            </div>
          </div>
          <p className="small muted build-note">
            Frontend demo. No live contracts, oracle panel or prize pool. Test
            results describe this local build; an independent audit has not been
            performed.
          </p>
        </section>
      </main>
      <footer className="footer">
        <div className="content-width">
          <div className="footer-main">
            <Logo />
            <h2>
              Make your case.
              <br />
              <span>Mainnet soon.</span>
            </h2>
            <a
              className="button button-outline"
              href="https://x.com/pleaimd"
              target="_blank"
              rel="noopener noreferrer"
            >
              Follow @pleaimd
              <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="footer-bottom">
            <span className="small">PLEA © 2026 · Built by the swarm.</span>
            <span className="small">
              Thirty judges between you and your exit.
            </span>
            <a href="#top" className="small">
              Back to top ↑
            </a>
          </div>
        </div>
      </footer>
      <BuyModal open={buyOpen} onClose={() => setBuyOpen(false)} />
    </div>
  );
}
