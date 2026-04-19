package com.aipose.camera

import kotlin.test.Test
import kotlin.test.assertEquals

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
}
