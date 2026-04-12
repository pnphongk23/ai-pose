# Subframe → Theme.swift Token Map

Complete mapping table for translating Subframe/Tailwind design tokens into Jazzcam's `Theme.swift`.

Last synced against: `Jazzcam/Design/Theme.swift` and `.stitch/DESIGN.md`

---

## Colors

### Backgrounds

| Subframe / Tailwind token | Hex | Theme.swift | Notes |
|--------------------------|-----|-------------|-------|
| `surface` / app background | `#131313` | `Theme.background` | Base darkroom floor |
| `surface_container_low` / card bg | `#1C1B1B` | `Theme.surface` | Cards, bottom bar |
| `surface_container` | `#201F1F` | `Theme.surfaceContainer` | General surface |
| `surface_container_high` / elevated | `#2A2A2A` | `Theme.surfaceElevated` | Modals, sheets, secondary buttons bg |
| `surface_container_highest` | `#353534` | `Theme.surfaceHighest` | Secondary button bg, raised elements |
| `surface_container_lowest` | `#0E0E0E` | `Theme.surfaceLowest` | Recessed "well" |
| `bg-brand-600` / primary CTA | `#E8A838` | `Theme.primary` | Amber Film — main CTA |
| `bg-brand-500` / primary hover | `#FFC66B` | `Theme.primaryHighlight` | Hover/glow |
| `bg-brand-50` / secondary brand bg | varies | `Theme.surfaceHighest` | Use surfaceHighest for secondary |
| `bg-error-600` | `#FFB4AB` | `Theme.error` | Error state |

### Text / Foreground

| Subframe / Tailwind token | Hex | Theme.swift |
|--------------------------|-----|-------------|
| `on_surface` / `text-default-font` | `#E5E2E1` | `Theme.foreground` |
| `on_surface_variant` / `text-subtext-color` | `#D5C4AF` | `Theme.mutedForeground` |
| `on_primary` / text on primary button | `#432C00` | `Theme.primaryForeground` |
| `tertiary_container` / premium accent | `#FF988B` | `Theme.accent` |
| White text (never pure white) | `#E5E2E1` | `Theme.foreground` |

### Borders

| Subframe / Tailwind token | Hex | Theme.swift |
|--------------------------|-----|-------------|
| `outline_variant` / `border-neutral-border` | `#504535` at 15% | `Theme.border` |
| Scrim / overlay | `#000000` at 60% | `Theme.overlayScrim` |

---

## Spacing

Subframe uses Tailwind's 4px base grid. Convert to Theme spacing constants.

| Tailwind class | px value | Theme.swift |
|---------------|----------|-------------|
| `p-1` / `gap-1` / `m-1` | 4 | `Theme.spacing4` |
| `p-2` / `gap-2` / `m-2` | 8 | `Theme.spacing8` |
| `p-3` / `gap-3` / `m-3` | 12 | `Theme.spacing12` |
| `p-4` / `gap-4` / `m-4` | 16 | `Theme.spacing16` |
| `p-5` / `gap-5` / `m-5` | 20 | `Theme.spacing20` |
| `p-6` / `gap-6` / `m-6` | 24 | `Theme.spacing24` |
| `p-8` / `gap-8` / `m-8` | 32 | `Theme.spacing32` |
| `p-10` / `gap-10` | 40 | `Theme.spacing40` |
| `p-12` / `gap-12` | 48 | `Theme.spacing48` |

For values not in the scale (e.g., Tailwind `p-7` = 28px), pick the closest Theme constant or propose a new one.

---

## Typography

| Subframe token | Size/Weight | Theme.swift |
|---------------|-------------|-------------|
| Display / hero text | 56pt Bold | `Theme.displayFont` |
| `text-heading-2 font-heading-2` | 20pt Semibold | `Theme.screenTitleFont` |
| `text-heading-3 font-heading-3` / section header | 16pt Semibold | `Theme.sectionHeaderFont` |
| `text-body font-body` | 15pt Regular | `Theme.bodyFont` |
| `text-caption font-caption` | 12pt Regular | `Theme.captionFont` |
| `text-body-bold font-body-bold` / button label | 15pt Semibold | `Theme.buttonLabelFont` |
| Tab label | 10pt Medium | `Theme.tabLabelFont` |
| Date stamp / monospace | 14pt Mono Regular | `Theme.dateStampFont` |

