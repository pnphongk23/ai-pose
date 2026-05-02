# Code Review: Poses Community + Extract
Date: 2026-05-02

## Overall Assessment
**PASS_WITH_CONCERNS** — score **7/10**

Core functionality is implemented and working: Ktor wired correctly, API service matches the spec, Community tab renders, Extract Pose flow is complete end-to-end. However several deviations from the plan spec exist, the most significant being that `PoseRepository` was NOT moved to `shared` as required, and Koin DI for the network layer is missing entirely.

---

## Spec Compliance

| Task | Status | Notes |
|------|--------|-------|
| `libs.versions.toml` — add Ktor version + library entries | ✅ DONE | ktor 2.3.12, all required entries present including `ktor-client-mock` |
| `shared/build.gradle.kts` — add Ktor deps | ✅ DONE | commonMain + iosMain correct, test scope for mock |
| `AppConfig.kt` | ✅ DONE | Correct URL, object constant |
| `CommunityPose.kt` — data model | ✅ DONE | All fields match API doc exactly |
| `PoseApiService.kt` | ✅ DONE | Both methods implemented, base URL injected |
| `ImagePicker.kt` — expect | ✅ DONE | |
| `ImagePicker.kt` — iOS actual | ✅ DONE | PHPickerViewController, delegate retained, main-thread callback |
| `PoseRepository` moved to `shared` | ❌ MISSING | Still in `composeApp/src/commonMain/kotlin/com/aipose/data/`. Plan explicitly says "Move từ composeApp → shared". `getCommunityPoses` delegation is also absent. |
| `PosesScreen.kt` — Community tab, upload flow | ✅ DONE | |
| `PoseDetailScreen.kt` — PoseSource pattern | ✅ PARTIAL | Implemented as two separate composables (`PoseDetailScreen` + `CommunityPoseDetailScreen`) instead of the spec's single screen with `PoseSource` parameter. Functionally equivalent but deviates from spec. |
| `Navigation.kt` — PoseSource routing | ✅ DONE | `PoseDetailVoyagerScreen(PoseSource)` dispatches correctly |
| Koin DI — `networkModule` in shared | ❌ MISSING | Spec requires `networkModule` with `HttpClient`, `PoseApiService`. Instead `PosesViewModel` hard-codes `createHttpClient()` inline (private function in PosesScreen.kt). |
| Tests — PoseApiService | ✅ DONE | Both extractPose + getCommunityPoses |
| Tests — PoseRepository insertPose | ✅ DONE | Two scenarios covered |
| Tests — PosesViewModel upload flow | ❌ MISSING | Plan TDD Task 4 not implemented |

---

## Issues Found

### Critical

**C1 — PoseRepository not moved to `shared`**
The plan's File Map says `Action: Modify (move)` from composeApp → shared. It remains in `composeApp/src/commonMain/kotlin/com/aipose/data/PoseRepository.kt`. Consequence: the repository is not testable in `shared` test source sets, and the spec's intent to share business logic is unfulfilled.

**C2 — `getCommunityPoses` missing from PoseRepository**
The spec explicitly adds `getCommunityPoses()` to `PoseRepository` as a delegation wrapper:
```kotlin
suspend fun getCommunityPoses(...): PaginatedResult<CommunityPose>
```
The current implementation calls `apiService.getCommunityPoses()` directly from `PosesViewModel`, bypassing the repository layer. This violates the architecture spec and makes the ViewModel directly coupled to `PoseApiService`.

### Major

**M1 — No Koin DI for network layer**
The spec defines a `networkModule`:
```kotlin
val networkModule = module {
    single { HttpClient(Darwin) { ... } }
    single { PoseApiService(get()) }
}
```
Instead, `PosesViewModel` creates its own `HttpClient` via a private `createHttpClient()` function and wires `PoseApiService` directly. `PoseRepository` also creates its own `AiPoseDatabase` inside its default constructor. This means every `PosesViewModel` instance owns a separate HTTP client — no singleton, no shared connection pool.

**M2 — `PoseSource` not `Parcelable`**
Spec says:
```kotlin
sealed class PoseSource : Parcelable { ... }
```
Implementation omits `Parcelable`. On Android (if ever ported), navigation state would not survive process death. For current iOS-only KMP target this is benign, but deviates from spec.

