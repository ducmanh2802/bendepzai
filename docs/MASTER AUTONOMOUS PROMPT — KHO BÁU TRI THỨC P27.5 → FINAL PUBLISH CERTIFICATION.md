# MASTER AUTONOMOUS EXECUTION
# KHO BÁU TRI THỨC — LỚP 1
# P27.5 → P33
# EXAM FIDELITY → READING FLUENCY → CONTENT QUALITY → RELIABILITY → PERFORMANCE → GOOGLE AI STUDIO → FINAL PUBLISH

## 0. ROLE

Bạn là Principal Engineer + Senior Frontend Engineer + EdTech Architect + QA Lead + Product Reliability Engineer.

Bạn đang làm việc trực tiếp trên repository hiện tại của:

**KHO BÁU TRI THỨC — LỚP 1**

Mục tiêu cuối cùng:

> Biến repository hiện tại thành một ứng dụng Grade-1 EdTech hoàn chỉnh, ổn định, an toàn cho trẻ, có Learning OS + Competition Training + Reading Fluency, chạy được trong Google AI Studio và đủ sạch để PUBLISH.

Đây là một nhiệm vụ **AUTONOMOUS EXECUTION**.

KHÔNG chỉ audit.

KHÔNG chỉ tạo report.

KHÔNG chỉ đề xuất TODO.

Bạn phải:

**DISCOVER → AUDIT → PLAN → IMPLEMENT → TEST → FIX → RE-TEST → REGRESSION → CERTIFY → CONTINUE**

và tự động tiếp tục cho đến khi toàn bộ release gates đạt PASS.

---

# 1. NON-NEGOTIABLE RULES

## 1.1 Không phá những gì đã PASS

Phải bảo vệ:

- P25
- P26
- P27
- P28
- Learning Engine
- Competition Engine
- Learning OS
- Knowledge State
- Adaptive Learning
- Spaced Repetition
- Games
- Rewards
- Garden
- Parent Mode
- Persistence
- Safety/Privacy
- existing curriculum
- existing mini-games
- existing Google AI Studio compatibility

Không được rewrite toàn bộ app chỉ vì muốn code “đẹp hơn”.

Ưu tiên:

**incremental hardening > destructive rewrite**

---

## 1.2 Không fake

TUYỆT ĐỐI KHÔNG:

- fake API
- fake PASS
- fake test
- fake score
- fake mastery
- fake readiness
- fake competition result
- fake learning progress
- fake external service
- hardcoded “success” state
- synthetic production data masquerading as real learner data
- placeholder presented as production feature

Nếu cần demo data:

- phải rõ ràng là demo/fixture/test data
- không được lẫn vào production learner state

---

## 1.3 Không phá backend/domain logic để sửa UI

Domain truth phải nằm ở domain engine.

UI không được tự tính:

- mastery
- readiness
- score
- correctness
- rewards
- competition result

UI chỉ render domain state.

Nguyên tắc:

**DOMAIN STATE → UI STATE → VISUAL/MOTION**

Không:

**ANIMATION → FAKE DOMAIN STATE**

---

## 1.4 Google AI Studio là release blocker

Ứng dụng cuối cùng PHẢI:

- install được
- build được
- run được
- preview được
- không phụ thuộc filesystem/path local của developer
- không phụ thuộc secret local
- không yêu cầu IDE đặc biệt
- không yêu cầu backend service không tồn tại
- không yêu cầu API key để sử dụng core learning
- không crash khi AI provider unavailable
- không phụ thuộc external AI để chấm điểm
- không phụ thuộc external AI để tính mastery
- không phụ thuộc external AI để tính score
- không phụ thuộc external AI để tính readiness

Nếu local PASS nhưng Google AI Studio FAIL:

**OVERALL RELEASE = FAIL**

---

# 2. FIRST ACTION — FULL REPOSITORY DISCOVERY

Ngay lập tức inspect toàn bộ repository.

Không đoán.

Xác định:

- package.json
- lockfile
- vite config
- tsconfig
- source tree
- entry points
- routing
- state management
- persistence
- question bank
- curriculum
- Learning Engine
- Competition Engine
- Learning OS
- game engine
- reward system
- parent mode
- audio
- assets
- tests
- docs
- build scripts
- environment variables
- AI integrations
- server/API nếu có
- Google AI Studio run path

Xác định chính xác:

- framework
- version
- package manager
- Node compatibility
- browser APIs
- external dependencies
- build output
- dev server
- production preview
- deployment assumptions

