# AI Pose - Design Reference Exploration Summary
**Date:** 2026-04-14

## 1. Project Setup Status

### Current State
- **Framework:** Next.js (web) - MVP complete
- **Target Platform:** iOS (Compose Multiplatform) → Android (future)
- **Subframe Project:** ✅ Found - "Phạm Như Phong's Project" (6f0b27e61709)
- **KMP Project:** Not yet initialized

### Key Design Pages in Subframe
- **Pose Mirror Studio** (54e0d2b4-5e3d-4793-9f09-dddb5544874b) - AI Pose design reference
- Design System Foundation (0cad28a8-f62b-4e37-a28f-cec867825d4f)
- Multiple component library pages

---

## 2. Current Web App Color Scheme (globals.css)

### Primary Colors
| Token | RGB | Hex | Purpose |
|-------|-----|-----|---------|
| `--bg-primary` | n/a | #f6f1e8 | Main background (light beige) |
| `--bg-dark` | n/a | #171717 | Dark elements, borders |
| `--accent-blue` | n/a | #87ceeb | Secondary accent |
| `--accent-pink` | n/a | #e7a1b0 | Brand pink accent |
| `--accent-yellow` | n/a | #f4c542 | Tertiary accent |
| `--accent-green` | n/a | #dff5d0 | Success/positive states |
| `--text-primary` | n/a | #171717 | Text color (dark) |
| `--text-white` | n/a | #ffffff | Light text |

### Design Style
- **Theme Type:** Neo-Brutalism
- **Box Shadows:** Hard shadows (2-6px offset) - `box-shadow: 4px 4px 0px 0px #171717`
- **Borders:** 2px solid #171717 (`.neo-border`)
- **Typography:** Inter font, wide letter-spacing (0.06-0.12em)

---

## 3. Subframe Theme Configuration (Tailwind)

### Color Palette (Extracted from get_theme)

**Brand Colors**
- Primary: `rgb(231 161 176)` (pink) - 50-900 gradation
- Neutral: `rgb(255 255 255)` to `rgb(10 10 10)` (white to near-black)

**Semantic Colors**
- **Error:** Red scale (50-900)
- **Warning:** Amber scale (50-900)
- **Success:** Green scale (50-900)

**Key Tokens Used**
```
Brand Primary: #e7a1b0 (Pink)
Default Font: #171717 (Dark)
Default Background: #faf8f3 (Off-white)
Neutral Border: #e8e5df (Light border)
```

### Typography (Subframe)
| Type | Size | Weight | Line Height | Letter Spacing |
|------|------|--------|-------------|----------------|
| caption | 11px | 500 | 16px | 0.08em |
| caption-bold | 11px | 700 | 16px | 0.08em |
| body | 14px | 400 | 20px | 0em |
| body-bold | 14px | 500 | 20px | 0em |
| heading-3 | 18px | 700 | 24px | 0em |
| heading-2 | 24px | 700 | 30px | 0em |
| heading-1 | 32px | 800 | 38px | 0em |

**Font Family:** Inter (all types)

### Spacing & Sizing
- **Border Radius:** sm=8px, md=12px, lg=16px, full=9999px
- **Box Shadows:** sm, default, md, lg, overlay (increasing blur/spread)
- **Spacing Extensions:** 112-320rem for large gaps

---

## 4. Compose Multiplatform Theme Requirements

### For KMP + Compose Implementation

**Phase 1 Tasks (per spec):**

#### Theme System (Theme.kt)
```kotlin
// Required theme structure
object AppTheme {
    // Color tokens
    val colorScheme = ColorScheme(
        background: Color(0xFFF6F1E8),      // Primary bg
        surface: Color(0xFFFAF8F3),         // Card/surface bg
        foreground: Color(0xFF171717),      // Text/dark
        primary: Color(0xFFE7A1B0),         // Brand pink
        accent: Color(0xFF87CEEB)           // Sky blue
    )
    
    // Typography tokens
    val typography = Typography(
        display: TextStyle(...),     // For large headers
        screenTitle: TextStyle(...), // ~heading-2 (24px)
        body: TextStyle(...),        // 14px, 400 weight
        caption: TextStyle(...)      // 11px, 500 weight
    )
    
    // Spacing constants
    val spacing = Spacing(
        xs: 4.dp,
        sm: 8.dp,
        md: 12.dp,
        lg: 16.dp,
        xl: 24.dp,
        xxl: 32.dp
    )
    
    // Component styles
    val shapes = Shapes(...)
}
```

