# KHO BÁU TRI THỨC — QUESTION AUDIO ROUTING FIX
## AUDIT → ROOT CAUSE → AUTO-FIX → REGRESSION TEST → REAL BROWSER PASS

### 0. MỤC TIÊU

Sửa triệt để lỗi:

> Khi người dùng nhấn nút **🔊 Đọc câu hỏi**, hệ thống lại đọc **đáp án đầu tiên** thay vì đọc nội dung câu hỏi.

Đây là lỗi **semantic data binding / audio routing**, không được xử lý bằng cách đổi text hiển thị hoặc hard-code.

Phải xác định chính xác:

```text
Question Audio Button
        ↓
click handler
        ↓
audio service / speech service
        ↓
selected question
        ↓
question text
        ↓
speechSynthesis / audio playback
```

và đảm bảo cuối cùng:

```text
READ QUESTION
→ question.prompt / question.text / canonicalQuestionText
→ NEVER answers[0]
→ NEVER first option
→ NEVER first choice
→ NEVER explanation
→ NEVER previously selected answer
```

---

# 1. HARD RULES

## 1.1 Không phá hệ thống đã PASS

BẮT BUỘC bảo vệ:

- Learning Engine
- Adaptive Learning
- Competition Engine
- Question Bank
- Math Engine
- Vietnamese Engine
- English Engine
- Kid’s Box integration
- Praise Engine
- Parent Mode
- Persistence
- Game Engine
- Audio UX
- PWA
- Offline-first
- Android/Capacitor
- Google AI Studio compatibility

Không được rewrite kiến trúc lớn nếu không cần thiết.

---

## 1.2 Không chữa cháy bằng hard-code

KHÔNG được làm kiểu:

```ts
speak(question.prompt)
```

mà không kiểm tra nguồn dữ liệu thực tế nếu hệ thống đang dùng abstraction khác.

Phải truy tìm **actual runtime object**.

Không được:

```ts
speak(options[0])
speak(answers[0])
speak(choices[0])
speak(question.answers[0])
speak(question.options[0])
```

cho Question Audio.

---

# 2. FORENSIC AUDIT

Tự động scan toàn bộ project.

Tìm tất cả:

```text
speechSynthesis
SpeechSynthesisUtterance
speech
speak
playAudio
readQuestion
questionAudio
audioQuestion
handleQuestionAudio
onQuestionAudio
playQuestion
readPrompt
tts
voice
audio service
```

Đồng thời tìm:

```text
answers[0]
options[0]
choices[0]
answer
correctAnswer
selectedAnswer
```

và trace nơi chúng được truyền vào audio service.

---

# 3. TRACE REAL DATA FLOW

Phải dựng được runtime flow thực tế:

```text
UI BUTTON
↓
EVENT HANDLER
↓
CURRENT QUESTION
↓
QUESTION DATA MODEL
↓
AUDIO TEXT RESOLVER
↓
TTS SERVICE
↓
SpeechSynthesisUtterance.text
```

Xác định chính xác:

### Question text canonical field

Ví dụ có thể là:

```ts
question.text
question.prompt
question.question
question.stem
question.content
question.questionText
```

Không được đoán.

Phải dựa vào actual type/interface/runtime object.

---

# 4. FIX AUDIO SEMANTICS

Thiết kế rõ semantic contract:

```ts
type QuestionAudioTarget = {
  type: "QUESTION";
  text: string;
  questionId: string;
};
```

Nếu project đã có audio target abstraction thì tận dụng abstraction hiện tại.

Quy tắc:

```text
QUESTION AUDIO
→ QUESTION TEXT

ANSWER AUDIO
→ ANSWER TEXT

EXPLANATION AUDIO
→ EXPLANATION TEXT
```

Ba loại tuyệt đối không được lẫn nhau.

---

# 5. CREATE SINGLE SOURCE OF TRUTH

Nếu hiện tại có nhiều nơi tự lấy text để đọc, gom về một resolver duy nhất.

Ví dụ:

```ts
resolveQuestionAudioText(question)
```

Contract:

```text
Input:
  canonical question object

Output:
  exact visible question text

Never:
  answer
  option
  choice
  explanation
```

Resolver phải fail-safe.

Nếu không tìm được question text:

```text
DO NOT SPEAK
DO NOT FALLBACK TO answers[0]
DO NOT FALLBACK TO options[0]
DO NOT FALLBACK TO selectedAnswer
```

Thay vào đó:

```text
AUDIO_UNAVAILABLE
```

hoặc trạng thái tương đương của hệ thống.

---

# 6. IMPORTANT — MULTIPLE QUESTION TYPES

Phải audit tất cả question types, không chỉ một màn hình.

Bao gồm tối thiểu:

### Multiple Choice

```text
Question
A
B
C
D
```

### True / False

### Matching

```text
Left
Right
```

### Ordering

### Fill in the Blank

### Image Question

### Math Question

### Vietnamese Question

### English Question

### Competition Question

### Kid’s Box Question

### Game Question nếu có question audio

Mỗi loại phải xác nhận:

```text
Read Question
→ reads question

NOT:
→ first answer
```

---