Không tạo architecture mới nếu architecture hiện tại đã đáp ứng.

---

# 3. BASELINE GATE

Trước khi sửa bất kỳ thứ gì:

chạy toàn bộ available:

- install
- typecheck
- lint nếu có
- unit tests
- integration tests
- build
- preview/start nếu có
- existing smoke tests

Ghi baseline.

Nếu baseline fail:

1. tìm root cause
2. sửa
3. chạy lại
4. chỉ khi baseline ổn mới tiếp tục

Tạo:

`docs/MASTER_BASELINE.md`

---

# 4. EXECUTION ORDER

Thực hiện tuần tự:

# P27.5
EXAM FIDELITY + READING FLUENCY

↓

# P29
CONTENT / QUESTION QUALITY

↓

# P30
RELIABILITY / PERSISTENCE / SECURITY

↓

# P31
PERFORMANCE / RESPONSIVE / ACCESSIBILITY / OFFLINE

↓

# P32
GOOGLE AI STUDIO COMPATIBILITY + PUBLISH HARDENING

↓

# P33
FINAL RELEASE CERTIFICATION

Nếu một phase đã hoàn chỉnh từ trước:

- audit
- xác minh bằng test/evidence
- đánh dấu PASS
- không rewrite vô ích
- chuyển phase tiếp theo

---

# P27.5 — EXAM FIDELITY + READING FLUENCY ENGINE

## 5. Mục tiêu

Làm Competition Engine sát với trải nghiệm thi tiếng Việt cấp tiểu học kiểu Trạng Nguyên ở mức:

**EXAM-LIKE FIDELITY**

Không tuyên bố:

“official replica”

Không copy nguyên văn đề thi chính thức.

Không scrape/copy copyrighted questions.

Có thể mô phỏng:

- cấu trúc bài
- áp lực thời gian
- nhiều dạng câu hỏi
- scoring model
- reading/comprehension
- ordering
- matching
- fill
- category/drag-drop
- multiple choice
- timed sessions

---

# 6. READING FLUENCY ENGINE

Đây là ưu tiên rất cao.

Xây dựng hoặc hoàn thiện:

**Reading Fluency → Reading Comprehension → Competition Processing Speed**

## 6.1 Skill taxonomy

Tạo taxonomy rõ ràng:

- RF-WORD-RECOGNITION
- RF-SYLLABLE-FLUENCY
- RF-PHRASE-FLUENCY
- RF-SENTENCE-FLUENCY
- RF-READ-ALOUD-ACCURACY
- RF-READ-ALOUD-SPEED
- RF-PUNCTUATION-PAUSE
- RF-READING-COMPREHENSION
- RF-KEYWORD-FINDING
- RF-QUESTION-UNDERSTANDING
- RF-ANSWER-SELECTION-SPEED

Không để “reading speed” là metric duy nhất.

---

# 7. READING TRAINING LADDER

Thiết kế progression:

### Stage 1
ACCURACY

- nhận diện từ
- ghép âm
- đọc đúng tiếng
- đọc đúng câu

### Stage 2
FLUENCY

- cụm từ
- câu ngắn
- câu có dấu câu
- đọc liền mạch

### Stage 3
COMPREHENSION

- ai?
- cái gì?
- ở đâu?
- khi nào?
- vì sao?
- như thế nào?
- từ khóa

### Stage 4
PROCESSING SPEED

- đọc câu hỏi
- tìm keyword
- loại distractor
- chọn đáp án

### Stage 5
COMPETITION SPEED

- timed mini test
- timed section
- mock exam

Không được ép speed training khi accuracy/comprehension chưa đạt threshold.

---

# 8. READING METRICS

Theo dõi tối thiểu:

- accuracy
- words/items processed
- response time
- comprehension accuracy
- question interpretation accuracy
- repeated error
- hesitation
- difficulty
- consistency
- recent trend

Không gắn nhãn:

- chậm
- kém
- yếu
- thua
- thất bại

Cho trẻ.

UI copy phải supportive.

Ví dụ:

“Bé đang đọc rất chắc. Mình thử tăng tốc một chút nhé!”

---

# 9. READING SPEED FAIRNESS

Cực kỳ quan trọng:

**SLOW + ACCURATE ≠ WEAK**

**FAST + INACCURATE ≠ STRONG**

Không được làm Learning OS giảm mastery chỉ vì một session chậm.

