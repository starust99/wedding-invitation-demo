# US-010 Tự động phân loại đơn vị khách

## Status

implemented

## Lane

normal

## Product Contract

Mẫu Excel tự xác định `Đơn vị khách` từ `Cụm danh xưng`, importer lưu lại
phân loại tương ứng, và admin hiển thị giá trị này để hỗ trợ ước lượng cũng như
xếp lưu trú. Các cụm `+ Người thương` tạo một link cặp đôi nhưng dùng cách gọi
ngắn tự nhiên trong câu văn.

## Relevant Product Docs

- `docs/product/guest-personalization.md`

## Acceptance Criteria

- `Đơn vị khách` tự hiện là `Cá nhân`, `Cặp đôi` hoặc `Gia đình` theo cụm danh xưng.
- Các cụm bắt đầu bằng `Vợ chồng` được xếp `Gia đình`; số người thực tế vẫn lấy từ RSVP.
- `Anh/Chị/Em/Bạn + Người thương` tạo đúng cụm tên, cụm dùng trong câu, số khách ước lượng và chính sách người đi cùng.
- File cũ không có cột mới vẫn import được theo quy tắc suy luận hiện tại.
- Admin hiển thị và cho phép chỉnh phân loại đã lưu mà không thêm câu hỏi RSVP.

## Design Notes

- Commands: tải mẫu, nhập Excel, lưu khách mời.
- Queries: đọc danh sách khách từ Supabase hoặc local storage.
- API: dùng lại `household_mode`; không đổi schema hay response envelope.
- Tables: `invitees.household_mode` tiếp tục là nguồn lưu trữ.
- Domain rules: cùng một link là một đơn vị khách; con số khách vẫn là ước lượng.
- UI surfaces: Excel và `/admin`; không đổi `/rsvp` ngoài copy đã thống nhất.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Mapping cụm danh xưng, tên hiển thị và copy Người thương |
| Integration | Workbook sinh công thức, parse và round-trip mapper đúng |
| E2E | Không yêu cầu cho thay đổi quản trị này |
| Platform | TypeScript, lint và production build |
| Release | Commit main được push lên GitHub |

## Harness Delta

Thêm kiểm tra tập trung `check:guest-unit` cho luồng Excel và copy.

## Evidence

- `npm run check:guest-unit`: workbook generation/import, legacy compatibility,
  `+ Người thương`, and `Vợ chồng… → Gia đình` all pass.
- Artifact Tool inspection: rendered `A1:G9` successfully and found no formula
  errors (`#REF!`, `#DIV/0!`, `#VALUE!`, `#NAME?`, `#N/A`).
- `npx tsc --noEmit`: pass.
- `npm run lint`: pass with existing warnings only; no errors.
- `npm run build`: production build pass.
