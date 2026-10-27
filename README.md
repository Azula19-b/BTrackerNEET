# BTrackerNEET

BTrackerNEET is an offline-first macOS desktop application for learning C++ interview patterns through repeated, independent practice. It deliberately separates “I understand this solution” from “I can write this by myself,” because those are different milestones.

The app is an independent personal study tool and is not affiliated with, endorsed by, or sponsored by LeetCode or NeetCode. Problem links lead to the original source; the app’s summaries, hints, learning notes, and code references are stored locally.

## What is included

- A real Electron desktop window with a context-isolated preload bridge and no renderer Node integration
- The complete 150-item NeetCode 150 index, kept in official topic order
- Verified catalog totals: 28 Easy, 101 Medium, 21 Hard across 18 topics
- Separate understanding and solving-progress controls
- Monaco C++17 editor with syntax highlighting, bracket matching, autosave, font controls, themes, copy/reset, full screen, and permanent attempt snapshots
- Progressive three-stage hints and a guarded reference-solution reveal
- Secure local `clang++` execution for standalone programs, with output capture, timeouts, cancellation, and temporary-file cleanup
- SQLite persistence for problems, progress, sessions, attempts, hints, reviews, notes, and settings
- Spaced reviews at default 1/3/7-day intervals with manual rescheduling in the data layer
- Custom problem add/edit/delete/search support with URL uniqueness enforcement
- Dashboard, topic progress, recent activity, streaks, and learning analytics
- JSON backup and restore
- Dark and light themes

## Learning workflow

1. Choose a built-in or custom problem.
2. Start from the problem’s starter method or from a runnable blank C++17 program.
3. Work independently while the draft autosaves.
4. Reveal hints one at a time. Hint usage is recorded, but never changes solving progress automatically.
5. If necessary, confirm before viewing the reference. Viewing it is recorded and does not mark the problem solved.
6. Save permanent attempt snapshots and update understanding and independent-solving status separately.
7. Return through **Review Today** according to the 1/3/7-day schedule.

When a practiced problem is reopened, BTrackerNEET asks whether to practice again, review notes, or view progress. Old attempts are never deleted when a new session begins.

## Architecture

```text
Electron main process
├── SQLite repository (better-sqlite3)
├── C++ runner (spawn without a shell)
├── backup/import file dialogs
└── restricted IPC handlers
        │
        ▼
Context-isolated preload bridge
        │
        ▼
React + Vite renderer
├── dashboard and analytics
├── problem libraries and filters
├── Monaco practice workspace
├── progressive hints / solution viewer
└── reviews, settings, and custom forms
```

The renderer cannot call Node APIs directly. Only the methods explicitly exposed in `electron/preload.cjs` are available. SQLite statements are parameterized, native data lives in Electron’s `userData` directory, and built-in seeding updates learning content without replacing user-progress rows.

## NeetCode 150 learning data

Run the catalog validator at any time:

```bash
npm run validate:data
```

It checks record count, unique IDs/titles/URLs, 18 topics, the 28/101/21 difficulty split, HTTPS links, three distinct hints per record, required explanations, starter code, and reference code presence.

Catalog metadata was cross-checked with the official [NeetCode 150 collection](https://neetcode.io/practice/practice/neetcode150). The complete statement remains on the linked source, avoiding reproduction of copyrighted statements.

## Install and run on Apple Silicon macOS

Requirements:

- macOS on Apple Silicon
- Node.js 22 or newer and npm
- Apple Command Line Tools (`xcode-select --install`) for `clang++`

```bash
git clone https://github.com/YOUR_ACCOUNT/BTrackerNEET.git
cd BTrackerNEET
npm install --legacy-peer-deps
npm run dev
```

`npm run dev` launches Vite and opens the Electron window. No Docker, server, cloud compiler, or external API is used.

For a production check:

```bash
npm run build
npm start
```

## Tests

```bash
npm test
```

Vitest runs under Electron’s Node runtime so it exercises the same native `better-sqlite3` binary as the app. Tests cover database initialization, 150-item validation, custom CRUD, duplicate URLs, understanding/progress changes, hints, drafts, attempts, reviews, analytics, JSON backups, and persistence after reopening a database file.

## Package a local Mac application

```bash
npm run dist
```

Artifacts are written to `release/` for Apple Silicon. Local builds are unsigned. On first launch, macOS may block an unsigned app; for a personal build, Control-click the app, choose **Open**, and confirm. Public distribution requires an Apple Developer ID, hardened runtime configuration, signing, and notarization.

## Local C++ execution and safety

The runner accepts only source text from the editor, invokes `clang++` with an argument array (never shell interpolation), limits compilation to 15 seconds and execution to 5 seconds, caps captured output, and removes its private temporary directory. C++ is native code and can access the current user’s machine, so only run code you trust.

Most linked platforms use a judge-provided `class Solution` and hidden test harness. BTrackerNEET does not pretend those snippets are directly executable. Add a standalone `main()` to run locally; otherwise the editor clearly reports that a problem-specific harness is unavailable.

## Data and backups

The database is stored under Electron’s platform-specific `userData` directory as `btrackerneet.db`. Use **Settings → Export JSON** before moving computers or testing an import. Import validates the backup format and restores records transactionally.

## Known limitations

- The application does not ship problem-specific sample-test harnesses; only standalone programs with `main()` run locally.
- This unsigned local build is not notarized for public distribution.
- The catalog includes complete metadata and an offline code reference for every problem. The first 33 code references have been independently specialized and verified against their exact judge signatures; the remaining entries currently provide compilable topic-pattern references and still require per-problem signature/algorithm verification before they should be described as complete judge solutions.
- Built-in examples point to the current official source rather than copying statement text. Rich, independently authored examples remain a content expansion item.
- There is no cloud sync or online judge submission; all progress stays local unless exported.

## Future improvements

- Finish per-problem verification for every C++ reference and add independently authored examples
- Add opt-in harnesses for problems whose inputs can be modeled reliably
- Add keyboard shortcuts and accessible focus trapping
- Add signed/notarized release automation
- Add optional encrypted backup files

## Commands

| Command | Purpose |
| --- | --- |
| `npm install --legacy-peer-deps` | Install and rebuild native Electron dependencies |
| `npm run dev` | Start Vite and Electron for development |
| `npm run validate:data` | Validate all built-in catalog records |
| `npm test` | Run the persistence and workflow test suite |
| `npm run build` | Build the renderer for production |
| `npm start` | Open the built Electron app |
| `npm run dist` | Test, build, and package the Apple Silicon app |

## License

Application source is available under the MIT License. Linked problem names and third-party trademarks remain the property of their respective owners.
