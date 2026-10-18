# KHO BÁU TRI THỨC — ENGLISH COMPANION TRACK
# KID'S BOX NEW GENERATION 1 — BRITISH ENGLISH
# AUTONOMOUS IMPLEMENTATION
# INTEGRATE WITH EXISTING LEARNING OS / ADAPTIVE LEARNING / GAMES / COMPETITION

## 0. MISSION

Tiếp tục trực tiếp trên repository hiện tại của:

**KHO BÁU TRI THỨC — LỚP 1**

Hiện app đã có English foundation.

Mục tiêu mới:

> Xây dựng một chương trình English Companion Track dành riêng cho trẻ đang học **Kid's Box New Generation 1 – British English** tại trung tâm.

Đây KHÔNG phải một app English độc lập.

Nó phải trở thành một learning track nằm trong:

Learning OS
→ English
→ Kid's Box Companion
→ Unit
→ Skills
→ Practice
→ Review
→ Games
→ Adaptive Learning
→ Parent Progress

---

# 1. NON-NEGOTIABLE

Không phá:

- Learning Engine
- Learning OS
- Competition Engine
- Persistence
- Adaptive Learning
- Spaced Repetition
- Games
- Rewards
- Garden
- Parent Mode
- P25/P26/P27/P28
- existing English curriculum
- existing Google AI Studio compatibility

Không rewrite toàn bộ English module nếu có thể mở rộng architecture hiện tại.

Ưu tiên:

**extend existing architecture**

thay vì:

**duplicate architecture**

---

# 2. COPYRIGHT / CONTENT POLICY

Cực kỳ quan trọng.

Không scrape hoặc sao chép nguyên văn toàn bộ:

- textbook
- workbook
- audio transcript
- copyrighted exercise
- copyrighted test

Không tạo bản sao của sách.

App phải là:

**COMPANION / PRACTICE TOOL**

không phải:

**DIGITAL COPY OF THE TEXTBOOK**

Có thể dùng:

- vocabulary concept
- topic
- skill mapping
- grammar concept
- phonics concept
- lesson objectives
- user-provided material
- original exercises generated from the concepts

Nếu repository có file tài liệu do user cung cấp:

hãy sử dụng file đó làm source-of-truth cho mapping, nhưng vẫn tránh sao chép nguyên văn vượt phạm vi cần thiết.

---

# 3. FIRST ACTION — DISCOVER CURRENT ENGLISH

Audit:

- existing English curriculum
- English topics
- English games
- question bank
- vocabulary model
- audio
- speech
- pronunciation
- Learning OS
- skill taxonomy
- persistence
- parent report
- adaptive engine

Tìm:

- English topic IDs
- English skill IDs
- question schema
- game schema
- evidence events
- mastery calculation

Không tạo taxonomy thứ hai nếu existing taxonomy có thể mở rộng.

---

# 4. SOURCE-OF-TRUTH MODEL

Tạo một content mapping layer:

```text
KIDS_BOX_COMPANION
    ↓
LEVEL_1
    ↓
UNIT
    ↓
LESSON / TOPIC
    ↓
SKILL
    ↓
ACTIVITY
    ↓
EVIDENCE
    ↓
LEARNING OS
```

Không để UI hardcode Unit → question.

---

# 5. KID'S BOX COMPANION CURRICULUM MODEL

Thiết kế data model có thể biểu diễn:

```ts
KidBoxUnit
KidBoxLesson
KidBoxSkill
KidBoxVocabulary
KidBoxPhonics
KidBoxLanguagePattern
KidBoxListeningActivity
KidBoxSpeakingActivity
KidBoxReadingActivity
KidBoxReviewActivity
```

Minimum metadata:

```text
id
unitId
title
subject
skillId
level
difficulty
britishEnglish
sourceType
learningObjective
```

---

# 6. UNIT STRUCTURE

Mỗi Unit có thể có:

## Vocabulary

