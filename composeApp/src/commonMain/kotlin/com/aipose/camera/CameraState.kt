package com.aipose.camera

import androidx.compose.ui.geometry.Offset

enum class CameraFrameRatio(val width: Int, val height: Int) {
    RATIO_4_3(3, 4),
    RATIO_16_9(9, 16),
    RATIO_1_1(1, 1),
}

data class CameraUiState(
    val permissionState: CameraPermissionState = CameraPermissionState.NOT_DETERMINED,
    val cameraFacing: CameraFacing = CameraFacing.BACK,
    val flashMode: FlashMode = FlashMode.OFF,
    val frameRatio: CameraFrameRatio = CameraFrameRatio.RATIO_4_3,
    val isGridVisible: Boolean = false,
    val isMoreMenuVisible: Boolean = false,
    val overlayOpacity: Float = 0.5f,
    val overlayOffset: Offset = Offset.Zero,
    val overlayScale: Float = 1f,
    val overlaySource: OverlaySourceState = OverlaySourceState.None,
    val thumbnailState: ThumbnailState = ThumbnailState.Empty,
    val isCaptureFlashVisible: Boolean = false,
    val isCaptureInFlight: Boolean = false,
    val captureStatus: String? = null,
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
