# Gallery Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the Gallery tab so users can browse, view, save, delete, and favorite captured photos stored in SQLDelight.

**Architecture:** Data flows from SQLDelight → `PhotoRepository` (shared module) → `GalleryViewModel` (composeApp) → `GalleryScreen` / `PhotoDetailDialog`. Platform-specific photo saving is handled via `expect/actual`. Navigation is wired through Voyager tabs.

**Tech Stack:** Kotlin Multiplatform, Compose Multiplatform, SQLDelight, Voyager, Coil3, coroutines/Flow.

**Spec:** `docs/superpowers/specs/2026-04-20-gallery-feature-design.md`

**Execution rules:**
- ❌ Không commit tại từng task — chỉ commit **một lần duy nhất** ở Task 8 (task cuối)
- ✅ Sau mỗi task chạy lint/build check: `./gradlew :composeApp:compileKotlinIosSimulatorArm64` — phải pass trước khi chuyển task tiếp
- ✅ Mỗi subagent dùng skill `mobilewright` hoặc KMP/Compose reference khi cần API chuẩn

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `shared/…/data/PhotoRepository.kt` | Modify | Add `getAllPhotos`, `deletePhoto`, `toggleFavorite` |
| `composeApp/…/theme/Color.kt` | Modify | Add `AccentBlue` token |
| `composeApp/…/theme/Typography.kt` | Modify | Add `GalleryTitle` style |
| `composeApp/…/gallery/GalleryViewModel.kt` | Create | UI state, date grouping, actions |
| `composeApp/…/gallery/PhotoCard.kt` | Create | Thumbnail composable |
| `composeApp/…/gallery/PhotoDetailDialog.kt` | Create | Full-screen image viewer + actions |
| `composeApp/…/gallery/GalleryScreen.kt` | Create | Gallery screen, grid/list layout |
| `composeApp/…/platform/SaveToPhotos.kt` | Create | `expect` declaration |
| `composeApp/src/iosMain/…/SaveToPhotos.ios.kt` | Create | iOS `actual` using PHPhotoLibrary |
| `composeApp/src/commonMain/…/SaveToPhotos.common.kt` | Create | Fallback `actual` returning false |
| `composeApp/…/navigation/Navigation.kt` | Modify | Replace placeholder with `GalleryScreen` |

---

### Task 1: Add theme tokens

**Goal:** Add the `AccentBlue` color and `GalleryTitle` typography style so all subsequent UI tasks can reference them.

- [ ] Add `AccentBlue = Color(0xFF87CEEB)` to `AiPoseColors` in `Color.kt`
- [ ] Add `GalleryTitle` text style (22sp, ExtraBold) to `AiPoseTypography` in `Typography.kt`
- [ ] Confirm no existing references to `AccentBlue` or `GalleryTitle` are broken
- [ ] Build check: `./gradlew :composeApp:compileKotlinIosSimulatorArm64` — must pass before proceeding

---

### Task 2: Extend PhotoRepository

**Goal:** Expose the three photo operations needed by the Gallery — stream all photos, delete, and toggle favorite — from the shared data layer.

- [ ] Add `getAllPhotos(): Flow<List<Photo>>` using the existing `getAllPhotos` SQL query, following the same `asFlow().mapToList(Dispatchers.Default)` pattern as `PoseRepository`
- [ ] Add `suspend fun deletePhoto(id: Long)` calling `queries.deletePhoto(id)`
- [ ] Add `suspend fun toggleFavorite(id: Long)` calling `queries.toggleFavorite(id)`
- [ ] Verify all three SQL queries already exist in `Photo.sq` (they do — no schema changes needed)
- [ ] Build check: `./gradlew :composeApp:compileKotlinIosSimulatorArm64` — must pass before proceeding

---

### Task 3: GalleryViewModel

**Goal:** Encapsulate all gallery state and business logic — photo list, date grouping, view mode, selected photo, and all user actions.

- [ ] Define `ViewMode` enum: `GRID`, `LIST`
- [ ] Define `GalleryUiState` data class with fields: `photos`, `groupedByDate`, `isLoading`, `viewMode`, `selectedPhoto`
- [ ] Implement date grouping logic: parse `createdAt` epoch millis → compare to today/yesterday in local time → produce `"TODAY"` / `"YESTERDAY"` / `"MMM DD"` uppercase keys
- [ ] Implement `load()` — collect `getAllPhotos()` flow, update state, set `isLoading = false` on first emission
- [ ] Implement `toggleViewMode()`, `deletePhoto(id)`, `toggleFavorite(id)`, `selectPhoto(photo?)`
- [ ] Follow the same ViewModel pattern used in `PosesViewModel` (no DI framework, coroutines, `collectLatest`)
- [ ] Build check: `./gradlew :composeApp:compileKotlinIosSimulatorArm64` — must pass before proceeding

---

### Task 4: PhotoCard composable

**Goal:** Render a single captured photo as a square neo-brutalism card with a pose badge, time label, and favorite heart.