- recognition
- meaning
- listening
- pronunciation
- spelling where age-appropriate
- picture association

## Phonics

- sound recognition
- sound discrimination
- initial sound
- final sound where appropriate
- listen and choose
- hear and repeat

## Language Patterns

Không dạy grammar theo kiểu nặng lý thuyết.

Ưu tiên:

**hear → understand → repeat → use**

Ví dụ dạng:

- What's this?
- It's a ...
- Who's this?
- This is ...
- I like ...
- I don't like ...
- Can you ...?
- Yes, I can.
- No, I can't.

Không hardcode các câu trên như curriculum nếu không thuộc Unit thực tế.

Chúng chỉ là ví dụ architecture.

---

# 7. BRITISH ENGLISH

Module phải xác định rõ:

`en-GB`

Không dùng:

`en-US`

làm mặc định.

Audio / speech:

```text
lang = en-GB
```

Nếu browser không có British English voice:

fallback có kiểm soát:

1. en-GB voice
2. generic English voice
3. visual/audio-independent activity

Không crash.

Không tuyên bố pronunciation “chuẩn British” nếu browser voice không đảm bảo điều đó.

---

# 8. ENGLISH SKILL TAXONOMY

Mở rộng taxonomy thành:

### Vocabulary

- EN-VOCAB-RECOGNITION
- EN-VOCAB-MEANING
- EN-VOCAB-LISTENING
- EN-VOCAB-RECALL
- EN-VOCAB-SPELLING

### Phonics

- EN-PHONICS-SOUND
- EN-PHONICS-DISCRIMINATION
- EN-PHONICS-INITIAL
- EN-PHONICS-BLENDING

### Listening

- EN-LISTENING-RECOGNITION
- EN-LISTENING-DETAIL
- EN-LISTENING-INSTRUCTION

### Speaking

- EN-SPEAKING-REPEAT
- EN-SPEAKING-QUESTION-ANSWER
- EN-SPEAKING-PATTERN

### Reading

- EN-READING-WORD
- EN-READING-PHRASE
- EN-READING-SENTENCE
- EN-READING-COMPREHENSION

### Language Use

- EN-LANGUAGE-PATTERN
- EN-GRAMMAR-IN-CONTEXT

Không biến lớp 1 thành grammar-heavy curriculum.

---

# 9. UNIT PROGRESSION

Mỗi Unit nên có progression:

### STEP 1 — SEE

Picture / object / character

↓

### STEP 2 — HEAR

British English audio

↓

### STEP 3 — UNDERSTAND

meaning

↓

### STEP 4 — REPEAT

pronunciation

↓

### STEP 5 — PRACTICE

recognition / matching

↓

### STEP 6 — USE

simple sentence/pattern

↓

### STEP 7 — REVIEW

spaced repetition

↓

### STEP 8 — GAME

fun reinforcement

↓

### STEP 9 — CHECK

short assessment

---

# 10. VOCABULARY ENGINE

Mỗi vocabulary item nên hỗ trợ:

- word
- picture
- meaning
- audio
- pronunciation target
- unit
- topic
- skill
- difficulty
- review state

Ví dụ architecture:

```text
apple
→ Unit X
→ FOOD
→ EN-VOCAB-RECOGNITION
→ en-GB
```

Không cần đưa ví dụ này vào production nếu không thuộc source curriculum.

---

# 11. FLASH / MEMORY ACTIVITIES

Tạo các activity phù hợp trẻ lớp 1:

- picture → word
- word → picture
- listen → choose
- hear → match
- memory cards
- odd one out
- find the pair
- missing word

Không biến toàn bộ module thành flashcard drilling.

---

# 12. LISTENING ENGINE

Listening phải là first-class skill.

Các dạng:

### Listen and choose

Audio
→ 2–4 pictures
→ choose

### Listen and match

Audio
→ matching

### Listen and order

Audio
→ arrange items

### Listen and act

Audio instruction
→ child performs action

### Listen and find

