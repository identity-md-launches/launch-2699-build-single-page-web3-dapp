# PLEA implementation and interface review

## Scope and assumptions

This is a worker review of a single-page **mock dApp**, not an independent audit or a live-token deployment. The complete production export is `dist/`; all mock flows run locally without a wallet or backend. Wallet connection uses wagmi/viem independently of mock transactions. No contract address, key, recipient or real oracle is invented.

Implementation choices: Base Sepolia for the optional connector; a 1 PLEA minimum and six decimal places; a 0.10 IMD objection fee; fixed mock held-time, P/L, trend and price; a five-second simulated oracle response. These are explicitly demo economics, not chain observations. The default example sells 90,000 of 450,000 PLEA and produces fact 36 → need 35. Simulation controls can reset the dead-man state; the described protocol's switch would be permanent.

The pinned Better Interface workflow and all six domain principles were read and applied during implementation. The pinned design probe was run against the production export. The supplied browser tool could not start because its Chrome distribution was missing; temporary Playwright Chromium and WebKit browsers were used instead. Dependencies and build caches remained outside the repository. Browser tests own a bounded foreground server, serve the export at `/review/plea/`, and close it when finished.

## Requirement coverage

| Requested surface or deliverable | Result | Implementation/evidence |
| --- | --- | --- |
| Neobrutalism, cream/yellow/black, status colors, Space Grotesk/Inter/mono | Met, with font limitation below | Tokens in `styles/globals.css`; local fonts and artwork; no remote visual assets for the mock flow |
| Hero, exact typewriter line, PLEA logo, token badge, Buy and Plead actions | Met | `components/Hero.tsx`, `components/ui.tsx`; first-screen screenshots |
| Wallet control, network and “test tokens, no value” banner | Met | Header and phone banner in `pages/index.tsx`; named-wallet and phone tests |
| Two-column “Plead to sell” form, amount/balance and five quick amounts | Met | `components/PleaForm.tsx`; mobile stacks; amount limit and quick-action tests |
| UTF-8 counter, progress and four live validation checks | Met | `lib/validation.ts`; Latin/Cyrillic/CJK, controls, hidden characters, reserved markers and byte boundaries tested |
| Stepper, 0.50 IMD fee, approval once, receipt and 1% slippage | Met | Form/fee dialog and contract adapter; invalid inputs do not consume fees |
| Pending envelope and yellow case tag | Met | `components/CasePanel.tsx`; staged pending screenshot and browser wait |
| 30 judges, staggered scores, sorted row and highlighted seventeenth answer | Met | Square seat grid, Framer Motion layout, keyboard-scrollable row; 30 seats asserted |
| Four fact cards, 0–45 score bar and `71 − fact` need | Met | `calculateFacts()` and CasePanel; example fact/need asserted in unit/browser tests |
| Quote, approval/denial stamp, seven-minute sale, SOLD and one appeal | Met | Contract state machine, countdowns, verdict link, keyboard and pointer flows |
| Twenty-minute objections, fresh panel, sustained/overruled, sale stands | Met | Both browser outcomes; deadlines and fees in unit tests; sustained removes points, overruled preserves sale score |
| Transaction example and animated hex decoding | Met | `components/Transaction.tsx`; readable text verified; symbolic mock Letterbox destination is disclosed |
| Season leaderboard, best-three/points/prize, seat multiplier and paid history | Met | Complete table retained in phone scroll region; fictional sample players/prizes disclosed |
| 33-hour dead-man clock, 30 seats, dark theme and unrestricted selling | Met | Timer and injected-clock tests; root theme, closed-case copy and free-selling dialog |
| Footer stats, “Make your case. Mainnet soon.” and X link | Met | 30 actual local unit tests, zero independent audits, zero deployed testnet days; supplied social handle |
| Next.js + Tailwind + TypeScript, wagmi/viem and Framer Motion | Met | Manifest/lockfile and production build; typed adapter/provider boundary |
| Mock hook/adapter methods and demo outcome selection | Met | `lib/mock-contract.ts`, `components/demo-context.tsx`; approved, denied, objection and dead states |
| Responsive layout and usable first 390px screen | Met | Six widths; hero actions and amount field visible at 390×844; no page overflow in tested initial states or 200% text case |
| Static export, relative assets, metadata and locally bundled runtime assets | Met | `dist/index.html`, `next.config.ts`, export script; nested-path asset and metadata checks |
| README, root DESIGN.md, six-domain review and byte budget | Met | Root documents, this record, raw data and `path-budget.md`; export-size check recorded below |

All twenty groups are implemented as a disclosed simulation. No shared/live leaderboard, deployed AI panel, audit history, contract destination or real payout is represented as real.

