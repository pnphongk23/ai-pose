# Gallery Feature — Design Spec

**Date:** 2026-04-20  
**Project:** AI Pose (Compose Multiplatform / KMP)  
**Status:** Approved

---

## Overview

Wire up the Gallery tab, which currently shows a placeholder. The feature lets users browse, view, save, delete, and favorite photos captured by the camera. Photos are stored in SQLDelight and displayed in a neo-brutalism UI consistent with the rest of the app.

---

## Architecture

```
shared/data/PhotoRepository     ← data layer (extended, not replaced)
composeApp/gallery/
  GalleryViewModel              ← state + business logic
  GalleryScreen                 ← top-level screen, grid/list layout
  PhotoCard                     ← thumbnail composable
  PhotoDetailDialog             ← full-screen image viewer
composeApp/platform/
  SaveToPhotos (expect/actual)  ← platform-specific photo save
composeApp/navigation/
  Navigation.kt                 ← wire GalleryTab → GalleryScreen
composeApp/theme/
  Color.kt                      ← add AccentBlue
  Typography.kt                 ← add GalleryTitle style
```

---

## Data Layer

**File:** `shared/src/commonMain/kotlin/com/aipose/data/PhotoRepository.kt`

Extend the existing `PhotoRepository` with:
- `getAllPhotos(): Flow<List<Photo>>` — streams all photos ordered by `createdAt DESC`
- `suspend fun deletePhoto(id: Long)` — removes a photo by id
- `suspend fun toggleFavorite(id: Long)` — flips `isFavorite` for a photo

All three queries already exist in `Photo.sq`. No schema changes needed.

---

## ViewModel

**File:** `composeApp/src/commonMain/kotlin/com/aipose/ui/screens/gallery/GalleryViewModel.kt`

### UiState
```
GalleryUiState(
  photos: List<Photo>                    // flat list from DB
  groupedByDate: Map<String, List<Photo>> // "TODAY" / "YESTERDAY" / "APR 19"
  isLoading: Boolean
  viewMode: ViewMode                     // GRID | LIST
  selectedPhoto: Photo?                  // non-null = detail dialog open
)
```

### Date Grouping
- Parse `createdAt` as epoch millis string
- Compare to device local date:
  - Same day → `"TODAY"`
  - Previous day → `"YESTERDAY"`
  - Older → `"MMM DD"` (e.g. `"APR 15"`) — always uppercase

### Actions
- `load()` — collects `getAllPhotos()` flow, sets `isLoading = false` on first emission
- `toggleViewMode()` — switches GRID ↔ LIST
- `deletePhoto(id)` — calls repository, photo removed from state via flow
- `toggleFavorite(id)` — calls repository, state refreshes via flow
- `selectPhoto(photo?)` — opens/closes detail dialog

---

## UI Components

### PhotoCard
**File:** `composeApp/src/commonMain/kotlin/com/aipose/ui/screens/gallery/PhotoCard.kt`

- Square aspect ratio (`aspectRatio(1f)`) with `cardChrome()` modifier
- `AsyncImage` (coil3) fills the box with `ContentScale.Crop`
- Null or blank `imagePath` → centered `Icons.Default.Image` placeholder (no crash)
- Pose name badge, top-right corner:
  - Color cycles by `photo.id % 4`: `[Primary, Warning, AccentBlue, Success]`
  - `badgeChrome(color)` modifier, rounded corners, 2dp border, neo shadow
- Bottom row:
  - Formatted time string (9sp, 60% alpha) on the left
  - Heart icon on the right: filled `Primary` if `isFavorite == 1`, `Subtext` otherwise

### PhotoDetailDialog
**File:** `composeApp/src/commonMain/kotlin/com/aipose/ui/screens/gallery/PhotoDetailDialog.kt`

- `Dialog(onDismissRequest)` wrapping a full-screen `Box`
- `AsyncImage` with `Modifier.transformable(rememberTransformableState)` for pinch-zoom
- Top bar: close button (ChevronLeft icon), left-aligned
- Bottom action bar:
  - **SAVE** button — `AccentBlue` background, Download icon — calls `saveImageToPhotos`; on failure shows a snackbar/toast "Save failed"
  - **DELETE** button — `Primary` background, Trash icon — triggers `AlertDialog` confirmation before executing delete; on confirm: `deletePhoto` → dialog auto-closes
  - **Favorite toggle** — heart icon, filled/unfilled based on state

### GalleryScreen
**File:** `composeApp/src/commonMain/kotlin/com/aipose/ui/screens/gallery/GalleryScreen.kt`

**Header row:**
- Back/nav button (left)
- `"GALLERY"` title — `GalleryTitle` style (22sp, ExtraBold, tracking)
- GRID toggle button + LIST toggle button (right)
  - Active: `AccentBlue` background
  - Inactive: `Background` color
  - Both: `neoBorder()` + `neoShadow()`

**Scrollable content:**
- Date section headers: `SectionHeader` with label + photo count badge
- **GRID mode:** `LazyVerticalGrid(GridCells.Fixed(2), gap = 8dp)` — `PhotoCard` items
- **LIST mode:** `LazyColumn` — `PhotoCard` full-width

**States:**
- **Loading:** `CircularProgressIndicator` centered
- **Empty:** neo-brutalism card with 📸 icon + "NO PHOTOS YET" text + "OPEN CAMERA" `PrimaryButton` that calls `onOpenCamera`

**Tapping a photo** → `viewModel.selectPhoto(photo)` → `PhotoDetailDialog` appears.

---

## Platform: SaveToPhotos

**expect declaration** (commonMain):
```
expect fun saveImageToPhotos(imagePath: String, context: Any?): Boolean
```

**iosMain actual:**
- Use `PHPhotoLibrary.shared().performChanges` to create an asset from the file URL
- Requires `NSPhotoLibraryAddUsageDescription` in `Info.plist`
- Returns `true` on success, `false` on failure

**commonMain fallback:**
- Returns `false` (no-op for unsupported platforms)

---

## Theme Additions

**Color.kt** — add:
```
AccentBlue = Color(0xFF87CEEB)
```

**Typography.kt** — add:
```
GalleryTitle = TextStyle(fontSize = 22.sp, fontWeight = ExtraBold, lineHeight = 28.sp)
```

---

## Navigation

`GalleryTab.Content()` replaces `PlaceholderScreen("Gallery")` with a `Navigator` containing a `GalleryListScreen`. The screen instantiates `GalleryViewModel` and wires `onOpenCamera` → `tabNavigator.current = CameraTab`.

---

## Acceptance Criteria

- [ ] Photos load from SQLDelight and display in 2-col grid grouped by date
- [ ] Grid ↔ List toggle works; active state shows `AccentBlue` background
- [ ] Tapping a photo opens full-screen detail dialog with pinch-zoom
- [ ] SAVE button triggers `saveImageToPhotos` (iOS: saves to Photos app)
- [ ] DELETE with confirmation removes photo and refreshes list
- [ ] Favorite toggle persists; heart icon reflects state
- [ ] Empty state shows with OPEN CAMERA shortcut
- [ ] Loading spinner shows during initial fetch
- [ ] Design matches neo-brutalism style: borders, shadows, typography

## Negative Cases

- Photo with null/blank `imagePath` shows placeholder icon — no crash
- `saveImageToPhotos` failure shows "Save failed" message
- Delete of last photo shows empty state immediately