Audio
→ find object

Phải có:

- retry
- replay
- slow/repeat option nếu phù hợp
- no punishment for replay

---

# 13. SPEAKING PRACTICE

Dùng Web Speech API khi khả dụng.

Nhưng không biến speech recognition thành hard dependency.

Có các mode:

### Repeat

Play audio
→ child repeats

### Question / Answer

Prompt
→ child answers

### Guided speaking

Picture
→ sentence frame
→ child speaks

Nếu speech recognition không khả dụng:

cho phép:

- listen
- repeat
- self-check
- parent-assisted check

Không fake pronunciation score.

---

# 14. PRONUNCIATION SAFETY

KHÔNG được hiển thị:

“Pronunciation = 93%”

nếu app không có engine đáng tin cậy đo pronunciation.

Nếu chỉ có Speech Recognition:

phải ghi rõ đây là:

`speech recognition match`

không phải:

`pronunciation quality`

---

# 15. READING

Tích hợp với Reading Fluency Engine đã xây dựng.

English reading progression:

word
→ phrase
→ sentence
→ short text
→ comprehension

Track:

- accuracy
- fluency
- comprehension
- response time

Không ép speed quá sớm.

---

# 16. GAMES

Tạo English games gắn trực tiếp với Unit/skill.

Ví dụ:

### Word Safari

find vocabulary

### Listen & Catch

catch correct picture after hearing word

### Balloon Words

pop correct word

### Memory Match

picture ↔ word

### Sound Detective

identify sound

### Sentence Builder

arrange sentence

### Listening Treasure Hunt

listen → find item

Games phải tạo evidence event.

Không chỉ cộng XP.

---

# 17. GAME → LEARNING OS

Ví dụ:

GAME
→ EN-VOCAB-RECOGNITION
→ correct/incorrect
→ response time
→ difficulty
→ evidence

Learning OS sử dụng evidence đó.

Không để:

game score

tự động = mastery.

---

# 18. ADAPTIVE ENGLISH

Learning OS phải trả lời:

> Bé đang yếu gì trong English của Kid's Box?

Ví dụ:

- vocabulary recognition tốt
- listening yếu
- phonics trung bình
- speaking chưa có evidence
- reading ổn

Sau đó:

Next Best Action:

`LISTENING_PRACTICE`

thay vì luôn:

`VOCABULARY_PRACTICE`

---

# 19. DAILY ENGLISH PLAN

Thêm:

## “English hôm nay”

Ví dụ architecture:

```text
3 min
Review old vocabulary

5 min
Current Unit practice

3 min
Listening

3 min
Speaking

2 min
Game
```

Không nhất thiết phải đúng các con số trên.

Learning OS phải điều chỉnh dựa trên:

- age
- current unit
- weakness
- recent performance
- fatigue
- review schedule

---

# 20. CENTER ↔ HOME BRIDGE

Đây là feature rất đáng giá.

Parent có thể chọn:

**Bé đang học:**

`Unit X`

hoặc:

`Week X`

Sau đó app tạo:

### Ôn ở nhà

- vocabulary
- listening
- speaking
- phonics
- reading
- mini game

Không cần phụ huynh nhập điểm phức tạp.

---

# 21. “CURRENT UNIT”

Tạo parent-controlled setting:

```text
Current English Course:
Kid's Box New Generation 1

Current Unit:
[select]

Current Lesson:
[optional]

Center homework:
[optional]
```

Nếu phụ huynh thay đổi Unit:

Learning OS ưu tiên content tương ứng.

---

# 22. UNIT LOCKING / PROGRESSION

Không bắt buộc hoàn thành Unit trước mới được xem Unit tiếp theo.

Cho phép:

- Preview
- Practice
- Review

nhưng Learning OS phải biết:

`CURRENT_UNIT`

và ưu tiên nó.

---

# 23. PARENT DASHBOARD

Hiển thị:

## Kid's Box Progress