Không được tăng difficulty chỉ vì tốc độ cao nhưng comprehension thấp.

---

# 10. EXAM-LIKE QUESTION TYPES

Competition mode phải hỗ trợ architecture cho:

- multiple choice
- fill in blank
- matching
- ordering
- drag/drop
- classify/category
- short response nếu architecture phù hợp

Question contract phải có:

- id
- subject
- topic
- skillId
- difficulty
- questionType
- prompt
- choices
- correctAnswer
- explanation
- estimatedTime
- metadata/version

Không được để question thiếu skillId.

---

# 11. EXAM BLUEPRINT

Tạo blueprint có thể cấu hình:

- duration
- questionCount
- score
- difficulty distribution
- skill distribution
- question-type distribution
- section order

Phải hỗ trợ các exam-like preset khác nhau.

Không hardcode một exam duy nhất.

Không tuyên bố preset là đề chính thức nếu chưa có nguồn chính thức tương ứng.

---

# 12. TIMER

Timer phải dựa trên timestamp.

Không dựa đơn thuần vào:

`setInterval`

Phải xử lý:

- tab background
- refresh
- browser throttling
- accidental double click
- pause nếu mode cho phép
- auto submit
- timeout
- resume state nếu phù hợp

Timer phải deterministic/testable.

---

# 13. SCORING

Tách:

- rawScore
- accuracy
- completion
- timing
- skillPerformance
- questionTypePerformance

Không để speed override correctness.

Không tạo magic formula khó giải thích.

---

# 14. EXAM REVIEW

Sau submit:

- câu đúng
- câu sai
- dạng bài
- skill
- lỗi
- thời gian
- explanation
- remediation action

Không chỉ hiển thị:

“Bạn được X điểm.”

---

# 15. P29 — CONTENT / QUESTION QUALITY

Audit toàn bộ question bank.

Kiểm tra:

- duplicate
- semantic duplicate
- ambiguous question
- multiple correct answers
- no correct answer
- invalid distractor
- grammatical error
- Vietnamese diacritics
- math correctness
- English correctness
- curriculum mismatch
- difficulty mismatch
- wrong skill tag
- wrong explanation
- estimated time unrealistic

Tạo automated validation.

Nếu có question invalid:

**FAIL → FIX → TEST → RESCAN**

Không bỏ qua.

---

# 16. CONTENT COVERAGE

Tạo coverage matrix:

Subject
→ Topic
→ Skill
→ Difficulty
→ Question Type

Phải phát hiện:

- skill không có câu
- skill quá ít câu
- difficulty gap
- question type gap
- duplicate concentration

Đảm bảo competition bank không chỉ là lesson bank được copy.

---

# 17. SEEDED DETERMINISM

Question selection phải hỗ trợ deterministic seed.

Cùng:

- question bank version
- blueprint
- seed

→ phải tạo cùng exam.

Test:

same seed = same exam

different seed = valid variation

Không duplicate exact question trong cùng exam.

---

# 18. P30 — RELIABILITY HARDENING

Audit:

- localStorage corruption
- missing keys
- malformed JSON
- old schema
- migration
- partial state
- interrupted session
- refresh
- browser close
- duplicate event
- duplicate reward
- duplicate XP
- duplicate completion
- duplicate competition submission

Persistence phải:

- versioned
- migratable
- recoverable
- validated

Nếu state corrupt:

không crash toàn app.

Có recovery path.

---

# 19. EVENT IDEMPOTENCY

Đặc biệt test:

- double click
- rapid click
- refresh after completion
- retry
- back/forward
- reopen game
- reopen exam
- repeated submit

Không được:

- cộng XP 2 lần
- cộng reward 2 lần
- ghi completion 2 lần
- tạo duplicate evidence
- tạo duplicate history

---

# 20. PARENT MODE

Audit:

- Parent Gate
- child cannot accidentally enter parent mode
- parent report
- competition report
- reading progress
- recommendations

Parent report phải giải thích:

- bé đang tốt ở đâu
- cần luyện gì
- bằng chứng
- gợi ý luyện tập

Không dùng:

“bé kém”

“bé chậm”

“bé thua”

---

# 21. SAFETY / PRIVACY

Audit toàn bộ app.

Không thu thập PII không cần thiết.

Không gửi child data tới AI không cần thiết.

AI nếu tồn tại chỉ được dùng cho:

- explanation wording
- parent-friendly summaries
- optional enrichment

AI KHÔNG được quyết định:

- correctness
- score
- mastery
- readiness
- ranking
- recommendation priority

Core app phải chạy khi AI unavailable.

---

# 22. P31 — PERFORMANCE

Audit performance thực tế.

Mục tiêu:

- fast initial render
- no obvious layout shift
- no runaway animation
- no memory leak
- no unnecessary re-render
- no giant bundle nếu có thể tránh
- no unnecessary dependency

Audit:

- lazy loading
- code splitting nếu phù hợp
- asset size
- font loading
- image size
- game rendering
- canvas cleanup
- event listener cleanup
- timer cleanup

Không thêm dependency nặng nếu native/browser API đủ.

---

# 23. RESPONSIVE

Test tối thiểu:

- 360x800
- 390x844
- 768x1024
- 1024x768
- 1280x800
- 1440x900

Kiểm tra:

- touch
- scrolling
- modal
- keyboard
- game board
- drag/drop
- exam UI
- timer
- parent mode

Minimum touch target:

**44px**

Preferred:

**48–56px**

---

# 24. ACCESSIBILITY

Audit:

- keyboard
- focus
- contrast
- labels
- aria
- semantic HTML
- screen reader basics
- reduced motion
- audio fallback

Nếu:

`prefers-reduced-motion: reduce`

thì animation phải giảm mạnh hoặc tắt.

---

# 25. OFFLINE / DEGRADED MODE

Core functionality phải hoạt động khi:

- AI unavailable
- network unavailable
- external API unavailable

Không để:

AI/network failure

→ toàn bộ learning app crash.

Nếu app hiện tại là local-first thì giữ nguyên.

---

# 26. P32 — GOOGLE AI STUDIO COMPATIBILITY

Đây là release blocker.

Audit toàn bộ:

### package.json

Kiểm tra:

- scripts
- dependencies
- devDependencies
- engines
- unnecessary packages
- platform-specific packages

### filesystem

Không được phụ thuộc:

- `C:\...`
- `D:\...`
- developer-specific absolute path
- local secret path
- machine-specific environment

### environment

Audit:

- `.env`
- `.env.local`
- environment variables
- secret access
- API keys

Không hardcode secrets.

Không yêu cầu secret để chạy core app.

---

# 27. GOOGLE AI STUDIO RUN PATH

Tạo/verify:

`docs/GOOGLE_AI_STUDIO_RUNBOOK.md`

Phải có:

1. open project
2. install dependencies
3. run
4. preview
5. build
6. expected result
7. troubleshooting
8. environment variables nếu thực sự cần
9. AI-disabled behavior

Không viết runbook giả.

Phải test bằng environment càng gần Google AI Studio càng tốt.

---

# 28. FRESH ENVIRONMENT TEST

Tạo clean-room validation.

Không dựa vào:

- existing node_modules
- developer cache
- hidden local state
- previous browser localStorage
- undocumented environment variable

Test:

fresh install
→ run
→ build
→ preview
→ core user journey

Nếu fail:

FIX → REPEAT.

---

# 29. GOOGLE AI STUDIO FAILURE AUDIT

Tìm và sửa:

- unsupported Node assumptions
- browser-incompatible code
- server-only imports in client
- filesystem imports
- process assumptions
- missing dependency
- wrong package version
- env mismatch
- SSR assumptions
- static asset path errors
- dynamic import failures
- CORS assumptions
- API startup dependency
- port assumptions
- hardcoded localhost dependencies

---

# 30. P33 — FINAL RELEASE CERTIFICATION

Không được tự tuyên bố PASS chỉ vì build xanh.

Phải thực hiện full certification.

## BUILD

- install PASS
- typecheck PASS
- lint PASS nếu có
- build PASS

## CORE LEARNING

- lesson
- practice
- adaptive
- spaced repetition
- mastery
- persistence

## COMPETITION

- practice
- speed
- mock
- timer
- scoring
- review
- error analysis
- readiness

## READING

- accuracy
- fluency
- comprehension
- speed
- competition reading

## GAMES

Tất cả games:

- start
- play
- score
- reward
- result
- retry
- reload

## PERSISTENCE

- reload
- corrupt storage
- migration
- recovery

## PARENT

- gate
- report
- reading progress
- competition progress

## UX

- responsive
- accessibility
- reduced motion
- touch

## PERFORMANCE

- initial load
- interaction
- animation
- memory
- bundle

## GOOGLE AI STUDIO

- fresh install
- run
- preview
- build
- core flow

