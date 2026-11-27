# Tiếng Trung Từ Đầu

Giải nén toàn bộ Tieng-Trung-Tu-Dau-Windows-x64.zip vào một thư mục và mở Tieng-Trung-Tu-Dau.exe. Bản Windows x64 đóng gói Electron, giao diện Pearl, font Noto Sans SC, 15 bài theo 3 chặng, 104 mục với 104 tệp WAV và 66 câu hỏi. Trong bài, bấm Nghe âm thanh để nghe lại. Cần đạt 80% để mở bài tiếp theo. Trang chủ cho phép vào lại bài đã mở và ôn các mục đến hạn.

## Cấu trúc và hợp đồng

- content/course.json và course.schema.json mô tả modules, lessons, items; content/audio chứa WAV. Đường dẫn audio tính từ thư mục giáo trình. content/README.md ghi nguồn. fixtures là hai bài mẫu riêng dành cho phát triển.
- src/ui xuất HomeScreen, LessonScreen, ReviewScreen, ProgressScreen. Kiểu props trong src/ui/types.ts. src/app chuyển dữ liệu giáo trình và trạng thái sang props, dùng itemIds[0] cho câu nghe, hiển thị notesVi trên thẻ học và giải thích sau khi nộp.
- src/core chấm theo ID, giữ thứ tự với câu xếp chữ. Lịch ôn theo ngày địa phương sau 1, 3, 7 và 14 ngày; sai về hôm nay. 
- electron/preload.cjs cung cấp study.load() và study.save(progress). Dữ liệu phiên bản 1 gồm bài hoàn thành, đáp án và bước đang học, lượt sai, ngày ôn, pinyin và mã lượt đã ghi. Electron lưu progress.json trong userData của tài khoản Windows, ghi tệp tạm rồi đổi tên và giữ progress.json.bak. Cửa sổ dùng sandbox, context isolation, tắt Node integration và chặn mạng.
 
## Tạo và kiểm tra bản phát hành

Chạy từ gốc mã nguồn trên Windows x64 có Node và Python.

1. npm.cmd ci
2. npm.cmd run build
3. npm.cmd test
4. Cài thư viện Python jsonschema để chạy python content/tools/validate_course.py content
5. python scripts/package.py "C:/Temp/Tiếng Trung" để đóng ZIP và giải nén thử.
6. node tests/portable.cjs "C:/Temp/Tiếng Trung/Tieng-Trung-Tu-Dau.exe"

## Kết quả trên bản giải nén

Đã chạy hết 15 bài và 66 câu qua giao diện Electron, thử đáp án sai ở bài đầu, ôn lại, kiểm tra chữ nguồn bị ẩn trong thẻ câu nghe trước khi nộp và pinyin hiện sau khi nộp. Đã bấm phát WAV, xác nhận bộ phát nạp và phát trong chế độ tắt tiếng. Đã đóng rồi mở lại giữa hai thẻ bài đầu và sau khi đạt 15/15. Năm kiểm thử dữ liệu và logic đạt. Bộ kiểm tra giáo trình xác nhận schema, khóa đáp án, ID và 104 WAV PCM.

Bản thử khởi động từ đường dẫn có dấu với thư mục tiến độ mới, chặn phân giải tên miền ngay từ lúc mở, chặn mạng trong ứng dụng và đặt trang ở chế độ offline khi chạy luồng học. Đã chạy Electron với hệ số hiển thị 1 và 1,25. Chưa ngắt bộ điều hợp mạng của Windows, chạy trên máy Windows sạch không có Node, đánh giá trực quan ở hai mức DPI, nghe qua loa hoặc đo thời lượng buổi đầu với người mới.
