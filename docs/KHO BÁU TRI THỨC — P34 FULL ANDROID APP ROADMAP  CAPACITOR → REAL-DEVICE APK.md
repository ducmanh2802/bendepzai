# KHO BÁU TRI THỨC — P34
# FULL ANDROID APP ROADMAP
## CAPACITOR → MOBILE HARDENING → APK → REAL DEVICE → RELEASE

---

# 0. MISSION

Bạn đang làm việc trực tiếp trên repository hiện tại của:

**KHO BÁU TRI THỨC — LỚP 1**

Nhiệm vụ:

> Biến web app hiện tại thành một **Android application hoàn chỉnh, ổn định, mượt, offline-first, touch-first, cài được bằng APK và chạy tốt trên điện thoại Android thật**.

Đây KHÔNG phải nhiệm vụ:

```text
"thêm Capacitor"
```

và cũng KHÔNG phải:

```text
"build được Gradle"
```

Mục tiêu cuối cùng là:

```text
SOURCE
  ↓
WEB APP
  ↓
MOBILE HARDENING
  ↓
CAPACITOR
  ↓
ANDROID PROJECT
  ↓
ANDROID BUILD
  ↓
REAL APK
  ↓
PHYSICAL DEVICE INSTALL
  ↓
REAL DEVICE LAUNCH
  ↓
GOLDEN PATH
  ↓
PERSISTENCE
  ↓
PERFORMANCE
  ↓
REGRESSION
  ↓
RELEASE APK
  ↓
P34 ANDROID REAL-DEVICE PASS
```

---

# 1. ABSOLUTE EXECUTION RULE

**Không dừng sau audit.**

**Không dừng sau Capacitor setup.**

**Không dừng sau Android project.**

**Không dừng sau Gradle build.**

**Không dừng sau khi tạo APK.**

**Không dừng sau emulator test nếu còn khả năng test physical device.**

Phải chạy vòng:

```text
AUDIT
→ IMPLEMENT
→ BUILD
→ INSTALL
→ RUN
→ TEST
→ FIND BUG
→ FIX
→ BUILD AGAIN
→ INSTALL AGAIN
→ RETEST
```

cho đến certification gate cuối cùng.

---

# 2. DO NOT BREAK EXISTING PRODUCT

Giữ nguyên toàn bộ functionality đã PASS.

Đặc biệt:

```text
Learning Engine
Learning OS
Adaptive Learning
Spaced Repetition
Competition Training Engine
Exam Fidelity
Reading Fluency
Games
Rewards
Knowledge Garden
Wardrobe
Parent Mode
Kid's Box Companion Track
Persistence
Google AI Studio compatibility
```

Không rewrite app sang:

```text
React Native
Flutter
Kotlin
Jetpack Compose
```

trừ khi repository hiện tại đã dùng native architecture.

Mặc định:

```text
Existing Web App
+
Capacitor Android
```

---

# 3. NO FAKE / NO MOCK / NO SILENT FALLBACK

Tuyệt đối không:

- fake APK
- fake install result
- fake device result
- fake performance result
- fake audio result
- fake persistence result
- synthetic learning data
- mock runtime data để đánh PASS
- suppress test failure
- disable feature để tránh crash
- báo PASS cho test chưa chạy

Nếu một test không thể chạy:

```text
BLOCKED
```

hoặc:

```text
NOT_EXECUTED
```

Không đổi thành PASS.

---

# 4. CERTIFICATION DEFINITION

P34 chỉ đạt:

```text
P34 ANDROID REAL-DEVICE PASS
```

khi:

```text
REAL APK
+
PHYSICAL ANDROID INSTALL
+
PHYSICAL ANDROID LAUNCH
+
GOLDEN PATH
+
PERSISTENCE
+
NO CRITICAL CRASH
```

đều PASS.

---

# PHASE A — BASELINE & FORENSIC AUDIT

## A1. Repository Audit

Kiểm tra:

```text
package.json
vite.config.*
tsconfig.*
src/
public/
index.html
server/
backend/
drizzle/
database/
.env*
```