---

# 31. GOLDEN PATH

Phải chạy end-to-end:

NEW CHILD

→ HOME

→ VIETNAMESE

→ READING FLUENCY

→ READ SHORT TEXT

→ COMPREHENSION

→ PRACTICE

→ COMPETITION

→ TIMED MINI TEST

→ RESULT

→ REVIEW

→ ADAPTIVE PRACTICE

→ MOCK EXAM

→ READINESS

→ PARENT MODE

→ PARENT REPORT

→ RELOAD

→ VERIFY PERSISTENCE

→ GOOGLE AI STUDIO RUN

---

# 32. CHILD PERSONAS

Simulate tối thiểu:

### CHILD A
Strong Vietnamese
Weak Math
Beginner English
Slow reading

### CHILD B
Weak Vietnamese
Strong Math
Fast but careless

### CHILD C
Balanced
Average speed

### CHILD D
New user
No history

### CHILD E
Accurate but slow reader

### CHILD F
Fast reader but poor comprehension

Learning OS phải đưa ra recommendation hợp lý cho từng persona.

Đặc biệt:

CHILD E

không được bị kết luận là knowledge-weak chỉ vì tốc độ thấp.

CHILD F

không được được đánh giá mastery cao chỉ vì làm nhanh.

---

# 33. AUTOMATED TEST MATRIX

Tạo test cho:

### Learning

- mastery transition
- review
- adaptive
- evidence

### Reading

- accuracy
- fluency
- comprehension
- speed
- error classification

### Competition

- blueprint
- timer
- scoring
- submit
- auto-submit
- duplicate prevention
- review

### Learning OS

- knowledge update
- recommendation
- next best action
- daily plan
- determinism

### Persistence

- migration
- corrupt storage
- reload
- duplicate event

### Games

- rewards
- retries
- duplicate clicks

### UI

- responsive
- accessibility

### Publish

- clean install
- build
- preview

---

# 34. NO MAGIC NUMBERS WITHOUT DOCUMENTATION

Nếu dùng threshold cho:

- mastery
- reading fluency
- readiness
- difficulty
- speed
- recommendation

phải:

1. có rationale
2. nằm trong policy/config
3. có test
4. dễ thay đổi
5. không rải hardcode khắp UI

---

# 35. OBSERVABILITY / DEBUG

Tạo dev-only diagnostic capability nếu cần.

Có thể inspect:

- learner profile
- knowledge state
- evidence
- recommendation
- competition state
- reading metrics
- persistence version

Nhưng:

**KHÔNG để debug state ảnh hưởng production logic.**

---

# 36. DOCUMENTATION

Sau khi implement phải cập nhật:

`docs/MASTER_ROADMAP.md`

và tạo:

- `docs/P27_5_EXAM_FIDELITY.md`
- `docs/P27_5_READING_FLUENCY.md`
- `docs/P29_CONTENT_QUALITY.md`
- `docs/P30_RELIABILITY.md`
- `docs/P31_PERFORMANCE_ACCESSIBILITY.md`
- `docs/P32_GOOGLE_AI_STUDIO.md`
- `docs/P33_FINAL_CERTIFICATION.md`

Nếu tài liệu cũ mâu thuẫn implementation:

**documentation phải được sửa để phản ánh code thực tế.**

Không viết documentation giả.

---

# 37. CONTINUOUS AUTONOMOUS LOOP

Đây là quy tắc quan trọng nhất.

Sau mỗi phase:

1. run tests
2. inspect failures
3. identify root cause
4. implement fix
5. run tests again
6. run regression
7. inspect neighboring systems
8. continue

KHÔNG dừng chỉ vì:

- build PASS
- typecheck PASS
- một test PASS
- một feature PASS

Nếu còn:

- P0
- P1
- release blocker
- regression
- broken golden path
- Google AI Studio issue

→ tiếp tục sửa.

---

# 38. SEVERITY

### P0
App unusable
data corruption
child safety issue
incorrect score/correctness
critical competition failure
Google AI Studio cannot run

### P1
Major feature broken
learning state incorrect
reward duplication
timer/scoring bug
major responsive issue
major accessibility issue

### P2
Minor UX/content/documentation issue

Final release requires:

**P0 = 0**

**P1 = 0**

P2 may remain only if:

- non-blocking
- documented
- does not affect child safety
- does not affect correctness
- does not affect publishability

---

# 39. FINAL CERTIFICATION RULE

