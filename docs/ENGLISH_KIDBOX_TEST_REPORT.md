# ENGLISH KIDBOX COMPANION — TEST REPORT
### Bằng chứng kiểm thử thực tế (§30, §38)

Lệnh đã chạy trong repo: `npm run typecheck`, `npm test`, `npm run build`, và kiểm tra
runtime bằng trình duyệt headless trên bản build thật.

---

## 1. Tổng quan

| Hạng mục | Kết quả |
| :--- | :--- |
| `npm run typecheck` (`tsc --noEmit`) | **PASS** — 0 lỗi |
| `npm test` (vitest) | **PASS** — 15 file, **193 test** |
| `npm run build` (vite) | **PASS** — không lỗi |
| Runtime (build thật, headless Chrome) | **PASS** — 0 console error, 0 request fail |
| Google AI Studio compatibility | **PASS** — không API key, không package mới, lazy chunk |

## 2. Bộ test Kid's Box

### `tests/kidbox-curriculum.test.ts` — 14 test

| Nhóm | Nội dung kiểm tra |
| :--- | :--- |
| Mapping | Course shell `en-GB`, không Unit giáo trình bị bịa, readiness = `CONTENT_SOURCE_REQUIRED` |
| Minh bạch | Bridge pack gắn nhãn `APP_BRIDGE` + câu "KHÔNG phải nội dung giáo trình" |
| Không bịa từ | **Mọi từ trong bridge pack phải đã tồn tại trong `ENGLISH_TOPICS`** (chấp nhận khác số ít/đa) |
| Taxonomy | 21 skill có mặt trong `getAllSkills()`; `LANGUAGE_USE ≤ 2` skill |
| Tách môn | Skill `EN-*` không xuất hiện trong competition taxonomy / blueprint / câu hỏi |
| Validation | `runKidBoxContentValidation()` **0 lỗi** |
| Mapping layer | Hoạt động sinh từ nội dung; Unit rỗng ⇒ **không** sinh hoạt động nào |
| Ingestion | Map đúng, cảnh báo chính tả Mỹ, `PARTIAL` + `missingContent`, JSON hỏng không throw |

> Bài test này đã **bắt được 1 lỗi thật** trong lúc phát triển: từ `please` tồn tại
> trong bridge pack nhưng không có trong chương trình English của app → đã thay bằng
> `sorry` (có thật trong app). Đây là cơ chế chống bịa nội dung hoạt động đúng.

### `tests/kidbox-activities.test.ts` — 18 test

| Nhóm | Nội dung kiểm tra |
| :--- | :--- |
| Listening | replay luôn mở; 2–4 lựa chọn, đúng 1 đáp án; sai lựa chọn ⇒ báo sai kèm explanation; id lạ không bao giờ được chấp nhận |
| Listen & act | `actionCueVi` + `captionEn` luôn có (audio không phải kênh duy nhất) |
| Rounds | Nhiều vòng, id không trùng, đúng 1 đáp án mỗi vòng, caption đích không trùng |
| Speaking | `en-GB`, nhận giọng nói là tuỳ chọn; match đúng/sai; fallback self-check |
| Chống nói dối | `containsBannedPronunciationClaim()` chặn "Pronunciation = 93%", "Phát âm chuẩn"; nhãn đúng `speech recognition match` / `self-check` / `parent-assisted check` |
| Voice | Không có en-GB ⇒ nhãn trung thực + fallback hợp lệ |
| Activity validation | Chặn `DUPLICATE_ITEM_ID`, `NOT_BRITISH_ENGLISH`, item mất caption/speakText |
| Nội dung mới | Unit vừa ánh xạ sinh hoạt động **không cần sửa code** |

> Bài test cũng bắt 2 lỗi thật: matcher speech đòi khớp *mọi* mục tiêu của hoạt động
> SPEAK (sửa: chấm theo `itemId`); và "it's a book" không khớp "it is a book" (sửa: bổ
> sung bảng mở rộng dạng rút gọn, dùng chung một hàm chuẩn hoá cho player/engine/test).

### `tests/kidbox-learning-os.test.ts` — 30 test

