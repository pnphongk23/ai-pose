# Phase 2: iOS Camera Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development hoặc superpowers:executing-plans để implement plan này task-by-task. Nếu không có superpowers, execute inline và giữ TDD checkpoints.

**Goal:** Hoàn thành Camera tab iOS vertical slice với native preview, Compose controls, capture flow, và SQLDelight persistence.

**Architecture Summary:** `composeApp` giữ UI và contract; `iosMain` giữ native camera actual implementation; `shared` giữ database provider, repository, và image persistence abstraction. Phase 2 ưu tiên `contract-first + AVFoundation-first` để ship acceptance trước.

**Tech Stack / Constraints:** Kotlin 2.0.0, Compose Multiplatform 1.6.x, Voyager, SQLDelight 2.0.0, iOS 15+, current iOS shell via `MainViewController()`. `Photo` lưu `imagePath`, không lưu raw blob. Mijick không là critical path và được ghi nhận là explicit deviation/follow-up. Phase 2 chỉ yêu cầu camera still capture, không yêu cầu audio/video recording. Flash scope cho Phase 2 được khóa ở mức contract + default `off`, không bắt buộc shipping full `off/auto/on` UI selector trong vòng này. Overlay source cho acceptance được khóa theo thứ tự ưu tiên: local placeholder asset deterministic trước, pose record load là optional enhancement nếu dữ liệu đã tồn tại. Ảnh capture được persist vào app sandbox iOS tại một thư mục nhất quán do `ImageStorage` quản lý (ưu tiên Application Support hoặc Documents, nhưng phải chốt một lựa chọn duy nhất trong implementation).

---

## File Structure

### New Files to Create

```
ai-pose/
├── composeApp/src/commonMain/kotlin/com/aipose/camera/
│   ├── CameraContract.kt
│   ├── CameraScreen.kt
│   └── CameraState.kt
│
├── composeApp/src/iosMain/kotlin/com/aipose/camera/
│   ├── CameraContract.ios.kt
│   ├── IOSCameraController.kt
│   └── IOSCameraPreview.kt
│
├── shared/src/commonMain/kotlin/com/aipose/data/
│   ├── DatabaseProvider.kt
│   ├── PhotoRepository.kt
│   └── ImageStorage.kt
│
├── shared/src/iosMain/kotlin/com/aipose/data/
│   └── ImageStorage.kt
│
└── docs/superpowers/tasks/
    └── 2026-04-17-phase2-ios-camera.md
```

### Existing Files to Update

- `composeApp/src/commonMain/kotlin/com/aipose/navigation/Navigation.kt`
- `composeApp/src/commonMain/kotlin/com/aipose/App.kt`
- `iosApp/iosApp/Info.plist`

---

## Task 1: Contract Freeze

**Files:**
- Create: `composeApp/src/commonMain/kotlin/com/aipose/camera/CameraContract.kt`
- Create: `composeApp/src/commonMain/kotlin/com/aipose/camera/CameraState.kt`

- [ ] **Step 1.1: Define camera enums and permission model**
- [ ] **Step 1.2: Define `CameraController` expect contract with async capture callback**
- [ ] **Step 1.3: Define `CameraPreview` expect composable**
- [ ] **Step 1.4: Define overlay state, overlay source state, and thumbnail state models**
- [ ] **Step 1.5: Document Mijick deviation in code-facing comments or ADR note if needed**

Expected outcome:
- Common contract ổn định cho iOS actual implementation và Compose screen.
- Không còn ambiguity giữa issue wording và implementation path.

Verification:
```bash
./gradlew :composeApp:compileKotlinIosSimulatorArm64
```

---

## Task 2: iOS Native Camera Foundation

**Files:**
- Update: `iosApp/iosApp/Info.plist`
- Create: `composeApp/src/iosMain/kotlin/com/aipose/camera/CameraContract.ios.kt`
- Create: `composeApp/src/iosMain/kotlin/com/aipose/camera/IOSCameraController.kt`
- Create: `composeApp/src/iosMain/kotlin/com/aipose/camera/IOSCameraPreview.kt`

- [ ] **Step 2.1: Add camera usage description only; do not add microphone permission unless implementation scope changes**
- [ ] **Step 2.2: Implement permission state mapping for `notDetermined`, `authorized`, `denied`, and `restricted` on iOS**
- [ ] **Step 2.3: Build AVCaptureSession preview wrapper**
- [ ] **Step 2.4: Implement capture callback returning JPEG bytes**
- [ ] **Step 2.5: Implement front/back camera switch and keep flash behavior at Phase 2 scope (`off` default, contract-ready for future expansion)**
- [ ] **Step 2.6: Handle session start/stop lifecycle safely**

Expected outcome:
- Native preview render được và capture callback hoạt động.

Verification:
- Build iOS target pass.
- Runtime: preview hiển thị, switch camera không crash.
- Runtime: denied/restricted state does not crash.

---

## Task 3: Full-Screen Camera Layout and CameraScreen

**Files:**
- Create: `composeApp/src/commonMain/kotlin/com/aipose/camera/CameraScreen.kt`
- Update: `composeApp/src/commonMain/kotlin/com/aipose/navigation/Navigation.kt`
- Update: `composeApp/src/commonMain/kotlin/com/aipose/App.kt`

