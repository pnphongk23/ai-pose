# Phase 3: Poses Feature Design Spec

## Context

**Problem:** App cần màn hình quản lý poses - hiển thị danh sách, xem chi tiết, và sử dụng pose với camera.

**Trigger:** GitHub Issue #19 - [Phase 3] Poses Feature (Listing, Detail, Tabs)

**Outcome:** User có thể browse poses, xem chi tiết, và navigate tới camera với pose overlay.

## Scope

### In Scope
- PosesScreen với grid layout
- PoseCard composable
- PoseDetailScreen với actions
- PosesViewModel + PoseRepository
- Shared components (Badge, TabSwitcher, SectionHeader)
- Navigation integration (Voyager)

### Out of Scope (deferred)
- Community tab (không có data source)
- Search functionality
- Add new pose (Extract Pose - Phase 5)
- Camera integration (Phase 2)

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Project structure | Flat (`ui/screens/poses/`) | Consistent với existing code |
| Image loading | Coil 3 | KMP-native, active development |
| Navigation flow | Card → Detail → Camera | User có thể xem metadata trước khi dùng |
| Community tab | Disabled với visual indicator | Không có data, giữ UI consistency |
| Header buttons | Placeholder (toast) | Giữ UI đầy đủ, defer functionality |

## Architecture

### File Structure
```
composeApp/src/commonMain/kotlin/com/aipose/
├── ui/
│   ├── screens/
│   │   └── poses/
│   │       ├── PosesScreen.kt        # Screen + ViewModel
│   │       ├── PoseDetailScreen.kt   # Detail view
│   │       └── PoseCard.kt           # Card composable
│   ├── components/
│   │   ├── Badge.kt                  # NEW: Reusable badge
│   │   ├── TabSwitcher.kt            # NEW: Tab row
│   │   └── SectionHeader.kt          # NEW: Section header
├── data/
│   └── PoseRepository.kt             # NEW: SQLDelight wrapper
└── navigation/
    └── Navigation.kt                 # UPDATE: PosesTab content
```

### Data Flow
```
SQLDelight (Pose.sq) → PoseRepository (Flow) → PosesViewModel (StateFlow) → UI
```

### Database Access
- `DatabaseDriverFactory` (expect/actual) đã có trong `shared/`
- PoseRepository sẽ ở `composeApp/` và sử dụng generated `AiPoseDatabase` từ SQLDelight

### State Model
```kotlin
data class PosesUiState(
    val poses: List<Pose> = emptyList(),
    val isLoading: Boolean = true,
    val selectedTab: Int = 0  // 0 = MY POSES, 1 = COMMUNITY (disabled)
)

sealed class PoseDetailUiState {
    object Loading : PoseDetailUiState()
    data class Success(val pose: Pose) : PoseDetailUiState()
    object NotFound : PoseDetailUiState()
}
```

## Components

### 1. Badge
```kotlin
@Composable
fun Badge(
    text: String,
    type: BadgeType,  // MINE, HOT, NEW
    modifier: Modifier = Modifier
)

enum class BadgeType(val color: Color) {
    MINE(AiPoseColors.Primary),
    HOT(AiPoseColors.Error),
    NEW(AiPoseColors.AccentBlue)
}
```
- Sử dụng `badgeChrome()` modifier từ `Modifiers.kt`
- Uppercase text với tracking

### 2. TabSwitcher
```kotlin
@Composable
fun TabSwitcher(
    tabs: List<String>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    disabledIndices: Set<Int> = emptySet(),
    modifier: Modifier = Modifier
)
```
- Neo-brutalism styling
- Disabled state cho COMMUNITY tab

### 3. SectionHeader
```kotlin
@Composable
fun SectionHeader(
    title: String,
    count: Int,
    modifier: Modifier = Modifier
)
```
- Format: "RECENT • 5"
- Typography: Caption, uppercase

### 4. PoseCard
```kotlin
@Composable
fun PoseCard(
    pose: Pose,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
)
```
- `cardChrome()` modifier
- AsyncImage (Coil 3) với placeholder
- Badge "MINE" bottom-left
- Name below card

### 5. PosesScreen
```kotlin
@Composable
fun PosesScreen(
    viewModel: PosesViewModel,
    onPoseClick: (Long) -> Unit,
    onExtractPoseClick: () -> Unit
)
```

**States:**
- Loading: CircularProgressIndicator centered
- Empty: Illustration + "No poses yet" + CTA button
- Content: TabSwitcher + SectionHeader + LazyVerticalGrid

**Header:**
- Title "POSES"
- Search IconButton → Toast "Coming soon"
- Add IconButton → Toast "Coming soon"

### 6. PoseDetailScreen
```kotlin
@Composable
fun PoseDetailScreen(
    poseId: Long,
    viewModel: PoseDetailViewModel,
    onUseWithCamera: (Pose) -> Unit,
    onBack: () -> Unit
)
```

**Layout:**
- Back button (top-left)
- Delete button (top-right) → AlertDialog
- Full image (zoomable modifier)
- Name (editable - optional)
- Created date
- "USE WITH CAMERA" PrimaryButton

## Navigation

```kotlin
// Voyager Screen classes
class PoseDetailScreen(val poseId: Long) : Screen {
    @Composable
    override fun Content() { ... }
}

// Navigation flow
PosesTab.Content() {
    val navigator = LocalNavigator.currentOrThrow
    PosesScreen(
        onPoseClick = { id -> navigator.push(PoseDetailScreen(id)) }
    )
}
```

## Dependencies (build.gradle.kts)

```kotlin
// Coil 3 for Compose Multiplatform
implementation("io.coil-kt.coil3:coil-compose:3.0.0")
implementation("io.coil-kt.coil3:coil-network-ktor:3.0.0")
```

## Existing Code to Reuse

| File | What to reuse |
|------|---------------|
| `Modifiers.kt` | `cardChrome()`, `badgeChrome()`, `neoBorder()`, `neoShadow()` |
| `Color.kt` | `AiPoseColors` - Primary, Surface, Foreground, etc. |
| `Typography.kt` | `AiPoseTypography` - Heading1, Body, Caption |
| `Spacing.kt` | `Spacing` - xs, sm, md, lg, xl |
| `PrimaryButton.kt` | Primary action button |
| `SecondaryButton.kt` | Secondary actions |
| `Pose.sq` | SQLDelight schema - getAllPoses, getMyPoses, deletePose |

## Verification

### Manual Testing
1. Build iOS app: `./gradlew :composeApp:iosSimulatorArm64Main`
2. Run on iOS Simulator
3. Navigate to Poses tab
4. Verify: Grid displays, cards render, tap navigates to detail
5. Verify: Delete works, returns to list
6. Verify: Empty state shows when no poses

### Unit Tests (optional for Phase 3)
- PoseRepository: Query returns correct data
- PosesViewModel: State updates correctly

## Implementation Order

1. Add Coil 3 dependency
2. Create shared components (Badge, TabSwitcher, SectionHeader)
3. Create PoseRepository
4. Create PoseCard
5. Create PosesScreen + ViewModel
6. Create PoseDetailScreen + ViewModel
7. Update Navigation.kt (PosesTab)
8. Test on iOS Simulator
