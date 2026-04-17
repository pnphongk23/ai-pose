# Phase 2: iOS Camera Feature with Native Integration

**Date:** 2026-04-17  
**Issue:** [#18](https://github.com/pnphongk23/ai-pose/issues/18)  
**Status:** Design Approved

## Context

Phase 1 đã setup xong Kotlin Multiplatform foundation với `composeApp`, `shared`, `iosApp`, Voyager navigation, và SQLDelight schema. Camera tab hiện tại vẫn là placeholder trong [Navigation.kt](/Users/phamnhuphong/Git/ai-pose-pharse-2/composeApp/src/commonMain/kotlin/com/aipose/navigation/Navigation.kt), trong khi issue #18 yêu cầu một vertical slice iOS camera hoàn chỉnh.

Repo hiện tại có 4 ràng buộc quan trọng:
- iOS app host Compose thông qua `MainViewController()` trong [MainViewController.kt](/Users/phamnhuphong/Git/ai-pose-pharse-2/composeApp/src/iosMain/kotlin/com/aipose/MainViewController.kt) và [AppDelegate.swift](/Users/phamnhuphong/Git/ai-pose-pharse-2/iosApp/iosApp/AppDelegate.swift).
- SQLDelight `Photo` schema lưu `imagePath`, không lưu blob, trong [Photo.sq](/Users/phamnhuphong/Git/ai-pose-pharse-2/shared/src/commonMain/sqldelight/com/aipose/Photo.sq).
- Camera issue wording nói tới Mijick, nhưng Mijick có rủi ro interop cao với kiến trúc hiện tại vì SwiftUI-first.
- `BottomNavigation` hiện được render qua `Scaffold` trong [App.kt](/Users/phamnhuphong/Git/ai-pose-pharse-2/composeApp/src/commonMain/kotlin/com/aipose/App.kt), nên cần quyết định rõ camera có full-screen thật hay không.

**Goal:** Hoàn thành iOS camera vertical slice cho Compose Multiplatform với preview native, overlay controls, capture, save vào SQLDelight, và thumbnail update.

## Scope

### In Scope
- Native iOS camera preview embedded vào Compose UI.
- Permission handling cho `notDetermined`, `authorized`, `denied`, `restricted`.
- `expect/actual` camera contract cho iOS implementation.
- `CameraScreen` thay thế placeholder `CameraTab`.
- Pose overlay với opacity slider, drag, pinch-to-zoom, remove action.
- Rule of thirds grid toggle.
- Front/back camera switch.
- Capture button với flash animation.
- Gallery thumbnail state update sau capture.
- Save captured photo vào filesystem iOS và insert record vào `Photo` table.
- Navigation hooks sang `Gallery` và `Poses` tabs.
- Full-screen camera layout ở mức user nhìn thấy preview full-bleed, không bị bottom tab bar làm co preview.

### Out of Scope
- Android camera implementation.
- Full `GalleryScreen` và `PosesScreen` implementation của Phase 3/4.
- Pose extraction flow của Phase 5.
- Save to Photos library.
- Full localization và animation polish của Phase 6.
- Engine swap sang Mijick trong cùng delivery nếu nó làm block acceptance runtime.

## Decision Record

### Decision 1: Camera Engine Path
- **Chosen:** `contract-first + AVFoundation-first`
- **Reason:** Đây là đường ngắn nhất để đạt acceptance runtime trên kiến trúc hiện tại.
- **Implication:** Phase 2 được coi là complete khi acceptance chạy được bằng native iOS camera implementation khả thi, không bắt buộc Mijick phải là engine production ngay trong vòng đầu.

### Decision 2: Mijick Deviation
- **Issue wording:** Có nhắc `Mijick Camera` cho iOS integration.
- **Current decision:** Không lấy Mijick làm critical path cho delivery này.
- **Reason:** Rủi ro SwiftUI/Swift 6/interop quá cao so với kiến trúc Compose-hosted hiện tại.
- **Follow-up:** Nếu team vẫn muốn bám literal issue checklist, mở một follow-up spike riêng để đánh giá engine swap sang Mijick sau khi Phase 2 đã chạy ổn định.

### Decision 3: Capture Contract
- **Chosen:** Dùng async callback theo issue #18:
  ```kotlin
  capture(onResult: (ByteArray) -> Unit)
  ```
- **Reason:** Native photo capture là asynchronous; callback giúp contract nhất quán với runtime thực tế.

### Decision 4: Persistence Strategy
- **Chosen:** `ByteArray -> image file path -> SQLDelight Photo.insertPhoto(...)`
- **Reason:** `Photo` schema hiện tại lưu `imagePath`, không lưu raw blob.

### Decision 5: Camera Layout
- **Chosen:** `CameraScreen` phải ưu tiên full-screen preview.
- **Reason:** Acceptance yêu cầu camera preview full-screen. `BottomNavigation` không được làm co preview.
- **Implementation note:** Nếu cần, `App.kt` sẽ ẩn hoặc overlay bottom nav khi current tab là `CameraTab`.

### Decision 6: Overlay Source
- **Chosen:** Phase 2 hỗ trợ 2 trạng thái rõ ràng:
  - `no overlay` là mặc định.
  - `overlay available` khi có pose source hợp lệ.
- **Pose source strategy:**
  - Nếu có `poseId` hoặc pose record đã tồn tại trong DB, load overlay từ đó.
  - Nếu chưa có full Poses feature, dùng test pose seed hoặc placeholder asset chỉ để verify interaction acceptance.
- **Implication:** Acceptance "overlay adjustable" vẫn kiểm chứng được ngay cả khi Phase 3 chưa hoàn thành.

## Architecture

```
composeApp/commonMain
├── camera/
│   ├── CameraContract.kt       # expect API + enums + permission/state models
│   ├── CameraScreen.kt         # Compose UI for Phase 2
│   └── CameraState.kt          # UI state / overlay state
│
composeApp/iosMain
├── camera/
│   ├── CameraContract.ios.kt   # actual implementation + UIKitView bridge
│   ├── IOSCameraController.kt  # AVCaptureSession wrapper
│   └── IOSCameraPreview.kt     # UIView / CALayer hosting preview
│
shared/commonMain
├── data/
│   ├── DatabaseProvider.kt     # singleton-ish AiPoseDatabase owner for app runtime
│   ├── PhotoRepository.kt      # write/read Photo records
│   └── ImageStorage.kt         # abstraction for file persistence
│
shared/iosMain
└── data/
    └── ImageStorage.kt         # write JPEG bytes to app documents dir
│
iosApp
└── iosApp/Info.plist           # permission strings
```

### Data Flow

1. User vào `CameraTab`.
2. Compose tạo `CameraController` và render `CameraPreview`.
3. iOS actual implementation start `AVCaptureSession` và show preview.
4. Compose layer quản lý overlay state, opacity, drag, pinch, grid toggle.
5. User tap capture -> native capture photo -> callback `ByteArray` về Compose.
6. Repository persist ảnh thành file trong app documents dir.
7. Repository insert record mới vào `Photo` table với `imagePath`, `poseId`, `poseName`, `createdAt`, `isFavorite`.
8. Camera UI refresh latest thumbnail state từ repository/database.

## Feature Breakdown

## Task 2.1: Contract and State Freeze
- Camera contract trong `commonMain`.
- Enums cho `FlashMode`, `CameraFacing`, `CameraPermissionState`.
- State cho overlay và last thumbnail.
- Overlay source strategy được encode rõ trong state.

## Task 2.2: Native iOS Camera Foundation
- Permission strings trong `Info.plist`.
- AVCaptureSession-based preview.
- Capture callback trả `ByteArray`.
- Switch front/back camera.
- Flash mode handling ở mức đủ cho Phase 2.

## Task 2.3: Compose CameraScreen
- Full-screen camera preview.
- Pose overlay với opacity slider.
- Drag và pinch controls.
- Remove overlay button.
- Grid toggle.
- Capture button với flash animation.
- Gallery thumbnail và Poses button.
- Camera switch button.

## Task 2.4: Persistence and Thumbnail Update
- `PhotoRepository`/`DatabaseProvider` tối thiểu.
- File persistence trên iOS.
- Insert vào `Photo` table.
- Thumbnail state update sau capture.

## Verification / Acceptance Criteria

### Build / Compile
```bash
./gradlew :shared:generateCommonMainAiPoseDatabaseInterface
./gradlew :composeApp:podspec
./gradlew :composeApp:compileKotlinIosSimulatorArm64
```

### Runtime Verification
- Vào tab Camera thấy native preview full-screen.
- Lần đầu xin quyền camera đúng.
- Khi denied/restricted, UI fallback hiển thị rõ ràng.
- Overlay có thể drag, pinch, và đổi opacity.
- Grid toggle hoạt động.
- Switch camera hoạt động.
- Capture trả callback dữ liệu ảnh và insert thành công vào `Photo`.
- Thumbnail cập nhật ngay sau capture.
- Nhấn vào `Gallery`/`Poses` chuyển tab đúng.

### Required Device Verification
- Simulator verification là bắt buộc cho compile/layout smoke test.
- Physical device verification là bắt buộc cho preview, capture, permission, và lifecycle closeout.

### Acceptance Mapping to Issue #18
- `2.1 Native Camera Setup`: covered.
- `2.2 Compose-Native Bridge`: covered.
- `2.3 CameraScreen`: covered.
- `2.4 Capture Flow`: covered.
- `Mijick mention`: handled as explicit deviation + follow-up decision, not hidden assumption.

## Risks / Open Questions

### Risks
- Mijick không practical cho critical path do SwiftUI/Swift 6/interop constraints.
- Memory pressure khi bridge `UIImage -> ByteArray`.
- Simulator không phản ánh đầy đủ camera lifecycle trên device thật.
- Nếu không khóa bottom nav behavior, camera preview có thể không đạt full-screen acceptance.

### Mitigations
- Chốt contract trước, thay engine sau nếu cần.
- Nén JPEG sớm và persist thành file path thay vì giữ blob lớn trong state.
- Test trên device thật trước khi coi là xong.
- Chốt layout rule: preview không bị bottom nav co lại.

### Open Questions
- Flash UI cho Phase 2 sẽ hỗ trợ `off/auto/on` đầy đủ hay chỉ cần đủ contract và default mode?
- Test pose seed sẽ được lấy từ DB seed hay local placeholder asset? Chỉ cần chốt 1 phương án nhất quán trước khi implement.