---

## Corner Radii

| Subframe / Tailwind | px value | Theme.swift |
|--------------------|----------|-------------|
| `rounded-sm` | 4 | — (rare, propose if needed) |
| `rounded` / `rounded-md` | 6–8 | — (use `Theme.secondaryCornerRadius` = 12 or propose) |
| `rounded-lg` | 12 | `Theme.secondaryCornerRadius` |
| `rounded-xl` / cards | 16 | `Theme.cardCornerRadius` / `Theme.sheetCornerRadius` |
| `rounded-2xl` / CTA pill | 24 | `Theme.ctaCornerRadius` |
| `rounded-full` / pill / badge | 16+ | `Theme.badgeCornerRadius` (16) or `Capsule()` |
| Tab bar | 31 | `Theme.tabBarCornerRadius` |

---

## Component Patterns

| Subframe component | Jazzcam SwiftUI |
|-------------------|----------------|
| `Button variant="brand-primary" size="large"` | `Button { }.buttonStyle(JazzcamPrimaryButtonStyle())` — height 48pt, pill shape |
| `Button variant="brand-secondary"` | `Button { }.buttonStyle(JazzcamSecondaryButtonStyle())` — height 44pt, ghost border |
| `Button variant="destructive-primary"` | Custom ButtonStyle with `Theme.error` fill |
| Card / elevated container | `.jazzcamCardChrome()` — surfaceElevated bg + ghost border |
| Card with custom bg | `.jazzcamCardChrome(backgroundColor: Theme.surface)` |
| Badge / chip | `.jazzcamBadgeChrome()` — accent bg, 16pt radius |
| Ghost border overlay | `.jazzcamGhostBorder(cornerRadius: ...)` |
| Divider | `Rectangle().fill(Theme.border).frame(height: 1)` or thin tonal shift |

---

## Icon Mapping (Feather/Lucide → SF Symbols)

| Subframe icon | SF Symbol |
|--------------|-----------|
| `FeatherHeart` | `heart` / `heart.fill` |
| `FeatherMail` | `envelope` |
| `FeatherSettings` / `FeatherCog` | `gearshape` |
| `FeatherCamera` | `camera` |
| `FeatherImage` | `photo` |
| `FeatherDownload` | `arrow.down.circle` |
| `FeatherShare` | `square.and.arrow.up` |
| `FeatherTrash` | `trash` |
| `FeatherX` / `FeatherClose` | `xmark` |
| `FeatherCheck` | `checkmark` |
| `FeatherChevronRight` | `chevron.right` |
| `FeatherChevronDown` | `chevron.down` |
| `FeatherPlus` | `plus` |
| `FeatherSearch` | `magnifyingglass` |
| `FeatherLock` | `lock.fill` |
| `FeatherUnlock` | `lock.open` |
| `FeatherStar` | `star` / `star.fill` |
| `FeatherPlay` | `play.fill` |
| `FeatherPause` | `pause.fill` |
| `FeatherArrowLeft` | `chevron.left` |
| `FeatherRotateCcw` | `arrow.triangle.2.circlepath` |
| `FeatherZap` / `FeatherBolt` | `bolt` / `bolt.fill` |
| `FeatherSparkles` | `sparkles` |
| `FeatherInfo` | `info.circle` |
| `FeatherAlertTriangle` | `exclamationmark.triangle` |

For icons not listed, search SF Symbols for the closest semantic match. Prefer filled variants for active/selected states.

---

## Design Rules (from DESIGN.md)

These rules apply to all translated output:

1. **"No-Line" Rule**: 1px solid borders prohibited for sectioning. Use tonal depth shift instead.
2. **"Ghost Border" Fallback**: `Theme.border` (outline_variant at 15% opacity) when accessibility requires edge definition.
3. **No pure white**: Always use `Theme.foreground` (#E5E2E1), never Color.white for text.
4. **Dark-mode dominant**: All screens assume dark background. No light-mode variants needed currently.
5. **Minimum tap target**: 44×44pt (`Theme.minimumTapTarget`).