- Current Unit
- Vocabulary
- Listening
- Speaking
- Phonics
- Reading
- Review
- Confidence

Không chỉ hiển thị tổng điểm.

Ví dụ:

```text
Vocabulary      ⭐⭐⭐⭐
Listening       ⭐⭐⭐
Phonics         ⭐⭐⭐⭐
Speaking        ⭐⭐
Reading         ⭐⭐⭐
```

Nhưng các sao phải có evidence thật.

---

# 24. WEEKLY REPORT

Parent có thể thấy:

### This week

- words practiced
- listening sessions
- speaking attempts
- reading practice
- review consistency
- strongest skills
- skills to practice

Không so sánh với trẻ khác.

Không leaderboard.

---

# 25. SPACED REPETITION

Vocabulary và language patterns phải tích hợp với existing review engine.

Review priority dựa trên:

- previous correctness
- recency
- consecutive correct
- difficulty
- forgetting risk

Không reset mastery vì một lần sai.

---

# 26. COMPETITION INTEGRATION

Kid's Box track không được trộn trực tiếp vào Trạng Nguyên Vietnamese competition.

English có:

**English Practice**

và nếu cần:

**English Challenge**

Competition engine có thể sử dụng English skill taxonomy nhưng phải tách subject.

---

# 27. CONTENT INGESTION

Nếu repository/user cung cấp:

- syllabus
- table of contents
- photos
- PDFs
- teacher notes
- homework list

hãy tạo ingestion/mapping workflow.

Không hardcode content chưa được xác minh.

Nếu thiếu source:

Tạo schema + placeholders rõ ràng:

`CONTENT_SOURCE_REQUIRED`

Không bịa Unit titles hoặc vocabulary để giả vờ đã map chính xác.

---

# 28. CONTENT VALIDATION

Mỗi item phải kiểm tra:

- unitId tồn tại
- skillId tồn tại
- difficulty hợp lệ
- answer hợp lệ
- không duplicate
- không ambiguity
- British English metadata đúng
- audio fallback
- explanation
- estimatedTime

---

# 29. PERSISTENCE

Persist:

- current course
- current unit
- unit progress
- vocabulary evidence
- listening evidence
- speaking attempts
- reading evidence
- review state
- last practiced
- nextReviewAt

Phải survive:

- reload
- browser restart
- migration

---

# 30. TESTS

Tạo tests:

### Curriculum

- unit mapping
- skill mapping
- content validation

### Vocabulary

- answer validation
- duplicate prevention

### Listening

- audio unavailable
- replay
- fallback

### Speaking

- speech unavailable
- self-practice
- recognition match

### Learning OS

- evidence
- mastery
- recommendation
- review

### Persistence

- save/reload
- migration
- corruption

### Parent

- current unit
- weekly report

### Games

- reward idempotency

---

# 31. UX

English interface phải trẻ em dễ hiểu.

Không biến thành:

“Course Management System”.

Ưu tiên:

- picture
- audio
- short text
- large button
- mascot
- animation
- repeat
- encouragement

Giữ design system P26.

---

# 32. ACCESSIBILITY

Support:

- audio fallback
- captions/text
- reduced motion
- keyboard
- large touch targets

Do not make audio the only way to understand a task.

---

# 33. GOOGLE AI STUDIO

Bắt buộc giữ:

- build
- typecheck
- runtime
- Google AI Studio compatibility

Không thêm package nặng chỉ để tạo audio nếu browser API đã đủ.

Không yêu cầu API key để học English core.

Nếu AI unavailable:

English module vẫn phải hoạt động.

---

# 34. PERFORMANCE

Không preload toàn bộ audio/content của tất cả Units.

Ưu tiên:

- lazy loading
- current unit first
- lightweight assets
- browser-native speech

Không tạo bundle khổng lồ.

---

# 35. DOCUMENTATION

Tạo:

`docs/ENGLISH_KIDBOX_COMPANION.md`

