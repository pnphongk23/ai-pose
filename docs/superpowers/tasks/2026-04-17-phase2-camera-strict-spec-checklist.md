# G0 Checklist — Phase 2 Camera Strict Spec (Issue #18)

**Date:** 2026-04-17  
**Branch:** `feature/pharse-2`  
**Issue:** https://github.com/pnphongk23/ai-pose/issues/18

---

## A. Spec Lock

- [x] A1. Freeze issue #18 acceptance scope 2.1 → 2.4 as non-negotiable
- [x] A2. Freeze UI source-of-truth artifacts:
  - [x] A2.1 `src/app/camera/page.js` reference behavior (mapped to KMP parity checks)
  - [ ] A2.2 Subframe design link in issue (not accessible from extracted issue content; needs manual confirm)
- [x] A3. Confirm strict interpretation: Mijick integration is required (explicit user confirmation)

---

## B. Baseline FAIL Audit (RED)

### B1. Issue 2.1 Native Camera Setup (iOS)
- [x] B1.1 Mijick/Camera dependency present in iOS host
  - Evidence: `iosApp/Podfile` now includes `pod 'MijickCamera', '~> 3.0.0'`; `pod install` resolved `MijickCamera (3.0.1)` and `Podfile.lock` contains Mijick entries.
- [ ] B1.2 `CameraViewController.swift` wrapper exists and is active path
  - Evidence: file missing at `iosApp/iosApp/CameraViewController.swift`.
- [x] B1.3 Permission states denied/restricted handled with fallback UI
  - Evidence: `CameraScreen.kt` denied/restricted overlay + `Open Settings` CTA.

### B2. Issue 2.2 Compose-Native Bridge
- [x] B2.1 `expect` camera contract matches required API shape
  - Evidence: `CameraContract.kt` has `CameraController` expect + `CameraPreview` expect + capture callback.
- [ ] B2.2 `actual` iOS bridge is UIKitView + Mijick-backed VC
  - Evidence: `IOSCameraPreview.kt` uses `UIKitView` + `AVCaptureVideoPreviewLayer`; `IOSCameraController.kt` is AVFoundation-only.
- [x] B2.3 Capture callback bridge returns data to Compose path
  - Evidence: `CameraScreen.kt` uses `controller.capture { bytes -> ... }` and persists result.

### B3. Issue 2.3 CameraScreen UI
- [x] B3.1 Full-screen native embedded preview
- [x] B3.2 Pose overlay + opacity slider
- [x] B3.3 Drag/pinch gestures on overlay
- [x] B3.4 Remove overlay button
- [x] B3.5 Capture FAB + flash animation
- [x] B3.6 Gallery thumb bottom-left -> Gallery
- [x] B3.7 Poses action bottom-right -> Poses
- [x] B3.8 Rule-of-thirds grid toggle
- [x] B3.9 Front/back camera switch button
- [ ] B3.10 Visual parity against reference (layout/control hierarchy)
  - Evidence: not yet validated with side-by-side simulator/device screenshot parity pass.

### B4. Issue 2.4 Capture Flow
- [x] B4.1 Native capture callback reaches Compose
- [x] B4.2 Save to SQLDelight Photo entity
- [x] B4.3 Gallery thumbnail state updates after capture

---

## C. Verification Matrix (must pass before closeout)

### C1. Simulator
- [ ] C1.1 `./gradlew :composeApp:compileKotlinIosSimulatorArm64`
- [ ] C1.2 Camera screen smoke test
- [ ] C1.3 Capture -> DB -> thumbnail smoke test

### C2. Physical Device (mandatory)
- [ ] C2.1 First-launch permission prompt behavior
- [ ] C2.2 Denied/restricted fallback + Open Settings action
- [ ] C2.3 Preview runtime stability on device camera
- [ ] C2.4 Capture flow works repeatedly without crash
- [ ] C2.5 Front/back switch and overlay gestures work

---

## D. Exit Criteria for G0

- [x] D1. Baseline FAIL/PASS map for all B-items recorded
- [x] D2. Mismatch list finalized and ordered by dependency (engine -> bridge -> UI -> flow)
- [x] D3. Approved to move G1/G2 implementation (user confirmed strict Mijick path)

---

## Mismatch Matrix (2.1 / 2.2 / 2.3 / 2.4)

| Area | Requirement | Current | Status | Priority |
|---|---|---|---|---|
| 2.1 | Mijick dependency in iOS host | Podfile + lock include MijickCamera | PASS | P0 |
| 2.1 | `CameraViewController.swift` wrapper | File missing | FAIL | P0 |
| 2.2 | UIKitView + Mijick VC bridge | UIKitView + raw AVFoundation | FAIL | P0 |
| 2.2 | Capture callback to Compose | Implemented | PASS | P1 |
| 2.3 | UI controls/features | Mostly implemented | PASS/PARTIAL | P1 |
| 2.3 | Strict visual parity with web reference | Not evidenced | FAIL (pending evidence) | P1 |
| 2.4 | Capture -> DB -> thumbnail | Implemented in code | PASS (runtime evidence pending) | P1 |

---

## Evidence — Phase 2 Mijick Swift 6 Remediation Attempt (2026-04-18)

### Remediation option (1): Podfile post_install compatibility flags

**Changes applied to `iosApp/Podfile`:**
- Added block in `post_install` for targets `['MijickCamera', 'MijickTimer']`:
  - `SWIFT_VERSION = '5.9'`
  - `SWIFT_STRICT_CONCURRENCY = 'minimal'`

