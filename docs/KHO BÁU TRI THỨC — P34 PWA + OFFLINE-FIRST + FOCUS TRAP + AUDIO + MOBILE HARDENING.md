# KHO BÁU TRI THỨC — P34
## PWA + OFFLINE-FIRST + FOCUS TRAP + AUDIO + MOBILE HARDENING
### AUTO-FIX → REAL BROWSER PASS

---

# 0. MISSION

You are continuing development of the existing:

**KHO BÁU TRI THỨC — LỚP 1**

The project already has substantial validated functionality:

- Vietnamese curriculum
- Mathematics curriculum
- English curriculum
- 14 real mini-games
- Learning Engine
- Adaptive Learning
- Spaced Repetition
- Competition Training Engine
- Reading Fluency
- Exam Fidelity
- Content Validator
- Question-type validation
- Parent Mode
- Screen Time
- Persistence
- Praise & Encouragement Engine
- Kid's Box integration framework
- Google AI Studio compatibility
- responsive UI
- accessibility work
- real browser QA

Previously validated phases must remain protected.

---

# 1. PRIMARY OBJECTIVE

Complete the remaining P2/P1 hardening around:

```text
PWA
+
OFFLINE-FIRST
+
SERVICE WORKER
+
MANIFEST
+
PNG ICONS
+
FOCUS TRAP
+
SCREEN TIME MODAL
+
AUDIO ASSETS
+
AUDIO RUNTIME
+
MOBILE UX
+
MOBILE PERFORMANCE
+
RESUME / INTERRUPTION
+
REAL BROWSER QA
```

Execution model:

```text
FORENSIC AUDIT
      ↓
IMPLEMENT
      ↓
BUILD
      ↓
REAL BROWSER TEST
      ↓
FIND FAILURE
      ↓
AUTO-FIX
      ↓
BUILD
      ↓
REAL BROWSER RETEST
      ↓
REGRESSION
      ↓
P34 PASS
```

Do NOT stop at an audit.

Do NOT merely report missing functionality.

Implement it.

Test it.

Fix it.

Retest it.

---

# 2. NON-NEGOTIABLE PROTECTION

Do NOT break:

```text
Learning Engine
Competition Engine
Exam Engine
Reading Fluency
Content Validator
Question Bank
Question Generators
Answer-Key generation
Praise Engine
Learning OS
Parent Mode
Persistence
Game Logic
Rewards
Kid's Box architecture
Google AI Studio compatibility
```

Do NOT rewrite working systems.

Do NOT replace real logic with mocks.

Do NOT fabricate audio test results.

Do NOT claim offline support without actually testing browser offline behavior.

Do NOT claim accessibility PASS without keyboard/focus evidence.

Do NOT claim mobile PASS based only on desktop viewport resizing.

---

# 3. BASELINE FORENSIC AUDIT

Before modifying code, inspect:

```text
package.json
vite.config.*
tsconfig.*
src/
public/
index.html
service worker files
manifest files
PWA configuration
audio files
audio utilities
speech utilities
modal components
dialog components
ScreenTimeModal
game overlays
Parent Mode
Competition UI
mobile navigation
responsive CSS
localStorage persistence
IndexedDB if present
```

Also inspect all previous P25–P33 changes.

Determine:

```text
What already exists?
What is partially implemented?
What is fake/placeholder?
What is unused?
What is broken?
What is browser-only?
What is mobile-only?
What is already PASS?
```

Do not duplicate existing infrastructure.

---

# 4. PWA AUDIT

Determine current PWA state:

```text
manifest
service worker
registration
icons
theme metadata
display mode
start URL
scope
cache strategy
offline fallback
installability
update behavior
```

Classify:

```text
PASS
PARTIAL
BROKEN
MISSING
```

---

# 5. WEB APP MANIFEST

Implement or repair a production-quality manifest.

Minimum:

```text
name
short_name
start_url
scope
display
background_color
theme_color
icons
```

Use the application's actual identity.