Chỉ được ghi:

# RELEASE CANDIDATE = READY

khi tất cả:

- Build PASS
- Typecheck PASS
- Test PASS
- Learning PASS
- Competition PASS
- Reading Fluency PASS
- Learning OS PASS
- Games PASS
- Persistence PASS
- Parent Mode PASS
- Safety PASS
- Responsive PASS
- Accessibility PASS
- Performance PASS
- Fresh Environment PASS
- Google AI Studio PASS
- Golden Path PASS
- P0 = 0
- P1 = 0

Nếu bất kỳ điều kiện nào FAIL:

**RELEASE CANDIDATE = NOT READY**

và phải tiếp tục sửa.

---

# 40. FINAL REPORT

Cuối cùng tạo:

`docs/FINAL_RELEASE_REPORT.md`

Bắt buộc có:

## Executive Summary

## Architecture Status

## P27.5 Status

## Reading Fluency Status

## Content Quality Status

## Reliability Status

## Performance Status

## Accessibility Status

## Security / Privacy Status

## Google AI Studio Status

## Test Summary

- total tests
- passed
- failed
- skipped
- known limitations

## Golden Path Result

## P0/P1/P2

## Remaining Risks

## Release Decision

Chỉ có:

`READY`

hoặc

`NOT READY`

Không được dùng:

“almost ready”

“should work”

“probably works”

“looks good”

---

# 41. FINAL RESPONSE FORMAT

Khi hoàn thành toàn bộ chain, output cuối cùng phải cực kỳ rõ:

```text
KHO BÁU TRI THỨC — FINAL RELEASE STATUS

P27.5 Exam Fidelity: PASS/FAIL
Reading Fluency: PASS/FAIL
P29 Content Quality: PASS/FAIL
P30 Reliability: PASS/FAIL
P31 Performance: PASS/FAIL
P32 Google AI Studio: PASS/FAIL
P33 Certification: PASS/FAIL

Build: PASS/FAIL
Typecheck: PASS/FAIL
Tests: X/Y
Golden Path: PASS/FAIL
Persistence: PASS/FAIL
Safety: PASS/FAIL
Accessibility: PASS/FAIL
Google AI Studio Fresh Run: PASS/FAIL

P0: X
P1: X
P2: X

FINAL RELEASE:
READY / NOT READY
```

Nếu NOT READY:

liệt kê chính xác:

- blocker
- root cause
- file
- fix attempted
- remaining work

Nhưng trước khi kết thúc phải tiếp tục tự động sửa nếu còn khả năng sửa trong repository.

---

# 42. ABSOLUTE STOP CONDITIONS

Chỉ được kết thúc khi:

### OPTION A

Toàn bộ certification PASS.

HOẶC

### OPTION B

Có blocker thực sự nằm ngoài quyền kiểm soát repository, ví dụ:

- external service unavailable
- Google AI Studio platform outage
- missing credential that user must manually provide
- external dependency permanently unavailable

Trong trường hợp đó:

- không fake PASS
- không fake test
- document exact blocker
- hoàn thành tất cả phần còn lại
- đánh dấu chính xác external blocker

---

# 43. FINAL PRODUCT PRINCIPLE

Sản phẩm cuối cùng phải thực hiện được chuỗi:

**HỌC**

→ **HIỂU**

→ **LUYỆN**

→ **ĐỌC CHẮC**

→ **ĐỌC LƯU LOÁT**

→ **HIỂU NHANH**

→ **LUYỆN DẠNG THI**

→ **TĂNG TỐC ĐỘ**

→ **THI THỬ**

→ **PHÂN TÍCH LỖI**

→ **ÔN ĐÚNG ĐIỂM YẾU**

→ **THI TỰ TIN**

và hệ thống phải biết:

**“Bé nên làm gì tiếp theo?”**

dựa trên evidence thực tế.

Không dựa trên cảm tính.

Không dựa trên fake AI.

Không dựa trên điểm số đơn lẻ.

---

# EXECUTE NOW

Bắt đầu ngay từ repository hiện tại.

Không hỏi tôi xác nhận từng phase.

Không dừng sau audit.

Không chỉ viết TODO.

Không chỉ tạo documentation.

Hãy:

**AUDIT → IMPLEMENT → TEST → FIX → REGRESSION → CERTIFY → NEXT PHASE**

cho đến khi đạt:

# FINAL RELEASE = READY FOR GOOGLE AI STUDIO PUBLISH