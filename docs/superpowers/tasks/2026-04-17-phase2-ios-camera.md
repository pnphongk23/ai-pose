# Phase 2: iOS Camera Tasks

**Issue:** [#18](https://github.com/pnphongk23/ai-pose/issues/18)  
**Scope:** iOS camera vertical slice only  
**Execution Mode:** Contract-first, AVFoundation-first, acceptance-driven

---

## M0: Contract Freeze

### Task M0.1
**Objective:** Chốt camera contract và state model cho Phase 2.  
**Files touched:**
- `composeApp/src/commonMain/kotlin/com/aipose/camera/CameraContract.kt`
- `composeApp/src/commonMain/kotlin/com/aipose/camera/CameraState.kt`

**Implementation steps:**
- [ ] Define `CameraPermissionState`
- [ ] Define `CameraFacing`
- [ ] Define `FlashMode`
- [ ] Define `CameraController` expect API
- [ ] Define `CameraPreview` expect composable
- [ ] Define overlay state, overlay source state, and thumbnail state
- [ ] Encode async capture callback only

**Verification:**
- [ ] `./gradlew :composeApp:compileKotlinIosSimulatorArm64`
- [ ] Contract uses async capture callback only

**Dependencies / blockers:**
- None

### Task M0.2
**Objective:** Khóa deviation về Mijick và engine path.  
**Files touched:**
- `docs/superpowers/specs/2026-04-17-phase2-ios-camera-design.md`
- `docs/superpowers/plans/2026-04-17-phase2-ios-camera.md`

**Implementation steps:**
- [ ] Record `AVFoundation-first` as chosen engine path
- [ ] Record Mijick as explicit follow-up, not hidden omission

**Verification:**
- [ ] Docs clearly state decision and implications

**Dependencies / blockers:**
- None

---

## M1: Native Preview + Permission

### Task M1.1
**Objective:** Thêm iOS permission strings.  
**Files touched:**
- `iosApp/iosApp/Info.plist`

**Implementation steps:**
- [ ] Add `NSCameraUsageDescription`
- [ ] Add `NSMicrophoneUsageDescription`

**Verification:**
- [ ] App requests permission instead of crashing

**Dependencies / blockers:**
- M0.1 complete

### Task M1.2
**Objective:** Build iOS actual camera controller và preview wrapper.  
**Files touched:**
- `composeApp/src/iosMain/kotlin/com/aipose/camera/CameraContract.ios.kt`
- `composeApp/src/iosMain/kotlin/com/aipose/camera/IOSCameraController.kt`
- `composeApp/src/iosMain/kotlin/com/aipose/camera/IOSCameraPreview.kt`

**Implementation steps:**
- [ ] Implement permission mapping
- [ ] Implement AVCaptureSession setup
- [ ] Implement preview layer host
- [ ] Implement `startPreview()` and `stopPreview()`
- [ ] Implement `switchCamera()`
- [ ] Implement `setFlashMode(...)`
- [ ] Implement `capture(onResult)` with JPEG bytes

**Verification:**
- [ ] Preview visible on iOS simulator/device
- [ ] Switch camera works
- [ ] Capture callback returns non-empty bytes
- [ ] Denied/restricted path does not crash

**Dependencies / blockers:**
- M0.1 complete
- Physical device preferred for realistic camera validation

---

## M2: Full-Screen CameraScreen UI

### Task M2.1
**Objective:** Replace camera placeholder with real full-screen screen.  
**Files touched:**
- `composeApp/src/commonMain/kotlin/com/aipose/navigation/Navigation.kt`
- `composeApp/src/commonMain/kotlin/com/aipose/camera/CameraScreen.kt`
- `composeApp/src/commonMain/kotlin/com/aipose/App.kt`

**Implementation steps:**
- [ ] Render `CameraScreen` from `CameraTab`
- [ ] Ensure preview is full-screen
- [ ] Hide or overlay `BottomNavigation` so it does not shrink preview

**Verification:**
- [ ] Camera tab no longer shows placeholder text
- [ ] Preview is visually full-bleed

**Dependencies / blockers:**
- M1.2 complete

### Task M2.2
**Objective:** Implement overlay controls.  
**Files touched:**
- `composeApp/src/commonMain/kotlin/com/aipose/camera/CameraScreen.kt`
- `composeApp/src/commonMain/kotlin/com/aipose/camera/CameraState.kt`

**Implementation steps:**
- [ ] Add `no overlay` default state
- [ ] Add deterministic overlay source for Phase 2 verification
- [ ] Add opacity slider
- [ ] Add drag gesture
- [ ] Add pinch-to-zoom gesture
- [ ] Add remove overlay action
- [ ] Add rule-of-thirds grid toggle

**Verification:**
- [ ] Overlay can move
- [ ] Overlay can scale
- [ ] Opacity changes visually
- [ ] Remove resets overlay state
- [ ] Overlay can be shown reproducibly during test

**Dependencies / blockers:**
- M2.1 complete

### Task M2.3
**Objective:** Implement main camera controls.  
**Files touched:**
- `composeApp/src/commonMain/kotlin/com/aipose/camera/CameraScreen.kt`

**Implementation steps:**
- [ ] Add capture button
- [ ] Add flash animation
- [ ] Add switch camera button
- [ ] Add gallery thumbnail button
- [ ] Add poses button

**Verification:**
- [ ] Buttons respond correctly
- [ ] Capture triggers flash animation
- [ ] Gallery/Poses hook navigates to correct tab

**Dependencies / blockers:**
- M2.1 complete

---

## M3: Capture + DB Persistence

### Task M3.1
**Objective:** Add shared persistence services with clear ownership.  
**Files touched:**
- `shared/src/commonMain/kotlin/com/aipose/data/DatabaseProvider.kt`
- `shared/src/commonMain/kotlin/com/aipose/data/PhotoRepository.kt`
- `shared/src/commonMain/kotlin/com/aipose/data/ImageStorage.kt`
- `shared/src/iosMain/kotlin/com/aipose/data/ImageStorage.kt`

**Implementation steps:**
- [ ] Create `AiPoseDatabase` provider with explicit lifecycle/ownership
- [ ] Create image storage abstraction
- [ ] Implement iOS file write to documents/cache dir
- [ ] Implement repository insert and latest-photo query

**Verification:**
- [ ] Stored file path exists
- [ ] Repository can insert and read latest photo
- [ ] Latest thumbnail query uses same provider path as insert

**Dependencies / blockers:**
- M0.1 complete

### Task M3.2
**Objective:** Wire capture callback to persistence and thumbnail update.  
**Files touched:**
- `composeApp/src/commonMain/kotlin/com/aipose/camera/CameraScreen.kt`
- `composeApp/src/iosMain/kotlin/com/aipose/camera/CameraContract.ios.kt`
- Any repository wiring files

**Implementation steps:**
- [ ] Receive bytes from native capture callback
- [ ] Persist bytes to image file
- [ ] Insert SQLDelight `Photo`
- [ ] Refresh latest thumbnail state from repository

**Verification:**
- [ ] New `Photo` row exists after capture
- [ ] Thumbnail updates immediately
- [ ] Thumbnail state matches latest persisted photo

**Dependencies / blockers:**
- M1.2 complete
- M3.1 complete

---

## M4: Hardening + Acceptance

### Task M4.1
**Objective:** Handle permission fallback and camera unavailability.  
**Files touched:**
- `CameraScreen.kt`
- iOS actual camera files

**Implementation steps:**
- [ ] Add denied/restricted UI
- [ ] Prevent invalid capture when camera unavailable
- [ ] Surface minimal user-friendly messages

**Verification:**
- [ ] Denied/restricted states show fallback UI
- [ ] No crash when camera unavailable

**Dependencies / blockers:**
- M2.3 complete

### Task M4.2
**Objective:** Harden lifecycle.  
**Files touched:**
- iOS actual camera files
- `CameraScreen.kt`

**Implementation steps:**
- [ ] Stop preview on tab exit if needed
- [ ] Restart on tab return
- [ ] Handle app background/foreground transitions
- [ ] Guard repeated captures

**Verification:**
- [ ] Background/foreground works
- [ ] Tab switching does not crash preview

**Dependencies / blockers:**
- M1.2 complete

### Task M4.3
**Objective:** Final acceptance verification.  
**Files touched:**
- No new code expected except fixes

**Implementation steps:**
- [ ] Run build/compile commands
- [ ] Test acceptance bullets one by one on simulator
- [ ] Test preview/capture/permission on physical device
- [ ] Capture evidence for preview, capture, DB insert, thumbnail update

**Verification:**
- [ ] `./gradlew :shared:generateCommonMainAiPoseDatabaseInterface`
- [ ] `./gradlew :composeApp:compileKotlinIosSimulatorArm64`
- [ ] Camera preview displays correctly
- [ ] Overlay adjustable for opacity, position, scale
- [ ] Photo capture works and saves to DB
- [ ] Navigation to Gallery/Poses works
- [ ] Physical device verification completed

**Dependencies / blockers:**
- M4.1 complete
- M4.2 complete