Do not invent misleading branding.

Verify:

```text
manifest loads
JSON valid
start_url works
scope correct
icons resolve
```

---

# 6. PNG ICON MANIFEST

The previous audit identified missing PNG manifest icons.

Fix this completely.

Provide appropriate:

```text
192x192 PNG
512x512 PNG
```

where supported/appropriate.

If maskable icons are used, provide valid maskable assets.

Do NOT simply rename another format to `.png`.

The files must actually be valid PNG images.

Verify:

```text
HTTP 200
correct MIME type
correct dimensions
browser can decode
manifest references resolve
```

Test all referenced icon URLs.

---

# 7. SERVICE WORKER

Implement or repair a real service worker.

Requirements:

```text
registration
install
activate
fetch handling
cache strategy
versioning
cleanup
update
```

Do NOT cache everything blindly.

Do NOT cache dynamic API responses as if they were static assets.

---

# 8. CACHE STRATEGY

Use differentiated strategies.

### Static application assets

Prefer:

```text
CACHE-FIRST
```

for immutable/versioned build assets.

### Navigation

Use a controlled navigation fallback where appropriate.

### API

Do NOT blindly cache all APIs.

Classify API calls:

```text
STATIC
SAFE TO CACHE
SESSION-DEPENDENT
REAL-TIME
MUST NOT CACHE
```

Competition results, progress, parent data and other mutable user state must not be silently served from stale cache when correctness matters.

---

# 9. OFFLINE-FIRST REQUIREMENT

Offline-first does NOT mean:

> “Everything must magically work without internet.”

It means the application must degrade predictably.

At minimum offline should allow:

```text
app shell
previously loaded curriculum
previously loaded question content
local progress
local rewards
local learning state
previously cached static assets
games that do not require network
```

Where network is genuinely required:

```text
show explicit offline state
do not fabricate success
do not silently lose user input
```

---

# 10. OFFLINE DATA SAFETY

Audit persistence.

Determine where data lives:

```text
localStorage
IndexedDB
memory
server
```

Ensure that offline actions do not accidentally overwrite newer local state.

Test:

```text
ONLINE
 ↓
learn
 ↓
progress saved
 ↓
OFFLINE
 ↓
learn again
 ↓
reload
 ↓
progress survives
 ↓
ONLINE
 ↓
application remains consistent
```

If synchronization is not implemented, do NOT pretend it is.

Document the actual model.

---

# 11. SERVICE WORKER UPDATE SAFETY

A new service worker must not trap users on an obsolete application forever.

Implement a safe update model:

```text
new version detected
      ↓
controlled update
      ↓
reload/restart when appropriate
      ↓
new assets active
```

Avoid destructive:

```text
clear all localStorage
```

during service-worker updates.

Never destroy learning progress because a PWA version changed.

---

# 12. OFFLINE TEST MATRIX

Use a real browser.

Test:

### Test A

```text
Online
→ open application
→ navigate
→ reload
```

### Test B

```text
Online
→ load core content
→ switch browser offline
→ reload
```

Expected:

```text
application shell works
```

### Test C

```text
Offline
→ start supported game
→ play
→ finish
→ verify local result
```

### Test D

```text
Offline
→ learning activity
→ answer
→ progress
→ reload
```

### Test E

```text
Offline
→ attempt network-required action
```

Expected:

```text
truthful offline/degraded state
```

No fake success.

---

# 13. FOCUS TRAP — SCREENTIME MODAL

Previous audit identified:

> `ScreenTimeModal` focus trap incomplete.

Fix this completely.

When modal opens:

```text
focus moves into modal
```

Keyboard navigation must remain inside the modal.

Expected:

```text
TAB
SHIFT+TAB
```

cycle only through focusable controls inside the modal.

Background controls must not receive focus.

---

# 14. MODAL ACCESSIBILITY

Implement correct:

```text
role="dialog"
aria-modal="true"
accessible label
focus management
escape behavior where appropriate
focus restoration
```

When modal closes:

```text
focus returns to the element that opened it
```

unless the triggering element no longer exists.

Do not move focus arbitrarily to `<body>`.

---

# 15. SCREEN TIME UX

The Screen Time experience is child-safe.

Ensure:

```text
clear message
large readable controls
keyboard access
touch access
no accidental dismissal
no focus leakage
```

Do not use punitive or frightening language.

Preserve Parent Mode controls.

---

# 16. FOCUS TRAP — GLOBAL AUDIT

Do not fix only ScreenTimeModal.

Search all modal/dialog implementations:

```text
Parent Mode
Competition result
Question explanation
Game result
Reward modal
Settings
Audio controls
Screen Time
Help
```

Classify each:

```text
FOCUS TRAP CORRECT
FOCUS RESTORATION CORRECT
PARTIAL
BROKEN
NOT A MODAL
```

Fix broken dialogs where practical without redesigning the UI.

---

# 17. KEYBOARD NAVIGATION

Run a real keyboard audit.

Test:

```text
TAB
SHIFT+TAB
ENTER
SPACE
ESC
ARROW KEYS
```

where semantically appropriate.

Verify:

```text
visible focus
logical order
no keyboard trap outside intended modal
interactive controls reachable
games do not accidentally hijack focus
```

Do not require keyboard operation for inherently pointer/touch gameplay where an equivalent accessible interaction already exists, but do not make basic navigation inaccessible.

---

# 18. AUDIO FORENSICS

Audit all audio functionality.

Classify:

```text
Web Speech API
in-repo audio assets
remote audio assets
generated audio
placeholder audio
missing audio
```

The previous audit identified:

> audio files in-repo still incomplete.

Determine exactly which audio assets are genuinely required.

---

# 19. AUDIO ASSET POLICY

Do NOT download copyrighted textbook audio into the repository without appropriate rights.

Especially for:

```text
Kid's Box
commercial textbooks
commercial course audio
```

Do NOT assume permission.

For original application audio:

```text
include locally where appropriate
```

For Web Speech API:

```text
use runtime TTS where appropriate
```

If a required commercial audio source is unavailable:

```text
CONTENT_SOURCE_REQUIRED
```

or an explicit unavailable state.

Never fake that audio exists.

---

# 20. QUESTION AUDIO

Preserve the previously established rule:

```text
Question Auto-Play = OFF
```

Question audio must be:

```text
user initiated
```

unless a specific accessibility mode explicitly enables another behavior.

Ensure the audio button states remain semantically correct:

```text
IDLE
PLAYING
PLAYED
```

---

# 21. AUDIO RUNTIME VALIDATION

Real browser test:

```text
open question
→ audio button
→ click
→ audio plays
→ state changes
→ click again
→ no duplicate uncontrolled playback
```

Test:

```text
Vietnamese
English
Math speech
Competition
Learning OS
games
```

where applicable.

---

# 22. AUDIO FAILURE HANDLING

If browser/device has no usable voice:

```text
do not crash
do not claim audio played
```

Use:

```text
AUDIO_UNAVAILABLE
```

or existing truthful fallback.

No fake playback.

No fake pronunciation score.

No false speaking mastery.

---

# 23. MOBILE FORENSIC AUDIT

Test actual mobile viewport sizes.

At minimum:

```text
360x800
375x812
390x844
412x915
```

Also test landscape where appropriate.

Inspect:

```text
header
navigation
cards
question layout
answer controls
games
modals
buttons
audio controls
competition timer
progress bars
parent mode
```

---

# 24. TOUCH TARGETS

Interactive controls should have appropriate touch target size.

Prioritize:

```text
primary CTA
answer choices
audio button
navigation
game controls
close buttons
modal actions
```

No accidental overlap.

No controls hidden under browser safe areas.

---

# 25. MOBILE SAFE AREAS

Check:

```text
notch
status bar
bottom navigation
home indicator
```

Use safe-area CSS where needed.

Do not allow:

```text
button under notch
modal action behind browser controls
content clipped at bottom
```

