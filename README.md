# PLEA — Make your case.

A single-page Next.js, Tailwind CSS and TypeScript dApp demo. Buying is open; selling needs a short written case scored by 30 AI judges. The frontend includes the full mock fee, verdict, sale, appeal, objection, leaderboard and dead-man flows.

**This is a simulation.** All token balances, fees, players, scores, prizes and market facts are demo data held in memory in the current tab. Reloading or selecting Reset starts fresh. No contract, AI oracle or prize pool is deployed. Wallet connection is optional and never signs or sends a transaction.

## Install, preview and rebuild

Use Node.js 20.9+ (Node 22 or 24 recommended) and npm. Dependencies are locked in `package-lock.json`.

```sh
npm ci
npm run preview
```

Open `http://localhost:4173/preview/`. This previews the **included production export**; no build or backend is needed. An optional port can be supplied with `npm run preview -- 8080`.

```sh
npm run dev         # Next development server on port 3000
npm run typecheck   # Strict TypeScript check
npm test           # 30 contract-layer and validation tests
npm run build      # Next static export → relative assets in dist/
```

`npm run build` runs `next build --webpack` with `output: 'export'` and `trailingSlash: true`, then `scripts/export.mjs`. The script copies `out/` to `dist/`, makes Next resource URLs relative and resolves bundled fonts relative to the CSS file. `dist/index.html` and every required runtime asset are included in this repository. Serve the directory as static files at a root or gateway subpath. There is one page with hash navigation; no route rewrites, API server or credentials are required. Use HTTP rather than opening the HTML as `file://`.

Generated dependencies, Next caches, intermediate exports and TypeScript metadata are ignored. The explicit submission budgets are in [artifacts/path-budget.md](artifacts/path-budget.md). `dist/` is deliberately included.

## Try the demo

1. Keep **Demo outcome → Approved**, choose an amount and write one line of 1–280 UTF-8 bytes. The checks reject controls, hidden characters and the reserved `plea` / `objection` markers, case-insensitively.
2. Submit the case and approve the mock oracle fee once. After about five seconds, the 30 judge scores sort into a row; the highlighted seventeenth value sets the answer. Follow **See verdict**, then sell inside the seven-minute window.
3. Object to the sale for a simulated 0.10 IMD fee. With Approved selected the objection is overruled; with Objection selected it is sustained, the sale stands and the case loses its points.
4. Reset, choose **Denied**, then submit a case or use **Try a sample case**. Write the one available appeal. Changing the outcome controls that pending verdict too.
5. Choose **Cabal dead**. The site turns dark, cases close and the Buy dialog gains a Sell tab. The real 33-hour timeout is represented by a ticking clock; tests advance an injected clock instead of waiting. Simulation controls can restore the panel; the described real-protocol switch would be irreversible.
6. Decode the example transaction, switch leaderboard seasons, or try Buy. The transaction card is an encoding example, not a live contract destination. Copy has a fallback if clipboard access is unavailable.

The sales limit is the smaller of 50% of the current mock balance and 2,500,000 PLEA. The inferred minimum is 1 PLEA, with six decimal places supported. The mock price is 0.000024 IMD per PLEA. Share points depend on the chosen amount; the other market facts are fixed fixtures. The initial example yields fact 36 → need 35. A sale records points in the current tab's standings; a sustained objection removes them. This is not a shared leaderboard.

## Wallets and a future contract adapter

The site shows **“CA: Coming soon”** in its top banner and header badge instead of any contract address or chain name, and the wallet control’s wrong-network label reads “Switch network”. Internally, `lib/wallet.ts` still points the optional connector at a test network (wagmi/viem chain definition and public RPC). That chain definition is only used if a visitor connects a wallet; it does not identify a deployed PLEA contract. No contract address is fabricated. The project’s X account is [@pleaimd](https://x.com/pleaimd).

The single connect control offers named EIP-6963 browser wallets and Coinbase Wallet. Phone browsers offer MetaMask, Coinbase Wallet, Rabby and Phantom app-browser links, plus Coinbase Smart Wallet. It handles rejection, pending connection, disconnect and wrong-network switching with wagmi's add-chain fallback. No WalletConnect relay or project ID is used. Installed wallets, phone app handoff and Coinbase passkeys require the respective wallet services; the mock application works without them.

`lib/mock-contract.ts` is the typed contract boundary: `submitPlea(amount, text)`, `getPleaStatus(id)`, `sell(id)`, `object(id)`, `getLeaderboard()` and `getDeadmanRemaining()`, plus approval, appeal and mock swaps. `components/demo-context.tsx` exposes it through `useMockContract()`, coordinates loading/errors and refreshes the active case. To integrate a real deployment, replace that adapter with typed asynchronous viem/wagmi contract reads and writes, supply the real ABI/address and chain in `lib/wallet.ts`, and replace the fixed economics and fixtures. Keep wallet connection separate from transaction approval. A production deployment also needs real oracle events, shared history, authoritative timers and prize settlement.

## Browser validation

```sh
npx playwright install chromium webkit
npm run test:browser
node scripts/check-export.mjs
```

The browser suite manages its own temporary HTTP server under `/review/plea/`, blocks backend requests for the main flow, and closes browsers/server on completion. It checks responsive layouts, primary and failure states, wallet fixtures, keyboard use, accessibility, fonts and resources. It writes disposable screenshots and JSON to `test/scratch/browser-validation/`. Linux may need Playwright's system libraries (`npx playwright install-deps chromium webkit`). `npm run test:browser -- --chromium-only` is available for a deliberately narrower local run.

Actual commands, final results, the Better Interface review across all six domains, resolved findings and remaining test limits are recorded in [artifacts/validation.md](artifacts/validation.md). This is worker-side evidence, not independent certification. [DESIGN.md](DESIGN.md) documents the implemented system. Runtime font and wallet mark licenses are retained with the assets and in [artifacts/THIRD_PARTY_NOTICES.md](artifacts/THIRD_PARTY_NOTICES.md).

Final local results (follow-up job with the “CA: Coming soon” and @pleaimd changes): production build and typecheck passed; all 30 unit tests passed; Chromium completed all 15 browser check groups with zero console/resource errors. WebKit could not launch on this machine because system libraries were missing, so it was not rerun for this change. The WebKit results from the original build are kept in `artifacts/validation-data/webkit-*.json`. Light and dark automated accessibility scans in Chromium reported no violations in the tested states. The design probe passed 13/16 checks; its three remaining reports reflect the brief's required badge, voice lines and hard border/shadow treatment. Native devices, real signing/passkeys and screen-reader sessions were not tested. See the full review for evidence and limits.
