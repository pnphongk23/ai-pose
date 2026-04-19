package com.aipose.camera

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupProperties
import androidx.compose.ui.unit.IntOffset as UiIntOffset
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.navigator.tab.LocalTabNavigator
import com.aipose.data.DatabaseDriverFactory
import com.aipose.data.DatabaseProvider
import com.aipose.data.ImageStorage
import com.aipose.data.PhotoRepository
import com.aipose.navigation.GalleryTab
import com.aipose.ui.theme.AiPoseColors
import com.aipose.ui.theme.AiPoseTypography
import com.aipose.ui.theme.Spacing
import kotlinx.coroutines.delay
import kotlin.math.roundToInt

@Composable
fun CameraScreen(
    modifier: Modifier = Modifier,
) {
    val tabNavigator = LocalTabNavigator.current
    val controller = remember { CameraController() }
    val database = remember { DatabaseProvider.getOrCreate(DatabaseDriverFactory()) }
    val photoRepository = remember { PhotoRepository(database) }
    val imageStorage = remember { ImageStorage() }

    var uiState by remember {
        mutableStateOf(CameraUiState(permissionState = controller.currentPermissionState()))
    }

    val fallbackOverlaySource = remember {
        OverlaySourceState.PlaceholderAsset("camera_overlay_placeholder")
    }
    val effectiveOverlaySource = remember(uiState.overlaySource, fallbackOverlaySource) {
        when (uiState.overlaySource) {
            is OverlaySourceState.PoseImage -> uiState.overlaySource
            OverlaySourceState.None -> fallbackOverlaySource
            is OverlaySourceState.PlaceholderAsset -> uiState.overlaySource
        }
    }
    val hasOverlay = uiState.overlaySource !is OverlaySourceState.None

    fun updateFlashMode(mode: FlashMode) {
        controller.setFlashMode(mode)
        uiState = uiState.copy(flashMode = mode)
    }

    fun toggleMoreMenu() {
        uiState = uiState.copy(isMoreMenuVisible = !uiState.isMoreMenuVisible)
    }

    fun toggleGrid() {
        val nextValue = !uiState.isGridVisible
        controller.setGridVisible(nextValue)
        uiState = uiState.copy(isGridVisible = nextValue)
    }

    fun selectFrameRatio(ratio: CameraFrameRatio) {
        uiState = uiState.copy(frameRatio = ratio, isMoreMenuVisible = false)
    }

    fun flipCamera() {
        controller.switchCamera()
        uiState = uiState.copy(
            cameraFacing = if (uiState.cameraFacing == CameraFacing.BACK) CameraFacing.FRONT else CameraFacing.BACK,
        )
    }

    LaunchedEffect(Unit) {
        val latestPath = photoRepository.getLatestPhotoPath()
        if (latestPath != null) {
            uiState = uiState.copy(thumbnailState = ThumbnailState.Available(latestPath))
        }
    }

    LaunchedEffect(Unit) {
        controller.setFlashMode(FlashMode.OFF)
        if (uiState.permissionState == CameraPermissionState.NOT_DETERMINED) {
            controller.requestPermission { grantedState ->
                uiState = uiState.copy(permissionState = grantedState)
            }
        }
    }

    LaunchedEffect(uiState.isCaptureFlashVisible) {
        if (uiState.isCaptureFlashVisible) {
            delay(140)
            uiState = uiState.copy(isCaptureFlashVisible = false)
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFFF6F1E8))
            .padding(horizontal = 12.dp, vertical = 16.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .clip(RoundedCornerShape(24.dp))
                .border(2.dp, Color(0xFFD4CDC0), RoundedCornerShape(24.dp))
                .background(Color.Black),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(uiState.frameRatio.width.toFloat() / uiState.frameRatio.height.toFloat()),
            ) {
                CameraPreview(
                    modifier = Modifier.fillMaxSize(),
                    controller = controller,
                )

                if (hasOverlay || effectiveOverlaySource is OverlaySourceState.PlaceholderAsset) {
                    OverlayPlaceholder(
                        modifier = Modifier
                            .align(Alignment.Center)
                            .offset {
                                IntOffset(
                                    uiState.overlayOffset.x.roundToInt(),
                                    uiState.overlayOffset.y.roundToInt(),
                                )
                            }
                            .pointerInput(Unit) {
                                detectTransformGestures { _, pan, zoom, _ ->
                                    uiState = uiState.copy(
                                        overlayOffset = uiState.overlayOffset + pan,
                                        overlayScale = (uiState.overlayScale * zoom).coerceIn(0.4f, 2.5f),
                                    )
                                }
                            }
                            .alpha(uiState.overlayOpacity),
                        scale = uiState.overlayScale,
                    )
                }

                if (uiState.isCaptureFlashVisible) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.White.copy(alpha = 0.25f)),
                    )
                }

                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(top = 12.dp, end = 12.dp)
                        .size(40.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(Color(0xFFF6F1E8))
                        .border(2.dp, AiPoseColors.Foreground, RoundedCornerShape(10.dp))
                        .clickable { toggleMoreMenu() },
                    contentAlignment = Alignment.Center,
                ) {
                    Text("⋯", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = AiPoseColors.Foreground)
                }

                if (uiState.isMoreMenuVisible) {
                    val popupOffset = cameraMorePopupOffset()
                    Popup(
                        alignment = Alignment.TopEnd,
                        offset = UiIntOffset(popupOffset.x, popupOffset.y),
                        onDismissRequest = { uiState = uiState.copy(isMoreMenuVisible = false) },
                        properties = PopupProperties(focusable = true),
                    ) {
                        AnimatedCameraMorePopup(
                            uiState = uiState,
                            onFlashSelected = { mode: FlashMode ->
                                updateFlashMode(mode)
                                uiState = uiState.copy(isMoreMenuVisible = false)
                            },
                            onToggleGrid = {
                                toggleGrid()
                                uiState = uiState.copy(isMoreMenuVisible = false)
                            },
                            onFrameRatioSelected = { ratio: CameraFrameRatio -> selectFrameRatio(ratio) },
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Box(
            modifier = Modifier.fillMaxWidth(),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFF6F1E8))
                    .border(2.dp, AiPoseColors.Foreground, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = uiState.frameRatio.label(),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = AiPoseColors.Foreground,
                )
            }
        }

        if (uiState.captureStatus != null) {
            Text(
                text = uiState.captureStatus ?: "",
                color = AiPoseColors.Foreground,
                style = AiPoseTypography.Caption,
                modifier = Modifier.align(Alignment.CenterHorizontally),
            )
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp, start = 24.dp, end = 24.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.Bottom,
        ) {
            GalleryThumbnailButton(
                thumbnailState = uiState.thumbnailState,
                onClick = { tabNavigator.current = GalleryTab },
            )

            CaptureButton(
                enabled = !uiState.isCaptureInFlight && uiState.permissionState == CameraPermissionState.AUTHORIZED,
                onClick = {
                    if (uiState.isCaptureInFlight || uiState.permissionState != CameraPermissionState.AUTHORIZED) return@CaptureButton
                    uiState = uiState.copy(
                        isCaptureInFlight = true,
                        captureStatus = null,
                        isCaptureFlashVisible = true,
                    )

                    controller.capture { bytes ->
                        if (bytes.isNotEmpty()) {
                            val path = imageStorage.writeJpeg(bytes)
                            if (path != null) {
                                photoRepository.insertCapturedPhoto(path)
                                val latestPath = photoRepository.getLatestPhotoPath()
                                uiState = uiState.copy(
                                    thumbnailState = latestPath?.let { ThumbnailState.Available(it) } ?: uiState.thumbnailState,
                                    isCaptureInFlight = false,
                                )
                            } else {
                                uiState = uiState.copy(
                                    captureStatus = "Failed to save photo",
                                    isCaptureInFlight = false,
                                )
                            }
                        } else {
                            uiState = uiState.copy(
                                captureStatus = "Capture unavailable",
                                isCaptureInFlight = false,
                            )
                        }
                    }
                },
            )

            FlipShortcutButton(onClick = ::flipCamera)
        }

        if (uiState.permissionState == CameraPermissionState.DENIED || uiState.permissionState == CameraPermissionState.RESTRICTED) {
            PermissionDeniedOverlay(controller = controller)
        }
    }
}

