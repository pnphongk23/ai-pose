---
name: subframe-to-swiftui
description: >
  Convert Subframe designs into native SwiftUI for the Jazzcam iOS app. Use this skill whenever
  a Subframe page URL or MCP link is provided, when the user asks to implement a Subframe design,
  when converting Subframe components/pages to SwiftUI, when updating existing SwiftUI screens
  from a changed Subframe design, or when syncing Subframe theme tokens into Theme.swift.
  Also use when the user mentions "subframe", "convert design", "implement this page",
  "update from subframe", or pastes an app.subframe.com URL. This skill handles the full pipeline:
  fetch design via MCP → extract tokens → map to Theme.swift → translate React/Tailwind layout
  to SwiftUI → enforce repo conventions → verify build.
argument-hint: "[Subframe page URL or 'update Theme tokens from Subframe']"
---

Convert Subframe designs into production SwiftUI code for Jazzcam. Subframe generates React + TypeScript + Tailwind — this skill translates the **design intent** (layout hierarchy, tokens, component structure, interactions) into native SwiftUI that follows Jazzcam repo conventions.

## Why This Skill Exists

Subframe is a web-first design tool. Jazzcam is a native iOS app. There is no `.subframe/` directory or synced React code in this repo — and there should not be. Instead, Subframe serves as an upstream design source. This skill bridges the gap by defining a repeatable, disciplined translation workflow.

## When NOT to Use This Skill

- Building UI from scratch without a Subframe design → use `.rule/guide/presentation-ui-sample.md`
- Editing existing SwiftUI screens without a Subframe reference → normal SwiftUI development
- Setting up Subframe in a React/web project → use `/subframe:setup`

## Workflow

```
Subframe MCP link
       │
       ▼
┌─────────────────┐
│ 1. Fetch Design  │  get_page_info / get_theme / get_component_info
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Extract       │  Identify: colors, spacing, typography, corner radii,
│    Tokens        │  shadows, component variants, layout structure
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Map to        │  Match against Theme.swift. Add new tokens if needed.
│    Theme.swift   │  Never hardcode raw hex/px values in Views.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Translate     │  React/Tailwind DOM → SwiftUI View hierarchy.
│    to SwiftUI    │  Map by intent, not by tag name.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. Enforce       │  MVVM, localization, accessibility, feature-slice
│    Conventions   │  structure, Core vs App boundaries.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. Verify        │  xcodebuild, JazzcamCoreTests if applicable,
│    Build         │  Mobile MCP or manual UI check.
└────────┘
```

---

## Step 1: Fetch the Design

Use Subframe MCP tools to retrieve the design. The user provides a page URL like:
`https://app.subframe.com/PROJECT_ID/design/PAGE_ID/edit`

```
get_page_info({ url: "<the URL>" })
```

Also fetch the theme to get the full token set:
```
get_theme({ projectId: "PROJECT_ID" })
```

If the MCP server is not authenticated, tell the user to run `/mcp` in Claude Code to authenticate.

If you need component details (props, variants, slots):
```
get_component_info({ name: "ComponentName", projectId: "PROJECT_ID" })
```

**Save the fetched page code and theme locally** — you will reference it throughout the translation.

---

## Step 2: Extract Tokens

From the fetched page code and theme, extract every design value used:

| Category | What to extract | Example from Subframe |
|----------|----------------|-----------------------|
| **Colors** | Background, text, border, accent colors | `bg-brand-600`, `text-neutral-700` |
| **Spacing** | Padding, gaps, margins | `px-4`, `gap-2`, `py-3` |
| **Typography** | Font size, weight, line height, tracking | `text-body-bold`, `font-heading-2` |
| **Corner radii** | Border radius values | `rounded-md`, `rounded-full` |
| **Shadows** | Box shadows | `shadow-md` |
| **Layout** | Flex direction, alignment, sizing | `flex flex-col items-center` |
| **Component variants** | Button sizes, states, color variants | `variant="brand-primary"`, `size="large"` |

Create a mapping table before writing any SwiftUI code.

---

## Step 3: Map to Theme.swift

Read `Jazzcam/Design/Theme.swift` and map each extracted token:

### Color mapping

| Subframe token | Theme.swift equivalent |
|---------------|----------------------|
| `bg-brand-600` / primary | `Theme.primary` |
| `bg-neutral-200` | `Theme.surfaceHighest` |
| `text-default-font` | `Theme.foreground` |
| `text-subtext-color` | `Theme.mutedForeground` |
| `border-neutral-border` | `Theme.border` |
| `bg-error-600` | `Theme.error` |

### Spacing mapping

Subframe uses Tailwind's 4px grid. Map to Theme spacing constants:

| Tailwind class | Value | Theme.swift |
|---------------|-------|-------------|
| `gap-1` / `p-1` | 4px | `Theme.spacing4` |
| `gap-2` / `p-2` | 8px | `Theme.spacing8` |
| `gap-3` / `p-3` | 12px | `Theme.spacing12` |
| `gap-4` / `p-4` | 16px | `Theme.spacing16` |
| `gap-5` / `p-5` | 20px | `Theme.spacing20` |
| `gap-6` / `p-6` | 24px | `Theme.spacing24` |
| `gap-8` / `p-8` | 32px | `Theme.spacing32` |

### Typography mapping

| Subframe token | Theme.swift |
|---------------|-------------|
| `text-heading-2 font-heading-2` | `Theme.screenTitleFont` |
| `text-body font-body` | `Theme.bodyFont` |
| `text-body-bold font-body-bold` | `Theme.buttonLabelFont` |
| `text-caption font-caption` | `Theme.captionFont` |

### Auto-extending Theme.swift

If the Subframe design uses a value that has no Theme.swift equivalent:

1. **Check if it's close enough** to an existing token (e.g., 14px spacing → use `Theme.spacing12` or `Theme.spacing16`, pick closest)
2. **If genuinely new**, add it to `Theme.swift` with a semantic name following existing conventions
3. **Document the addition** in your commit message

Example — Subframe uses a 36px corner radius not in Theme:
```swift
// Add to Theme.swift
static let previewCornerRadius: CGFloat = 36
```

**Never** write raw values like `Color(hex: 0xE8A838)` or `.padding(24)` in View files. Always reference Theme.

---

## Step 4: Translate to SwiftUI

This is the core translation. Map by **intent**, not by HTML tag.

### Layout primitives

| React/Tailwind | SwiftUI equivalent |
|---------------|-------------------|
| `<div className="flex flex-col ...">` | `VStack(alignment:spacing:)` |
| `<div className="flex flex-row ...">` | `HStack(alignment:spacing:)` |
| `<div className="flex ... items-center justify-center">` | `VStack { ... }.frame(maxWidth:maxHeight:)` with alignment |
| `<div className="grid grid-cols-3">` | `LazyVGrid(columns: [GridItem(.flexible())...])` |
| `<div className="w-full">` | `.frame(maxWidth: .infinity)` |
| `<div className="h-px bg-neutral-border">` | `Divider()` or `Rectangle().fill(Theme.border).frame(height: 1)` |
| `<span>text</span>` | `Text(...)` |
| `<img>` | `Image(...)` or `AsyncImage(...)` |
| `<button>` | `Button { } label: { }` |
| `<input>` | `TextField(...)` |
| Scrollable container | `ScrollView` |
| Fixed positioning / z-index | `ZStack` with alignment |

### Component mapping

| Subframe component | Jazzcam SwiftUI equivalent |
|-------------------|--------------------------|
| `Button variant="brand-primary"` | `Button { } label: { Text(...) }.buttonStyle(JazzcamPrimaryButtonStyle())` |
| `Button variant="brand-secondary"` | `Button { } label: { Text(...) }.buttonStyle(JazzcamSecondaryButtonStyle())` |
| Card container | `.jazzcamCardChrome()` modifier |
| Badge | `.jazzcamBadgeChrome()` modifier |
| Icon (Feather/Lucide) | `Image(systemName: "sf.symbol.name")` — find the closest SF Symbol |
| Loading spinner | `ProgressView()` |

### Interaction patterns

| Subframe pattern | SwiftUI equivalent |
|-----------------|-------------------|
| `onClick` handler | `Button` action or `.onTapGesture` |
| Modal/overlay | `.sheet(isPresented:)` or `.fullScreenCover` |
| Accordion open/close | `DisclosureGroup` or `@State` toggle |
| Tabs | `TabView` or custom tab (follow `RootTabView` pattern) |
| Form with validation | `Form { }` or manual `VStack` with `@State` |

### What to ignore from Subframe output

- `className` strings — extract the intent, discard the Tailwind classes
- `SubframeCore.*` and `SubframeUtils.*` imports — not applicable
- `React.forwardRef` patterns — SwiftUI doesn't use refs
- `data-*` attributes — not relevant to SwiftUI
- CSS hover/active pseudo-states — use `ButtonStyle` or `.opacity` on press instead
- `group/` Tailwind modifiers — handle parent-child state via `@State`/`@Binding`

---

## Step 5: Enforce Jazzcam Conventions

After translating, verify the output follows repo rules:

### File placement
- New screen → `Jazzcam/Features/<Feature>/<FeatureName>View.swift`
- ViewModel if needed → `Jazzcam/Features/<Feature>/<FeatureName>ViewModel.swift`
- Pure logic → `JazzcamCore/`

