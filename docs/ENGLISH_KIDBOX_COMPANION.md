# KID'S BOX COMPANION — ARCHITECTURE
### Kid's Box New Generation 1 · British English (en-GB) companion track

> Trạng thái nội dung giáo trình: **CONTENT_SOURCE_REQUIRED** — xem §7.

---

## 1. Vị trí trong Learning OS

Track này **không phải một app English riêng**. Nó là một learning track bên trong
Learning OS, dùng lại toàn bộ engine sẵn có:

```text
Learning OS
→ English
→ Kid's Box Companion
→ Unit (current unit do phụ huynh chọn)
→ §9 progression: SEE → HEAR → UNDERSTAND → REPEAT → PRACTICE → USE → REVIEW → GAME → CHECK
→ Activities
→ LearningEvidence
→ KnowledgeState (mastery của Learning OS)
→ Next Best Action / Daily Plan / Parent Report
```

| Tầng | File chịu trách nhiệm |
| :--- | :--- |
| Schema + taxonomy | `src/types/kidBox.ts`, `src/data/kidBoxTaxonomy.ts` |
| Course + nội dung | `src/data/kidBoxCurriculum.ts`, `src/data/kidBoxBridgePack.ts` |
| Ánh xạ nguồn (§27) | `src/data/kidBoxIngest.ts` |
| Mapping `UNIT+SKILL → ACTIVITY` (§4) | `src/services/kidBoxActivities.ts` |
| Tiếng Anh British + nói (§7, §13, §14) | `src/services/britishSpeech.ts` |
| Adaptive / plan / báo cáo (§18–§25) | `src/services/kidBoxEngine.ts` |
| Kiểm tra nội dung (§28) | `src/services/kidBoxValidator.ts` |
| Lưu trữ (§29) | `src/services/kidBoxStore.ts` |
| UI | `src/components/english/*`, `src/components/parent/KidBoxParentPanel.tsx` |

## 2. Nguyên tắc bất di bất dịch (§1)

Track **mở rộng** kiến trúc sẵn có, không sao chép:

- **Skill taxonomy**: `getAllSkills()` trong `src/data/curriculum.ts` được mở rộng để
  trả về cả 21 skill `EN-*` của Kid's Box. Evidence ghi vào đúng một taxonomy.
- **Mastery**: `LearningOS.reduceEvidence()` vẫn là nguồn duy nhất của `mastery`,
  `confidence`, `NEEDS_REVIEW`, `nextReviewAt`.
- **Persistence**: schema version `P30-v1`, Kid's Box dùng **key riêng**
  (`kho_bau_kidbox_store`) nên dữ liệu P29 cũ vẫn nạp được nguyên vẹn.
- **Gợi ý học tập**: `LearningOS.getNextBestActions(..., trackActions)` nhận action
  của track và xếp chung một danh sách — không có engine đề xuất thứ hai.
- **Tranh đấu**: skill Kid's Box là `subject: 'english'`; test khẳng định chúng không
  bao giờ xuất hiện trong taxonomy/blueprint/câu hỏi của Đấu Trường (§26).

## 3. Source-of-truth model (§4)

```text
KIDS_BOX_COMPANION → LEVEL_1 → UNIT → LESSON → SKILL → ACTIVITY → EVIDENCE → LEARNING OS
```

`buildUnitActivities(unit)` là nơi **duy nhất** biến nội dung thành hoạt động.
UI chỉ hỏi "unit này có hoạt động gì", không bao giờ hardcode `Unit 1 → câu 3`.
Hệ quả: khi có nội dung thật, chỉ cần ánh xạ là nội dung hiện ra, **không sửa engine**.

Tính xác định (determinism) là bắt buộc: vòng lặp chọn bài dùng `hashSeed(unitId)` +
rotation thay vì `Math.random`, để id evidence ổn định qua reload và test có ý nghĩa.

## 4. Skill taxonomy (§8)

21 skill, 6 nhóm (strand). Mỗi skill có `skillId`, tên tiếng Việt cho bé, mô tả cho
phụ huynh và `sequence` ổn định.

