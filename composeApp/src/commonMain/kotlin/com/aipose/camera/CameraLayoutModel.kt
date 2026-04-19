package com.aipose.camera

data class CameraPopupOffset(
    val x: Int,
    val y: Int,
)

data class CameraPopupAnimation(
    val alpha: Float,
    val scale: Float,
    val translationY: Float,
)

fun cameraMorePopupOffset(
    buttonSizeDp: Int = 40,
    marginDp: Int = 12,
    gapDp: Int = 8,
): CameraPopupOffset {
    return CameraPopupOffset(
        x = -marginDp,
        y = marginDp + buttonSizeDp + gapDp,
    )
}

fun cameraMorePopupAnimation(isVisible: Boolean): CameraPopupAnimation {
    return if (isVisible) {
        CameraPopupAnimation(alpha = 1f, scale = 1f, translationY = 0f)
    } else {
        CameraPopupAnimation(alpha = 0f, scale = 0.92f, translationY = -8f)
    }
}
