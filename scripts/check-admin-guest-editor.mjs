import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const adminSource = readFileSync(join(rootDir, "src/components/admin/InviteAdminPanel.tsx"), "utf8");
const layoutSource = readFileSync(join(rootDir, "src/app/layout.tsx"), "utf8");

for (const heading of [
  "Hiển thị trên thiệp",
  "Quản lý nội bộ",
  "Quyền mời",
  "Thông tin và công cụ nâng cao",
  "Phản hồi của khách",
]) {
  assert.match(adminSource, new RegExp(heading), `Missing Admin guest-editor section: ${heading}`);
}

assert.match(adminSource, /Khách không nhìn thấy các mục này/);
assert.match(adminSource, /Mời tiệc sau Thánh lễ/);
assert.match(adminSource, /Cho phép đăng ký lưu trú/);
assert.match(adminSource, /Đang bật tự động vì thuộc nhóm gia đình/);
assert.match(adminSource, /Xem thiệp/);
assert.match(adminSource, /Sao chép link/);
assert.match(adminSource, /Lưu thay đổi/);
assert.match(adminSource, /Tạo link thiệp mới/);
assert.match(adminSource, /Xoá khách mời/);
assert.match(adminSource, /grid grid-cols-2 gap-2/);
assert.doesNotMatch(adminSource, />Đổi mã</);
assert.doesNotMatch(adminSource, /Link thiệp riêng của khách:/);
assert.doesNotMatch(adminSource, /Tên hiển thị \(Admin\)/);
assert.doesNotMatch(adminSource, /Hỏi khách về tiệc sau Hôn phối/);
assert.match(layoutSource, /__html: String\.raw`/);

console.log("Admin guest editor checks passed: fields are grouped by purpose, primary actions are prioritized, and technical controls are progressive.");
