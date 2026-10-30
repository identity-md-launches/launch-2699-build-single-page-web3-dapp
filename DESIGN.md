# PLEA design system

## Overview

PLEA is a single-page token dApp demo for holders writing a case to sell. The visual idea is a court filing: cream paper, black ink, a yellow action color and verdicts stamped onto the case. The page is intentionally neobrutalist, with hard shadows and visible borders as specified in the brief.

The source of truth is `styles/globals.css`, supported by the components in `components/`. Tailwind CSS 4 provides the reset and small layout utilities; product tokens and component styles are explicit CSS. `pages/index.tsx` owns the one-page composition and metadata. There are no remote font, art or icon requests for the mock flow.

## Colors

The canonical format is hexadecimal. Tokens are declared in `styles/globals.css:16`; `.theme-dark` begins at line 1711. The class is applied to the document root in `pages/index.tsx`, with native `color-scheme: dark`; dialogs explicitly use the light native scheme.

| Token | Light | Cabal-dead theme | Role |
| --- | --- | --- | --- |
| `--page` | `#f6f4f0` | `#111111` | Whole-page background |
| `--surface` | `#ffffff` | `#202020` | Cards, fields and secondary actions |
| `--ink` | `#000000` | `#f6f4f0` | Primary copy |
| `--muted` | `#5c5a55` | `#bdb9b0` | Explanations, captions and secondary data |
| `--line` | `#000000` | `#f6f4f0` | Structural borders |
| `--subtle` | `#e8e5df` | `#333333` | Disabled controls and inactive tracks |
| `--accent` | `#ffd324` | Same | Primary action, logo, selected amount and score fill |
| `--approved` | `#4ade80` | Same | Approved stamp and live judge indicators |
| `--denied` | `#f87171` | Same | Denied stamp and dead panel |
| `--sold` | `#93c5fd` | Same | Sold stamp |
| `--objection` | `#c084fc` | Same | Objection, sustained and overruled stamps |
| `--focus` | `#2459ce` | `#ffd324` | Keyboard outline |

Status fills always use black text, a written status and an explicit border. Dark mode resolves foregrounds explicitly on each element; yellow actions, status surfaces and the footer scope `--ink` locally to black, and black actions scope it to white. This avoids stale inherited foregrounds in WebKit. Color is never the sole verdict cue. Buttons with a black background use white text. The footer and the “CA: Coming soon” banner retain black ink on yellow in both themes. Native dialogs retain cream/white surfaces and dark text even when opened from the dark page.

Supporting surface values include `#f9f8f5` behind the stepper, `#eeeae2` on the light dead-man card and `#ece9e2` on table headers. Inline errors use `#a51e1e` in light mode and `#f87171` in dark mode; the modal retains the light error value. Yellow hover is `#ffdf5b`.

Rendered contrast evidence is recorded in `artifacts/validation.md`. The checked light pairs include black/cream 19.12:1, muted/cream 6.27:1, black/white 21:1, black/yellow 14.60:1 and white/black 21:1. These measurements do not establish every conceivable overlay or system-color pair.

## Typography

Three font roles, six size tokens and three used weights:

| Role/token | Size at 16px root | Use |
| --- | ---: | --- |
| `--text-small` | 13px | Captions, validation, table cells, metadata, compact actions |
| `--text-body` | 16px | Body default, fields, main actions |
| `--text-lead` | 20px | Card titles and medium data |
| `--text-heading` | 28px | Section headings, amount input and verdict labels |
| `--text-title` | 44px | Mobile hero, score and compact timer |
| `--text-display` | 80px | Desktop hero and large dead-man timer |

`--font-heading` is **Space Grotesk**, falling back to Arial/sans-serif. Headings request weight **800** to match the brief; the upstream variable font covers **300–700**, so the browser may synthesize the heavier face. This is an intentional limit of the supplied typeface, not a claim that an 800 master exists. `--font-ui` is **Inter**, with Arial/sans-serif fallback; the local file covers 100–900, while UI uses 400 and 600. `--font-mono` uses the system monospace stack for numbers, timers, scores, amounts and hex.