**Commands run:**
```bash
cd iosApp && pod install
xcodebuild -workspace iosApp.xcworkspace -scheme iosApp -sdk iphonesimulator \
  -destination 'id=C147AB30-C3E9-41BF-AFD7-EDD8FCD31E1A' build
```

**Result: BUILD FAILED**

The Podfile build-settings approach does NOT suppress the Swift 6 compiler errors. The pod sources
are compiled by the Swift 6 toolchain regardless of `SWIFT_VERSION` / `SWIFT_STRICT_CONCURRENCY`
settings because those settings are not forwarded to the per-file compile invocation in this
Xcode/CocoaPods version.

**Remaining blocker (all in one file):**
```
Pods/MijickCamera/Sources/Public/UI/Public+UI+MCameraScreen.swift
  - ~40 errors: "call to main actor-isolated instance method ... in a synchronous nonisolated context"
  - "main actor-isolated property 'attributes' can not be referenced from a nonisolated context"
```
Root cause: `MCameraScreen` calls `@MainActor`-isolated methods from a nonisolated `View` body.
This is a bug in MijickCamera 3.0.x — not fixable purely via build settings.

**Required next remediation (option 2):** Either:
- A) Pin to MijickCamera version that pre-dates the Swift 6 `@MainActor` annotations (e.g. `< 2.x`)
- B) Use a local podspec with `Public+UI+MCameraScreen.swift` patched to add `@MainActor` on the struct or wrap calls in `Task { @MainActor in ... }`
- C) Add a `script_phase` that patches the file post-fetch before compilation

---

## Evidence Commands Run (G0 + G1 + G2.1)

```bash
git -C /Users/phamnhuphong/Git/ai-pose-pharse-2 status -sb
sed -n '1,120p' /Users/phamnhuphong/Git/ai-pose-pharse-2/iosApp/Podfile
test -f /Users/phamnhuphong/Git/ai-pose-pharse-2/iosApp/iosApp/CameraViewController.swift && echo exists || echo missing
grep -n "AVCapture\|Mijick\|MCamera" /Users/phamnhuphong/Git/ai-pose-pharse-2/composeApp/src/iosMain/kotlin/com/aipose/camera/IOSCameraController.kt
grep -n "expect class CameraController\|expect fun CameraPreview\|capture(onResult" /Users/phamnhuphong/Git/ai-pose-pharse-2/composeApp/src/commonMain/kotlin/com/aipose/camera/CameraContract.kt
grep -n "DENIED\|RESTRICTED\|Open Settings" /Users/phamnhuphong/Git/ai-pose-pharse-2/composeApp/src/commonMain/kotlin/com/aipose/camera/CameraScreen.kt
cd /Users/phamnhuphong/Git/ai-pose-pharse-2 && ./gradlew :composeApp:compileKotlinIosSimulatorArm64
cd /Users/phamnhuphong/Git/ai-pose-pharse-2/iosApp && pod install
grep -n "MijickCamera" /Users/phamnhuphong/Git/ai-pose-pharse-2/iosApp/Podfile
grep -n "MijickCamera" /Users/phamnhuphong/Git/ai-pose-pharse-2/iosApp/Podfile.lock
```

Baseline result:
- `./gradlew :composeApp:compileKotlinIosSimulatorArm64` => BUILD SUCCESSFUL (pre-change and post-pod-install).
- `pod install` => Installed `MijickCamera (3.0.1)`.
- Remaining P0 blockers are bridge path (`CameraViewController.swift` + Mijick-backed UIKit bridge).


---

## Next Gate Sequence (commit-sized, strict-spec)

1. ✅ **G2.1 (P0):** Add Mijick dependency + install pods.
2. **G2.2 (P0):** Create `CameraViewController.swift` wrapping Mijick controller.
3. **G2.3 (P0):** Rewire `CameraContract.ios.kt` + `IOSCameraPreview.kt` to host Mijick VC via UIKitView.
4. **G2.4 (P0):** Connect permission/capture/switch callbacks through Mijick path.
5. **G3.1 (P1):** UI parity polishing against `src/app/(shell)/camera/page.js` and capture screenshots.
6. **G4.1 (P1):** Simulator compile + smoke tests.
7. **G4.2 (P1):** Physical device verification matrix + evidence logs/screens.

Immediate next action: start G2.2 with a minimal `CameraViewController.swift` that hosts `MCamera().startSession()` and exposes captured image callback hook for KMP bridge wiring.

### G2.2 Unblock Evidence — 2026-04-18 (MijickCamera actor-isolation patch)
- Patched local pod file: `iosApp/Pods/MijickCamera/Sources/Public/UI/Public+UI+MCameraScreen.swift`.
- Minimal fix applied: annotated main protocol-extension blocks as `@MainActor` to align wrapper API context with main-actor-isolated `CameraManager` calls.
  - Added `@MainActor` before methods extension (`captureOutput` through `setGridVisibility`).
  - Added `@MainActor` before both attributes extensions (`cameraOutputType`…`isGridVisible`, and `hasFlash`…`deviceOrientation`).
- Verification run:
  - Command: `cd /Users/phamnhuphong/Git/ai-pose-pharse-2/iosApp && xcodebuild -workspace iosApp.xcworkspace -scheme iosApp -sdk iphonesimulator -destination 'id=C147AB30-C3E9-41BF-AFD7-EDD8FCD31E1A' build`
  - First retry hit transient build-db lock.
  - Final result: `** BUILD SUCCEEDED **`.
- Result: actor-isolation compile blocker in `Public+UI+MCameraScreen.swift` is unblocked on current Xcode/Swift toolchain.