| Strand | Skill |
| :--- | :--- |
| VOCABULARY | `EN-VOCAB-RECOGNITION`, `-MEANING`, `-LISTENING`, `-RECALL`, `-SPELLING` |
| PHONICS | `EN-PHONICS-SOUND`, `-DISCRIMINATION`, `-INITIAL`, `-BLENDING` |
| LISTENING | `EN-LISTENING-RECOGNITION`, `-DETAIL`, `-INSTRUCTION` |
| SPEAKING | `EN-SPEAKING-REPEAT`, `-QUESTION-ANSWER`, `-PATTERN` |
| READING | `EN-READING-WORD`, `-PHRASE`, `-SENTENCE`, `-COMPREHENSION` |
| LANGUAGE_USE | `EN-LANGUAGE-PATTERN`, `EN-GRAMMAR-IN-CONTEXT` |

Lớp 1 cố tình **không** grammar-heavy: `LANGUAGE_USE` chỉ có 2 skill nhẹ.

## 5. British English (§7)

- Locale duy nhất: `en-GB` (`KIDBOX_LOCALE`). `en-US` không phải mặc định của track.
- Chuỗi fallback có kiểm soát: **en-GB voice → voice en-GB regional → voice English
  bất kỳ → chỉ chữ/phụ đề**. `getBritishVoiceCapability()` trả về `tier` + `label`.
- UI hiện nhãn trung thực. Ví dụ quan sát thật trên máy không có giọng en-GB:
  `🔊 Giọng English (en-US) — không phải en-GB`. App **không** tuyên bố "phát âm
  chuẩn British" khi thiết bị không bảo đảm điều đó.
- `sound.speak()` được mở rộng thêm `en-GB` cùng chuỗi chọn voice; hành vi cũ của
  `vi-VN`/`en-US` không đổi.

## 6. Minh bạch nội dung (§39)

`runKidBoxContentValidation()` chạy trong `runContentValidation()` chung của repo và
kiểm tra: `unitId` tồn tại, `skillId` có trong taxonomy, difficulty hợp lệ, đáp án hợp
lệ, trùng lặp, gây nhầm lẫn (similarity), metadata `en-GB`, audio fallback, có
explanation, có `estimatedTime`.

## 7. Trạng thái nội dung giáo trình — CONTENT_SOURCE_REQUIRED

Repository **không có** syllabus / mục lục / danh sách từ / phonics chart / teacher's
notes của Kid's Box New Generation 1. Vì vậy:

- `KIDBOX_MAPPED_UNITS` **cố ý rỗng** — app không bịa tên Unit, không bịa từ vựng.
- `KIDBOX_REQUIRED_ARTIFACTS` liệt kê chính xác 7 nhóm tài liệu còn thiếu và app làm
  gì được khi có chúng. Cùng danh sách này hiện trong Parent Mode và trong docs.
- Ship duy nhất là **bridge pack** `unit-bridge-level1`, gắn nhãn
  `sourceType: 'APP_BRIDGE'`, dựng **chỉ từ từ vựng đã có sẵn trong chương trình
  English của chính app**. UI ghi rõ: *"Nội dung luyện tập nền — KHÔNG phải nội dung
  giáo trình"*. Test `kidbox-curriculum.test.ts` chặn việc bridge pack trôi thành
  nội dung mới.

## 8. Đường nạp nội dung (§27)

`ingestKidBoxSource(packet)` là hàm thuần (pure): nhận JSON của giáo viên/phụ huynh →
trả về `KidBoxUnit[]` + danh sách lỗi/cảnh báo + `missingContent`.

- Skill mặc định được khai báo tường minh trong `KIDBOX_MAPPING_DEFAULTS` (audit được).
- Chính tả Mỹ → **cảnh báo** `US_SPELLING`, không tự động đổi (§7).
- Thiếu tiêu đề → `title = undefined`, UI hiện "Unit N (chưa có nội dung nguồn)".
- `contentStatus`: `READY` khi đủ 5 nhóm nội dung, `PARTIAL` khi thiếu, và
  `CONTENT_SOURCE_REQUIRED` khi không có gì.

## 9. Hiệu năng (§34)

- `KidBoxCompanionScreen` được `React.lazy` → chunk riêng **23.5 kB** (6.8 kB gzip),
  không nằm trong bundle chính.
- Không nạp trước audio: dùng `speechSynthesis` của trình duyệt.
- Không thêm package nào; không cần API key (§33).