- [ ] **Step 3.1: Replace `CameraTab` placeholder with `CameraScreen`**
- [ ] **Step 3.2: Ensure camera preview is full-screen and bottom nav does not shrink preview**
- [ ] **Step 3.3: Decide and implement tab bar behavior on camera screen (hidden or overlaid)**
- [ ] **Step 3.4: Embed `CameraPreview` full screen inside Compose**
- [ ] **Step 3.5: Add overlay image with opacity slider**
- [ ] **Step 3.6: Add drag and pinch gestures for overlay**
- [ ] **Step 3.7: Add remove overlay action and grid toggle**
- [ ] **Step 3.8: Add capture button, flash animation, gallery thumbnail, poses navigation button, switch camera button**

Expected outcome:
- Camera UI đạt acceptance behavior của issue #18.
- Full-screen preview is explicit, not accidental.

Verification:
- Manual runtime test: overlay move/scale/opacity works.
- `CameraTab` không còn placeholder text.
- Preview is visually full-bleed.

---

## Task 4: Overlay Source Strategy

**Files:**
- Update: `CameraState.kt`
- Update: `CameraScreen.kt`
- Optional update: repository or seed helper files

- [ ] **Step 4.1: Implement `no overlay` as default state**
- [ ] **Step 4.2: Implement local placeholder asset as the single deterministic overlay source for Phase 2 acceptance verification**
- [ ] **Step 4.3: Support loading overlay from pose record if available without making it a prerequisite for acceptance**
- [ ] **Step 4.4: Keep the placeholder asset path as the fallback path so overlay interaction can always be tested end-to-end**

Expected outcome:
- Acceptance "overlay adjustable" can be verified end-to-end even before full Poses feature exists.

Verification:
- There is at least one reproducible way to display overlay during Phase 2 testing.

---

## Task 5: Persistence Flow

**Files:**
- Create: `shared/src/commonMain/kotlin/com/aipose/data/DatabaseProvider.kt`
- Create: `shared/src/commonMain/kotlin/com/aipose/data/PhotoRepository.kt`
- Create: `shared/src/commonMain/kotlin/com/aipose/data/ImageStorage.kt`
- Create: `shared/src/iosMain/kotlin/com/aipose/data/ImageStorage.kt`
- Optional update: camera screen / controller wiring files

- [ ] **Step 5.1: Create shared database provider with explicit ownership/lifecycle**
- [ ] **Step 5.2: Create image storage abstraction for writing JPEG bytes to a single, explicit iOS app sandbox location chosen once for this phase**
- [ ] **Step 5.3: Create photo repository to insert and query latest photo**
- [ ] **Step 5.4: Wire capture callback -> storage -> repository insert, keeping the stored file path identical to the path saved into `Photo.imagePath`**
- [ ] **Step 5.5: Update thumbnail state from latest photo using the same provider/repository path**

Expected outcome:
- Capture tạo file ảnh và có record mới trong `Photo`.
- Thumbnail state does not drift from database state.

Verification:
```bash
./gradlew :shared:generateCommonMainAiPoseDatabaseInterface
./gradlew :shared:compileKotlinIosSimulatorArm64
```
- Manual or debug verification: latest photo record exists and thumbnail matches it.

---

## Task 6: Permission + Lifecycle Hardening

**Files:**
- Update: `CameraScreen.kt`
- Update: iOS camera actual implementation files

- [ ] **Step 6.1: Add denied/restricted fallback UI with explicit user-facing message and a deterministic recovery path (for example, a Settings CTA if that fits the current shell)**
- [ ] **Step 6.2: Ensure tab switching stops/restarts preview correctly**
- [ ] **Step 6.3: Ensure background/foreground transitions do not crash session**
- [ ] **Step 6.4: Guard repeated capture / unavailable camera states**

Expected outcome:
- Camera flow ổn định trong lifecycle thật.

Verification:
- Tab in/out, app background/foreground, repeated capture không crash.
- Denied/restricted fallback shows a clear state and does not leave a broken preview surface behind.

---

## Task 7: Final Verification

**Files:**
- No new code expected, chỉ verification artifacts / fixes if needed

- [ ] **Step 7.1: Run compile/build verification commands**
- [ ] **Step 7.2: Run iOS app on simulator**
- [ ] **Step 7.3: Run iOS app on physical device**
- [ ] **Step 7.4: Verify issue acceptance bullets one-by-one**
- [ ] **Step 7.5: Record evidence for preview, capture, overlay interaction, thumbnail update, and DB insert using one explicit verification path (for example: repository query of latest photo + visible thumbnail match + debug output of saved path/record id)**

Expected outcome:
- Phase 2 có bằng chứng rõ ràng và đủ điều kiện chuyển sang implementation review.

Verification checklist:
- [ ] Preview camera hiển thị đúng
- [ ] Permission flow đúng
- [ ] Overlay adjustable for opacity, position, scale
- [ ] Capture callback trả dữ liệu đúng
- [ ] DB insert thành công
- [ ] Thumbnail cập nhật
- [ ] Navigation hooks hoạt động
- [ ] Physical device verification completed

---

## Recommended Commit Checkpoints

- [ ] `docs: add phase 2 camera design and execution artifacts`
- [ ] `feat: add camera contract and iOS native camera bridge`
- [ ] `feat: implement full-screen compose camera screen and controls`
- [ ] `feat: persist captured photos to SQLDelight`
- [ ] `fix: harden camera permission and lifecycle`