`docs/ENGLISH_KIDBOX_CONTENT_SCHEMA.md`

`docs/ENGLISH_KIDBOX_SKILL_TAXONOMY.md`

`docs/ENGLISH_KIDBOX_PROGRESS.md`

`docs/ENGLISH_KIDBOX_PARENT_MODE.md`

`docs/ENGLISH_KIDBOX_TEST_REPORT.md`

Update:

`docs/LEARNING_ENGINE.md`

`docs/PRODUCT_SPEC.md`

`docs/FINAL_QA.md`

chỉ khi thực tế implementation đã thay đổi.

---

# 36. GOLDEN PATH

Test:

NEW CHILD

→ English

→ Kid's Box Companion

→ Current Unit

→ Vocabulary

→ Listen

→ Repeat

→ Phonics

→ Speaking

→ Reading

→ Game

→ Review

→ Mini Check

→ Learning OS

→ Next Best Action

→ Parent Mode

→ Parent Report

→ Reload

→ progress remains

---

# 37. CHILD PERSONAS

### CHILD A

Good vocabulary
Weak listening

Expected:
Listening recommendation.

### CHILD B

Good listening
Weak speaking

Expected:
Speaking recommendation.

### CHILD C

Weak vocabulary
Good phonics

Expected:
Vocabulary recommendation.

### CHILD D

New learner

Expected:
Gentle baseline exploration.

### CHILD E

Accurate but slow

Expected:
No premature speed pressure.

---

# 38. RELEASE GATES

Before marking complete:

- typecheck PASS
- tests PASS
- build PASS
- runtime PASS
- Google AI Studio PASS
- English Golden Path PASS
- persistence PASS
- content validation PASS
- Learning OS integration PASS
- Parent Mode PASS
- accessibility PASS
- performance PASS
- P0 = 0
- P1 = 0

---

# 39. IMPORTANT CONTENT RULE

If exact Kid's Box New Generation 1 Unit information is NOT present in repository or supplied source material:

DO NOT INVENT IT.

Instead:

1. implement architecture
2. implement mapping layer
3. implement content schema
4. implement current-unit selection
5. implement validation
6. document exactly what source content is still required

When source content becomes available, it can be mapped without redesigning the engine.

---

# 40. AUTONOMOUS EXECUTION

Do not ask for confirmation after every task.

Execute:

AUDIT
→ DESIGN
→ IMPLEMENT
→ TEST
→ FIX
→ REGRESSION
→ DOCUMENT
→ GOOGLE AI STUDIO CHECK

If an existing feature already satisfies a requirement:

verify it and reuse it.

Do not duplicate it.

If a requirement cannot be completed because source content is unavailable:

implement everything that can be implemented and mark only the content-dependent portion as:

`CONTENT_SOURCE_REQUIRED`

Do not fake completion.

---

# 41. FINAL REPORT

Output:

```text
KID'S BOX COMPANION — FINAL STATUS

Architecture: PASS/FAIL
Curriculum Mapping: PASS/FAIL/PENDING SOURCE
Vocabulary: PASS/FAIL
Phonics: PASS/FAIL
Listening: PASS/FAIL
Speaking: PASS/FAIL
Reading: PASS/FAIL
Games: PASS/FAIL
Adaptive Learning: PASS/FAIL
Spaced Review: PASS/FAIL
Learning OS: PASS/FAIL
Parent Mode: PASS/FAIL
Persistence: PASS/FAIL
Accessibility: PASS/FAIL
Performance: PASS/FAIL
Google AI Studio: PASS/FAIL

Content Source:
AVAILABLE / PARTIAL / REQUIRED

P0: X
P1: X
P2: X

FINAL:
READY / READY WITH CONTENT SOURCE REQUIRED / NOT READY
```

START NOW.

Do not stop after creating the architecture.

Implement everything possible.

Test everything implemented.

Fix all regressions.

Keep the application runnable in Google AI Studio.

Do not fabricate textbook content.