## Better Interface coverage

| Domain | Coverage | Evidence and practical limits |
| --- | --- | --- |
| Accessibility | Checked | Native controls/dialogs, labels, byte progress semantics, first-error focus, full keyboard plea→approval→sale, Escape/focus return, mobile sheet containment, meaningful status text, reduced motion, automated WCAG A/AA scans. No screen-reader session or physical assistive-device testing. Final light and dark scans pass in both engines. |
| Layout | Checked | Initial production export at 320, 390, 640, 820, 1024 and 1440; screenshots; real flows at 390; complete scrollable table/jury; 200% root-text enlargement without page overflow. This is not browser-native 200% zoom. RTL and translated layouts were not tested; the UI is English. |
| Writing | Checked | Cost/action labels, fee timing, byte/amount errors and recovery; explicit sample/in-memory disclosures; closed-Cabal copy replaces the active-court promise. Required voice lines retained. |
| Typography | Checked | Fonts actually loaded locally, six sizes desktop/five phone, three families/weights, heading hierarchy, long hex/quotes wrapping, stable number roles. Space Grotesk's available 300–700 range limits the requested 800 face. |
| Colors | Checked | Exact brief palette, both theme blocks, foreground/background measurements and scans in both engines. Explicit foreground rules corrected the reproduced WebKit dark-text defect. Forced-color emulation is recorded in the raw presentation results; no physical high-contrast OS session. |
| UI details | Checked | Hard surfaces, hover/pressed/focus/disabled/loading/error/empty/success states; finite envelope/score/stamp motion and reduced-motion guard. No native-device passkey flow, hardware wallet or slowed animation-panel session. |

## Findings and corrections

| Severity / source | Observed problem and reproduction | Correction and recheck |
| --- | --- | --- |
| High · `scripts/export.mjs:13` | At the nested host path, CSS resolved fonts under `css/_next/static/media/`, producing 404s and fallback fonts. | Rewrite CSS font URLs to `../media/`; both local font faces now report loaded, with no failed initial assets. |
| High · `next.config.ts:4` | After hydration the router removed the directory slash. Wallet icons opened later resolved to the parent directory; the early static images hid this defect. | `trailingSlash: true` keeps the gateway directory. Both browser wallet-only runs passed under the nested path, including all five wallet marks. The final combined suite also asserts the directory URL. |
| Medium · `components/ui.tsx:166`, `components/Deadman.tsx:53` | An aria-label on a paragraph and on an unnamed generic graphic failed `aria-prohibited-attr`. | Use complete hidden typewriter text plus an aria-hidden visual duplicate, and an image role for the judge graphic. Light-theme scans report no violations in both engines. |
| High · `styles/globals.css:844` | Hidden absolute seat labels escaped the scroll area's positioning context; an active case enlarged the document scroll width to about 1144px. | Position each seat relatively, preserving the labels within the scroll region. Active-case and text-enlargement checks now keep the page width at 390px. |
| Medium · `styles/globals.css:495`, `components/Deadman.tsx:44` | Enlarging text exposed a heading's intrinsic minimum and an unbreakable eight-character timer. | Allow section-title flex items to shrink/wrap; allow timer breaks only between time groups; wrap calculation/header rows. No digits or columns are clipped or removed. |
| Medium · `components/Leaderboard.tsx:62`, `styles/globals.css:2279` | An early phone layout hid Best three. | Keep the full five-column table in a labeled, focusable scroll region with an explicit hint. All data remains available. |
| Medium · `pages/index.tsx:25`, `components/Hero.tsx:3`, `components/CasePanel.tsx:42` | The first dead-state version kept the “selling needs a plea” promise and could show a waiting case after closure. | Apply the theme at the document root, set the native dark scheme, show “Your exit is open”, close the panel UI and expose trading. The modal keeps a light native scheme. Explicit foreground rules and local ink tokens fixed the subsequently reproduced WebKit black-text defect. Free selling and final zero-violation dark scans were exercised. |
| Medium · `components/ConnectWallet.tsx:32` | A phone with an EIP-6963 provider but no legacy `window.ethereum` could be mistaken for a providerless browser. | Prefer discovered named providers over app-browser links. The wallet suite covers an injected phone and a separate providerless phone. |
| Medium · `components/demo-context.tsx:20` | The final stress flow found a status interval reading a case after Reset cleared the contract map, producing “Case not found” page errors. | Store the current case in a ref, clear it before reset, and use it in timer callbacks. The combined flow is rerun after this correction; final error totals are in the saved results. |
| Medium · `lib/mock-contract.ts:225` | A fresh overruled panel could overwrite the score used for the sale's leaderboard points. | Preserve `saleScore` at sale and use it for the best-three standings. The existing overruled-objection test now asserts points are retained; the suite still has 30 tests. |
| Low · `styles/globals.css:141`, `components/PleaForm.tsx:323` | Default strong text introduced a fourth weight, and the bar explanation was repeated three times. | Normalize UI strong to 600, retain 800 headings, remove redundant lines; the probe reports three weights and no repeated lines. |

