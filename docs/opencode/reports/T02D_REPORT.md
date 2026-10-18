# T02D REPORT — Sửa 2 lỗi nội dung nhỏ còn sót sau T02B

**Branch:** `p42/T02D` · **Ngày:** 2026-10-14 · **Chế độ:** auto-runner (tự quyết định, không hỏi)

## 1. Đã làm gì

### Mục 1 — spelling_duel tier 6: bỏ câu "Cháu chào ...ạ cụ!"
- Câu cũ ghép đáp án `d` thành "Cháu chào dạ cụ!" — không phải câu tiếng Việt
  tự nhiên (đúng phải là "Cháu chào cụ ạ!").
- Thay bằng: `Điền chữ còn thiếu: Con ...ế mèn` — emoji 🦗 —
  options `[d, gi, r]` — đáp án `d` ("Con dế mèn").
- Chỉ một đáp án đúng: "giế mèn"/"riế mèn" vô nghĩa.
- Gợi ý mới `Chú nhỏ kêu rỉ rả ngoài đồng` không chứa token đáp án `d`
  (kiểm tra theo token như test T02B).

### Mục 2 — shape_sorting: bỏ "Nón lá" 👒 khỏi rổ tam giác
- 👒 là mũ rộng vành hình tròn — xếp vào rổ tam giác khiến bé nhầm.
- Ghi chú: task gợi ý ⚠️/🍕 nhưng cả hai đã có sẵn trong pool, nên chọn vật
  thứ ba có chóp tam giác rõ ràng: `Ngọn núi` — emoji ⛰️ — hint
  `Ngọn núi cao hình chóp`.

### Mục 3 — Rà soát toàn bộ `src/data/games/*.ts` (18 game)
Đọc hết 19 file data. Chỉ sửa chỗ sai rõ ràng (so với spec T02B hoặc luật lớp 1):
| File | Thay đổi | Lý do |
|---|---|---|
| `clock_money.ts` (T5) | phương án `110cm` → `10cm` (câu bàn 70cm/ghế 40cm) | T02B/B8 yêu cầu bỏ 110cm (> 100); báo cáo T02B tưởng đã xong nhưng phương án nhiễu còn sót |
| `phonics_pop.ts` (T4 blend) | `RED` (R/L/W) → `CRAB` (con cua 🦀, CR/BR/GR) | Tier blend theo T02B/B7 phải toàn blend 2 chữ ở cả đáp án lẫn nhiễu; RED chữ đơn còn sót, trái với comment ngay trong file |
| các file còn lại | không đổi | Chuỗi hiển thị tự nhiên, emoji khớp nghĩa, hint không lộ đáp án (đối chiếu từng hint spelling_duel với `checkHintHidesAnswer`), toán không nhớ/mượn đã đúng từ T02B |

Không đổi: `me` 🫛 (quả me hình nang, emoji vỏ đậu gợi hình tương đối — không
phải sai rõ ràng); emoji trùng giữa các game khác nhau (🦀, ⛰️ dùng lại ở game
khác — chấp nhận được, bé chơi từng game riêng).

## 2. File thay đổi
- `src/data/games/spelling_duel.ts` (câu mới + 2 comment)
- `src/data/games/shape_sorting.ts` (vật mới + comment)
- `src/data/games/clock_money.ts` (1 phương án)
- `src/data/games/phonics_pop.ts` (1 item + comment)
- `tests/games-all.test.ts` (cập nhật 3 kỳ vọng theo nội dung đúng: `ạ cụ`→`ế mèn`,
  `Nón lá`→`Ngọn núi` + vào danh sách cấm quay lại, blend +`CRAB`)
- `tests/games-content.test.ts` (`Nón lá`→`Ngọn núi` + `not.toContain('Nón lá')`)
- `tests/t02d-content-fixes.test.ts` (mới, 8 test)
- `.ai/CURRENT.md` (1 dòng trạng thái)

Không thêm dependency. Không đụng localStorage/storage. Không thêm tự đọc mới.
Không sửa `queue/`, `state/`, `logs/`, `TRANG_THAI.md`.

## 3. Số liệu trước/sau
| Chỉ số | Trước | Sau |
|---|---|---|
| Câu tier 6 spelling_duel | 8 (1 câu sai tự nhiên) | 8 (câu mới đúng, 1 đáp án) |
| Vật tam giác shape_sorting | 6 (1 emoji sai hình) | 6 (⛰️ rõ chóp) |
| Phương án > 100 trong clock_money | 1 (`110cm`) | 0 |
| Item chữ đơn trong tier blend phonics | 1 (RED) | 0 |
| Test suite | 496 pass | **504 pass** (+8 mới) |

## 4. Lệnh đã chạy + kết quả
- `npm run typecheck` — PASS (tsc --noEmit, 0 lỗi)
- `npm test` — PASS (**31 file, 504/504 test**)
- `npm run build` — PASS (1.79s; cảnh báo chunk chính 727 kB > 500 kB đã có
  từ trước P42, thuộc phạm vi T02C/T03, không xử lý ở task này)
- QA trình duyệt: SKIPPED (best-effort theo luật 10; không có script QA nào
  được task yêu cầu, build pass nên không chạy thêm)

## 5. Quyết định tự đưa ra
1. Chọn `Con ...ế mèn` thay vì `Cô giáo ...ạy em học` (cả hai đều được task gợi
   ý): emoji 🦗 khớp nghĩa trực quan hơn cho bé lớp 1.
2. Chọn `Ngọn núi` ⛰️ thay vì ⚠️/🍕 (đã tồn tại trong pool): tránh trùng vật
   trong cùng rổ; núi chóp là hình tam giác kinh điển cho trẻ.
3. Sửa thêm `110cm` và `RED`: cả hai đều vi phạm yêu cầu T02B ghi trong báo
   cáo T02B (tưởng đã xong nhưng code còn sót) — đúng tinh thần "sót sau T02B".
4. Cập nhật 5 kỳ vọng test cũ theo nội dung đúng (không làm yếu test — luật 9
   cho phép test đi theo nội dung sửa đúng); test blend được tăng mạnh
   (toàn bộ T4 phải 2 chữ, trước đây chỉ kiểm 7/8 từ).

## 6. Việc còn tồn
- Không. Task hoàn thành đầy đủ 4 mục nghiệm thu.