- [ ] Square aspect ratio container using `cardChrome()` modifier
- [ ] `AsyncImage` (coil3) with `ContentScale.Crop`; blank/null path → centered `Icons.Default.Image` placeholder (no crash)
- [ ] Pose name badge top-right: color cycles by `photo.id % 4` across `[Primary, Warning, AccentBlue, Success]`; use `badgeChrome(color)` modifier
- [ ] Bottom row: formatted time string at 60% alpha (Caption 9sp) + heart icon (filled `Primary` if `isFavorite == 1`, `Subtext` otherwise)
- [ ] Follow the `PoseCard` composable as a structural reference
- [ ] Build check: `./gradlew :composeApp:compileKotlinIosSimulatorArm64` — must pass before proceeding

---

### Task 5: PhotoDetailDialog

**Goal:** Show a full-screen overlay where the user can zoom the image, save it to the device, delete it (with confirmation), and toggle favorite.

- [ ] Use `Dialog(onDismissRequest)` wrapping a full-screen `Box`
- [ ] `AsyncImage` with `Modifier.transformable` for pinch-to-zoom using `rememberTransformableState`
- [ ] Top bar: close button (ChevronLeft) aligned top-left, calls `onDismiss`
- [ ] Bottom action bar: SAVE button (`AccentBlue` bg) + DELETE button (`Primary` bg) + favorite toggle heart
- [ ] DELETE flow: tap → `AlertDialog` confirmation → on confirm call `onDelete(photo.id)` → dialog closes
- [ ] SAVE flow: call `saveImageToPhotos(photo.imagePath, platformContext)` → on `false` result show a snackbar/toast with "Save failed"
- [ ] Build check: `./gradlew :composeApp:compileKotlinIosSimulatorArm64` — must pass before proceeding

---

### Task 6: GalleryScreen

**Goal:** Assemble the full Gallery tab screen — header with toggle controls, date-grouped scrollable grid/list, and all three states (loading, empty, populated).

- [ ] Header row: back nav button + `"GALLERY"` title (`GalleryTitle` style) + GRID/LIST toggle buttons
  - Active toggle: `AccentBlue` bg; inactive: `Background` bg; both use `neoBorder()` + `neoShadow()`
- [ ] **Loading state:** `CircularProgressIndicator` centered, shown when `isLoading == true`
- [ ] **Empty state:** neo-brutalism card with 📸 icon + "NO PHOTOS YET" text + `PrimaryButton("OPEN CAMERA")` → calls `onOpenCamera`
- [ ] **Populated state — GRID mode:** `LazyVerticalGrid(GridCells.Fixed(2))` with 8dp gap; date section headers via `SectionHeader`
- [ ] **Populated state — LIST mode:** `LazyColumn`, `PhotoCard` full-width; same date section headers
- [ ] Tapping a `PhotoCard` → `viewModel.selectPhoto(photo)` → show `PhotoDetailDialog`
- [ ] `LaunchedEffect` to call `viewModel.load()` on entry (same pattern as `PosesScreen`)
- [ ] Build check: `./gradlew :composeApp:compileKotlinIosSimulatorArm64` — must pass before proceeding

---

### Task 7: SaveToPhotos expect/actual

**Goal:** Provide a cross-platform function to save an image file to the device photo library, with a safe fallback.

- [ ] Declare `expect fun saveImageToPhotos(imagePath: String, context: Any?): Boolean` in a commonMain file
- [ ] iOS `actual`: use `PHPhotoLibrary.shared().performChanges` to create a photo asset from the file URL at `imagePath`; return `true` on success, `false` on error
- [ ] iOS: verify `NSPhotoLibraryAddUsageDescription` key is present in `Info.plist` — add it if missing
- [ ] commonMain fallback `actual`: return `false` (no-op)
- [ ] Build check: `./gradlew :composeApp:compileKotlinIosSimulatorArm64` — must pass before proceeding

---

### Task 8: Wire navigation

**Goal:** Replace the Gallery placeholder with the real `GalleryScreen`, correctly integrated into the Voyager tab navigator.

- [ ] Create a `GalleryListScreen : Screen` class that instantiates `GalleryViewModel` with `remember` and passes `onOpenCamera = { tabNavigator.current = CameraTab }`
- [ ] Replace `PlaceholderScreen("Gallery")` in `GalleryTab.Content()` with `Navigator(GalleryListScreen())`
- [ ] Verify back navigation works: tapping back in detail dialog dismisses it without popping the tab
- [ ] Final build check: `./gradlew :composeApp:compileKotlinIosSimulatorArm64` — must pass
- [ ] Commit toàn bộ: `git add -A && git commit -m "feat: implement Gallery feature (PhotoRepository, GalleryViewModel, PhotoCard, PhotoDetailDialog, GalleryScreen, SaveToPhotos, navigation)"`

---

## Acceptance Checklist

- [ ] Photos load from SQLDelight and display in 2-col grid grouped by date
- [ ] Grid ↔ List toggle works; active state shows AccentBlue background
- [ ] Tapping a photo opens full-screen detail with pinch-zoom
- [ ] SAVE triggers `saveImageToPhotos` (iOS: saves to Photos app)
- [ ] DELETE with confirmation removes photo; list refreshes
- [ ] Favorite toggle persists; heart icon reflects state
- [ ] Empty state shows OPEN CAMERA button
- [ ] Loading spinner shows on initial fetch
- [ ] Photo with null/blank path shows placeholder — no crash
- [ ] Save failure shows "Save failed" message