No required functionality was removed to improve the review score. The font range and unperformed native-device checks remain documented limitations.

## Design-probe result and deliberate brief overrides

The final pinned `taste@1` report is retained as `validation-data/taste.json`. **13/16 checks pass.** Rendering, layout, targets, measured contrast, casing, tracking, type sizes, font families/weights, glyphs, repetition, copy budget, motion and sharing pass.

The three reported failures are preserved as explicit brief overrides:

- **Eyebrows:** the brief asks for the pill “A meme token on Uniswap v4”; the hero retains that one badge.
- **Slogans:** required copy includes “Buying is open. Selling needs a plea.”, “30 judges. 17 must agree.” and “No site? Plead in a transaction.” The probe also counts the parent/child judge line twice and banner fragments. These are not a stack of added marketing headlines.
- **Chrome:** the brief explicitly requires “2px solid black border” and “hard shadow 4px 4px 0 #000” on cards/buttons. The page keeps that neobrutalist treatment. The probe finds no nested cards or gradient text.

The probe measures 46 prose words on the first 390px screen (bar 60), five phone sizes/six desktop sizes, three families and three weights. All 23 measured controls meet its 24px/spacing rule; 13 compact controls are below its 44px comfort target. Main transaction actions and wallet rows use larger touch targets.

## Limitations

- Real wallet signing, live chain transactions, Coinbase passkey creation and launches into installed phone apps were not performed. The EIP-1193 tests use an ephemeral browser fixture; no key or deployed address is involved. Phone rows, links, names, marks, rejection, chain add/switch and disconnect are checked.
- All economic, oracle, account, season and payout data is local mock data. No cross-visitor storage, persistence, live contracts or backend exists. Reload/reset clears the simulation. The real 33-hour wait is tested with an injected clock rather than waiting on the wall clock.

- Native screen-reader use, physical iPhone/Safari, hardware wallets, browser-native zoom, RTL/localization and clipboard permissions across platforms were not independently verified.
- Space Grotesk supplies a 300–700 variable range. CSS requests the brief's 800 weight and the browser may synthesize/select the nearest heavy face. No native 800 master is claimed.

## Verification and final artifacts

| Command | Actual final result |
| --- | --- |
| `npm run typecheck` | Exit 0, strict TypeScript check passed |
| `npm test` | Exit 0, 30 tests passed, zero failed/skipped |
| `NEXT_TELEMETRY_DISABLED=1 npm run build` | Exit 0, Next production build and static export completed after the last application correction |
| `npm run test:browser` | Exit 0, Chromium 15/15 check groups; WebKit 15/15; zero page/console errors, failed local assets or backend requests |
| Pinned `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste` | Measured the final export: 13/16 pass; three documented brief overrides |
| `node scripts/check-export.mjs` | Passed metadata, relative resource URLs, generated-directory/archive exclusions and all explicit byte budgets |

The browser suite checked the initial export at 320, 390, 640, 820, 1024 and 1440 pixels, then exercised the full case flows at 390×844, including a keyboard-only approval and sale. Both engines kept the document width at 390 under 200% root-text enlargement. All four saved light/dark axe files contain `[]`. This supplements rendered inspection; it is not a claim of complete accessibility compliance.

Raw final results are in `validation-data/results.json`, `validation-data/*presentation.json`, the four `*axe.json` files and `validation-data/taste.json`. The snapshots in `screens/` preserve the phone first screen, full desktop page, approval/denial, corrected WebKit dead theme, wallet picker, keyboard focus and enlarged text. These images were inspected locally; no screenshot or audit result is fabricated. Intermediate failed-run artifacts are not presented as final evidence.

The export is 1,176,058 bytes. The complete deliverable remains below the 8,388,608-byte cap, including screenshots, source, lockfile and runtime assets. `path-budget.md` records the explicit per-path caps. No dependencies, caches, source maps, npm archives or submodule are submitted. Original font sources/licenses remain complete; duplicate export font payloads and the redundant share-card SVG export were removed while retaining the runtime WOFF2 and PNG assets.

**Complete for the stated scope.** The mock dApp, complete static export, source/lockfile, documentation and local validation are delivered. No hosting or live-contract deployment was attempted.
