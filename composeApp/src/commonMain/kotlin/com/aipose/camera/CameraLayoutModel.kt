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

data class CameraZoomUiState(
    val isZoomSliderVisible: Boolean = false,
    val zoomValue: Float = 1f,
)

fun toggleCameraZoomSlider(state: CameraZoomUiState): CameraZoomUiState {
    return state.copy(isZoomSliderVisible = !state.isZoomSliderVisible)
}

fun setCameraZoomValue(state: CameraZoomUiState, rawValue: Float): CameraZoomUiState {
    return state.copy(zoomValue = rawValue.coerceIn(1f, 3f))
}

fun cameraZoomLabel(value: Float): String {
    val normalized = value.coerceIn(1f, 3f)
    val rounded = (normalized * 10).toInt() / 10f
    return if (rounded % 1f == 0f) "${rounded.toInt()}x" else "${rounded}x"
}

fun cameraPoseShortcutTarget(): String = "poses"

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