# 7. SPECIAL CASE — QUESTIONS WITH EMPTY TEXT

Nếu question được render từ nhiều thành phần:

```ts
parts
segments
tokens
images
mathExpression
```

phải tạo canonical spoken text đúng với câu hỏi hiển thị.

Ví dụ:

```text
"5 + 3 bằng bao nhiêu?"
```

thì audio phải đọc:

```text
"5 cộng 3 bằng bao nhiêu?"
```

nếu Math Speech Engine hiện tại đã có semantic conversion.

Không được lấy đáp án:

```text
8
```

---

# 8. DO NOT CHANGE QUESTION CONTENT

Không sửa:

- question bank
- correct answer
- answer options
- scoring
- grading
- explanation
- difficulty
- Learning Engine

trừ khi audit chứng minh dữ liệu question thực sự sai.

Mục tiêu P0 chỉ là:

```text
QUESTION AUDIO ROUTING
```

---

# 9. BUTTON SEMANTICS

Audit UI.

Nút:

```text
🔊 Đọc câu hỏi
```

phải có:

```text
aria-label="Đọc câu hỏi"
```

và semantic:

```text
action = READ_QUESTION
```

Không được dùng generic:

```text
READ_CURRENT_ITEM
READ_FIRST_ITEM
READ_FIRST_OPTION
```

nếu generic routing gây lỗi.

---

# 10. STOP PREVIOUS AUDIO

Khi nhấn:

```text
Đọc câu hỏi
```

phải:

```ts
speechSynthesis.cancel()
```

trước khi đọc câu hỏi mới, nếu đó là behavior hiện tại của Audio UX.

Không để audio cũ hoặc answer audio đang phát làm người dùng tưởng rằng question audio đọc sai.

---

# 11. AUDIO STATE

Đảm bảo state:

```text
IDLE
→ PLAYING
→ PLAYED
```

áp dụng đúng cho:

```text
QUESTION AUDIO
```

Không được trigger:

```text
ANSWER AUDIO
```

song song.

---

# 12. REQUIRED DEBUG ASSERTION

Trong development/test mode có thể thêm assertion:

```ts
assertQuestionAudioTarget({
  questionId,
  text
})
```

Nếu text trùng với một answer nhưng question text khác:

```text
FAIL
```

Ví dụ:

```text
Question:
"5 + 3 bằng bao nhiêu?"

Answer[0]:
"8"
```

Nếu Question Audio target:

```text
"8"
```

phải fail ngay.

---

# 13. AUTOMATED UNIT TESTS

Tạo hoặc mở rộng test.

### Test 1 — basic

```text
Question:
"Con vật nào kêu meo meo?"

Answers:
["Con mèo", "Con chó", "Con bò"]

Click Read Question

Expected:
"Con vật nào kêu meo meo?"

NOT:
"Con mèo"
```

### Test 2 — first answer intentionally resembles question

```text
Question:
"Chọn số lớn hơn 5."

Answers:
["8", "3", "4"]
```

Expected:

```text
"Chọn số lớn hơn 5."
```

### Test 3 — correct answer is first

Cực kỳ quan trọng.

```text
Question:
"2 + 2 bằng bao nhiêu?"

Answers:
["4", "5", "6"]
```

Question Audio MUST still say:

```text
"2 + 2 bằng bao nhiêu?"
```

### Test 4 — correct answer is not first

```text
Question:
"2 + 2 bằng bao nhiêu?"

Answers:
["5", "4", "6"]
```

Expected:

```text
"2 + 2 bằng bao nhiêu?"
```

### Test 5 — selected answer exists

```text
selectedAnswer = "4"
```

Question Audio MUST NOT read:

```text
"4"
```

### Test 6 — explanation exists

Question Audio MUST NOT read explanation.

### Test 7 — multiple question types

Run every supported question type.

---

# 14. REGRESSION TEST — SPY TTS

Mock/spy ONLY the TTS boundary for testing.

KHÔNG mock the application question data.

Capture:

```ts
SpeechSynthesisUtterance.text
```

Then assert:

```text
spokenText === canonicalQuestionText
```

and:

```text
spokenText !== answer[0]
spokenText !== selectedAnswer
spokenText !== explanation
```

---

# 15. REAL BROWSER TEST

Không chỉ unit test.

Launch actual app.

Use real browser automation.

Golden flow:

```text
Open app
↓
Enter Math
↓
Open question
↓
Observe question
↓
Click 🔊 Đọc câu hỏi
↓
Capture actual TTS invocation
↓
Verify target text
↓
Answer question
↓
Click 🔊 Đọc câu hỏi again
↓
Verify it STILL reads question
```

Repeat with:

```text
Vietnamese
Math
English
Competition
Kid’s Box
```

where applicable.

---

# 16. CRITICAL REGRESSION

Test these sequences:

### Case A

```text
Open question
→ Read Question
```

Expected:

```text
QUESTION
```

### Case B

```text
Open question
→ Select Answer A
→ Read Question
```

Expected:

```text
QUESTION
```

### Case C

```text
Open question
→ Select Answer B
→ Read Question
```

Expected:

```text
QUESTION
```

