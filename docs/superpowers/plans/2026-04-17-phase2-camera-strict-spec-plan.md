# Phase 2 Camera — Strict Spec Recovery Plan (Issue #18)

**Date:** 2026-04-17  
**Owner:** phongpn + Claude  
**Target Issue:** https://github.com/pnphongk23/ai-pose/issues/18  
**Plan Type:** Superpowers gate-based execution (G0 → G4)  
**Execution Mode:** Spec-first, no implementation until gate acceptance passes.

---

## 1) Objective

Khôi phục implementation về đúng literal spec của Issue #18:
1. Dùng **Mijick Camera** cho iOS native integration (không dùng custom AVFoundation engine làm final path).
2. Camera UI parity với design/reference đã chỉ định (Subframe + web camera reference).
3. Pass đầy đủ checklist 2.1 → 2.4 trong issue, có bằng chứng simulator + physical device.

---

## 2) Non-Negotiable Constraints (Superpowers discipline)

1. **No code before root-cause/spec lock** (Systematic Debugging).
2. **No production change without failing verification first** (TDD spirit cho bug/behavior deltas).
3. Mỗi gate chỉ mở khi gate trước có evidence pass.
4. Không “functional equivalent” nếu issue yêu cầu literal integration (Mijick).
5. Không close task/issue nếu thiếu physical device verification cho camera lifecycle.

---

## 3) Current Gap Snapshot (from repo audit)

### Gap A — Engine mismatch
- Spec expects Mijick setup ở 2.1.
- Current implementation dùng custom AVFoundation wrapper (`IOSCameraController.kt`) thay vì Mijick pipeline.

### Gap B — UI parity mismatch
- Current `CameraScreen` dùng temporary text-heavy controls; không match style/placement parity theo design/web reference.

### Gap C — Acceptance evidence mismatch
- Có build/simulator evidence, nhưng strict issue acceptance cần mapping checklist rõ ràng + device closeout.

---

## 4) Gate Plan

## G0 — Spec Lock & Acceptance Contract (Required before coding)

### Tasks
1. Freeze acceptance checklist từ issue #18 thành testable checklist nội bộ.
2. Freeze UI source-of-truth:
   - Subframe design page (issue link)
   - `src/app/camera/page.js` visual behavior baseline
3. Tạo mapping table: `Issue checkbox -> code surface -> verification step`.
4. Mark current state FAIL/PASS theo từng checkbox (baseline audit).

### Exit Criteria
- Có checklist chuẩn hóa cho 2.1/2.2/2.3/2.4.
- Mọi stakeholder đồng thuận “strict literal Mijick path”.

### Evidence
- `docs/superpowers/tasks/2026-04-17-phase2-camera-strict-spec-checklist.md` (to be created in execution).

---

## G1 — RED Baseline (prove current implementation fails strict criteria)

### Tasks
1. Chạy verification baseline trên branch hiện tại:
   - compile + simulator runtime smoke
   - checklist strict UI parity
2. Ghi rõ các fail points:
   - Engine fail (Mijick unchecked)
   - UI parity fail items
3. Preserve regression test đã có cho SQLDelight crash path.

### Exit Criteria
- Có bằng chứng baseline fail đúng lý do spec mismatch, tránh “fix mù”.

### Evidence
- test/build logs + checklist with explicit FAIL marks.

---

## G2 — Engine Compliance (Issue 2.1 + 2.2)

### Tasks
1. Add Mijick Camera package vào iOS host theo yêu cầu issue.
2. Tạo `CameraViewController.swift` wrapper để host Mijick camera view.
3. Rewire bridge:
   - `expect` contract (commonMain)
   - `actual` implementation (iosMain) dùng UIKitView + Swift wrapper.
4. Permission handling states:
   - notDetermined, authorized, denied, restricted
   - settings deep link cho denied/restricted.
5. Keep capture callback contract to Compose (`ByteArray` flow).

### Exit Criteria
- Camera preview/capture chạy qua Mijick-backed path.
- Checkbox 2.1 + 2.2 pass với evidence.

### Evidence
- Build success, runtime trace, code path proof (no fallback to old custom engine on normal path).

---

## G3 — UI Parity Rewrite (Issue 2.3)

### Tasks
1. Rewrite `CameraScreen` layout theo design reference:
   - preview container framing
   - overlay controls (opacity + remove)
   - grid toggle presentation
   - camera switch position/style
   - bottom controls: gallery thumb (left), capture FAB (center), poses button (right)
2. Ensure gestures parity:
   - drag + pinch-to-zoom on overlay
3. Keep flash animation behavior aligned with reference expectation.
4. Remove temporary UI artifacts that violate parity (text placeholders/diagnostic look).

### Exit Criteria
- Visual parity accepted (not pixel-perfect absolute, but control hierarchy/placement/style intent matches source).
- Checkbox 2.3 pass.

### Evidence
- Side-by-side screenshots/video (simulator + device) against references.

---

## G4 — Capture Flow + End-to-End Acceptance (Issue 2.4)

### Tasks
1. Validate capture callback native -> Compose.
2. Persist photo record to SQLDelight `Photo` entity.
3. Update gallery thumbnail immediately after capture.
4. Verify navigation to Gallery/Poses from camera controls.
5. Run full acceptance matrix:
   - Simulator smoke
   - Physical device mandatory checks.

### Exit Criteria
- Checkbox 2.4 pass + all required verification complete.
- Full issue checklist 2.1→2.4 marked done with evidence.

### Evidence
- command logs, runtime screenshots, device checklist signed-off.

---

## 5) Issue #18 Mapping Table (Execution Target)

| Issue Item | Gate | Done Definition |
|---|---|---|
| 2.1 Native Camera Setup (Mijick) | G2 | Mijick dependency + Swift wrapper + permission handling pass |
| 2.2 Compose-Native Bridge | G2 | expect/actual bridge points to Mijick-backed preview/capture |
| 2.3 CameraScreen Compose | G3 | UI control set + placement + gestures match reference intent |
| 2.4 Capture Flow | G4 | capture->DB->thumbnail->navigation verified on simulator+device |

---

## 6) Risks & Mitigations

### Risk 1: Mijick interop instability with current KMP setup
- **Mitigation:** isolate bridge layer in iosMain + Swift wrapper; keep regression checks after each step.

### Risk 2: UI parity debates (subjective)
- **Mitigation:** lock explicit comparison checklist before rewrite; review against same artifacts only.

### Risk 3: Device-only camera behavior differs from simulator
- **Mitigation:** no closeout without device matrix pass.

---

## 7) Execution Order & Branch Discipline

1. G0/G1 first; no implementation before baseline evidence.
2. G2 (engine) before G3 (UI), to avoid rewriting UI on wrong backend.
3. G4 closeout only after G2+G3 accepted.
4. One gate = one review checkpoint + evidence bundle.

---

## 8) Definition of Done

Plan considered complete when:
1. Issue #18 checklist 2.1/2.2/2.3/2.4 all pass.
2. Mijick integration is actual runtime path.
3. UI no longer “completely different” from design/reference.
4. Physical device verification evidence is attached.
5. No known crash regression in photo save flow.