Both Latin WOFF2 files live in `public/fonts/`, with complete licenses. Webpack emits their runtime versions into `dist/_next/static/media/`; the export script removes redundant original font payloads from `dist/fonts/` while retaining license files. Non-Latin input uses the browser's fallback glyphs. Fonts use `font-display: swap` and have been checked as loaded in the production browser runs.

Body line height is 1.5; form prose uses up to 1.6. Heading line heights are 0.98–1.25 by role. Display tracking is −0.06em; section headings −0.035em; small headings −0.025em or −0.02em. Prose has natural tracking and `text-wrap: pretty`; headings use `text-wrap: balance`. The typewriter has a complete screen-reader text equivalent while its animated duplicate is hidden from assistive technology. Meaningful values remain selectable; the hex and long quotes wrap instead of being ellipsized.

At 640px and below the display token becomes 44px. At 360px and below the hero becomes 28px to fit the narrow width. Input and textarea copy remains at least 16px. Changing values use monospace/tabular numerals to limit layout movement.

## Layout

The shared `.content-width` is at most **1184px**. Desktop gutters are 48px, become 32px at 1100px, 18px at 640px and 14px at 360px. Repeated spacing is primarily 4, 8, 12, 16, 20, 24 and 32px. Major section gaps are 64px on desktop and 44px on phones; the first form starts 28px below its mobile demo controls.

The hero uses two columns with a paper illustration, becoming a text-and-actions composition on phones. The form uses a 1.16:1 split between the case editor and stepper, stacking below 640px. Fact cards use four columns, then two on phones. The transaction and dead-man cards each switch from two columns to one. Footer elements wrap without clipping. The header also wraps when enlarged text requires more room. The timer can wrap between hours, minutes and seconds without shrinking or losing a digit. Judge seats establish a local positioning context so their hidden accessibility labels cannot widen the page.

At 820px and below, full navigation is removed and the jury's sorted row becomes an internal horizontal scroll area. On phones the unsorted jury uses five columns of square seats. After sorting it stays one row, brings the seventeenth seat into view, exposes a keyboard-focusable scroll region and includes a scroll hint. The leaderboard keeps **all five columns** in a minimum-600px table with its own scroll container and explicit hint. Neither table nor jury creates page-level horizontal scrolling.

The site never names a chain or contract address. A full-width yellow `.ca-banner` (`pages/index.tsx:52`) reads only “CA: Coming soon” at every width, in `--text-small` black text with a 2px black bottom rule. The header `.ca-badge` (`pages/index.tsx:74`) repeats “CA: Coming soon” as plain small text next to the wallet control above 1100px and between 641px and 820px; it is hidden from 821–1100px and at 640px and below, where the banner alone carries it. The wallet control’s wrong-network state reads “Switch network” without naming the chain. The footer’s outline button links to https://x.com/pleaimd as “Follow @pleaimd”. The first 390×844 view includes the product, both main actions and the amount field. Viewports 320, 390, 640, 820, 1024 and 1440 were used in browser validation. The 200% root-text enlargement check is separate from browser-native zoom; see the validation limits.

## Elevation & depth

`.card` and `.button` use a **2px solid border**, **3px radius** and hard **4px 4px 0** shadow. This deliberately follows the requested visual language even though the review guide normally prefers a border or a shadow. In dark mode the hard shadow becomes `4px 4px 0 #66645f` for visibility.

Button hover offsets the surface by −1px with a 5px shadow. Press moves it by 3px and scales to 0.96, with the shadow removed. Only transform and shadow transition (120ms); theme colors snap. Disabled controls have a grey outline, grey surface and no shadow. Modal elevation is a 6px hard black shadow over a `#0009` backdrop. No gradients or glows are used.

## Shapes