### Case D

```text
Open question
→ Submit
→ Read Question
```

Expected behavior must remain consistent with existing UX.

### Case E

```text
Read Answer
→ Read Question
```

Expected:

```text
QUESTION
```

### Case F

```text
Read Question
→ Read Answer
→ Read Question
```

Expected final audio:

```text
QUESTION
```

---

# 17. MOBILE / TOUCH TEST

Test:

```text
360x800
375x812
390x844
412x915
```

Verify:

- button clickable
- no overlapping
- no accidental answer click
- correct aria label
- audio state correct
- no duplicate speech

---

# 18. OFFLINE / PWA TEST

Nếu question audio sử dụng Web Speech API:

```text
Offline
→ Open cached question
→ Read Question
```

phải giữ đúng semantic routing.

Không được vì offline mà fallback sang:

```text
answers[0]
```

Nếu audio unavailable:

```text
AUDIO_UNAVAILABLE
```

là hợp lệ.

---

# 19. SEARCH FOR HIDDEN BUGS

Sau khi fix, scan lại toàn project.

FAIL nếu Question Audio path còn:

```text
answers[0]
options[0]
choices[0]
selectedAnswer
correctAnswer
```

được truyền trực tiếp vào question audio.

Đặc biệt kiểm tra:

```text
Array index 0
```

vì bug có thể bị ẩn dưới dạng:

```ts
items[0].text
```

---

# 20. TEST DATA MUST BE REAL

Không được tạo fake production data để che lỗi.

Test fixtures được phép dùng cho unit/integration test.

Nhưng browser validation phải chạy trên:

```text
real application
real question rendering
real question object
real UI button
real audio routing
```

---

# 21. AUTO-FIX LOOP

Agent phải tự chạy vòng:

```text
AUDIT
↓
LOCATE ROOT CAUSE
↓
IMPLEMENT FIX
↓
TYPECHECK
↓
UNIT TEST
↓
INTEGRATION TEST
↓
BUILD
↓
START APP
↓
REAL BROWSER TEST
↓
FAIL?
 ├─ YES → TRACE → FIX → TEST AGAIN
 └─ NO
      ↓
REGRESSION
      ↓
FINAL AUDIT
```

Không được dừng sau khi sửa code nếu chưa test runtime.

---

# 22. DO NOT ASK FOR CONFIRMATION

Tự động:

- đọc code
- xác định root cause
- sửa
- test
- sửa tiếp nếu fail
- build lại
- chạy browser
- xác nhận

Không hỏi:

```text
"Bạn có muốn tôi sửa không?"
```

---

# 23. HARD PASS CRITERIA

Chỉ được ghi:

```text
QUESTION AUDIO ROUTING — PASS
```

khi TẤT CẢ đạt:

```text
[PASS] Root cause identified
[PASS] Question audio reads canonical question text
[PASS] Never reads answers[0]
[PASS] Never reads options[0]
[PASS] Never reads selected answer
[PASS] Never reads explanation
[PASS] All question types validated
[PASS] Unit tests PASS
[PASS] Integration tests PASS
[PASS] Real browser test PASS
[PASS] Vietnamese PASS
[PASS] Math PASS
[PASS] English PASS
[PASS] Competition PASS
[PASS] Kid’s Box PASS where applicable
[PASS] Mobile regression PASS
[PASS] PWA/offline regression PASS
[PASS] Build PASS
[PASS] No console errors caused by fix
[PASS] No existing PASS system regressed
```

---

# 24. EVIDENCE REPORT

Tạo:

```text
docs/QUESTION_AUDIO_ROUTING_FIX.md
```

Ghi rõ:

```text
Original bug:
...

Root cause:
...

Affected files:
...

Original data flow:
...

Fixed data flow:
...

Question canonical field:
...

Audio resolver:
...

Tests:
...

Browser validation:
...

Before:
Question button → Answer[0]

After:
Question button → Canonical Question Text
```

Không ghi PASS nếu chưa có evidence.

---

# 25. FINAL OUTPUT

Cuối cùng chỉ được kết luận một trong hai:

```text
QUESTION AUDIO ROUTING — PASS
```

hoặc:

```text
QUESTION AUDIO ROUTING — BLOCKED
```

Nếu BLOCKED phải ghi:

```text
BLOCKER
EVIDENCE
WHAT WAS FIXED
WHAT REMAINS
EXACT NEXT ACTION
```

Tuyệt đối không dùng:

```text
PASS
```

nếu chỉ mới kiểm tra source code.

---

# FINAL OBJECTIVE

Bug phải được sửa ở **nguồn dữ liệu/audio routing**, không phải bằng mẹo UI.

Đích cuối cùng:

```text
USER
 ↓
🔊 ĐỌC CÂU HỎI
 ↓
CURRENT QUESTION
 ↓
CANONICAL QUESTION TEXT
 ↓
TTS
 ↓
ĐỌC ĐÚNG CÂU HỎI
```

và tuyệt đối không:

```text
🔊 ĐỌC CÂU HỎI
 ↓
answers[0]
```

**EXECUTE AUTONOMOUSLY UNTIL PASS OR BLOCKED.**