package com.aipose.camera

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

enum class CameraPermissionState {
    NOT_DETERMINED,
    AUTHORIZED,
    DENIED,
    RESTRICTED,
}

enum class CameraFacing {
    BACK,
    FRONT,
}

enum class FlashMode {
    OFF,
    ON,
    AUTO,
}

expect class CameraController() {
    fun currentPermissionState(): CameraPermissionState
    fun requestPermission(onResult: (CameraPermissionState) -> Unit)

    fun startPreview()
    fun stopPreview()

    fun capture(onResult: (ByteArray) -> Unit)

    fun switchCamera()
    fun setFlashMode(mode: FlashMode)
    fun setGridVisible(isVisible: Boolean)
    fun setZoomFactor(zoomFactor: Float)
    fun openAppSettings()
}

@Composable
expect fun CameraPreview(
    modifier: Modifier,
    controller: CameraController,
)
