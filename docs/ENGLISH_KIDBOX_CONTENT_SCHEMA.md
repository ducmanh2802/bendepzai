# ENGLISH KIDBOX COMPANION — CONTENT SCHEMA
### Đặc tả dữ liệu để ánh xạ nội dung giáo trình

Nguồn: `src/types/kidBox.ts`. Đây là hợp đồng dữ liệu; UI và engine chỉ đọc theo hợp
đồng này.

---

## 1. Phân cấp

```text
KidBoxCourse
├── levels[]            (LEVEL_1, 6–7 tuổi)
├── units[]
│   ├── lessons[]       KidBoxLesson
│   ├── vocabulary[]    KidBoxVocabulary
│   ├── phonics[]       KidBoxPhonics
│   ├── patterns[]      KidBoxLanguagePattern
│   ├── readingTexts[]  KidBoxReadingText
│   └── missingContent[]  (những gì còn thiếu — hiển thị ra, không tự điền)
└── requiredArtifacts[] (tài liệu cần người dùng cung cấp)
```

Mọi item kế thừa `KidBoxContentBase`:

| Trường | Ý nghĩa |
| :--- | :--- |
| `id` | định danh ổn định, dùng làm khóa evidence |
| `unitId` | phải khớp Unit chứa nó (validator kiểm tra) |
| `lessonId?` | bài cụ thể, tuỳ chọn |
| `skillId` | `KidBoxSkillId`, dùng để ghi evidence |
| `difficulty` | `1 \| 2 \| 3` |
| `britishEnglish` | bắt buộc `'en-GB'` |
| `sourceType` | `TEACHER_NOTES \| PARENT_PROVIDED \| ORIGINAL_PRACTICE \| APP_BRIDGE` |
| `estimatedSeconds` | 8–90 (validator) |

## 2. Định danh bắt buộc cho mỗi loại

| Loại | Trường riêng bắt buộc | Ghi chú |
| :--- | :--- | :--- |
| `KidBoxVocabulary` | `word`, `meaningVi`, `topic` | `pictureEmoji` nếu có; `examplePattern` tuỳ chọn |
| `KidBoxPhonics` | `focusSound`, `exampleWord` | `grapheme`, `contrastWord` cho bài phân biệt âm |
| `KidBoxLanguagePattern` | `pattern`, `question` | `slots[]` để bé xếp câu; `suggestedAnswer` |
| `KidBoxReadingText` | `text`, `wordCount`, `comprehension[]` | `wordCount` phải khớp số từ thật |
| `KidBoxLesson` | `title`, `learningObjective` | `skills[]` phải thuộc taxonomy |

## 3. Activity — sản phẩm của mapping layer

`KidBoxActivity` **không** được nhập tay trong UI; nó được sinh từ Unit bằng
`buildUnitActivities()`:

| Trường | Ý nghĩa |
| :--- | :--- |
| `step` | một trong 9 bước §9 |
| `kind` / `mode` | dạng bài và cách trả lời (`SINGLE_CHOICE`, `MATCHING`, `ORDERING`, `ACTION`, `SPEAK`, `MEMORY`, `BUILD`, `MULTI_SELECT`, `CHECK`) |
| `items[]` | **một vòng**; nhiều vòng được sinh bởi `buildRounds()` |
| `allowReplay` / `allowSlowReplay` | luôn `true` — nghe lại không bị trừ điểm |
| `acceptsSpeechRecognition` | có nhận giọng nói hay không |
| `instructionEn` / `instructionVi` | lời dẫn có cả tiếng lẫn chữ (§32) |
| `explanation` | giải thích sau khi sai (§28) |
| `britishEnglish` | luôn `'en-GB'` |

`KidBoxActivityItem` giữ `speakText` (đọc bằng giọng en-GB), `captionEn`/`captionVi`
(không được để trống — audio không phải kênh duy nhất), `isCorrect`, `chunkOrder`,
`orderHint`, `actionCueVi`, `pairKey`.

## 4. Store

`KidBoxProgressStore` (key `kho_bau_kidbox_store`, schema `kidbox-store-v1`):

| Nhóm | Nội dung |
| :--- | :--- |
| `courseState` | course, level, `currentUnitId`, `currentLessonId`, `centerHomework`, `currentWeekLabel` |
| `unitProgress[]` | trạng thái 9 bước, `evidenceCount`, `checkAccuracy` |
| `reviewStates[]` | `KidBoxReviewState` cho ôn tập (§25) |
| `attempts[]` | lịch sử lượt làm (cap 300) |
| `speakingAttempts[]` | lượt nói kèm **phương pháp** đã dùng (cap 300) |
| `counters.days{}` | số liệu báo cáo tuần (cap 60 ngày) |

Mọi payload đọc lên đều đi qua `sanitiseKidBoxStore()`: sai kiểu, skill không tồn tại,
bước không hợp lệ, id trùng, số liệu vô lý đều bị loại hoặc kẹp lại an toàn.

## 5. Định dạng gói nội dung để ánh xạ (§27)

```jsonc
{
  "artifactId": "unit-word-lists",
  "units": [
    {
      "unitRef": "1",                     // bất kỳ nhãn nào giáo viên dùng
      "title": "…",                       // bỏ trống nếu chưa xác minh
      "topic": "SCHOOL",
      "learningObjectives": ["…"],
      "lessons": [{ "title": "…", "learningObjective": "…", "skills": ["EN-VOCAB-RECOGNITION"] }],
      "vocabulary": [{ "word": "…", "meaningVi": "…", "pictureEmoji": "📕", "topic": "SCHOOL", "difficulty": 1 }],
      "phonics": [{ "focusSound": "sh", "grapheme": "sh", "exampleWord": "ship", "contrastWord": "sheep" }],
      "patterns": [{ "pattern": "It is a book.", "question": "What is this?", "suggestedAnswer": "It is a book.", "slots": ["It is a", "book"] }],
      "readingTexts": [{ "text": "…", "textVi": "…", "comprehension": [{ "prompt": "…", "options": ["…"], "correctAnswer": "…", "explanation": "…" }] }],
      "sourceNote": "ảnh bảng từ vựng Unit 1 do giáo viên gửi",
      "sourceType": "PARENT_PROVIDED"
    }
  ]
}
```

Skill bỏ trống sẽ nhận giá trị mặc định theo `KIDBOX_MAPPING_DEFAULTS`:
vocabulary → `EN-VOCAB-RECOGNITION`, phonics → `EN-PHONICS-SOUND`,
pattern → `EN-LANGUAGE-PATTERN`, reading → `EN-READING-COMPREHENSION`.

## 6. Luật bắt buộc khi ánh xạ

1. Không chép nguyên văn giáo trình — chỉ khái niệm, chủ đề, mục tiêu, bài tập tự viết.
2. Chỉ dùng **chính tả British**; chính tả Mỹ phải được người có chứng chỉ kiểm tra lại.
3. Không để Unit `READY` khi `missingContent` còn phần tử.
4. Không thêm skill ngoài taxonomy.
5. Không khai báo audio file: app dùng `speechSynthesis` (en-GB), nên nội dung chỉ
   cần `speakText` + `captionEn`.
