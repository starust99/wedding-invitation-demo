# Validation

## Proof Strategy

Prove the access resolver independently, then prove every UI and server boundary
uses it without changing lodging eligibility.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Normalize all Nhà Trai group forms; verify Nhà Trai flag false/true and non-Nhà Trai matrix; verify post-ceremony applicability. |
| Integration | Token RSVP normalizes tampered ceremony/intimate answers and preserves Nhà Trai family lodging for 26/12. |
| E2E | Banquet-only Nhà Trai invitation and RSVP contain no ceremony text; direct-invite Nhà Trai and existing non-Nhà Trai flows remain intact. |
| Platform | 390px, 768px, and desktop layouts contain no gap or horizontal overflow. |
| Performance | Production build stays within existing behavior. |
| Logs/Audit | Harness trace records policy, changed files, and validation evidence. |

## Fixtures

- `[Nhà Trai] Họ nội`, post-ceremony false.
- `[Nhà Trai] Họ ngoại`, post-ceremony true.
- `[Nhà Trai] Khách ba`, post-ceremony false.
- `[Nhà Gái] Họ nội`, post-ceremony false.
- `[Nhật] Bạn bè & Đồng nghiệp`, post-ceremony false.

## Commands

```text
npm run check:event-access
npm run check:event-access-browser
npm run check:rsvp-branching
npm run check:post-ceremony-rsvp
npm run check:rsvp-resilience
npm run check:guest-copy
npx tsc --noEmit
npm run lint
npm run build
```

## Acceptance Evidence

- Unit policy checks passed for all Nhà Trai prefixes, both invite-flag states,
  non-Nhà Trai compatibility, disabled fallback, and unchanged lodging groups.
- Browser invitation checks passed at 390px, 768px, and 1440px without ceremony
  disclosure or horizontal overflow for banquet-only Nhà Trai guests; a flagged
  Nhà Trai guest retained the ceremony card.
- RSVP branching passed for Nhà Trai parent guests, Nhà Trai family lodging,
  regular fallback guests, direct intimate-party invitees, review, and reduced
  motion.
- RSVP resilience passed delayed hydration, explicit 26/12 lodging choice,
  draft reload, non-family party size, and invalid-link behavior.
- Post-ceremony workbook/persistence, guest copy, lodging copy, smart calendar,
  and calendar handoff regressions passed.
- TypeScript, `git diff --check`, ESLint with zero errors (existing warnings
  remain), and the optimized Next.js production build passed.