| Nhóm | Nội dung kiểm tra |
| :--- | :--- |
| Evidence | Câu đúng ⇒ `KnowledgeState` thật của Learning OS; replay ⇒ **không** đếm hai lần |
| Chơi game | Taps đúng/sai đều thành evidence, nhưng mastery **không** bằng điểm game |
| Trung thực | `SELF_CHECKED`/`SKIPPED` **không** phát evidence; vẫn lưu lượt làm |
| Learning OS | Action của track nằm chung danh sách, xếp hạng đúng; **không** rò sang Đấu Trường |
| **Personas** | Child A → nghe · B → nói · C → từ vựng · D → `GENTLE_BASELINE` · E → **không** ép tốc độ |
| Sao | 0 sao khi chưa có evidence; 0 sao khi < 60%; ≥ 3 sao khi đạt ngưỡng |
| Báo cáo tuần | Số liệu thật; câu "không so với bạn khác"; tuần rỗng báo rõ |
| Plan | Luôn trong ngân sách; bé mệt ⇒ bỏ nghe/nói/game |
| Tiến bộ | `DONE` chỉ khi có evidence; **không** bước nào `LOCKED` |
| Ôn tập | Sai một lần không xoá `correctCount`; hàng đợi chỉ có mục thật sự đến hạn/shaky |
| Persistence | Save→reload giữ nguyên; JSON hỏng không throw; payload độc hại bị sanitize; reset xoá store Kid's Box |
| Tương thích | `LearningOS` cũ vẫn chạy khi không có `trackActions`; `generateDailyPlan` không đổi hợp đồng |

## 3. Kiểm tra runtime (build thật, headless Chrome)

Kịch bản: NEW CHILD → English → Kid's Box Companion → Unit → nghe → trả lời →
Learning OS → Parent Mode → reload.

| Bước | Kết quả quan sát |
| :--- | :--- |
| Mở app | `200`, title đúng, **0 console error** |
| English subject | Thẻ "🐰 BRITISH ENGLISH · EN-GB — Kid's Box Companion" hiển thị |
| Hub | Đủ 9 bước §9; badge `CONTENT_SOURCE_REQUIRED`; danh sách 7 tài liệu còn thiếu |
| Nhãn giọng nói | `🔊 Giọng English (en-US) — không phải en-GB` (máy test không có en-GB) |
| Kế hoạch hôm nay | 3 mục, `~7 phút` (ông dụng: review do + khám phá + nghe) |
| Hoạt động nghe | Mở đúng, có "Nghe lại" + "Nghe chậm" + câu "không bị trừ điểm", 4 hình lựa chọn |
| Evidence | `kho_bau_learning_os_store` schema `P30-v1`, skill `EN-VOCAB-LISTENING`, `recentEvidences` có bản ghi |
| Kid's Box store | `attempts` + `reviewStates` + `counters.days` đều ghi |
| Bậc thang | HEAR hiện "Đã luyện 2 lượt có ghi nhận" |
| Parent Mode | Cổng phép tính PASS → tab "Kid's Box" → Current Unit/Lesson/Homework, sao theo nhóm, báo cáo tuần, danh sách nội dung thiếu |
| Câu cấm | Panel **không** chứa tuyên bố chấm phát âm; có nhãn `speech recognition match` |
| Reload | Evidence, attempts, current unit **giữ nguyên**; bậc thang vẫn báo đã luyện |

## 4. Release gates (§38)

| Gate | Trạng thái |
| :--- | :--- |
| typecheck PASS | ✅ |
| tests PASS | ✅ 193/193 |
| build PASS | ✅ |
| runtime PASS | ✅ 0 lỗi console |
| Google AI Studio PASS | ✅ không API key / không package mới |
| English Golden Path PASS | ✅ xem §3 |
| persistence PASS | ✅ |
| content validation PASS | ✅ 0 lỗi |
| Learning OS integration PASS | ✅ |
| Parent Mode PASS | ✅ |
| accessibility PASS | ✅ caption + replay + nút ≥ 44px + nhãn ARIA |
| performance PASS | ✅ chunk Kid's Box 23.5 kB (6.8 kB gzip), lazy-load |
| P0 = 0 | ✅ |
| P1 = 0 | ✅ |

## 5. Còn `CONTENT_SOURCE_REQUIRED`

Kiểm thử **tự động** đã đầy đủ cho kiến trúc, nhưng không thể tự kiểm chứng nội dung
giáo trình vì repository không có nguồn. Xem `docs/ENGLISH_KIDBOX_CONTENT_SCHEMA.md`
§5 và `docs/ENGLISH_KIDBOX_COMPANION.md` §7.
