<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- HARNESS:BEGIN -->
## Harness

This repo uses Harness. Before work, read:

- `README.md`
- `docs/HARNESS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTEXT_RULES.md`
- `scripts/bin/harness-cli query matrix`

Use the Rust Harness CLI at `scripts/bin/harness-cli` as the main operational
tool.
<!-- HARNESS:END -->

## Response convention

- **Luôn kết thúc mỗi câu trả lời** bằng đúng cụm: **Sax báo cáo** (dòng riêng ở cuối).

## MCP — GitNexus (code graph)

Repo đã index (`npm run gitnexus:index`). Dùng khi cần hiểu luồng code, blast radius, hoặc đổi tên an toàn:

- `list_repos` — xác nhận repo indexed.
- `query` — tìm execution flows / symbol theo ngữ cảnh task.
- `context` / `impact` — xem phụ thuộc trước khi sửa component, lib guest, RSVP, config.
- `detect_changes` — map git diff → flows bị ảnh hưởng trước commit.
- Sau thay đổi lớn: `npm run gitnexus:index` (hoặc `gitnexus:index:force`).

## MCP — Chrome DevTools (browser)

Dùng khi verify UI wedding, performance, console/network — **không** thay thế đọc code:

- `new_page` / `navigate_page` → URL dev (`http://localhost:3000`) hoặc preview.
- `take_snapshot` — a11y tree + `uid` để click/fill; `take_screenshot` khi cần hình.
- `performance_start_trace` + `performance_stop_trace` (hoặc `autoStop`) — LCP/CLS/insights.
- `list_console_messages` / `list_network_requests` — lỗi runtime sau deploy hoặc form RSVP.
- Trình duyệt mở khi tool cần; tránh tab có dữ liệu nhạy cảm khách mời.