Xác định:

- framework
- build system
- routing
- state management
- persistence
- asset pipeline
- audio
- speech
- network
- API
- environment variables
- browser APIs
- server-only APIs
- external services

---

## A2. Baseline Test

Chạy:

```text
npm install
typecheck
tests
lint nếu có
build
E2E nếu có
```

Lưu baseline.

Không được phá baseline mà không biết nguyên nhân.

---

## A3. Dependency Audit

Kiểm tra:

- Node
- npm
- TypeScript
- Vite
- Capacitor
- Java/JDK
- Android SDK
- Gradle
- Android Gradle Plugin

Không nâng cấp hàng loạt dependency nếu không cần.

---

# PHASE B — MOBILE COMPATIBILITY AUDIT

Audit toàn bộ code cho:

```text
window
document
localStorage
sessionStorage
indexedDB
navigator
Audio
SpeechSynthesis
SpeechRecognition
webkitSpeechRecognition
Notification
Clipboard
File
Blob
URL
fetch
WebSocket
serviceWorker
window.open
```

Phân loại:

```text
SAFE
FALLBACK_REQUIRED
NATIVE_BRIDGE_REQUIRED
SERVER_ONLY
UNSUPPORTED
```

Mỗi browser-only capability phải có graceful fallback.

---

# PHASE C — MOBILE-FIRST UX HARDENING

Không chỉ thu nhỏ desktop UI.

App phải trở thành:

> **touch-first learning application**

Audit:

- button size
- touch target
- scrolling
- drag/drop
- swipe
- modal
- keyboard
- bottom navigation
- game controls
- text size
- Vietnamese diacritics
- English text
- long text
- timer
- accidental tap

Không phụ thuộc hover.

Không phụ thuộc right-click.

Không có tiny controls.

---

# PHASE D — RESPONSIVE DEVICE MATRIX

Kiểm tra:

```text
small phone
normal phone
large phone
tablet nếu có
portrait
landscape nếu feature yêu cầu
```

Không được:

```text
horizontal overflow
clipped button
overlapping modal
text outside viewport
game canvas overflow
bottom navigation hidden
notch overlap
```

---

# PHASE E — SAFE AREA & SYSTEM UI

Xử lý:

```text
status bar
navigation bar
display cutout
notch
gesture navigation
safe-area inset
keyboard
```

Kiểm tra đặc biệt:

```text
bottom CTA
game controls
parent controls
modal buttons
lesson navigation
```

---

# PHASE F — CAPACITOR FOUNDATION

Nếu chưa có:

```text
@capacitor/core
@capacitor/cli
@capacitor/android
```

Cài version tương thích.

Tạo:

```text
capacitor.config.ts
android/
```

Không tạo production dependency vào localhost.

---

# PHASE G — ANDROID IDENTITY

Thiết lập:

```text
App Name:
KHO BÁU TRI THỨC

Package ID:
giữ ID hiện tại nếu đã có
nếu chưa có:
vn.khobautrithuc.lop1
```

Thiết lập:

- launcher icon
- adaptive icon
- splash screen
- theme
- status bar
- navigation bar
- version name
- version code

Không commit private signing keys.

---

# PHASE H — ANDROID NAVIGATION

Thiết kế Android back behavior.

Ví dụ:

```text
Game
 ↓ Back
Game Exit Confirmation

Lesson
 ↓ Back
Previous Screen

Parent Mode
 ↓ Back
Safe Parent Exit

Home
 ↓ Back
Exit Confirmation
```

Không để Android back làm app crash.

Không phá router history.

---

# PHASE I — OFFLINE-FIRST ARCHITECTURE

Core learning phải hoạt động offline.

Offline-capable:

```text
Vietnamese
Math
English
Kid's Box local content
Learning Engine
Learning OS
Spaced Repetition
Games
Rewards
Competition Training
Parent Mode
Progress
```

AI/external API:

```text
OPTIONAL
```

