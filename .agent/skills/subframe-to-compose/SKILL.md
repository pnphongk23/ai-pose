---
name: subframe-to-compose
description: >
  Convert Subframe designs into native Jetpack Compose or Compose Multiplatform code. Use this skill whenever
  a Subframe page URL or MCP link is provided, when the user asks to implement a Subframe design in Compose,
  when converting Subframe components/pages to KMP, or when updating existing Compose screens
  from a changed Subframe design. This skill handles the full pipeline:
  fetch design via MCP → extract tokens → map to Compose Theme → translate React/Tailwind layout
  to Compose UI → integrate Lucide SVG icons safely for KMP → verify build.
argument-hint: "[Subframe page URL or 'update Theme tokens from Subframe']"
---

Convert Subframe designs into production Jetpack Compose / Compose Multiplatform (KMP) code. Subframe generates React + TypeScript + Tailwind — this skill translates the **design intent** (layout hierarchy, tokens, component structure, interactions) into native Kotlin UI that follows KMP/Compose conventions.

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
│ 3. Map to        │  Match against Compose MaterialTheme or custom Theme object.
│    Theme         │  Never hardcode raw dp/Color values in Composables.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Translate     │  React/Tailwind DOM → Compose View hierarchy (Row/Column/Box).
│    to Compose    │  Map by intent using `Modifier`.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. Handle Icons  │  Convert Lucide SVGs safely to ImageVector or KMP Resources.
│    (KMP Safe)    │  Resolve iOS CocoaPods bundling constraints.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. Enforce       │  State hoisting, ViewModel, Modifier passing,
│    Conventions   │  Localization, standard Component Wrappers.
└────────┘
```

---

## Step 1: Fetch the Design

Use Subframe MCP tools to retrieve the design if a URL is provided:
`https://app.subframe.com/PROJECT_ID/design/PAGE_ID/edit`

```
get_page_info({ url: "<the URL>" })
get_theme({ projectId: "PROJECT_ID" })
```

---

## Step 2: Extract Tokens

Break down the Tailwind classes from Subframe into logical values:
- **Colors**: `bg-brand-600`
- **Spacing**: `gap-4`, `p-3`
- **Typography**: `text-heading-2`
- **Radii**: `rounded-full`

---

## Step 3: Map to Compose Theme

Map extracted tokens to Android/Compose paradigms. Never use raw `Modifier.padding(16.dp)` or `Color(0xFFE8A838)` directly in business logic screens unless it's a completely custom single-use element.

### Layout & Spacing
Tailwind's 4px unit maps to `dp`:
- `gap-1` / `p-1` -> `4.dp`
- `gap-2` / `p-2` -> `8.dp`
- `gap-4` / `p-4` -> `16.dp`
- `gap-6` / `p-6` -> `24.dp`

### Typography
Map to Compose MaterialTheme (or custom AppTheme):
- `text-heading-2 font-heading-2` -> `MaterialTheme.typography.headlineMedium`
- `text-body font-body` -> `MaterialTheme.typography.bodyLarge`

*(If the project has an established UI system, map to its semantic tokens first).*

---

## Step 4: Translate to Compose

This is the core translation. Map by **intent**, not by HTML tag.

### Layout Primitives

| React/Tailwind | Compose equivalent |
|---------------|-------------------|
| `<div className="flex flex-col ...">` | `Column(verticalArrangement, horizontalAlignment)` |
| `<div className="flex flex-row ...">` | `Row(horizontalArrangement, verticalAlignment)` |
| `<div className="relative"> ... <div className="absolute">`| `Box` with `Modifier.align(...)` |
| `<div className="grid grid-cols-3">` | `LazyVerticalGrid(columns = GridCells.Fixed(3))` |
| `<div className="w-full">` | `Modifier.fillMaxWidth()` |
| `<div className="h-px bg-neutral-border">` | `HorizontalDivider(color = ...)` |
| `<span>text</span>` | `Text(...)` |
| `<button>` | `Button(...) { ... }` or `IconButton` |

### Modifiers Translation Chain
Always extract Tailwind constraints into a singular `Modifier` chain. Order matters in Compose:
1. Size (`fillMaxWidth`, `width`, `height`)
2. Background (`background`, `clip`)
3. Padding (`padding`)

Example:
`className="flex w-full items-center justify-between rounded-[48px] bg-[#f6f1e8] px-3 pb-3"`
Becomes:
```kotlin
Row(
    modifier = Modifier
        .fillMaxWidth()
        .clip(RoundedCornerShape(48.dp))
        .background(Color(0xFFF6F1E8)) // Use Theme color where possible
        .padding(horizontal = 12.dp, bottom = 12.dp),
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.SpaceBetween
) { ... }
```

---

## Step 5: Handle Icons (KMP specific)

Subframe heavily uses Feather/Lucide icons. In Compose Multiplatform, UI parity requires mapping these correctly.

### Method 1: KMP SVG Resource Bundling (The standard but fragile way)
Place `.svg` files from Subframe directly into `composeApp/src/commonMain/composeResources/drawable/`.
- **Constraint**: You MUST change `stroke="currentColor"` in the SVG to `stroke="#000000"` so `Icon(tint = ...)` works correctly in Compose.
- **Usage**: `Icon(painterResource(Res.drawable.ic_layout_grid), contentDescription = null)`
- **⚠️ CRITICAL iOS BUG WARNING**: If using CocoaPods with `isStatic = true`, adding new resources will crash iOS with `MissingResourceException` at runtime because the resources aren't bundled.
  **Fix**: You MUST instruct the user to run `cd iosApp && pod install` after adding any new SVG files via this method.

### Method 2: Pure Kotlin ImageVector (The robust way)
When CocoaPods integration fails, or you only have a few icons, convert the SVG directly to Kotlin code using `ImageVector.Builder`.
This completely bypasses the resource caching issue, allows dynamic tinting naturally, and compiles natively.

```kotlin
val LayoutGrid: ImageVector
    get() = ImageVector.Builder(
        name = "LayoutGrid",
        defaultWidth = 24.dp,
        defaultHeight = 24.dp,
        viewportWidth = 24f,
        viewportHeight = 24f
    ).apply {
        // Map SVG paths to PathBuilder commands
        // ...
    }.build()
```

When translating UI, propose Method 1 for mass-imports, but immediately default to Method 2 if KMP resource compilation issues arise.

---

## Step 6: Enforce Conventions

### State Hoisting
- Subframe code often puts states (`isOpen`, `selectedTab`) inside the component.
- In Compose, **hoist the state** up: Pass `isOpen: Boolean` and `onOpenChange: (Boolean) -> Unit` as parameters.
- Add `modifier: Modifier = Modifier` as the first optional parameter to every UI Composable.
---

## Step 7: Verify

After generating the Composables:
1. Check imports: Are `androidx.compose.*` imports correct? Did we import the right `Res` class (`ai_pose.composeapp.generated.resources.Res`)? (Watch out for KMP replacing hyphens with underscores in package names).
2. Check preview: Ensure a `@Composable @Preview` function is provided so the user can see the Component locally without booting the App.
3. Advise the user to rebuild the project (and `pod install` if resources were appended).
