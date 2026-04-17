package com.aipose.camera

data class CameraScreenState(
    val permissionState: CameraPermissionState = CameraPermissionState.NOT_DETERMINED,
    val cameraFacing: CameraFacing = CameraFacing.BACK,
    val flashMode: FlashMode = FlashMode.OFF,
    val overlayState: OverlayState = OverlayState(),
    val thumbnailState: ThumbnailState = ThumbnailState.Empty,
)

data class OverlayState(
    val source: OverlaySourceState = OverlaySourceState.None,
    val opacity: Float = 1f,
    val offsetX: Float = 0f,
    val offsetY: Float = 0f,
    val scale: Float = 1f,
    val showGrid: Boolean = false,
)

sealed interface OverlaySourceState {
    data object None : OverlaySourceState
    data class PlaceholderAsset(val assetName: String) : OverlaySourceState
    data class PoseImage(val poseId: String, val imagePath: String) : OverlaySourceState
}

sealed interface ThumbnailState {
    data object Empty : ThumbnailState
    data class Available(val imagePath: String) : ThumbnailState
}