---

# 26. MOBILE SCROLL

Audit:

```text
body scroll
modal scroll
question scroll
game viewport
parent reports
long explanations
```

Prevent:

```text
double-scroll traps
horizontal overflow
locked page
modal behind content
```

---

# 27. MOBILE GAME HARDENING

Test all 14 games on mobile-sized viewport.

At minimum:

```text
game starts
instructions visible
controls usable
touch works
score updates
feedback works
reward works
result screen works
retry works
exit works
```

Do not require desktop mouse assumptions.

---

# 28. ORIENTATION / RESIZE

Test:

```text
portrait
→ landscape
→ portrait
```

during:

```text
question
game
modal
competition
```

No fatal state corruption.

No duplicated UI.

No frozen layout.

---

# 29. INTERRUPTION TESTS

Real browser/device simulation:

```text
open lesson
→ navigate away
→ return
```

```text
open game
→ background tab
→ return
```

```text
open modal
→ resize
→ return
```

```text
audio playing
→ background tab
→ return
```

Verify state remains safe.

---

# 30. PERSISTENCE TEST

Run:

```text
learn
→ answer
→ progress
→ reward
→ reload
```

Verify:

```text
progress survives
reward state survives
learning state survives
settings survive
```

Then:

```text
service worker update
```

and verify data remains.

---

# 31. PERFORMANCE

Measure browser performance.

Inspect:

```text
initial JS
CSS
image size
audio loading
service worker
long tasks
layout shifts
memory
```

Do not perform premature architecture rewrites.

Fix obvious problems such as:

```text
huge unoptimized images
duplicate asset loads
unnecessary rerenders
audio loaded eagerly when not needed
```

---

# 32. PWA INSTALLABILITY

Using a Chromium browser where PWA installability is supported:

verify:

```text
manifest
service worker
icons
start URL
scope
HTTPS/secure context where required
```

If the environment prevents installability, report the exact environmental limitation.

Do not fake an install test.

---

# 33. REAL BROWSER AUTOMATION

Use the existing QA/browser infrastructure if available.

Prioritize actual browser execution over static assertions.

Run at least:

```text
PWA smoke
offline smoke
modal focus
audio smoke
mobile viewport
game smoke
competition smoke
persistence smoke
```

---

# 34. REGRESSION — COMPETITION ENGINE

P34 must not break the already validated competition system.

Re-run:

```text
all question types
canonical answer grading
perturbation checks
7 exam flows
3 subject filters
```

At minimum verify the previously established:

```text
132 canonical keys
58 browser questions
7 question types
```

or the current equivalent if the bank has legitimately expanded.

No regressions.

---

# 35. REGRESSION — CONTENT VALIDATOR

Ensure:

```text
duplicate ID detection
semantic duplicate detection
answer/explanation consistency
ordering validation
matching validation
choice validation
canonical answer generation
```

still passes.

Do not manually alter generated answer keys unless the builder itself is incorrect.

---

# 36. REGRESSION — LEARNING OS

Verify:

```text
NOT_STARTED
LEARNING
PRACTICING
MASTERED
NEEDS_REVIEW
```

remain correct.

Do not fake mastery.

Do not change competency state merely to make tests pass.

---

# 37. REGRESSION — PARENT MODE

Verify:

```text
Parent Gate
competency analysis
screen-time settings
progress
rewards
persistence
```

still work.

Focus trap must not break Parent Mode.

---

# 38. REGRESSION — PRAISE ENGINE

Verify:

```text
correct
incorrect
almost
streak
combo
personal best
improvement
mastered
review success
game completed
lesson completed
mission completed
daily goal
competition success
recovery
encouragement
```

still generate contextually appropriate feedback.

Do not change the source-of-truth learning state.

---

# 39. GOOGLE AI STUDIO COMPATIBILITY

P34 must preserve Google AI Studio compatibility.

Run:

```text
fresh environment
install
build
run
browser
PWA checks where supported
```