Nếu AI mất:

```text
CORE APP MUST STILL WORK
```

---

# PHASE J — LOCAL DATA ARCHITECTURE

Audit persistence.

Nếu localStorage hiện tại đủ:

→ giữ.

Nếu dữ liệu bắt đầu lớn:

→ đánh giá IndexedDB nhưng không migrate vô cớ.

Không được mất:

```text
child profile
learning progress
mastery
XP
rewards
game results
competition results
review state
Kid's Box progress
parent settings
```

---

# PHASE K — PERSISTENCE HARDENING

Test:

```text
create child
→ learn
→ complete activity
→ gain XP
→ play game
→ save progress
→ close app
→ force stop
→ reopen
```

Tất cả state phải còn.

Sau đó nếu môi trường cho phép:

```text
restart Android
→ launch app
→ verify again
```

---

# PHASE L — STATE RECOVERY

Test:

```text
empty state
malformed state
missing optional field
old schema
partial state
unexpected value
```

App phải recover.

Không crash.

Không silently wipe valid progress.

---

# PHASE M — AUDIO ENGINE

Audit:

```text
HTML Audio
Web Audio
SpeechSynthesis
SpeechRecognition
```

Android autoplay restrictions phải được xử lý.

Ưu tiên:

```text
User taps
→ audio plays
```

Không bắt buộc autoplay.

---

# PHASE N — BRITISH ENGLISH

Kid's Box default:

```text
en-GB
```

Test:

```text
Vocabulary
Listening
Speaking
Reading
Phonics
```

Nếu thiết bị không có `en-GB`:

fallback an toàn.

Không fake pronunciation scoring.

Không claim pronunciation quality nếu chưa đo.

---

# PHASE O — GAME ENGINE MOBILE HARDENING

Test toàn bộ loại interaction:

```text
tap
drag
drop
swipe
canvas
timer
memory
ordering
matching
```

Ít nhất phải test:

```text
Vietnamese game
Math game
English game
Canvas game
Drag/drop game
Memory game
```

Kiểm tra:

```text
start
instruction
play
input
feedback
score
reward
result
retry
exit
```

---

# PHASE P — GAME LIFECYCLE

Đảm bảo:

```text
enter game
→ timer starts
→ play
→ leave
→ timer stops
```

Không để:

```text
orphan timer
duplicate listener
duplicate animation loop
background audio
memory leak
```

---

# PHASE Q — COMPETITION ENGINE

Test:

```text
competition start
question
timer
answer
feedback
score
result
retry
progress
```

Timer phải dựa trên timestamp thật.

Không fake score.

Không fake ranking.

---

# PHASE R — LEARNING OS

Verify:

```text
activity
→ evidence
→ Learning Engine
→ Learning OS
→ recommendation
```

Android wrapper không được làm mất event.

---

# PHASE S — KID'S BOX COMPANION

Test:

```text
English
→ Kid's Box Companion
→ Current Unit
→ Vocabulary
→ Listening
→ Speaking
→ Phonics
→ Reading
→ Game
→ Review
→ Mini Check
→ Learning OS
→ Parent Mode
```

Nếu source Unit chưa được cung cấp:

```text
CONTENT_SOURCE_REQUIRED
```

Không tự invent textbook content.

---

# PHASE T — PARENT MODE

Test:

- Parent Gate
- child progress
- competency
- screen-time reminder
- weekly report
- English progress
- competition progress

Parent Mode phải không bị phá bởi Android navigation.

---

# PHASE U — PERFORMANCE

Không chỉ hỏi:

> “App có chạy không?”

Phải kiểm tra cảm giác sử dụng:

```text
cold startup
warm startup
screen transition
scroll
button response
game interaction
animation
audio
lesson load
competition
parent dashboard
```

Nếu có profiling tools:

→ đo thật.

Nếu không:

→ manual runtime validation.

Không claim FPS chưa đo.

---

# PHASE V — MEMORY / RESOURCE

Kiểm tra repeated:

```text
open lesson
close lesson
open game
retry game
play audio
switch subject
open parent mode
return home
```

Theo dõi:

```text
timer cleanup
event listener cleanup
animation cleanup
audio cleanup
canvas cleanup
```

---

# PHASE W — ANDROID SECURITY

Audit:

```text
API keys
environment secrets
credentials
localhost
debug endpoints
cleartext HTTP
WebView configuration
external intents
deep links
```

Không bundle secret vào APK.

Child data phải privacy-conscious.

---

# PHASE X — ACCESSIBILITY

Kiểm tra:

```text
large text
screen reader basics
contrast
touch targets
focus
labels
audio alternatives
```

Không hy sinh accessibility để lấy visual effect.

---

# PHASE Y — BUILD PIPELINE

Pipeline:

```text
npm run build
        ↓
npx cap sync android
        ↓
Gradle compile
        ↓
APK
```

Mọi failure phải:

```text
diagnose
→ fix
→ rebuild
```

Không suppress.

---

# PHASE Z — APK VALIDATION

APK phải:

```text
exist
valid
non-zero
correct package
correct version
```

Xác định artifact thực:

```text
APK_PATH
APK_SIZE
VERSION_NAME
VERSION_CODE
PACKAGE_ID
```

---

# PHASE AA — ADB / DEVICE DISCOVERY

Ưu tiên:

```text
PHYSICAL ANDROID DEVICE
```

sau đó:

```text
EMULATOR
```

cuối cùng:

```text
BUILD-ONLY
```

Chạy:

```text
adb devices
```

Nếu physical device connected:

→ bắt buộc test trên physical device.

---

# PHASE AB — REAL APK INSTALL

Cài APK thật:

```text
adb install -r <apk>
```

Phải có evidence install thành công.

Sau đó launch package thật.

---

# PHASE AC — REAL DEVICE GOLDEN PATH

Trên **điện thoại Android thật**, chạy:

```text
Launch
 ↓
Home
 ↓
Child
 ↓
Vietnamese
 ↓
Math
 ↓
English
 ↓
Kid's Box
 ↓
Mini-game
 ↓
Competition
 ↓
Learning OS
 ↓
Parent Mode
```

Mỗi hệ thống phải thực sự interactive.

Không chỉ kiểm tra screenshot.

---

# PHASE AD — REAL DEVICE PERSISTENCE

Đây là P0 gate.

Trên điện thoại thật:

```text
1. Open app
2. Select child
3. Complete lesson
4. Earn reward
5. Play game
6. Generate learning evidence
7. Record competition result
8. Exit app
9. Force Stop
10. Relaunch
11. Verify state
```

Phải giữ:

```text
progress
XP
rewards
mastery
game state
competition state
review state
Kid's Box state
```

Nếu mất:

```text
P34 FAIL
```

---

# PHASE AE — REAL DEVICE BACKGROUND/RESUME

Test:

```text
open lesson
→ background app
→ return
```

và:

```text
game
→ background
→ return
```

Không crash.

Timer phải xử lý đúng lifecycle.

Audio phải xử lý đúng lifecycle.

---

# PHASE AF — REAL DEVICE INTERRUPTION TEST

Nếu có thể test:

```text
incoming notification
screen lock
unlock
rotation
keyboard open
keyboard close
```

Không làm mất progress.

---

# PHASE AG — CRASH INVESTIGATION

Nếu app crash:

thu thập:

```text
logcat
stack trace
Android exception
JS error
```

Root cause.

Fix.

Rebuild.

Reinstall.

Retest.

Không bỏ qua crash.

---

# PHASE AH — REGRESSION LOOP

Sau mỗi major fix:

```text
typecheck
tests
web build
Capacitor sync
Android build
APK install
critical runtime
```

Không được sửa Android rồi làm hỏng web.

---

# PHASE AI — RELEASE BUILD

Sau khi debug APK PASS:

build release variant.

Kiểm tra signing.

Không commit private keystore.

Nếu release signing chưa thể tự động hóa:

```text
DEBUG REAL-DEVICE PASS
RELEASE SIGNING BLOCKED
```

Không fake release PASS.

---

# PHASE AJ — CLEAN RELEASE AUDIT

Kiểm tra APK/repository:

- debug logging
- test endpoints
- mock data
- fake credentials
- temporary files
- screenshots
- generated junk
- unnecessary dependencies

Không xóa source chỉ vì tên file trông không cần thiết.

---

# PHASE AK — DOCUMENTATION

Tạo/cập nhật:

```text
ANDROID_SETUP.md
ANDROID_BUILD.md
ANDROID_RELEASE.md
ANDROID_TROUBLESHOOTING.md
```

Ghi:

```text
Node
npm
JDK
Android SDK
Gradle
Capacitor
build commands
APK location
ADB install
device testing
release process
known limitations
```

---

# PHASE AL — FINAL TEST MATRIX

Tạo machine-readable hoặc structured report:

```text
WEB_BUILD
CAPACITOR_SYNC
ANDROID_COMPILE
APK_EXISTS
APK_VALID
PHYSICAL_DEVICE
APK_INSTALL
APP_LAUNCH
HOME
VIETNAMESE
MATH
ENGLISH
KIDBOX
GAMES
COMPETITION
LEARNING_ENGINE
LEARNING_OS
PARENT_MODE
AUDIO
TOUCH
BACK_BUTTON
OFFLINE
PERSISTENCE
FORCE_STOP_RELAUNCH
BACKGROUND_RESUME
RECOVERY
SECURITY
PERFORMANCE
```

Mỗi item:

```text
PASS
FAIL
BLOCKED
NOT_EXECUTED
```

---

# PHASE AM — REAL DEVICE CERTIFICATION

## HARD P0 GATES

Không được certification nếu bất kỳ gate nào dưới đây fail:

```text
P0-01 REAL APK
P0-02 PHYSICAL DEVICE INSTALL
P0-03 PHYSICAL DEVICE LAUNCH
P0-04 GOLDEN PATH
P0-05 LEARNING
P0-06 GAMES
P0-07 COMPETITION
P0-08 KID'S BOX
P0-09 PARENT MODE
P0-10 PERSISTENCE
P0-11 FORCE STOP → RELAUNCH
P0-12 NO CRITICAL CRASH
```

---

# PHASE AN — FINAL CERTIFICATION

Chỉ được ghi:

```text
==================================================
P34 ANDROID REAL-DEVICE PASS
==================================================
```

khi:

```text
APK BUILD                 PASS
APK EXISTS                PASS
PHYSICAL DEVICE           PASS
APK INSTALL               PASS
APP LAUNCH                PASS
GOLDEN PATH               PASS
LEARNING                  PASS
GAMES                     PASS
COMPETITION               PASS
KID'S BOX                 PASS
LEARNING OS               PASS
PARENT MODE               PASS
TOUCH                     PASS
AUDIO                     PASS
BACK BUTTON               PASS
OFFLINE CORE              PASS
PERSISTENCE               PASS
FORCE STOP/RELAUNCH       PASS
BACKGROUND/RESUME         PASS
CRITICAL CRASHES          0
```

---

# 5. IF PHYSICAL DEVICE IS NOT AVAILABLE

Không fake.

Nếu không có điện thoại thật:

```text
P34 REAL-DEVICE STATUS = BLOCKED
```

Nhưng vẫn phải hoàn thành:

```text
web
Capacitor
Android project
Gradle
APK
emulator nếu có
tests
documentation
```

Sau đó ghi:

```text
BLOCKER:
Physical Android device unavailable.
```

Không gọi đây là:

```text
P34 ANDROID REAL-DEVICE PASS
```

---

# 6. AUTONOMOUS FIX LOOP

Đây là directive bắt buộc:

```text
while critical_gates_not_passed:

    audit
    reproduce
    diagnose
    patch
    typecheck
    test
    web_build
    capacitor_sync
    android_build
    install
    launch
    runtime_test

    if failure:
        continue fixing

    if regression:
        isolate regression
        fix
        rerun

stop only when:
    P34 ANDROID REAL-DEVICE PASS
```