#### Button & Component Styles Needed
- `PrimaryButton` - Pink background (#e7a1b0), dark text
- `SecondaryButton` - Transparent, dark border
- Modifier extensions:
  - `.ghostBorder()` - 2px solid dark border
  - `.cardChrome()` - Neo-brutalism shadow (4px offset)
  - `.badgeChrome()` - Small shadow variant (2px offset)

#### Typography Mapping
| Compose | Subframe | Usage |
|---------|----------|-------|
| `display` | heading-1 | Feature titles |
| `screenTitle` | heading-2 | Screen headers (CAMERA, POSES, etc.) |
| `body` | body | Main content |
| `caption` | caption-bold | Labels, counts |

#### Color Scheme Implementation
```kotlin
// Core palette
val backgroundColor = Color(0xFFF6F1E8)
val surfaceColor = Color(0xFFFAF8F3)
val textPrimary = Color(0xFF171717)
val brandPink = Color(0xFFE7A1B0)
val accentBlue = Color(0xFF87CEEB)

// Extended palette for states
val borderColor = Color(0xFF171717)
val successGreen = Color(0xFFDFF5D0)
val warningYellow = Color(0xFFF4C542)
val errorRed = Color(0xFFE72424)  // Error-600 from Subframe
```

---

## 5. Neo-Brutalism Design System

### Visual Principles (from web app globals.css)
1. **Hard Shadows:** Solid offset shadows, no blur
   - Small: `2px 2px`
   - Medium: `3px 3px`
   - Large: `4px 4px`
   - XL: `6px 6px`

2. **Stark Borders:** 2px solid dark (#171717)

3. **Press Effects:** Translate on active state
   ```css
   transform: translate(2px, 2px);
   box-shadow: 0px 0px 0px 0px;
   ```

4. **Typography Emphasis:** 
   - Wide letter-spacing (0.06-0.12em)
   - Bold weights for UI text
   - UPPERCASE for section labels

### Animation Keyframes (for Compose)
- **slideUp:** translateY(20px) → 0, opacity fade
- **progressPulse:** opacity 1 → 0.7 → 1 (infinite)
- **flashCapture:** opacity 0 → 0.8 → 0 (0.4s)
- **shimmer:** Background position shift (loading)

---

## 6. Component Patterns from Spec

### Key Components for Compose
1. **CameraScreen**
   - Full-screen preview with pose overlay
   - Opacity slider (0-100%)
   - Grid overlay toggle (rule of thirds)
   - Gesture: pinch-to-zoom, drag to move overlay
   - Controls: capture button, gallery thumbnail, poses nav

2. **PoseCard**
   - Thumbnail image
   - Title (uppercase, bold)
   - Badge (MINE/HOT/NEW with colors)
   - Likes count optional
   - 2-column grid layout

3. **GalleryScreen**
   - Grid/List toggle
   - Date section headers (TODAY, YESTERDAY, formatted)
   - PhotoCard with favorite indicator
   - Save/Delete options

4. **ExtractScreen**
   - Image upload area
   - Progress indicator
   - Status badges (DETECTING..., DONE)
   - Name input field
   - Save button

### Shared Components
- **Badge** - Type-based (MINE/HOT/NEW/status)
- **TabSwitcher** - MY POSES / COMMUNITY
- **NavButton** - Icon-based navigation
- **PermissionScreen** - Denied/restricted states

---

## 7. Additional Resources

### Referenced in Spec
- **Subframe Design Link:** https://app.subframe.com/6f0b27e61709/design/54e0d2b4-5e3d-4793-9f09-dddb5544874b/edit?tab=design
- **Web App:** `src/app/` contains camera, poses, gallery, extract pages
- **Jazzcam Reference:** ~/Git/jazzcam/ (Theme, project structure)

### Dependencies for Theme
```kotlin
// In composeApp build.gradle.kts
commonMain.dependencies {
    implementation(compose.material3)    // Material Design 3 basis
    implementation(compose.foundation)   // Box, Text, Image
    implementation(compose.components.resources)  // Colors, strings
}
```

---

## 8. Platform-Specific Considerations

### iOS (Compose)
- SafeArea support (env constants)
- Natural scrollbar hide
- Typography: Inter font availability
- Colors: RGB vs HSV compatibility

### Future Android
- Material Design 3 compliance
- Additional accent colors if needed
- Larger touch targets (48dp minimum)
- CameraX integration

---

## 9. Implementation Checklist

### Theme.kt Structure
- [ ] Define ColorScheme data class
- [ ] Define Typography data class with TextStyle instances
- [ ] Define Spacing object with dp values
- [ ] Create Shapes with rounded corner definitions
- [ ] Implement @Composable AppTheme() provider
- [ ] Create Button composables (Primary, Secondary)
- [ ] Create Modifier extensions (ghostBorder, cardChrome, badgeChrome)

### Resources
- [ ] String resources (EN/VI) in commonMain/resources
- [ ] Color definitions in theme
- [ ] Font resource setup (Inter)

### Component Library
- [ ] Badge composable (type-parameterized)
- [ ] TabSwitcher composable
- [ ] NavButton composable
- [ ] Loading states (progress pulse animation)
- [ ] Permission denied screen

---

## Key Design Tokens Summary

| Category | Token | Value | Notes |
|----------|-------|-------|-------|
| **Background** | Primary | #f6f1e8 | Light beige |
| **Background** | Surface | #faf8f3 | Slightly darker |
| **Text** | Primary | #171717 | Near black |
| **Brand** | Pink | #e7a1b0 | Main brand color |
| **Accent** | Blue | #87ceeb | Sky blue |
| **Semantic** | Success | #dff5d0 | Light green |
| **Semantic** | Warning | #f4c542 | Amber |
| **Border** | Default | #171717 | Dark, 2px |
| **Shadow** | Neo | Offset 4px | Hard shadow style |
| **Radius** | Small | 8px | Mild rounding |
| **Radius** | Medium | 12px | Common rounding |
| **Typography** | Primary Font | Inter | All weights 400-800 |
| **Typography** | Caption | 11px, 500 | Tracked 0.08em |
| **Typography** | Body | 14px, 400 | Normal text |
| **Typography** | Heading 2 | 24px, 700 | Screen titles |

