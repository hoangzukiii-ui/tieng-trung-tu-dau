# Tiếng Trung Từ Đầu

Giáo trình nhập môn tiếng Phổ thông cho người Việt, dùng chữ giản thể. Phần pinyin dùng dấu thanh. Âm tiết thanh nhẹ để trống dấu. Mục `notesVi` giải thích những điểm cần đọc khác với dấu đang thấy, như biến điệu thanh 3 trong 你好 và biến điệu của 一, 不. Những cụm cố định như 一起 và 不客气 hiển thị cách đọc quen dùng.

| Chặng | Bài | Đích thực hành |
| --- | --- | --- |
| Âm và chào hỏi | 01 · Bắt đầu với bốn thanh | Nghe bốn thanh trên âm ma, chào và cảm ơn |
| | 02 · Chào hỏi lịch sự | Dùng lời chào, tạm biệt, xin lỗi và đáp lời cảm ơn |
| | 03 · Tên bạn là gì? | Hỏi tên và giới thiệu tên |
| | 04 · Đếm từ 0 đến 10 | Đọc dãy số và nhận ra cặp số khi nghe |
| | 05 · Gặp bạn mới | Nối các lượt lời của một đoạn giới thiệu |
| Giao tiếp hằng ngày | 06 · Số và tuổi | Ghép số hàng chục và nói tuổi |
| | 07 · Gia đình mình | Gọi tên người thân và dùng lượng từ 口 |
| | 08 · Hỏi giờ và ngày | Hỏi giờ, trả lời giờ, nói ngày mai là thứ mấy |
| | 09 · Hỏi với 吗 và từ để hỏi | Dùng 吗, 谁 và 哪里 đúng vị trí |
| | 10 · Hội thoại sau giờ học | Hỏi thăm, trả lời và rủ đi uống nước |
| Đi chơi và ăn uống | 11 · Gọi món ở quán | Gọi món với 杯 hoặc 碗 |
| | 12 · Hỏi giá | Hỏi giá và hiểu câu trả lời có 块 |
| | 13 · Hỏi đường | Hỏi vị trí và hiểu chỉ dẫn đi thẳng, rẽ trái hoặc phải |
| | 14 · Hẹn gặp bạn | Đề xuất giờ gặp và dùng mẫu nhận lời |
| | 15 · Tổng hợp một buổi đi chơi | Hẹn giờ, hỏi đường và ôn gọi món |

Nhịp đề xuất cho bài đầu là 2 phút nghe và nhắc lại bốn thanh, 1–2 phút học lời chào và cảm ơn, rồi 2–4 phút làm bảy câu luyện. Bài này dùng từ mẫu để làm nổi bật đối lập giữa bốn thanh, rồi dùng cả cụm để giao tiếp.

## Tích hợp

- `course.json` theo phiên bản 1. `notesVi` là trường tùy chọn bổ sung trên bài học. Hiện ghi chú ở phần học để người học thấy hướng dẫn phát âm.
- `audio` tính tương đối từ thư mục `content/`. Đóng gói `course.json` và `audio/` cùng bản cài. Mọi mục trong giáo trình đều có WAV PCM mono 22.050 Hz, 16 bit.
- Với `audio_choice` và `tone_choice`, dùng `itemIds[0]` để phát âm. Chỉ hiện nút phát, câu hỏi và lựa chọn khi đang trả lời. Chữ, pinyin và nghĩa của mục nguồn chỉ hiện trong phần giải sau khi nộp. Tên clip được băm từ văn bản.
- Chấm câu thường bằng ID lựa chọn. Với `order`, so sánh cả dãy ID theo thứ tự. Có thể giữ thứ tự lựa chọn đã soạn, hoặc đảo khi bắt đầu câu và giữ nguyên thứ tự ấy tới khi nộp.

## Nguồn âm thanh

Văn bản và câu hỏi được soạn cho giáo trình này. Toàn bộ clip là giọng tổng hợp tiếng Phổ thông `cmn` từ [eSpeak NG](https://github.com/espeak-ng/espeak-ng), bản WebAssembly [espeak-ng 1.0.2](https://www.npmjs.com/package/espeak-ng/v/1.0.2), tốc độ cấu hình 135. Một số câu dùng phiên âm chỉnh tay để đưa đúng thanh điệu. Gói giáo trình phân phối WAV tạo từ văn bản soạn riêng. Mã và mô hình tổng hợp chỉ dùng ở bước dựng dữ liệu. [Giải thích về đầu ra của chương trình GPL](https://www.gnu.org/licenses/gpl-faq.html#WhatCaseIsOutputGPL)

## Dựng và kiểm tra

Thực hiện trong thư mục chứa `tools/`. Xóa các WAV cũ trước khi dựng lại toàn bộ audio trong một thư mục đích mới.

```powershell
python tools/build_course.py .
npm.cmd install --prefix tools --no-save --ignore-scripts espeak-ng@1.0.2
node tools/synthesize.mjs .
node tools/synthesize.mjs . --audit
python -m pip install jsonschema==4.26.0
python tools/validate_course.py .
```

Tệp `qa.txt` lưu kết quả kiểm tra. Đã kiểm tra tự động schema, liên kết, đáp án và tín hiệu WAV. Đã đọc đầu ra phiên âm của bộ tổng hợp để rà bốn thanh và phát hiện các âm cần chỉnh. Chưa đánh giá độ tự nhiên bằng người bản ngữ và chưa đo thời lượng với người học.
