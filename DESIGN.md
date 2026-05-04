# DESIGN.md — nhatphuong.love Wedding Invitation

## 1. Visual Theme & Atmosphere

This site is a single high-end online wedding invitation for an outdoor Đà Lạt wedding at Terracotta Hotel & Resort Dalat, Hồ Tuyền Lâm.

The visual direction is **Rose Quartz + Serenity Enchanted Garden**: romantic, soft, editorial, floral, vintage, and premium. The page should feel like a luxury printed invitation translated into motion and web layout, not like a SaaS landing page.

Keywords:

- Romantic garden evening
- Đà Lạt resort atmosphere
- Vintage floral stationery
- Soft luxury
- Editorial spacing
- Rose Quartz + Serenity pastel
- Cream paper texture
- Champagne gold accent
- Deep botanical green grounding

Avoid:

- Tech startup / dashboard aesthetics
- Harsh contrast except for readability
- Neon colors
- Heavy black sections
- Generic template-looking cards
- Oversized blank areas that look like layout bugs
- Overly playful wedding clipart

## 2. Color Palette & Roles

Use these colors as the canonical palette.

| Token | Hex | Role |
| --- | --- | --- |
| Rose Quartz | `#F2C6CF` | Romantic accent, floral warmth, soft gradients |
| Serenity | `#8FAADC` | Main pastel blue, calm garden sky tone |
| Cream | `#FDFBF7` | Primary page background, paper canvas |
| Soft White | `#FFFFFF` | Cards and elevated paper surfaces |
| Deep Green | `#2F3A35` | Primary text, botanical grounding, dark CTA sections |
| Champagne Gold | `#D4AF37` | Premium accent, dividers, eyebrows, button fills |
| Dusty Mauve | `#E9DDE5` | Borders, quiet separators |
| Slate Lavender | `#7B8291` | Muted body text |

### Color Rules

- Cream should dominate the page.
- Rose Quartz and Serenity should appear as soft gradients, floral accents, and image treatments.
- Gold is a highlight, not a background flood. Use it for thin lines, tiny labels, CTA fill, and ornamental details.
- Deep Green should anchor text and provide contrast where the page needs seriousness.
- Do not introduce new saturated colors unless replacing an image asset.

## 3. Typography Rules

Current font direction:

- Display / serif: `Playfair Display`
- Body / sans: `Lato`

### Hierarchy

| Element | Style |
| --- | --- |
| Hero names | Large serif, elegant, tight leading, soft shadow when on image |
| Section titles | Serif, 48–72px desktop, 40–56px mobile, tight but readable |
| Card titles | Serif, 32–56px depending on importance |
| Eyebrows | Small uppercase sans, bold, wide tracking, gold or pastel primary |
| Body copy | Sans, 16–20px, relaxed line-height |
| Buttons | Sans, bold uppercase, moderate tracking |

### Typography Guardrails

- Serif headings should feel editorial and romantic, not decorative-gothic.
- Body text must stay highly readable on mobile.
- Avoid too many uppercase blocks; use uppercase only for labels and CTAs.
- Vietnamese diacritics must render clearly at large sizes. Do not use fonts that break Vietnamese accents.

## 4. Layout Principles

The page should feel spacious, but never accidentally empty.

### Widths

- Main sections: `max-w-6xl` to `max-w-7xl`.
- Text blocks: usually `max-w-2xl` or `max-w-3xl`.
- Hero content: centered and narrow, `max-w-xl` to `max-w-2xl`.

### Spacing

- Use generous vertical rhythm between sections.
- Inside cards, padding should feel like premium stationery: `p-7` to `p-14` depending on screen size.
- Avoid hard-coded desktop heights unless the component is truly image-led.
- Prefer content-driven height and balanced grid alignment.

### Desktop Layout Rules

- Two-column sections must be actual grid columns, not children hidden inside wrappers that break grid behavior.
- Decorative panels should stretch to match adjacent content, but should not force huge empty cards.
- No section should have more than roughly 25–30% dead blank space unless it is intentional editorial whitespace.
- Cards should preserve rounded corners and clipping across nested wrappers.

### Mobile Layout Rules

- Stack columns vertically.
- Keep touch targets at least 44px high.
- Preserve image/card rhythm; do not compress everything into tiny dense blocks.
- Hero and RSVP CTA must remain immediately understandable on a phone.

## 5. Component Styling

### Paper Cards

Cards should resemble fine printed invitation paper.

- Background: Soft White or Cream.
- Border: Dusty Mauve or soft pastel border.
- Radius: large, usually `rounded-[2rem]` to `rounded-[2.8rem]`.
- Shadow: soft, broad, low-opacity green/gray shadow.
- Optional paper texture: tiny low-opacity dots or radial pattern.

Avoid:

- Sharp rectangular cards.
- Heavy borders.
- SaaS-style gray cards.
- Dense dashboard layouts.

### Buttons

Primary buttons:

- Rounded full pill.
- Champagne Gold fill.
- Deep Green text.
- Uppercase with modest letter spacing.
- Soft shadow and gentle hover lift.

Secondary buttons:

- White/transparent fill.
- Soft border.
- Deep Green text.
- Same pill shape.

Button motion should be elegant, not bouncy or gamified.

### Floral Decoration

Use floral assets as framing and atmosphere.

- Corners, edges, and low-opacity overlays work well.
- Keep florals partially cropped for an editorial print feel.
- Avoid placing florals directly over important text unless opacity is very low.
- Do not overuse florals in every card; alternate with whitespace and fine lines.

### Image Treatment

- Public-facing images should be full-bleed within rounded frames.
- Use `object-cover` for uploaded/local images.
- For user-provided images, the crop should look intentional and premium.
- Gallery images may use staggered vertical offsets, but not so much that the grid feels broken.

## 6. Motion & Interaction

Motion should feel slow, graceful, and luxurious.

Use:

- Fade up
- Gentle scale reveal
- Slow hero image settle
- Subtle hover lift
- Soft shimmer on buttons

Avoid:

- Fast springy transitions
- Excessive parallax
- Infinite animations except tiny scroll cues
- Motion that distracts from wedding content

Respect reduced-motion settings.

## 7. Section-Specific Rules

### Hero

- Full viewport or near-full viewport.
- Image should cover the whole hero without distortion.
- Overlay must preserve text readability.
- Names, date, venue, and monogram are the priority.

### Invitation Message

- Should feel ceremonial and intimate.
- Centered composition.
- Floral frame is acceptable here.
- Copy width must stay readable.

### Event Details

- Cards should be compact, elegant, and scannable.
- Times should be large and serif.
- Avoid overcomplicating with too many icons.

### Timeline

- Should feel like an evening flow, not a project roadmap.
- Line and nodes can use gold.
- Cards should remain soft and readable.

### Venue

This section must avoid blank-space bugs.

- Desktop should be a true two-column card.
- Left visual panel and right address panel should be siblings inside the same grid.
- The left visual panel may stretch to match the right content, but must not set the entire card to an excessive fixed height.
- Preferred approach: content-driven grid with `lg:items-stretch` and modest mobile min-height.
- If a panel has decorative background only, it must either fill its column or be replaced with a real image/map-style visual.
- No large empty dotted area should appear to the right or below the visual panel.

### Dress Code

- Color swatches should be tactile and centered.
- Keep copy short.
- Palette must match the canonical colors.

### Weather & Accommodation

- Practical but still soft.
- Cards can be simpler than hero/invitation.
- Avoid making them look like admin widgets.

### Gallery

- Editorial image grid.
- Rounded frames and soft shadows.
- Crops should feel intentional.
- Avoid tiny thumbnails on desktop.

### RSVP CTA

- Should feel emotionally warm and action-oriented.
- Dark green gradient with gold CTA works well.
- Keep text short and clear.

### Admin Editor

Admin UI can be more utilitarian but should still inherit the wedding palette.

- Inputs should be friendly and rounded.
- Image picker should preview crops clearly.
- Live preview must not distort the public invitation.
- Avoid cramped controls.

## 8. Responsive Behavior

Breakpoints follow Tailwind defaults.

- Mobile: one column, large touch targets, reduced decorative density.
- Tablet: keep cards comfortable; avoid overly narrow text.
- Desktop: use editorial two-column layouts where helpful.
- Large desktop: constrain width; do not let content stretch endlessly.

For every layout change, check:

- Mobile viewport around 390px wide.
- Tablet around 768px wide.
- Desktop around 1440px wide.
- Large desktop around 1920px wide.

## 9. Do's and Don'ts

### Do

- Make it feel custom, romantic, and personal.
- Use soft gradients and floral framing.
- Keep all key RSVP information easy to find.
- Use content-driven layout heights.
- Prefer fewer, better visual moments over many decorative elements.
- Test desktop and mobile after UI changes.

### Don't

- Do not make it look like a generic wedding template.
- Do not make it look like a startup landing page.
- Do not create giant blank sections by forcing min-heights.
- Do not add new design languages section-by-section.
- Do not use harsh black, neon, or heavy dashboard styling.
- Do not bury RSVP behind too much visual noise.

## 10. Agent Prompt Guide

When asking an AI agent to modify this UI, include this direction:

> Use the local `DESIGN.md` as the source of truth. Preserve the Rose Quartz + Serenity Enchanted Garden wedding style. Keep layouts content-driven, romantic, editorial, and premium. Avoid SaaS aesthetics and avoid oversized blank whitespace. Test desktop and mobile behavior conceptually before changing Tailwind classes.

For Venue-specific fixes:

> The Venue section must be a true two-column card on desktop. The visual panel and address panel should be siblings inside the same grid. Do not force a huge fixed height. No large dotted blank area should remain visible beside or below the visual panel.