### MVVM
- View is thin: layout + navigation only
- Business logic, state management, I/O in ViewModel (`@Observable` + `@MainActor`)
- SDK calls through service wrappers (EntitlementService, AdService, etc.)

### Localization
- All user-facing strings must use `String(localized:)` or `Text("key", comment:)`
- No hardcoded English in production Views

### Accessibility
- Add `.accessibilityLabel()` for icon-only buttons
- Add `.accessibilityIdentifier()` for testable elements
- Minimum 44×44pt tap targets (`Theme.minimumTapTarget`)

### Design tokens
- Colors from `Theme.*` only
- Spacing from `Theme.spacing*` only
- Typography from `Theme.*Font` only
- Corner radii from `Theme.*CornerRadius` or named constants
- Button styles via `JazzcamPrimaryButtonStyle()` / `JazzcamSecondaryButtonStyle()`
- Card chrome via `.jazzcamCardChrome()`, badges via `.jazzcamBadgeChrome()`

### project.yml
- If adding new files, run `xcodegen generate` after

---

## Step 6: Verify

After writing the SwiftUI code:

1. **Build check**:
   ```bash
   xcodegen generate
   xcodebuild -scheme Jazzcam -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' build
   ```

2. **Core tests** (if logic was added to JazzcamCore):
   ```bash
   xcodebuild -scheme JazzcamCore -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17,OS=26.1' test
   ```

3. **Visual verification**: Rebuild, install, and relaunch on the real iPhone or simulator using Mobile MCP or manual check.

4. **Token audit**: Grep the new file for raw hex values or hardcoded spacing — there should be none.
   ```bash
   grep -n 'Color(' NewFile.swift | grep -v 'Theme\.'
   grep -nE '\.(padding|spacing)\([0-9]' NewFile.swift
   ```

---

## Handling Design Updates

When a Subframe design changes and needs to be re-translated:

1. **Fetch the updated design** via MCP
2. **Diff against the existing SwiftUI** — identify what changed (layout? tokens? new sections?)
3. **Preserve existing business logic** — hooks, handlers, state management, SDK calls
4. **Update only the visual layer** — layout structure, token values, new/removed UI elements
5. **If Theme tokens changed**, update `Theme.swift` first, then update Views
6. **Verify build** as in Step 6

---

## Handling Theme Sync

When the user says "update tokens from Subframe" or "sync Subframe theme":

1. Fetch theme: `get_theme({ projectId: "..." })`
2. Read current `Jazzcam/Design/Theme.swift`
3. Compare Subframe Tailwind tokens against Theme.swift values
4. For each difference:
   - **Existing token, value changed** → update the hex/CGFloat in Theme.swift
   - **New token in Subframe** → add with semantic name to Theme.swift
   - **Token removed in Subframe** → flag for manual review (don't auto-delete, existing Views may use it)
5. Run build to verify no regressions

---

## Reference Screens

When translating, study these existing screens as canonical examples of Jazzcam SwiftUI patterns:

- **`Jazzcam/Features/Billing/PaywallView.swift`** — Card-based content with CTA buttons, feature list, badge, error handling, localization
- **`Jazzcam/Features/Export/ExportGateView.swift`** — Background image + gradient overlay, floating close button, content panel with CTAs, footer links
- **`Jazzcam/Features/Camera/CameraView.swift`** — Complex layout with GeometryReader, custom controls, badge pills, preview stage, bottom control panel
- **`Jazzcam/Features/Gallery/GalleryView.swift`** — Grid layout, thumbnails, navigation

Read `references/token-map.md` for the complete Subframe → Theme.swift mapping table.

---

## Quick Checklist

Before marking a Subframe→SwiftUI translation as done:

- [ ] All colors reference `Theme.*` — no raw hex
- [ ] All spacing uses `Theme.spacing*` — no magic numbers
- [ ] All typography uses `Theme.*Font` — no inline `.font(.system(...))`
- [ ] Buttons use `JazzcamPrimaryButtonStyle()` or `JazzcamSecondaryButtonStyle()`
- [ ] Cards use `.jazzcamCardChrome()`, badges use `.jazzcamBadgeChrome()`
- [ ] Strings use localization — no hardcoded English
- [ ] Accessibility identifiers on interactive elements
- [ ] File placed in correct `Features/<Feature>/` directory
- [ ] ViewModel separated if screen has state/logic
- [ ] `xcodegen generate` run if files added
- [ ] `xcodebuild` build succeeds
- [ ] No `SubframeCore`, `SubframeUtils`, React, or Tailwind references in output