Do not introduce dependencies that require unavailable system services.

If service worker/PWA behavior differs in preview versus published runtime:

```text
test both
document actual behavior
```

---

# 40. AUTO-FIX LOOP

For every failure:

```text
FAIL
 ↓
READ ACTUAL ERROR
 ↓
LOCATE ROOT CAUSE
 ↓
MINIMAL PATCH
 ↓
TYPECHECK
 ↓
UNIT TEST
 ↓
BUILD
 ↓
REAL BROWSER TEST
 ↓
REGRESSION
```

Repeat automatically.

Do not stop after the first fix.

---

# 41. NO CHEATING

Forbidden:

```text
skip offline tests
claim service worker works because file exists
claim focus trap works because aria-modal exists
claim audio works because button renders
claim mobile works because CSS has media queries
claim PWA works because manifest exists
disable failing tests
remove failing questions
reduce coverage
mock browser APIs without also performing real browser validation
```

Mocks may be used for isolated unit tests where appropriate, but they cannot replace real browser evidence for the P34 certification gates.

---

# 42. REAL BROWSER GOLDEN PATH

Execute this exact flow:

```text
OPEN APP
  ↓
HOME
  ↓
VIETNAMESE LESSON
  ↓
QUESTION
  ↓
USER-INITIATED AUDIO
  ↓
ANSWER
  ↓
PRAISE
  ↓
PROGRESS SAVED
  ↓
MATH
  ↓
GAME
  ↓
GAME RESULT
  ↓
ENGLISH
  ↓
AUDIO
  ↓
COMPETITION
  ↓
QUESTION
  ↓
ANSWER
  ↓
RESULT
  ↓
PARENT MODE
  ↓
SCREEN TIME MODAL
  ↓
FOCUS TRAP
  ↓
CLOSE
  ↓
FOCUS RESTORED
  ↓
OFFLINE
  ↓
RELOAD
  ↓
LOCAL CONTENT
  ↓
PROGRESS SURVIVES
```

Every failure must be fixed before PASS.

---

# 43. MOBILE GOLDEN PATH

On a mobile viewport:

```text
HOME
 ↓
LESSON
 ↓
QUESTION
 ↓
ANSWER
 ↓
AUDIO
 ↓
GAME
 ↓
COMPETITION
 ↓
RESULT
 ↓
PARENT MODE
 ↓
MODAL
 ↓
RELOAD
```

No:

```text
horizontal overflow
clipped controls
unreachable buttons
focus loss
fatal console errors
network errors caused by broken asset paths
```

---

# 44. OFFLINE GOLDEN PATH

```text
ONLINE
 ↓
OPEN APP
 ↓
LOAD CONTENT
 ↓
LOAD GAME
 ↓
SAVE PROGRESS
 ↓
OFFLINE
 ↓
RELOAD
 ↓
OPEN CACHED CONTENT
 ↓
PLAY SUPPORTED GAME
 ↓
ANSWER
 ↓
SAVE LOCAL STATE
 ↓
RELOAD
 ↓
STATE SURVIVES
```

Any network-required action must clearly report offline status.

---

# 45. EVIDENCE DOCUMENT

Create/update:

```text
docs/P34_PWA_MOBILE_AUDIO_CERTIFICATION.md
```

Include:

```text
PWA status
manifest
icons
service worker
cache strategy
offline behavior
focus trap
focus restoration
audio assets
audio runtime
mobile viewport results
game results
competition regression
persistence
Google AI Studio
browser console
network failures
known limitations
```

Do not record fake results.

---

# 46. FINAL CERTIFICATION MATRIX

