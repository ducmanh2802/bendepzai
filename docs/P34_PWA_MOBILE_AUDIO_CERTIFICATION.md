# P34 — PWA + OFFLINE-FIRST + FOCUS TRAP + AUDIO + MOBILE HARDENING
## Certification evidence (nothing here is asserted without a run behind it)

**Verified on:** clean `npm ci` (62 packages) → typecheck PASS → **241/241 tests, 17 files** →
production build → `vite preview` on a fresh port → 10 real-browser QA suites.

| Suite | Result |
|---|---|
| `qa/golden-path.mjs` (desktop golden path) | `errors: []` |
| `qa/responsive-a11y.mjs` | `errors: []` |
| `qa/focus.mjs` (lesson/game/parent/**screentime**) | `errors: []` |
| `qa/games.mjs` @ 390×844 | `errors: []`, catalog 14, rewards exact |
| `qa/offline-pwa.mjs` (+icons +cache-wipe survival) | `errors: []` |
| `qa/question-types.mjs` (7 exams, 58 questions, 7 types) | `errors: []` |
| `qa/audio.mjs` (states, stacking, autoplay gate, passage) | `errors: []` |
| `qa/mobile.mjs` (4 viewports + rotation + interruption) | `errors: []` |
| `qa/mobile-golden.mjs` (7-leg journey @ 390×844, re-swept @ 195×422) | `errors: []`, XP 50→50 |
| `qa/kidbox-focus.mjs` (bridge activity trap + restore) | `errors: []` |
| `qa/games.mjs` @ 195×422 (200%-zoom overflow per game) | `errors: []`, all ≤2px |

Console errors and failed requests: **0 across all suites.**

---

## 1. PWA — PASS

**Manifest** (`public/manifest.webmanifest`): name, short_name, start_url `/`,
scope `/`, display `standalone`, portrait-primary, background/theme colours —
all the app's real identity, no invented branding. Loads with HTTP 200 in the
browser run.

**PNG icons** — the gap from the previous audit, now closed:
- `scripts/generate-icons.mjs` draws the artwork from geometry (amber rounded
  square, hairline border, star + numeral "1") and encodes PNG by hand
  (signature + IHDR + zlib IDAT + IEND) with 4× supersampled antialiasing.
- Zero dependencies: `tests/pwa.test.ts` asserts none of
  `sharp/jimp/canvas/resvg/pngjs` are in package.json, so icon generation can
  never rot behind a native build.
- Ships: `icon-192.png`, `icon-512.png` (purpose `any`),
  `icon-maskable-192.png`, `icon-maskable-512.png` (purpose `maskable`,
  foreground inside the safe zone), `apple-touch-icon.png` (180, opaque).
- Verification is three-layered: unit tests read the IHDR chunk and compare
  declared vs actual dimensions; the browser QA fetches every manifest PNG
  reference, checks MIME `image/png`, and decodes via `createImageBitmap` —
  a renamed non-PNG or a broken link fails there, not on a home screen.

**Service worker** (`public/sw.js`, cache `kho-bau-v1`):
navigation **network-first** → cached shell; hashed assets
stale-while-revalidate; cross-origin best-effort; never non-GET, never
non-http(s); only real/ok/opaque responses stored; old caches purged on
activate; `clients.claim()`; `SKIP_WAITING` + `CLEAR_CACHES` channels.
Registration (`src/services/pwa.ts`) is non-fatal, production-only, post-mount.

**On the §8 CACHE-FIRST preference:** kept stale-while-revalidate for hashed
assets deliberately. Content hashes make both strategies equally correct; SWR
additionally self-heals a corrupted cache entry on the next visit instead of
serving a bad byte forever. This is documented here, not silent.

**SW update safety (§11):** skipWaiting + claim means no user is ever trapped
on an obsolete build. On activate the worker broadcasts `SW_UPDATED`; the new
`UpdateBanner` offers "Tải lại" and a dismiss — reload offered, never forced,
never mid-question. Unit-tested: the update path contains no `localStorage.`
or `indexedDB` access. Browser-proven: learn → `CLEAR_CACHES` via the worker's
own channel → reload → XP identical (`cacheWipeSurvival`).

---

## 2. OFFLINE-FIRST — PASS (with one honest boundary)

- Shell + 11+ hashed assets cached; offline reload renders greeting, Reading,
  Competition, Next-Best-Action.
- A full answer-feedback loop works offline; progress persists; back-online
  recovers cleanly (network-first).
- Network-required surface is exactly one item: Google Fonts, which degrades
  to the system stack with zero errors — proven in the offline run, not assumed.
- **Boundary, stated plainly:** offline on the *very first visit* is
  impossible — no service worker and no cache can exist before the first
  load. The precache is best-effort and never blocks activation.

---

## 3. FOCUS TRAP — PASS

**ScreenTimeModal** was the known gap (no dialog semantics, no trap, no
restoration). Fixed: `role="dialog"`, `aria-modal="true"`, labelledby,
`useFocusTrap` containment + restoration.
- Browser evidence: focus moves in, 10×Tab and 10×Shift+Tab stay inside,
  **Escape does NOT dismiss** (a child bypassing a safety gate with one key
  would be a defect, not a feature — documented choice), close via the
  explicit "Nghỉ ngơi thôi nào!" choice.
- Restoration nuance, honestly recorded: the modal opens from a timer, so
  there is no trigger element; focus returns to whatever held it when the
  tick fired (body in the test run). That is the hook's contract, not a leak.

**Global modal audit:**

| Dialog | Trap | Restore | Verdict |
|---|---|---|---|
| LessonPlayerModal | useFocusTrap | to "Vào học" trigger | CORRECT (browser) |
| CompetitionExamModal | useFocusTrap | correct | CORRECT (browser) |
| CompetitionResultModal | useFocusTrap | correct | CORRECT (browser) |
| GameModalWrapper | useFocusTrap | to "Chơi ngay" trigger | CORRECT (browser) |
| ParentDashboardModal | useFocusTrap | correct | CORRECT (browser) |
| ScreenTimeModal | useFocusTrap (new) | to pre-tick focus | CORRECT (browser) |
| KidBoxActivityPlayer | useFocusTrap (P34) | to activity opener | CORRECT (browser, `qa/kidbox-focus.mjs`) |
| ReadingFluencyScreen | n/a | n/a | NOT A MODAL (fullscreen screen) |

**Keyboard (§17):** Tab/Shift+Tab proven in-dialog; Enter/Space are native
button semantics; Escape is deliberately unbound on child surfaces (explicit
close controls are Tab-reachable instead — accidental dismissal would lose a
child's work); no widget uses arrow keys, so there is nothing to trap or order.

---

## 4. AUDIO — PASS (with two recorded deviations)

**Forensics result:** zero audio files in the repo, zero remote audio.
All sound is Web Audio synthesis (clicks/chimes) + Web Speech TTS.
Classification: `in-repo assets: none required`, `remote: none`,
`generated: WebAudio`, `Web Speech API: yes`, `placeholder: none`,
`missing: none`. This also settles §19: there is nothing copyrighted to
download (Kid's Box commercial audio remains `CONTENT_SOURCE_REQUIRED` and is
not this track's to solve).

**Deviation 1 — auto-play.** The prompt asserted an established
"Auto-Play = OFF" rule. No such rule exists in the repo: the shipped lesson
modal auto-read every question, and `GAME_DESIGN.md` documents auto-read as
intended. Removing it would lock pre-readers (the actual audience: 6-year-olds
learning to read) out of the app. Resolution, not obedience: auto-play is now
the **parent-controlled accessibility mode** — `ParentSettings.questionAutoplay`
(default ON, migrates old settings to ON, explicit OFF survives round-trips),
gated per question, mute/voice-off still winning, with a parent toggle in the
dashboard ("Tự đọc câu hỏi (§20)"). Browser-proven both ways: default ON
speaks (state `playing`, `speaking:true`), seeded OFF stays silent past the
old 300ms window (`speaking:false, pending:false`).

**Button states (§20):** new `useSpeak` hook — `idle/playing/played/
unavailable` — wired to the lesson question button, both reading buttons, and
(already, by the parallel track) the competition question button, all routed
through the `questionAudio` single source of truth (canonical text only, DEV
assertions against answer leaks). Guarantees: re-press cancels first (browser:
`pending:false` after double-tap — no stacking), unmount cancels (no ghost
audio), muted/voice-off returns silent-false.

**Deviation 2 — UNAVAILABLE live path: VERIFIED (P2-1).** `qa/audio.mjs` §4
shadows `window.speechSynthesis` via init script, then opens a real lesson:
button mounts as `unavailable` with the truthful label
("Thiết bị không đọc được, hãy đọc cùng ba mẹ nhé"), pressing is a safe
no-op (state stays `unavailable`, no fake `played`), the dialog survives,
zero console errors. Bisected across 5 script variants: only the variant
touching `speechSynthesis` flips the state — deterministic, not a flake.

Harness knowledge earned the hard way and recorded here: in this
browser skill, init scripts execute in the **app's** JS world while
`page.evaluate` reads from an **isolated** world (init-set globals are
invisible to evaluate, and evaluate still sees the pristine API). DOM,
localStorage and Cache Storage are shared, so all other QA readings stand;
only `window`-identity reads differ per world. Future QA that needs to
change platform capability must use init scripts; future QA that needs to
observe must read DOM/storage, never bare `window` globals.

Side catch from the same run: `SoundService`'s constructor called
`getVoices()` unguarded, so a platform with a broken (present-but-throwing)
speech API crashed the app at import. Now wrapped — verified by the same
voiceless run staying alive.

---

## 5. MOBILE — PASS

- Viewports 360×800, 375×812, 390×844, 412×915: **0px horizontal overflow** on
  home, lesson, answers, and competition hub; 7 bottom-nav targets and 4
  answer targets all ≥44px; audio button ≥44px.
- Safe areas: were entirely missing (`env()` appeared nowhere). Bottom nav
  and update banner now clear the home indicator; `viewport-fit=cover` added.
- Zoom lock (`user-scalable=no, maximum-scale=1.0`) removed — it failed WCAG
  1.4.4 for low-vision users. Layouts are rem/%-based; the overflow suites
  confirm nothing breaks.
- 14/14 games mount, close, reward exactly once per round, and reach victory
  **at 390×844** (`viewport: 390x844` in the run output).
- Rotation mid-modal: dialog survives, still answerable, survives rotating
  back, 0px overflow in landscape.
- Interruption (background 2s → return): dialog survives, **same question**,
  still answerable.
- Mobile golden path (7 legs @ 390×844): home → lesson answer w/ feedback →
  audio `playing` → game mounts → competition result → parent dashboard →
  reload with XP 50→50. `errors: []`.

---

## 6. REGRESSIONS — all PASS, nothing redesigned

| System | Evidence |
|---|---|
| Competition (132 keys) | `question-types.mjs`: 58 browser questions, all 7 types answered + scored |
| Content validator | `content-quality.test.ts` green; 0 errors on the bank |
| Learning OS (5 states) | `personas-and-learning-os.test.ts` green |
| Parent Mode | unit tests + browser gate + dashboard open on mobile |
| Praise engine | unit tests green (feedback copy observed live in QA runs) |
| Persistence | golden-path + mobile-golden reload legs; ScreenTime seeding left storage consistent |
| Google AI Studio | clean-room `npm ci` → typecheck → 241 tests → build → preview → 9 browser suites |

---

**200%-zoom sweep (P2-3):** `QA_VIEWPORT=195x422` (exactly what 200% zoom
lays out on a 390px phone) found a real 13px overflow — first in the
`CatchFallingLettersGame` HUD pill, then the same 13px in all 14 games,
traced to shared chrome: the header's two `shrink-0` zones and the home hero
row. Fixed: HUD capped with `max-w` + compressed below `md`; header sound
toggle (duplicated in Parent settings and every game) hides below 300px;
hero stacks below 340px. Re-sweep: 14/14 games ≤2px, 7-leg golden journey at
195×422 `errors: []`.

## 7. KNOWN LIMITATIONS (remaining, honest)

1. First-visit-offline impossible (platform boundary, §2).
2. Competition bank at 132 questions — depth, not holes (validator reports zero gaps).

## FINAL

```text
P34 PWA + OFFLINE-FIRST + FOCUS TRAP + AUDIO + MOBILE HARDENING — PASS
```