**M3 — `extractPose` error handling is absent**
The spec says `extractPose` should throw `PoseApiException` for known error codes. The current implementation does a blind `.body<ExtractPoseResponse>()` — if the server returns a non-2xx (e.g. `ALL_KEYS_EXHAUSTED`, `INVALID_IMAGE`), Ktor will throw a generic `ResponseException`. The ViewModel catches `Exception` generically, so the user sees a raw Ktor error message rather than a user-friendly one. `PoseApiException` type is never defined.

**M4 — Upload "overlay" not dimmed**
Spec says `UploadState.Uploading` → "Modal/dimmed overlay + spinner". The implementation shows a `Box` overlay with `CircularProgressIndicator` but there is **no background dim** (no semi-transparent scrim). The overlay is effectively transparent, making it hard to notice the blocking state.

### Minor

**m1 — Missing `refresh` param respected in `loadCommunityPoses`**
Signature accepts `refresh: Boolean = false` but the body always fetches page 1 and doesn't use `refresh` to reset state differently from a first-load. Minor, since behavior is correct, but the parameter is unused.

**m2 — `PoseApiService.extractPose` hard-codes `ContentType: image/jpeg`**
```kotlin
append(HttpHeaders.ContentType, "image/jpeg")
```
This is hardcoded regardless of what the actual image type is. If a user picks a PNG, the server receives wrong Content-Type metadata. Should derive from `fileName` extension or accept a `mimeType: String` parameter.

**m3 — ViewModel lifecycle / scope leakage**
`PosesViewModel` uses `CoroutineScope(SupervisorJob() + Dispatchers.Main)` and `PoseDetailViewModel` launches coroutines via `rememberCoroutineScope`. The `PosesViewModel` scope is never cancelled because it's not tied to `rememberCoroutineScope` or a proper lifecycle owner. Long-lived network requests could run after the screen is gone. This is a known KMP Voyager limitation but worth noting.

**m4 — `PoseSource.kt` is a separate file but `UploadState`/`PosesUiState` are in `PosesScreen.kt`**
Minor organization inconsistency — `PoseSource` got its own file but `UploadState` and `PosesUiState` (also shareable types) are embedded inside PosesScreen.kt.

**m5 — `PoseApiServiceTest` doesn't verify `image` field name in multipart body**
Test verifies the request is POST to `/api/extract-pose` but doesn't verify the multipart field is named `"image"` (as required by the server). The field check is in the comment (`verify field "image" present`) but the assertion is missing.

---

## Missing Implementations

1. **TDD Test 4** — `PosesViewModel` upload state transition test (`Idle → Uploading → Idle`) not written.
2. **`PoseApiException`** — defined in spec, never created.
3. **`getCommunityPoses` in PoseRepository** — spec addition, skipped.
4. **Koin `networkModule`** — spec-required DI, not implemented.

---

## Recommendations

1. **Move `PoseRepository` to `shared`** and add `getCommunityPoses()` delegation. Update `PosesViewModel` to use the repository for community poses.
2. **Implement Koin `networkModule`** in `shared` and wire `PoseApiService` as a singleton. Remove inline `createHttpClient()` from PosesScreen.
3. **Add `PoseApiException`** and catch non-2xx in `extractPose` to surface user-friendly error messages.
4. **Add background scrim** to the uploading overlay (`Modifier.background(Color.Black.copy(alpha = 0.5f))`).
5. **Fix multipart Content-Type** to be derived from the actual image type or accept `mimeType` param.
6. **Write ViewModel upload flow test** to complete TDD plan.
7. **Strengthen `PoseApiServiceTest`** to assert multipart field name = `"image"`.

---

## Unresolved Questions

1. Is iOS the only target long-term? If Android is ever added, `PoseSource : Parcelable` becomes required — worth adding now.
2. Should community poses be cached to SQLDelight for offline browsing? Plan says "no cache" (MVP), but should be documented as a known limitation.
3. The `extractPose` API is not documented in `docs/community-poses-api.md` — only the community CRUD endpoints are there. Where is the extract-pose endpoint documented? The code assumes `/api/extract-pose` POST multipart returning `{ success, data: { imageBase64, mimeType, processingTimeMs } }` — is this contract stable?