private fun CameraFrameRatio.label(): String = when (this) {
    CameraFrameRatio.RATIO_4_3 -> "4:3"
    CameraFrameRatio.RATIO_16_9 -> "16:9"
    CameraFrameRatio.RATIO_1_1 -> "1:1"
}

@Composable
private fun OverlayPlaceholder(
    modifier: Modifier,
    scale: Float,
) {
    Box(
        modifier = modifier.size((220f * scale).dp, (300f * scale).dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .border(2.dp, Color.White.copy(alpha = 0.9f), CircleShape),
            )
            Box(
                modifier = Modifier
                    .width(2.dp)
                    .height(80.dp)
                    .background(Color.White.copy(alpha = 0.9f)),
            )
        }
    }
}

@Composable
private fun FlashModeOption(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(if (selected) Color(0xFFF4C542) else Color(0xFFF6F1E8).copy(alpha = 0.9f))
            .border(2.dp, AiPoseColors.Foreground, RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 5.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = AiPoseColors.Foreground)
    }
}

@Composable
private fun PermissionDeniedOverlay(
    controller: CameraController,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.7f)),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("Camera permission required", style = AiPoseTypography.Heading2, color = Color.White)
            Spacer(modifier = Modifier.height(Spacing.md))
            Button(onClick = { controller.openAppSettings() }) {
                Text("Open Settings")
            }
        }
    }
}

@Composable
private fun CaptureButton(
    enabled: Boolean,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .size(64.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0xFFF6F1E8))
            .border(2.dp, AiPoseColors.Foreground, RoundedCornerShape(18.dp))
            .clickable(enabled = enabled, onClick = onClick)
            .padding(4.dp),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .clip(RoundedCornerShape(13.dp))
                .background(Color(0xFFE7A1B0))
                .border(2.dp, AiPoseColors.Foreground, RoundedCornerShape(13.dp))
                .alpha(if (enabled) 1f else 0.35f),
        )
    }
}