Không hỏi user:

> “Có muốn tôi sửa tiếp không?”

Tự sửa tiếp.

Không hỏi:

> “Có muốn build APK không?”

Tự build.

Không hỏi:

> “Có muốn test persistence không?”

Tự test.

---

# 7. DESTRUCTIVE ACTION PROHIBITION

TUYỆT ĐỐI KHÔNG:

```text
git reset --hard
git clean -fd
git clean -fdx
git restore .
force push
xoá toàn bộ Android project để làm lại
xoá curriculum
xoá database schema
xoá Learning OS
xoá game
```

Chỉ sửa additive/minimal khi có thể.

---

# 8. FINAL REPORT

Cuối cùng xuất:

```text
========================================================
KHO BÁU TRI THỨC
P34 — ANDROID REAL-DEVICE RELEASE
========================================================

STATUS:
PASS / PARTIAL / BLOCKED

WEB
- Typecheck:
- Tests:
- Build:

CAPACITOR
- Sync:
- Version:

ANDROID
- Compile:
- Package:
- Version:

APK
- Path:
- Size:
- Variant:

PHYSICAL DEVICE
- Connected:
- Device:
- Android version:

INSTALL
- APK install:
- Launch:

REAL DEVICE GOLDEN PATH
- Home:
- Vietnamese:
- Math:
- English:
- Kid's Box:
- Games:
- Competition:
- Learning OS:
- Parent Mode:

MOBILE UX
- Touch:
- Scroll:
- Back:
- Safe area:
- Keyboard:
- Audio:
- Speech:

OFFLINE
- Core learning:
- Games:
- Progress:

PERSISTENCE
- Normal relaunch:
- Force stop → relaunch:
- Device restart:
- Progress recovery:

STABILITY
- Critical crashes:
- Runtime errors:
- Memory/resource issues:

SECURITY
- Secrets:
- Debug endpoints:
- Unsafe network:

REGRESSION
- Web:
- Android:

RELEASE
- Debug APK:
- Release APK:
- Signing:

BLOCKERS:
<exact blockers>

========================================================
FINAL CERTIFICATION
========================================================

P34 ANDROID REAL-DEVICE PASS

OR

P34 NOT CERTIFIED
========================================================
```

---

# 9. FINAL PRODUCT STANDARD

Đừng đánh giá thành công bằng:

```text
"APK build được"
```

Đánh giá bằng:

```text
APK
 ↓
cài trên điện thoại thật
 ↓
mở nhanh và không crash
 ↓
bé chạm và sử dụng bình thường
 ↓
học
 ↓
chơi
 ↓
thi
 ↓
nghe tiếng
 ↓
đọc
 ↓
English
 ↓
Kid's Box
 ↓
Learning OS cập nhật
 ↓
Parent xem tiến độ
 ↓
đóng app
 ↓
force stop
 ↓
mở lại
 ↓
tiến độ vẫn nguyên
```

Đó mới là:

# P34 ANDROID REAL-DEVICE PASS

---

# 10. EXECUTE NOW

**Bắt đầu ngay từ repository hiện tại.**

Không tạo roadmap khác.

Không chỉ report audit.

Không dừng giữa các phase.

Thực hiện toàn bộ roadmap A → AN theo thứ tự hợp lý, tự phát hiện dependency giữa các phase, tự sửa lỗi, tự build lại, tự test lại.

Ưu tiên:

```text
CORRECTNESS
>
PERSISTENCE
>
STABILITY
>
MOBILE UX
>
PERFORMANCE
>
POLISH
```

Không đánh đổi correctness để lấy visual polish.

Kết thúc duy nhất khi đạt:

```text
P34 ANDROID REAL-DEVICE PASS
```

hoặc environment thực sự chặn physical-device validation, khi đó phải ghi chính xác blocker và tuyệt đối không giả certification.