# SPEC.md — Wedding Invitation (nhatphuong.love)

Tài liệu **nguồn sự thật** cho mục tiêu, kiến trúc đã chốt, template Excel, và việc làm tiếp theo. Đọc kèm `PRODUCT.md`, `DESIGN.md`, `XUNG_HO_RULES.md`, `AGENTS.md`, `docs/HARNESS.md`.

**Canonical production URL:** `https://nhatphuong.love`

**Template Excel (không đổi kết cấc):** `mau-danh-sach-khach-moi` — sheet `Danh sách khách mời`, tiêu đề cột **hàng 8**, dữ liệu từ **hàng 9**; chỉ sửa **4 cột đầu** (A–D), không đổi tên cột, không thêm cột mới.

---

## 1. Goal

Thiệp cưới online cao cấp — đám **Nhật & Phương**, Terracotta Đà Lạt — đạt:

| Kết quả | Mô tả |
|--------|--------|
| **Tôn trọng khách** | Mỗi **`/i/{token}`** hiển thị lời mời đúng vai vế (tiếng Việt, `XUNG_HO_RULES`). |
| **Hành động rõ** | RSVP rõ; lễ + tiệc (W4); dress code và copy cá nhân qua một engine. |
| **Vận hành gia đình** | Import Excel chuẩn, admin, RSVP, export workbook/link; DB một nguồn (B2). |
| **Nhất quán** | **Excel (field thô) → DB → `buildInvitationCopy` → UI**; kiểm `check-guest-copy` + cảnh báo lệch preview (Cp3). |

**Không trong phạm vi hiện tại:** SaaS đa tenant, album sau đám (A1), thông báo RSVP tự động (Ntf1), refactor kiến trúc không phục vụ đám này.

---

## 2. Users

| Nhóm | Nhu cầu |
|------|---------|
| **Khách** | Chỉ vào thiệp bằng link `https://nhatphuong.love/i/{token}`; RSVP (S4); sửa RSVP đến **26/09/2026** (Ed2). |
| **Gia đình / admin** | Import/export Excel, sửa khách (Ov1), regenerate token (G1+G4), publish site (Pub2+Pub3), sửa RSVP mọi lúc (Adm1). |

Persona & anti-pattern: `PRODUCT.md`. Giao diện: `DESIGN.md`.

---

## 3. Luồng khách & routing

| Quyết định | Nội dung |
|------------|----------|
| **Cổng thiệp** | **I2b** — Khách **chỉ** dùng `/i/[token]`; token invalid → chặn (I2), không render thiệp cá nhân. |
| **`/`** | **H1** — Thông báo: mở link trong thiệp đã gửi; không thiệp đầy đủ / không salutation chung. |
| **Identity** | **T4** — Ưu tiên: **token → query → localStorage** (admin ngoại lệ). |
| **Storage** | **L1** — Sau visit token hợp lệ: lưu identity **gắn token**; token trên URL vẫn thắng. |
| **RSVP URL** | **S4** — Thiệp trên `/i/[token]`; RSVP tại `/rsvp` **luôn kèm token** (cùng phiên). |
| **`/rsvp` thiếu token** | **Rsvp3 → Rsvp1** — Thử khôi phục từ L1; không được → chặn như I2. |
| **Splash** | **M2** — Intro **một lần / token / thiết bị**; lần sau vào thẳng hero. |
| **Sau RSVP** | **Ty4 + Ty2** — `?rsvp=done` (hoặc tương đương); copy cảm ơn theo attending / P4. |

---

## 4. Copy & xưng hô (kiến trúc)

### 4.1 Source of truth — **Decision: C**

- **Runtime (web):** luôn `buildInvitationCopy(identity)` từ field thô trong DB.
- **DB:** không lưu chuỗi lời mời “chính thức” để render thay runtime.
- **Kiểm chứng:** `npm run check:guest-copy`; lộ trình test **X3 → X1** (combo cột Excel → đủ `XUNG_HO_RULES`).
- **Dress code & câu theo quan hệ:** **D1** — nằm trong output `buildInvitationCopy`, không hard-code riêng component.

### 4.2 Tên hiển thị (H-B, N2, Ov1, Hcol1)

- **H-B:** Mọi khách: **Cụm danh xưng (A) + Tên khách (B)** → ghép theo **N2** (nhóm cụm: Gia đình, Anh/Chị, Vợ chồng…).
- **N3 / override:** Chỉ trên **admin (Ov1)** sau import; Excel **không** đọc cột **Tên khách mời (H)** khi upload (**Hcol1**).
- Heading thiệp: **`TRÂN TRỌNG & THÂN MỜI`** (đồng bộ code + spreadsheet).

### 4.3 Giọng mời (`hostTone`) — không thêm cột

Cột **Người mời là (D)** map cố định:

| Giá trị Excel | `hostTone` |
|---------------|------------|
| Ba mẹ | `parents_host` |
| Nhật | `couple_host` |
| Phương | `couple_host` |
| Nhật & Phương | `couple_host` |
| Trống / lạ | **Vd1** — không import dòng |

### 4.4 Validation import (Nm1 + Nm3)

- Import chỉ tin **4 cột A–D** (+ map trên); không bắt đọc cột **Kiểm tra dòng nhập**.
- **Nm1:** Theo `needsName` trong `salutationDefinitions` (Bố mẹ/Ông bà có thể trống tên; cụm cần tên mà trống → Vd1).

### 4.5 Excel preview vs runtime (Cp3 + Wm1)

- Upload: **Cp3** — so sánh cột preview (5–6) với `buildInvitationCopy`; **Wm1** — cảnh báo vàng, **vẫn import**, liệt kê dòng lệch.
- Web và link sau Save: **V1** (copy = production); form admin: **V3** (draft preview).

### 4.6 Thay đổi copy sau khi đã gửi link

- **Chính sách 2:** Chỉ deploy sửa rule khi **lỗi nghiêm trọng** (sai vai vế, tên, dấu gây hiểu nhầm).
- **K3 + K1:** Checklist lỗi nghiêm trọng công khai; **một người** merge copy hotfix sau CI xanh.

---

## 5. Excel — hợp đồng file

| Mục | Quy tắc |
|-----|---------|
| **Parser** | **Pr1 + Pr3** — Sheet `Danh sách khách mời`, header row **8**, data từ **9**; **không** đổi tên 4 cột: Cụm danh xưng, Tên khách, Nhóm khách, Người mời là. |
| **Nhóm khách (C)** | **Gr1 + Gr3** — Metadata admin + validate dropdown (tiền tố `[Nhà Trai]` …); **không** đổi copy web. |
| **Import lần đầu** | Không cột token; tạo invite + token mới. |
| **Import lại** | **KeyB** — File export admin có **token**: có token → **cập nhật**; không token → **tạo mới**. |
| **Upsert** | **Imp1** — Cập nhật field thô; **giữ token** trừ regenerate (**G1+G4**). |
| **Export link** | **St1** — Chỉ khi env production `https://nhatphuong.love`; không đưa preview/localhost vào Excel gửi khách. |

Code tham chiếu: `src/lib/invite-spreadsheet.ts`, `src/lib/invite-mapper.ts`, API `/api/admin/invites`, `invite-links-workbook`.

---

## 6. RSVP & nội dung sau xác nhận

| Mục | Quy tắc |
|-----|---------|
| **Gate nội dung nhạy cảm** | **R2** — Đã RSVP **có tham dự** + khớp **invite/token** trong DB. |
| **Lưu trú** | **P4** — Thêm điều kiện **`accommodationNeeded`**. |
| **Khách sửa RSVP** | **Ed2** — Đến hết **26/09/2026** (ghi rõ 00:00 ICT trong triển khai); sau đó chỉ admin. |
| **Admin sửa RSVP** | **Adm1** — Mọi lúc. |
| **Thông báo** | **Ntf1** — Không email/webhook; xem `/admin`. |

---

## 7. Publish, ngày cưới, token

| Mục | Quy tắc |
|-----|---------|
| **Nội dung site khách** | **E1** — Hero/event/gallery từ **published** settings; copy từ `buildInvitationCopy`. |
| **Ngày/giờ** | **W4** — Lễ và tiệc **riêng** trong publish; fallback **W3** từ config nếu thiếu publish. |
| **Cut-off publish** | **W4c + Pub2 + Pub3** — **T-7** tính từ **ngày sớm hơn** (lễ vs tiệc); sau T-7 chỉ sửa publish khi checklist “sai thực tế” (giờ, địa điểm, ảnh lỗi). |
| **Hero countdown** | **Cd3** — Không countdown; hiển thị rõ **cả lễ + tiệc**. |
| **Regenerate token** | **G1 + G4** — Token cũ chết ngay; admin xác nhận trước khi tái tạo. |
| **Dữ liệu** | **B2** — DB/API production; Excel export backup/vận hành. |

---

## 8. Admin & bảo mật vận hành

- **Ad1** — `/admin` + session; không index công khai.
- **Album sau đám:** **A1** — Ngoài phạm vi đến sau ngày cưới (chỉ giữ ý trong `PRODUCT.md`).

---

## 9. Stack

| Lớp | Công nghệ |
|-----|-----------|
| App | Next.js 16, React 19, TypeScript, Tailwind 4 |
| Data | Supabase (schema trong repo) |
| Media | Cloudinary |
| Excel | ExcelJS (`invite-spreadsheet`, workbook API) |
| Agent / graph | GitNexus (`npm run gitnexus:index`) |
| UI verify | Chrome DevTools MCP, `npm run capture:browser` (Playwright) |
| Vận hành agent | Harness — `docs/HARNESS.md`, `scripts/bin/harness-cli` (nếu có) |

