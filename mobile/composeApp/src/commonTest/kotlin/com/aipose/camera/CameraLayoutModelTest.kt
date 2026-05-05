package com.aipose.camera

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class CameraLayoutModelTest {
    @Test
    fun popupOffsetAppearsBelowMoreButton() {
        val offset = cameraMorePopupOffset(buttonSizeDp = 40, marginDp = 12, gapDp = 8)

        assertEquals(-12, offset.x)
        assertEquals(60, offset.y)
    }

    @Test
    fun popupAnimationTargetsMatchVisibleState() {
        val visible = cameraMorePopupAnimation(isVisible = true)
        val hidden = cameraMorePopupAnimation(isVisible = false)

        assertEquals(1f, visible.alpha)
        assertEquals(1f, visible.scale)
        assertEquals(0f, visible.translationY)

        assertEquals(0f, hidden.alpha)
        assertEquals(0.92f, hidden.scale)
        assertEquals(-8f, hidden.translationY)
    }

    @Test
    fun zoomSliderToggleFlipsVisibility() {
        val initial = CameraZoomUiState(isZoomSliderVisible = false, zoomValue = 1f)

        val visible = toggleCameraZoomSlider(initial)
        val hidden = toggleCameraZoomSlider(visible)

        assertTrue(visible.isZoomSliderVisible)
        assertFalse(hidden.isZoomSliderVisible)
    }

    @Test
    fun zoomValueClampsToSupportedRange() {
        val initial = CameraZoomUiState()

        val min = setCameraZoomValue(initial, 0.4f)
        val mid = setCameraZoomValue(initial, 2.3f)
        val max = setCameraZoomValue(initial, 4.8f)

        assertEquals(1f, min.zoomValue)
        assertEquals(2.3f, mid.zoomValue)
        assertEquals(3f, max.zoomValue)
    }

    @Test
    fun zoomLabelUsesCompactCameraFormat() {
        assertEquals("1x", cameraZoomLabel(1f))
        assertEquals("2.3x", cameraZoomLabel(2.34f))
        assertEquals("3x", cameraZoomLabel(3.2f))
    }

    @Test
    fun poseShortcutTargetsPosesDestination() {
        assertEquals("poses", cameraPoseShortcutTarget())
    }
}