@Composable
private fun GalleryThumbnailButton(
    thumbnailState: ThumbnailState,
    onClick: () -> Unit,
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(10.dp))
                .border(2.dp, AiPoseColors.Foreground, RoundedCornerShape(10.dp))
                .clickable(onClick = onClick),
            contentAlignment = Alignment.Center,
        ) {
            when (thumbnailState) {
                is ThumbnailState.Available -> Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFFF4C542)),
                )
                ThumbnailState.Empty -> Text("G", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = AiPoseColors.Foreground)
            }
        }
        Text("GALLERY", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = AiPoseColors.Foreground)
    }
}

@Composable
private fun FlipShortcutButton(onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(Color(0xFFF6F1E8))
                .border(2.dp, AiPoseColors.Foreground, RoundedCornerShape(10.dp))
                .clickable(onClick = onClick),
            contentAlignment = Alignment.Center,
        ) {
            Text("⟳", fontSize = 18.sp, color = AiPoseColors.Foreground)
        }
        Text("FLIP", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = AiPoseColors.Foreground)
    }
}

@Composable
private fun AnimatedCameraMorePopup(
    uiState: CameraUiState,
    onFlashSelected: (FlashMode) -> Unit,
    onToggleGrid: () -> Unit,
    onFrameRatioSelected: (CameraFrameRatio) -> Unit,
) {
    val popupAnimation = cameraMorePopupAnimation(isVisible = uiState.isMoreMenuVisible)
    val alpha by animateFloatAsState(
        targetValue = popupAnimation.alpha,
        animationSpec = tween(durationMillis = 180),
    )
    val scale by animateFloatAsState(
        targetValue = popupAnimation.scale,
        animationSpec = tween(durationMillis = 180),
    )
    val translationY by animateFloatAsState(
        targetValue = popupAnimation.translationY,
        animationSpec = tween(durationMillis = 180),
    )

    CameraMorePopup(
        modifier = Modifier
            .graphicsLayer {
                this.alpha = alpha
                scaleX = scale
                scaleY = scale
                this.translationY = translationY
            },
        uiState = uiState,
        onFlashSelected = onFlashSelected,
        onToggleGrid = onToggleGrid,
        onFrameRatioSelected = onFrameRatioSelected,
    )
}

@Composable
private fun CameraMorePopup(
    modifier: Modifier = Modifier,
    uiState: CameraUiState,
    onFlashSelected: (FlashMode) -> Unit,
    onToggleGrid: () -> Unit,
    onFrameRatioSelected: (CameraFrameRatio) -> Unit,
) {
    Column(
        modifier = modifier
            .width(148.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF171717))
            .border(2.dp, AiPoseColors.Foreground, RoundedCornerShape(16.dp))
            .padding(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        MorePopupRow(title = "Flash", value = uiState.flashMode.name) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                FlashMode.values().forEach { mode ->
                    FlashModeOption(
                        label = mode.name,
                        selected = uiState.flashMode == mode,
                        onClick = { onFlashSelected(mode) },
                    )
                }
            }
        }
        MorePopupDivider()
        MorePopupRow(title = "Grid", value = if (uiState.isGridVisible) "ON" else "OFF") {
            MoreToggleRow(value = uiState.isGridVisible, onClick = onToggleGrid)
        }
        MorePopupDivider()
        MorePopupRow(title = "Frame", value = uiState.frameRatio.label()) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                FrameRatioChip("4:3", uiState.frameRatio == CameraFrameRatio.RATIO_4_3) { onFrameRatioSelected(CameraFrameRatio.RATIO_4_3) }
                FrameRatioChip("16:9", uiState.frameRatio == CameraFrameRatio.RATIO_16_9) { onFrameRatioSelected(CameraFrameRatio.RATIO_16_9) }
                FrameRatioChip("1:1", uiState.frameRatio == CameraFrameRatio.RATIO_1_1) { onFrameRatioSelected(CameraFrameRatio.RATIO_1_1) }
            }
        }
    }
}

@Composable
private fun MorePopupRow(
    title: String,
    value: String,
    content: @Composable () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(title, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
            Text(value, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFFF4C542))
        }
        content()
    }
}

@Composable
private fun MorePopupDivider() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(Color.White.copy(alpha = 0.1f)),
    )
}

@Composable
private fun MoreToggleRow(
    value: Boolean,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.End,
    ) {
        Box(
            modifier = Modifier
                .width(28.dp)
                .height(16.dp)
                .clip(CircleShape)
                .background(if (value) Color(0xFF87CEEB) else Color.White.copy(alpha = 0.2f))
                .clickable(onClick = onClick)
                .padding(horizontal = 2.dp),
            contentAlignment = if (value) Alignment.CenterEnd else Alignment.CenterStart,
        ) {
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .clip(CircleShape)
                    .background(Color.White),
            )
        }
    }
}

@Composable
private fun FrameRatioChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(if (selected) Color(0xFF87CEEB) else Color(0xFFF6F1E8))
            .border(2.dp, AiPoseColors.Foreground, RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 8.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = AiPoseColors.Foreground)
    }
}

