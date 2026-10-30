# Submission path budget

The submission cap is **8,388,608 bytes**. `dist/` is included, never ignored.

| Paths | Maximum submitted bytes | Purpose |
| --- | ---: | --- |
| `dist/**` | 4,194,304 | Complete production HTML and required runtime assets |
| `public/**` | 524,288 | Original fonts, artwork, wallet marks, favicon and share card |
| `pages/**`, `components/**`, `lib/**`, `styles/**` | 524,288 | Application source |
| `scripts/**`, `tests/**`, root package files and frontend configuration | 524,288 | Reproducible build and checks |
| `artifacts/**`, `README.md`, `DESIGN.md`, `.gitignore` | 2,621,440 | Review evidence, licenses and documentation |
| **Total** | **8,388,608** | Includes source and export |

The new `.gitignore` explicitly includes `dist/**` and `artifacts/**` within their budgets above. Its exclusions are limited to generated dependencies (`**/node_modules/`), Next caches (`**/.next/`), intermediate exports (`**/out/`), caches (`**/.cache/`), TypeScript build metadata (`**/*.tsbuildinfo`) and the requester's disposable `test/scratch/`. Every ignored family has a **zero-byte submission budget**. No source, lockfile, `dist/` file, runtime asset or required evidence is ignored. All dependency installation and Next build output for this assignment were kept in temporary directories outside the repository. No submodule is used.

The final measured size is recorded in `validation.md` after the final build.