The dominant form is a square-edged paper rectangle. Cards and buttons share the 3px radius token; fields and utility controls use 2px. The token badge is the deliberate pill exception. The logo rotates −4 degrees in its yellow border. Verdicts rotate −8 degrees with a double black stamp border. Initial judge seats have dashed borders; revealed scores have solid borders; the seventeenth seat has yellow fill and a heavier border. Dead judge seats use red fill and a written closed-panel state.

The letter illustration and share image have editable SVG sources in `public/`. The favicon is an original boxed P glyph. Wallet marks are official identifiers retained with their notices.

## Components

| Component/pattern | Source | Behavior and reuse |
| --- | --- | --- |
| `Logo` | `components/ui.tsx` | Home anchor and tilted PLEA wordmark; the footer has a size override |
| `SectionTitle` | `components/ui.tsx` | Consistent section heading, optional number and trailing information |
| `.button` | `styles/globals.css` | Yellow primary, black secondary, white/outline secondary; native loading/disabled states |
| `Modal` | `components/ui.tsx` | Native `dialog`; title and close control, Escape/backdrop dismissal, platform focus containment/return; bottom sheet on phones |
| `Typewriter`, `CountUp`, `Stamp` | `components/ui.tsx` | Short staged motion with accessible text/static outcomes; reduced-motion variants |
| `ConnectWallet` | `components/ConnectWallet.tsx` | One connection control, named EIP-6963 providers, phone app links, Coinbase, row pending/error states, chain switching and disconnect |
| `PleaForm` | `components/PleaForm.tsx` | Amount presets, exact UTF-8 counter, validation, receipt and one-time mock fee approval; first invalid field receives focus |
| `CasePanel` | `components/CasePanel.tsx` | Pending envelope, staggered scores, sorted panel, need/fact cards, verdict, sale, one appeal and objection outcomes; closed panel in dead mode |
| `BuyModal` | `components/BuyModal.tsx` | Balance-checked mock buying; selling tab only when the Cabal is dead; receipt and local errors |
| `Transaction` | `components/Transaction.tsx` | Locally encoded hex, copy/fallback, and animated decoding into text |
| `Leaderboard` | `components/Leaderboard.tsx` | Complete current standings table, sample season history and prize-paid stamps |
| `Deadman` | `components/Deadman.tsx` | Actual ticking 33-hour mock deadline, 30 seats and free-trading recovery action |
| Demo provider | `components/demo-context.tsx` | One in-memory contract instance; active case, outcome, loading and action-local error state |

The no-case panel provides a sample-case action. Invalid text/amounts remain editable and explain the fix. A pending case disables duplicate submission. Approval has a seven-minute sell window; denial has one appeal within four hours. Service errors appear beside the action as well as in the stable status region. Labels and instructions remain outside placeholders.

Motion uses Framer Motion: judge pop-ins, layout reordering, score count-up, envelope flight and stamp slam. A stamp scales 1.6→1, settles to −8 degrees and shakes once. CSS disables animation/transition durations for reduced motion, and the motion provider uses `reducedMotion="user"`. There are no endless decorative animations. Dynamic status always has written text.

## Do's and don'ts

- Start another surface with `.content-width`, `SectionTitle`, existing type tokens and one `.card` when a container is needed.
- Use yellow for the main action or selected score/amount; use written status plus the existing stamp fill for a verdict.
- Keep data and costs visible beside their controls. Keep complete table data available through a labeled scroll area on narrow screens.
- Keep buttons/links native, labels explicit and focus visible. Keep numeric/hex content readable and selectable.
- Preserve the mock-data disclosure. A live deployment must supply real contracts and economics rather than relabeling these fixtures as live.
- Do not add font families, extra display sizes, gradients, soft shadows or rounded dashboard chrome. Do not remove borders/shadows to satisfy the review guide's generic preference.
- Any new animated component needs a reduced-motion path and a static indication of its result. Test the final export at a nested path after changing assets.
