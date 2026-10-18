# T12 — Tiếng Anh: số 1–20, mẫu câu, phonics, nạp Kid's Box units

**Phụ thuộc:** T05. **Nhánh:** `p42/T12` · Song song được với T10, T11, T13.
**File chính:** `src/data/englishCurriculum.ts`, `src/data/kidBox*.ts`.

## Hiện trạng
11 chủ đề / 12 bài / 44 câu; số chỉ tới 5; competition English 107/122 là từ vựng; `KIDBOX_MAPPED_UNITS = []`.

## Nội dung (British English, bám Kid's Box New Generation 1)
Unit gợi ý (mỗi unit = 1 chủ đề, 2–3 bài):
1. Hello! (greetings, names, numbers 1–10, colours)
2. My school (classroom objects, "What's this? It's a…")
3. Favourite toys (toys, "I've got…", "Where's…? in/on/under")
4. My family (family words, "This is my…", adjectives big/small, old/new)
5. Our pets (animals, "It's a… / They're…")
6. My face (face/body, "I've got…", "He's/She's got…")
7. Wild animals (animals, can/can't)
8. My clothes (clothes, colours, "I'm wearing…")
9. Fun time (activities, "I like…/ I don't like…")
10. At the funfair / Our house (rooms, prepositions)
11. Party time (food, "Do you like…?")
12. Numbers 11–20 + counting games.

Mỗi unit cần: từ vựng (picture), nghe chọn (audio-choice), mẫu câu (ordering/fill-blank), phonics chữ đầu & âm (s, a, t, p, i, n, m, d, g, o, c, k, e, u, r, h, b, f, l…), 1 bài hát/chant ngắn dạng text để TTS đọc (tự sáng tác, KHÔNG chép lời bài hát có bản quyền).

## Yêu cầu
- **Mỗi bài ≥ 10 câu**; audioPrompt bằng giọng British (`britishSpeech.ts`); hướng dẫn cho bé hiển thị bằng tiếng Việt đơn giản + nút loa.
- Ghi dữ liệu Kid's Box dạng packet và nạp qua `ingestKidBoxSource` vào `KIDBOX_MAPPED_UNITS` (tự soạn nội dung tương đương, không sao chép nguyên văn sách).
- Bổ sung ~40 câu competition English loại Phonics/Listening/Sentence để cân lại bank (bump `COMPETITION_BANK_VERSION`).
- Lời khen tiếng Anh khớp chữ hiển thị (luật P38).

## Nghiệm thu
- Mục tiêu **≥ 30 bài, ≥ 300 câu**, ≥ 250 từ vựng có emoji/hình.
- Test english-curriculum + kidbox mở rộng; validator Kid's Box PASS.
- typecheck + test + build PASS.