---

## 10. Quality gates & CI

| Gate | Bắt buộc |
|------|----------|
| **Q1** | `npm run check:guest-copy` + `npm run build` trước merge `main` |
| **CI3** | GitHub Actions = **required check**; Vercel preview vẫn chạy |
| Khuyến nghị | `npm run lint`; UI theo `DESIGN.md` (390 / 768 / 1440px) |

Sau thay đổi lớn copy/routing: `gitnexus:index`; pre-commit: `detect_changes` (GitNexus).

---

## 11. Thứ tự triển khai (đã chốt)

```text
O3 — 1 PR: GitHub Actions (check:guest-copy + build + lint), required on main
  ↓
O1 — Routing & identity: I2b, H1, T4, S4, L1, M2, Rsvp3→Rsvp1, G1 UI admin
  ↓
O2 — Copy pipeline: C, map Người mời là, Nm1, Cp3/Wm1, Pr1+Pr3, KeyB, X3 tests, D1, V1/V3, hero/event wiring
```

---

## 12. Công việc tiếp theo (checklist)

### O3 — CI

- [ ] Workflow GitHub Actions: `npm ci`, `check:guest-copy`, `lint`, `build`
- [ ] Branch protection `main`: required status Actions

### O1 — Routing & identity

- [ ] `/` → H1 (không thiệp đầy đủ)
- [ ] `/i/[token]` — nguồn identity chính; invalid → I2
- [ ] `resolveGuestIdentity`: T4; L1 keyed by token
- [ ] `/rsvp` — bắt buộc token trên URL; Rsvp3 → Rsvp1
- [ ] Splash M2 (storage per token)
- [ ] Ty2 + Ty4 sau submit RSVP
- [ ] Regenerate token G1 + modal G4

### O2 — Copy & Excel

- [ ] SPEC §4 đã chốt C — đồng bộ code paths còn đọc chuỗi bake
- [ ] Import: Pr1+Pr3, Nm1, map D → hostTone, Gr3, KeyB, Imp1
- [ ] Cp3 + Wm1 trên API import
- [ ] `check-guest-copy`: mở rộng X3 (4 cột + map) → X1
- [ ] `XUNG_HO_RULES.md` ↔ script
- [ ] Dress code / event copy: D1 qua `buildInvitationCopy`
- [ ] Admin Ov1; preview V3 + “xem như khách” V1
- [ ] Publish W4 + W4c; cut-off T-7; Cd3
- [ ] Ed2 deadline 26/09/2026 trên form RSVP
- [ ] `NEXT_PUBLIC_SITE_URL` / export St1 = `https://nhatphuong.love`

### Docs & vận hành

- [ ] Checklist K3 (lỗi nghiêm trọng copy) — `XUNG_HO_RULES.md` hoặc `docs/decisions/`
- [ ] Ghi cut-off T-7 và ngày lễ/tiệc vào published settings khi có ngày chính thức

---

## 13. Bảng quyết định (tóm tắt)

| ID | Quyết định |
|----|------------|
| Copy | **C** |
| Deploy copy | **2** + **K3+K1** |
| Routing | **I2b**, **H1**, **T4**, **S4**, **L1**, **M2** |
| RSVP | **R2**, **P4**, **Ed2** (26/09/2026), **Ty4+Ty2**, **Adm1**, **Rsvp3→Rsvp1** |
| Excel | **Pr1+Pr3**, **H-B**, **Nm1+Nm3**, **KeyB**, **Imp1**, **Hcol1**, **Ov1**, **Cp3**, **Wm1**, map **Người mời là** |
| Preview | **V1+V3** |
| Publish | **E1**, **W4**, **W4c**, **Pub2+Pub3**, **T-7**, **Cd3** |
| Link | **U1** `nhatphuong.love`, **St1**, **G1+G4** |
| Data | **B2**, **Gr1+Gr3**, **Ntf1**, **A1** (album sau) |
| CI | **Q1**, **CI3** |
| Thứ tự | **O3 → O1 → O2** |

---

## 14. Tài liệu liên quan

- `PRODUCT.md` — persona, album (tương lai)
- `DESIGN.md` — UI/UX
- `XUNG_HO_RULES.md` — quy tắc xưng hô
- `AGENTS.md` — MCP GitNexus, Chrome DevTools
- `docs/HARNESS.md` — intake / story (thay đổi high-risk)

---

| Ngày | Ghi chú |
|------|---------|
| 2026-06-02 | SPEC rút gọn ban đầu |
| 2026-06-02 | SPEC đầy đủ: phỏng vấn thiết kế + template `mau-danh-sach-khach-moi (9).xlsx` |