| Gate | Required |
|---|---|
| PWA manifest | PASS |
| PNG icons | PASS |
| Service worker | PASS |
| Cache strategy | PASS |
| Offline app shell | PASS |
| Offline supported content | PASS |
| Offline persistence | PASS |
| Offline failure handling | PASS |
| SW update safety | PASS |
| ScreenTimeModal focus trap | PASS |
| Focus restoration | PASS |
| Global modal audit | PASS |
| Keyboard navigation | PASS |
| Audio asset audit | PASS |
| Audio runtime | PASS |
| Audio failure handling | PASS |
| Mobile 360px | PASS |
| Mobile 375px | PASS |
| Mobile 390px | PASS |
| Mobile 412px | PASS |
| Touch interactions | PASS |
| Safe areas | PASS |
| Mobile games | PASS |
| Resize/orientation | PASS |
| Interruption/resume | PASS |
| Persistence | PASS |
| Competition regression | PASS |
| Content validator regression | PASS |
| Learning OS regression | PASS |
| Parent Mode regression | PASS |
| Praise Engine regression | PASS |
| Google AI Studio | PASS |
| Real browser golden path | PASS |
| Mobile golden path | PASS |
| Offline golden path | PASS |

---

# 47. HARD PASS CONDITION

Only declare:

```text
P34 PWA + OFFLINE-FIRST + FOCUS TRAP + AUDIO + MOBILE HARDENING — PASS
```

when:

```text
[PASS] PWA works
[PASS] Manifest valid
[PASS] PNG icons valid
[PASS] Service worker actually runs
[PASS] Offline behavior actually tested
[PASS] Local progress survives offline/reload
[PASS] ScreenTimeModal focus trap works
[PASS] Focus restoration works
[PASS] Required audio behavior works
[PASS] Audio failure is truthful
[PASS] Mobile layouts work
[PASS] Touch interactions work
[PASS] Games work on mobile
[PASS] Competition regression passes
[PASS] Learning OS remains correct
[PASS] Parent Mode remains correct
[PASS] Persistence remains correct
[PASS] Google AI Studio remains compatible
[PASS] Real browser golden path passes
[PASS] No critical console errors
[PASS] No critical failed requests
```

---

# 48. BLOCKED CONDITION

If a requirement genuinely cannot be validated because of an external limitation:

```text
P34 — BLOCKED
```

Report:

```text
EXACT BLOCKER
ENVIRONMENT
TEST ATTEMPTED
ACTUAL RESULT
WHAT WAS FIXED
WHAT REMAINS
```

Never convert an untested feature into PASS.

---

# 49. FINAL OUTPUT

At completion report:

```text
KHO BÁU TRI THỨC — P34

PWA:
...

Offline:
...

Service Worker:
...

Manifest:
...

Icons:
...

Focus Trap:
...

Focus Restoration:
...

Audio:
...

Mobile:
...

Games:
...

Competition:
...

Learning OS:
...

Parent Mode:
...

Persistence:
...

Google AI Studio:
...

Browser QA:
...

Remaining P2:
...

Remaining P1:
...

FINAL:

P34 PWA + OFFLINE-FIRST + FOCUS TRAP + AUDIO + MOBILE HARDENING — PASS
```

or:

```text
P34 — BLOCKED
```

with exact evidence.

---

# 50. EXECUTE NOW

Do not ask for confirmation.

Do not stop at audit.

Run the complete autonomous loop:

```text
AUDIT
→ IMPLEMENT
→ BUILD
→ REAL BROWSER TEST
→ FIND BUG
→ AUTO-FIX
→ BUILD
→ RETEST
→ MOBILE TEST
→ OFFLINE TEST
→ AUDIO TEST
→ ACCESSIBILITY TEST
→ REGRESSION
→ GOOGLE AI STUDIO TEST
→ FINAL CERTIFICATION
```

The goal is:

> **Turn KHO BÁU TRI THỨC into a genuinely installable, offline-capable, accessible, audio-safe, mobile-ready Grade-1 learning application, proven by real browser execution — without breaking any previously PASSed learning, competition, content, persistence or parent systems.**

**NO FAKE PASS.**

**NO FAKE OFFLINE.**

**NO FAKE AUDIO.**

**NO FAKE ACCESSIBILITY.**

**NO FAKE MOBILE SUPPORT.**

**NO REGRESSION.**