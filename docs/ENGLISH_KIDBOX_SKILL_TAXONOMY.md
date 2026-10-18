# ENGLISH KIDBOX COMPANION — SKILL TAXONOMY
### 21 kỹ năng, 6 nhóm, một taxonomy duy nhất

---

## 1. Vì sao không tạo taxonomy thứ hai

`getAllSkills()` (`src/data/curriculum.ts`) là nơi duy nhất giải tên skill cho mọi
evidence. Track Kid's Box **mở rộng** hàm đó bằng `getKidBoxSkillCatalogue()`:

```ts
// Kid's Box skill được đăng ký vào catalogue chung
map.set('EN-VOCAB-RECOGNITION', { skillId: 'EN-VOCAB-RECOGNITION',
  skillName: "Kid's Box Companion: Nhận diện từ vựng", subject: 'english' });
```

Hệ quả: `StorageService.recordLearningEvidence()` tìm tên skill, `Learning OS` tính
mastery và Parent Dashboard đọc báo cáo — tất cả hoạt động y hệt skill Tiếng Việt/Toán.
Không có `kidBoxMastery`, không có bảng điểm riêng.

## 2. Danh mục đầy đủ

### 🧺 VOCABULARY — từ vựng

| Skill ID | Tên (bé đọc) | Mô tả (phụ huynh đọc) | Độ tuổi tối thiểu |
| :--- | :--- | :--- | :---: |
| `EN-VOCAB-RECOGNITION` | Nhận diện từ vựng | Bé nhìn hình và gọi đúng từ tiếng Anh. | 6 |
| `EN-VOCAB-MEANING` | Hiểu nghĩa từ vựng | Bé biết từ tiếng Anh đó mang ý nghĩa gì. | 6 |
| `EN-VOCAB-LISTENING` | Nghe nhận từ vựng | Bé nghe giọng British English và chọn đúng từ. | 6 |
| `EN-VOCAB-RECALL` | Gọi lại từ vựng | Bé nhớ và nói lại từ đã học mà không nhìn hình. | 6 |
| `EN-VOCAB-SPELLING` | Viết chính tả từ vựng | Bé ghép chữ cái để viết từ (chỉ khi phù hợp lứa tuổi). | 7 |

### 🔤 PHONICS — âm thanh

| Skill ID | Tên | Mô tả | Độ tuổi |
| :--- | :--- | :--- | :---: |
| `EN-PHONICS-SOUND` | Nghe âm | Bé nghe và nhận ra âm thanh trong từ. | 6 |
| `EN-PHONICS-DISCRIMINATION` | Phân biệt âm thanh | Bé phân biệt được các từ gần giống nhau về âm (cat / cap). | 6 |
| `EN-PHONICS-INITIAL` | Âm đầu của từ | Bé nghe và nhận ra âm đầu của từ. | 6 |
| `EN-PHONICS-BLENDING` | Ghép âm | Bé ghép các âm đơn lại để đọc trọn từ. | 6 |

### 👂 LISTENING — kỹ năng hạng nhất (§12)

| Skill ID | Tên | Mô tả | Độ tuổi |
| :--- | :--- | :--- | :---: |
| `EN-LISTENING-RECOGNITION` | Nghe và nhận ra | Bé nghe âm thanh và nhận ra hình ảnh / từ tương ứng. | 6 |
| `EN-LISTENING-DETAIL` | Nghe chi tiết | Bé nghe và nắm được thông tin chi tiết trong câu nói. | 7 |
| `EN-LISTENING-INSTRUCTION` | Nghe và làm theo | Bé nghe câu lệnh và thực hiện đúng hành động. | 6 |

### 🗣️ SPEAKING — nói, không chấm điểm phát âm (§13, §14)

| Skill ID | Tên | Mô tả | Độ tuổi |
| :--- | :--- | :--- | :---: |
| `EN-SPEAKING-REPEAT` | Nói lại từ | Bé nghe và nói lại từ tiếng Anh. | 6 |
| `EN-SPEAKING-QUESTION-ANSWER` | Hỏi và trả lời | Bé trả lời một câu hỏi đơn giản bằng tiếng Anh. | 6 |
| `EN-SPEAKING-PATTERN` | Dùng mẫu câu | Bé dùng đúng mẫu câu đã học để nói câu của mình. | 7 |

### 📖 READING — đọc (§15)

| Skill ID | Tên | Mô tả | Độ tuổi |
| :--- | :--- | :--- | :---: |
| `EN-READING-WORD` | Đọc từ | Bé đọc đúng một từ tiếng Anh. | 6 |
| `EN-READING-PHRASE` | Đọc cụm từ | Bé đọc đúng một cụm từ quen thuộc. | 7 |
| `EN-READING-SENTENCE` | Đọc câu | Bé đọc đúng một câu ngắn. | 7 |
| `EN-READING-COMPREHENSION` | Đọc hiểu | Bé hiểu nội dung câu chuyện ngắn và trả lời câu hỏi. | 7 |

### 💬 LANGUAGE_USE — cách dùng (cố ý nhẹ cho lớp 1)

| Skill ID | Tên | Mô tả | Độ tuổi |
| :--- | :--- | :--- | :---: |
| `EN-LANGUAGE-PATTERN` | Mẫu câu nghe quen | Bé dùng một mẫu câu ngắn đã nghe nhiều lần. | 6 |
| `EN-GRAMMAR-IN-CONTEXT` | Cấu trúc câu trong ngữ cảnh | Bé nhận ra cách dùng đúng trong tình huống quen thuộc, không học thuật ngữ. | 7 |

## 3. Ánh xạ bước §9 → skill

| Bước | Hoạt động sinh ra | Skill chính |
| :--- | :--- | :--- |
| SEE | `PICTURE_TO_WORD` | `EN-VOCAB-RECOGNITION` |
| HEAR | `LISTEN_AND_CHOOSE`, `LISTEN_AND_ACT` | `EN-VOCAB-LISTENING`, `EN-LISTENING-INSTRUCTION` |
| UNDERSTAND | `MEANING_MATCH` | `EN-VOCAB-MEANING` |
| REPEAT | `SPEAKING_REPEAT` | `EN-SPEAKING-REPEAT` |
| PRACTICE | `RECOGNITION`, `MISSING_WORD` | `EN-VOCAB-RECOGNITION`, `EN-PHONICS-*` |
| USE | `PATTERN_BUILD`, `SPEAKING_QUESTION_ANSWER` | `EN-LANGUAGE-PATTERN`, `EN-SPEAKING-PATTERN` |
| REVIEW | `SPACED_REVIEW` | `EN-VOCAB-RECALL` |
| GAME | `MINI_GAME` (Word Safari) | `EN-VOCAB-RECOGNITION` |
| CHECK | `MINI_CHECK` | `EN-VOCAB-RECOGNITION` |

## 4. Nguyên tắc sư phạm

- **Hear → understand → repeat → use** (§6). Không dạy grammar theo lý thuyết.
- **Không bao giờ** biến điểm trò chơi thành mastery (§17).
- **Sao phụ huynh** chỉ hiện khi có evidence đủ ngưỡng `STAR_MIN_ATTEMPTS` và
  `STAR_MIN_ACCURACY` trong `KIDBOX_POLICY` (§23).
- **Tốc độ**: `READING_MIN_ACCURACY_FOR_SPEED = 85`. Bé chính xác nhưng chậm không
  bao giờ bị ép tốc độ (§37 Child E).
