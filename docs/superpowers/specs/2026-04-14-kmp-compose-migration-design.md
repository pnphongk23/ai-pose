# AI Pose - KMP + Compose Multiplatform Migration

**Date:** 2026-04-14  
**Status:** Draft  
**Author:** Claude + User

## Context

AI Pose hiện có:
- **Web app (Next.js)**: MVP hoàn chỉnh với camera, poses, gallery, extract features
- **iOS spec (SwiftUI)**: 6 phases trong GitHub issues (#17-#22)
- **Mục tiêu mới**: Migrate sang KMP + Compose Multiplatform để support cả iOS và Android

### Decision

Chọn **Approach 3: Gradual Migration** với modifications:
- Implement iOS first với Compose Multiplatform (không SwiftUI)
- Camera feature: Native per platform (Mijick iOS, CameraX Android sau)
- Pose extraction: API call thay vì native Vision framework
- Data layer: SQLDelight (shared)
- Android implementation: Deferred (sau Phase 6)

## Architecture

```
ai-pose/
├── composeApp/                    # Shared Compose UI
│   ├── commonMain/
│   │   ├── kotlin/
│   │   │   ├── App.kt            # Root composable
│   │   │   ├── navigation/       # Navigation setup
│   │   │   ├── ui/
│   │   │   │   ├── theme/        # Theme, Colors, Typography
│   │   │   │   ├── components/   # Shared composables
│   │   │   │   ├── screens/      # Feature screens
│   │   │   │   │   ├── camera/
│   │   │   │   │   ├── poses/
│   │   │   │   │   ├── gallery/
│   │   │   │   │   └── extract/
│   │   │   └── expect/           # expect declarations
│   │   └── resources/            # Strings, images
│   ├── iosMain/
│   │   └── kotlin/
│   │       └── actual/           # iOS actual implementations
│   └── androidMain/              # (Future)
│
├── shared/                        # Business logic (no UI)
│   ├── commonMain/
│   │   ├── kotlin/
│   │   │   ├── domain/           # Models, UseCases
│   │   │   ├── data/
│   │   │   │   ├── repository/   # Repositories
│   │   │   │   ├── local/        # SQLDelight
│   │   │   │   └── remote/       # Ktor API client
│   │   └── sqldelight/           # .sq files
│   ├── iosMain/
│   └── androidMain/
│
├── iosApp/                        # iOS native shell
│   ├── iosApp/
│   │   ├── ContentView.swift     # Hosts ComposeView
│   │   └── Camera/               # Mijick Camera integration
│   └── iosApp.xcodeproj
│
└── androidApp/                    # (Future) Android native shell
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | Compose Multiplatform 1.6+ |
| Navigation | Voyager (simpler, recommended) |
| State Management | ViewModel (moko-mvvm hoặc custom) |
| Database | SQLDelight |
| Network | Ktor Client |
| Image Loading | Coil 3 (KMP) hoặc Kamel |
| DI | Koin Multiplatform |
| Camera iOS | Mijick Camera (native) |
| Camera Android | CameraX (native, future) |

## Phase Breakdown

### Phase 1: Project Foundation & Design System

**Goal:** Setup KMP project structure và design system

**Tasks:**
1. **KMP Project Setup**
   - Khởi tạo project với Kotlin Multiplatform Wizard hoặc template
   - Configure build.gradle.kts với iOS targets (iosArm64, iosSimulatorArm64)
   - Setup CocoaPods hoặc SPM cho iOS framework
   - Verify build: `./gradlew :composeApp:iosSimulatorArm64Test`

2. **Theme System**
   - `Theme.kt`: ColorScheme, Typography, Shapes, Spacing
   - Color tokens: background, surface, foreground, primary, accent
   - Typography: display, screenTitle, body, caption
   - Spacing constants: 4, 8, 12, 16, 24, 32
   - Button styles: PrimaryButton, SecondaryButton composables
   - Modifier extensions: ghostBorder, cardChrome, badgeChrome

3. **SQLDelight Setup**
   - Add SQLDelight plugin và dependencies
   - `Pose.sq`: CREATE TABLE, queries (selectAll, selectById, insert, delete)
   - `Photo.sq`: CREATE TABLE, queries
   - Database driver: NativeSqliteDriver (iOS), AndroidSqliteDriver (Android)
   - DatabaseDriverFactory expect/actual

4. **Navigation**
   - Use Voyager (simpler API, good for this project size)
   - RootNavigation với 3 tabs: Camera, Poses, Gallery
   - Tab bar composable

**Verification:**
```bash
./gradlew :composeApp:iosSimulatorArm64Test
./gradlew :shared:iosSimulatorArm64Test
# Open Xcode, build và run trên simulator
```

### Phase 2: Camera Feature với Native Integration

**Goal:** Camera với pose overlay, sử dụng native Mijick Camera

**Tasks:**
1. **Native Camera Setup (iOS)**
   - Add Mijick/Camera SPM dependency
   - Info.plist: NSCameraUsageDescription, NSMicrophoneUsageDescription
   - CameraViewController.swift: Wrap Mijick CameraView
   - Permission handling (denied, restricted states)

2. **Compose-Native Bridge**
   - `expect` interface trong commonMain:
     ```kotlin
     expect interface CameraController {
         fun startPreview()
         fun stopPreview()
         fun capture(): ByteArray
         fun setFlashMode(mode: FlashMode)
         fun switchCamera()
     }
     
     @Composable
     expect fun CameraPreview(
         modifier: Modifier,
         controller: CameraController,
         onCapture: (ByteArray) -> Unit
     )
     ```
   - `actual` implementation trong iosMain:
     - UIKitView wrapper cho CameraViewController
     - Callback bridges

3. **CameraScreen (Compose)**
   - Full screen camera preview (native embedded)
   - Pose overlay Image với opacity Slider
   - Gesture modifiers: pointerInput for drag, pinch-to-zoom
   - Overlay controls: remove button, opacity slider
   - Capture button với flash animation (AnimatedVisibility)
   - Navigation: Gallery thumbnail (bottom-left), Poses button (bottom-right)
   - Grid overlay toggle (rule of thirds)
   - Camera switch button

4. **Capture Flow**
   - Capture photo callback từ native
   - Save to SQLDelight (Photo entity)
   - Update gallery thumbnail state

**Verification:**
- Camera preview hiển thị đúng
- Pose overlay adjustable (opacity, position, scale)
- Capture lưu photo
- Navigation hoạt động

### Phase 3: Poses Feature

**Goal:** Poses listing, detail, tab navigation

**Tasks:**
1. **PosesScreen**
   - Header Row: Title "POSES", IconButton (search), IconButton (add)
   - TabRow: "MY POSES" / "COMMUNITY" tabs
   - LazyVerticalGrid (columns = 2)
   - Section header composable (RECENT/TRENDING + count)
   - Empty state với "EXTRACT POSE" CTA
   - Loading state (CircularProgressIndicator)

2. **PoseCard Composable**
   - Card với thumbnail (AsyncImage - Coil/Kamel)
   - Pose name Text (uppercase, fontWeight = Bold)
   - Badge composable (type: MINE/HOT/NEW với colors)
   - Likes count (optional)
   - Clickable modifier → navigate

3. **PoseDetailScreen**
   - Full image preview (zoomable)
   - Metadata: name, created date
   - "USE WITH CAMERA" button → navigate to camera với pose overlay
   - Delete button với AlertDialog confirmation
   - Edit name (optional)

4. **Shared Components**
   - Badge(type: BadgeType, text: String)
   - TabSwitcher(tabs: List<String>, selected: Int, onSelect: (Int) -> Unit)
   - NavButton(icon: ImageVector, onClick: () -> Unit)

**Verification:**
- Tabs switch đúng
- Grid hiển thị poses
- Navigation to detail/camera hoạt động
- Delete xóa pose

### Phase 4: Gallery Feature

**Goal:** Photos grid/list với date grouping

**Tasks:**
1. **GalleryScreen**
   - Header: BackButton, "GALLERY" title, Grid/List toggle IconButton
   - State: viewMode (Grid/List)
   - LazyVerticalGrid (Grid) hoặc LazyColumn (List)
   - Date section headers (TODAY, YESTERDAY, formatted date) với count
   - Empty state với "OPEN CAMERA" CTA
   - Loading state

2. **PhotoCard Composable**
   - Thumbnail AsyncImage
   - Pose name badge overlay (if applicable)
   - Favorite indicator (heart icon)
   - Clickable → open detail

3. **PhotoDetailDialog**
   - Dialog hoặc full screen
   - Full image với zoom
   - Save to Photos button (expect/actual - PHPhotoLibrary iOS)
   - Delete button với confirmation
   - Favorite toggle
   - Close button

4. **GalleryViewModel**
   - Load photos từ SQLDelight
   - Group by date logic
   - Delete, toggle favorite operations

**Verification:**
- Photos hiển thị trong grid/list
- Date grouping đúng
- Save to Photos hoạt động
- Delete và favorite persist

### Phase 5: Extract Pose Feature (API)

**Goal:** Extract pose từ image via API call

**Tasks:**
1. **ExtractScreen (Compose)**
   - Header: BackButton, "EXTRACT" title, InfoButton
   - Image upload area (clickable Box)
   - expect/actual PhotosPicker integration
   - Selected image preview
   - "EXTRACT POSE" button
   - LinearProgressIndicator during extraction
   - Status badges: "DETECTING...", "DONE"
   - Extracted pose preview overlay
   - Pose name OutlinedTextField
   - "SAVE POSE" button
   - "CHANGE" image button
   - Error Snackbar

2. **PoseExtractorApi (shared)**
   - Ktor HttpClient setup trong shared module
   - `suspend fun extractPose(imageData: ByteArray): Result<ByteArray>`
   - API endpoint: `POST /api/extract-pose` (server URL from config/env)
   - Request: multipart/form-data với image
   - Response: PNG image data (pose silhouette)
   - Error handling (network, server errors)

3. **ExtractViewModel**
   - State: selectedImage, isExtracting, extractedPose, poseName, error
   - selectImage(), extractPose(), savePose() functions

4. **Supporting Utilities**
   - FileStorage expect/actual (save/load/delete image data)
   - createThumbnail(imageData: ByteArray, maxSize: Int): ByteArray

**Verification:**
- Image selection hoạt động
- API call trả về pose silhouette
- Progress updates đúng
- Pose saves to SQLDelight
- Error states handled

### Phase 6: Polish

**Goal:** Tests, localization, animations

**Tasks:**
1. **Tests**
   - SQLDelight queries tests (commonTest)
   - ViewModel unit tests
   - Repository tests với mock
   - Optional: Compose UI tests

2. **Localization**
   - String resources trong commonMain/resources
   - `strings_en.xml`, `strings_vi.xml`
   - Use stringResource() trong composables

3. **Permission Handling**
   - Camera permission flow (expect/actual)
   - Photo library permission (save/export)
   - Permission denied screen với Settings deep link

4. **Animations**
   - AnimatedVisibility cho screen transitions
   - animateContentSize cho expanding content
   - Scale animation cho card press (Modifier.clickable with interactionSource)
   - Capture flash: AnimatedVisibility với fadeIn/fadeOut
   - Progress pulse: rememberInfiniteTransition với animateFloat

**Verification:**
```bash
./gradlew :shared:allTests
./gradlew :composeApp:iosSimulatorArm64Test
```
- All tests pass
- App hiển thị đúng Vietnamese/English
- Animations smooth

## Future: Android Implementation

Deferred sau Phase 6. Sẽ cần:
- androidApp module setup
- CameraX integration (actual implementation)
- Android-specific permissions
- AndroidSqliteDriver

## Dependencies

```kotlin
// build.gradle.kts (composeApp)
commonMain.dependencies {
    implementation(compose.runtime)
    implementation(compose.foundation)
    implementation(compose.material3)
    implementation(compose.components.resources)
    
    // Navigation
    implementation("cafe.adriel.voyager:voyager-navigator:1.0.0")
    implementation("cafe.adriel.voyager:voyager-tab-navigator:1.0.0")
    
    // Image loading
    implementation("io.coil-kt.coil3:coil-compose:3.0.0")
    implementation("io.coil-kt.coil3:coil-network-ktor:3.0.0")
    
    // DI
    implementation("io.insert-koin:koin-core:3.5.0")
    implementation("io.insert-koin:koin-compose:1.1.0")
}

// build.gradle.kts (shared)
commonMain.dependencies {
    // Database
    implementation("app.cash.sqldelight:runtime:2.0.0")
    implementation("app.cash.sqldelight:coroutines-extensions:2.0.0")
    
    // Network
    implementation("io.ktor:ktor-client-core:2.3.0")
    implementation("io.ktor:ktor-client-content-negotiation:2.3.0")
    implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.0")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.0")
}

iosMain.dependencies {
    implementation("io.ktor:ktor-client-darwin:2.3.0")
    implementation("app.cash.sqldelight:native-driver:2.0.0")
}
```

## Design Reference

- **Subframe Design**: https://app.subframe.com/6f0b27e61709/design/54e0d2b4-5e3d-4793-9f09-dddb5544874b/edit?tab=design
- **Web app reference**: `src/app/` (camera, poses, gallery, extract pages)
- **Jazzcam reference**: `~/Git/jazzcam/` (Theme, project structure)

## Risk & Mitigation

| Risk | Mitigation |
|------|------------|
| Compose iOS performance | Benchmark early, fallback to native cho critical paths |
| Native camera bridge complexity | Start simple, iterate |
| SQLDelight migration từ SwiftData | Fresh start, no migration needed |
| Ktor iOS networking issues | Well-tested, fallback to URLSession if needed |

## Success Criteria

- [ ] iOS app builds và runs trên simulator
- [ ] All 6 phases complete với Compose UI
- [ ] Camera capture hoạt động với native Mijick
- [ ] Pose extraction via API thành công
- [ ] Tests pass
- [ ] App localized (VI/EN)
