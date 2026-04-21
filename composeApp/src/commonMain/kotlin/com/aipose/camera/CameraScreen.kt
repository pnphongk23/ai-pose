package com.aipose.camera

import com.aipose.ui.components.NeoBrutalismContainer
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
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
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.Icon
import org.jetbrains.compose.resources.painterResource
import ai_pose.composeapp.generated.resources.Res
import ai_pose.composeapp.generated.resources.ic_refresh_cw
import ai_pose.composeapp.generated.resources.ic_more_horizontal
import ai_pose.composeapp.generated.resources.ic_zap
import ai_pose.composeapp.generated.resources.ic_grid
import ai_pose.composeapp.generated.resources.ic_users

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
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTag
import cafe.adriel.voyager.navigator.tab.LocalTabNavigator
import com.aipose.data.DatabaseDriverFactory
import com.aipose.data.DatabaseProvider
import com.aipose.data.ImageStorage
import com.aipose.data.PhotoRepository
import com.aipose.navigation.GalleryTab
import com.aipose.navigation.PosesTab
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
    var zoomUiState by remember {
        mutableStateOf(CameraZoomUiState())
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
            .background(AiPoseColors.SurfaceVariant)
            .padding(bottom = 24.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .padding(horizontal = 0.dp) // allow extending via -mx style
                .border(2.dp, AiPoseColors.Border)
        ) {            CameraPreview(
                modifier = Modifier.fillMaxSize(),
                controller = controller,
            )

            // Overlays
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(AiPoseColors.SurfaceVariant.copy(alpha = 0.2f))
            )

            if (uiState.isGridVisible) {
                CameraGridOverlay()
            }
            CenterCrosshair()

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

            // Top Right
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(top = 64.dp, end = 12.dp)
            ) {
                CameraMoreButton(
                    onClick = { uiState = uiState.copy(isMoreMenuVisible = !uiState.isMoreMenuVisible) }
                )
            }

            if (uiState.isMoreMenuVisible) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(top = 116.dp, end = 12.dp)
                ) {
                    Popup(
                        alignment = Alignment.TopEnd,
                        onDismissRequest = { uiState = uiState.copy(isMoreMenuVisible = false) },
                        properties = PopupProperties(focusable = true)
                    ) {
                        CameraMorePopup(
                            modifier = Modifier.width(144.dp),
                            uiState = uiState,
                            onFlashSelected = { mode: FlashMode ->
                                updateFlashMode(mode)
                                uiState = uiState.copy(isMoreMenuVisible = false)
                            },
                            onToggleGrid = {
                                toggleGrid()
                                uiState = uiState.copy(isMoreMenuVisible = false)
                            },
                            onFrameRatioSelected = { ratio: CameraFrameRatio -> selectFrameRatio(ratio) }
                        )
                    }
                }
            }

            // Bottom Right
            CameraUsersButton(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(end = 12.dp, bottom = 12.dp),
                onClick = { tabNavigator.current = PosesTab }
            )

            // Bottom Center
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 12.dp)
            ) {
                 CameraZoomIndicator(
                    value = zoomUiState.zoomValue,
                    onClick = { zoomUiState = toggleCameraZoomSlider(zoomUiState) }
                )
            }

            if (zoomUiState.isZoomSliderVisible) {
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 60.dp)
                ) {
                    Popup(
                        alignment = Alignment.BottomCenter,
                        onDismissRequest = { zoomUiState = zoomUiState.copy(isZoomSliderVisible = false) },
                        properties = PopupProperties(focusable = true)
                    ) {
                        CameraZoomSlider(
                            value = zoomUiState.zoomValue,
                            onValueChange = {
                                zoomUiState = setCameraZoomValue(zoomUiState, it)
                                controller.setZoomFactor(zoomUiState.zoomValue)
                            }
                        )
                    }
                }
            }

            if (uiState.isCaptureFlashVisible) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(AiPoseColors.Surface.copy(alpha = 0.25f)),
                )
            }
        }

        if (uiState.captureStatus != null) {
            Text(
                text = uiState.captureStatus ?: "",
                color = AiPoseColors.Foreground,
                style = AiPoseTypography.Caption,
                modifier = Modifier.align(Alignment.CenterHorizontally).padding(top = 8.dp),
            )
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
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



@Composable
private fun CameraGridOverlay() {
    Box(modifier = Modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .width(1.dp)
                .background(AiPoseColors.Foreground.copy(alpha = 0.15f))
                .align(Alignment.CenterStart)
                .offset(x = 126.dp),
        )
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .width(1.dp)
                .background(AiPoseColors.Foreground.copy(alpha = 0.15f))
                .align(Alignment.CenterEnd)
                .offset(x = (-126).dp),
        )
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(AiPoseColors.Foreground.copy(alpha = 0.15f))
                .align(Alignment.TopCenter)
                .offset(y = 180.dp),
        )
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(AiPoseColors.Foreground.copy(alpha = 0.15f))
                .align(Alignment.BottomCenter)
                .offset(y = (-180).dp),
        )
    }
}

@Composable
private fun CenterCrosshair() {
    Box(
        contentAlignment = Alignment.Center, 
        modifier = Modifier.fillMaxSize().alpha(0.8f)
    ) {
        NeoBrutalismContainer(
            modifier = Modifier.size(40.dp),
            shape = CircleShape,
            backgroundColor = Color.Transparent,
            borderColor = AiPoseColors.Foreground,
            borderWidth = 2.dp,
            shadowColor = AiPoseColors.Foreground.copy(alpha = 0.6f),
            shadowOffset = 0.dp
        ) {}
        
        Box(modifier = Modifier.width(2.dp).height(80.dp).background(AiPoseColors.Foreground))
        Box(modifier = Modifier.offset(y = (-56).dp)) {
            Box(modifier = Modifier.width(64.dp).height(2.dp).background(AiPoseColors.Foreground).graphicsLayer { rotationZ = -50f }.offset(x = (-8).dp))
            Box(modifier = Modifier.width(64.dp).height(2.dp).background(AiPoseColors.Foreground).graphicsLayer { rotationZ = 30f }.offset(x = 8.dp))
        }
        Box(modifier = Modifier.offset(y = (-4).dp)) {
            Box(modifier = Modifier.width(80.dp).height(2.dp).background(AiPoseColors.Foreground).graphicsLayer { rotationZ = -60f })
            Box(modifier = Modifier.width(80.dp).height(2.dp).background(AiPoseColors.Foreground).graphicsLayer { rotationZ = 20f })
        }
    }
}

@Composable
private fun CameraMoreButton(
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    NeoBrutalismContainer(
        modifier = modifier.semantics { testTag = "overlayAction_More" }.size(40.dp),
        shape = RoundedCornerShape(10.dp),
        backgroundColor = AiPoseColors.SurfaceVariant,
        shadowColor = AiPoseColors.Foreground,
        shadowOffset = 2.dp,
        onClick = onClick
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                painter = painterResource(Res.drawable.ic_more_horizontal),
                contentDescription = "More Options",
                tint = AiPoseColors.Foreground,
                modifier = Modifier.size(16.dp)
            )
        }
    }
}

@Composable
private fun CameraUsersButton(
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    NeoBrutalismContainer(
        modifier = modifier.semantics { testTag = "poseButton" }.size(40.dp),
        shape = CircleShape,
        backgroundColor = AiPoseColors.AccentBlue,
        shadowColor = AiPoseColors.Foreground,
        shadowOffset = 2.dp,
        onClick = onClick
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                painter = painterResource(Res.drawable.ic_users),
                contentDescription = "Users",
                tint = AiPoseColors.Foreground,
                modifier = Modifier.size(16.dp)
            )
        }
    }
}

@Composable
private fun CameraZoomIndicator(
    modifier: Modifier = Modifier,
    value: Float,
    onClick: () -> Unit,
) {
    NeoBrutalismContainer(
        modifier = modifier.semantics { testTag = "zoomButton" }.size(36.dp),
        shape = CircleShape,
        backgroundColor = AiPoseColors.SurfaceVariant,
        shadowColor = AiPoseColors.Foreground,
        shadowOffset = 2.dp,
        onClick = onClick
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center,
        ) {
            Text(cameraZoomLabel(value), fontSize = 12.sp, fontWeight = FontWeight.Bold, color = AiPoseColors.Foreground)
        }
    }
}

@Composable
private fun CameraZoomSlider(
    modifier: Modifier = Modifier,
    value: Float,
    onValueChange: (Float) -> Unit,
) {
    Column(
        modifier = modifier
            .semantics(mergeDescendants = true) { 
                testTag = "zoomSlider"
                contentDescription = "zoomSlider"
            }
            .clickable(onClick = {})
            .width(180.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(AiPoseColors.Foreground)
            .border(2.dp, AiPoseColors.Foreground, RoundedCornerShape(18.dp))
            .padding(horizontal = 12.dp, vertical = 10.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Text(cameraZoomLabel(value), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = AiPoseColors.Surface)
        Slider(
            value = value,
            onValueChange = onValueChange,
            valueRange = 1f..3f,
        )
    }
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
                    .border(2.dp, AiPoseColors.Surface.copy(alpha = 0.9f), CircleShape),
            )
            Box(
                modifier = Modifier
                    .width(2.dp)
                    .height(80.dp)
                    .background(AiPoseColors.Surface.copy(alpha = 0.9f)),
            )
        }
    }
}


@Composable
private fun PermissionDeniedOverlay(
    controller: CameraController,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(AiPoseColors.Foreground.copy(alpha = 0.7f)),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("Camera permission required", style = AiPoseTypography.Heading2, color = AiPoseColors.Surface)
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
    NeoBrutalismContainer(
        modifier = Modifier.size(64.dp).semantics { testTag = "camera-capture-btn" },
        shape = RoundedCornerShape(18.dp),
        backgroundColor = AiPoseColors.SurfaceVariant,
        shadowColor = AiPoseColors.Primary,
        shadowOffset = 4.dp,
        onClick = if (enabled) onClick else null
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(4.dp)
                .clip(RoundedCornerShape(13.dp))
                .background(AiPoseColors.Primary)
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
    NeoBrutalismContainer(
        modifier = Modifier.size(48.dp).semantics { testTag = "camera-gallery-thumbnail" },
        shape = RoundedCornerShape(10.dp),
        backgroundColor = AiPoseColors.SurfaceVariant,
        shadowColor = AiPoseColors.Warning,
        shadowOffset = 3.dp,
        onClick = onClick
    ) {
        when (thumbnailState) {
            is ThumbnailState.Available -> Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(10.dp))
                    .border(2.dp, AiPoseColors.Foreground, RoundedCornerShape(10.dp))
                    .background(AiPoseColors.Warning),
            )
            ThumbnailState.Empty -> Text("G", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = AiPoseColors.Foreground)
        }
    }
}

@Composable
private fun FlipShortcutButton(onClick: () -> Unit) {
    NeoBrutalismContainer(
        modifier = Modifier.size(48.dp),
        shape = RoundedCornerShape(10.dp),
        backgroundColor = AiPoseColors.SurfaceVariant,
        shadowColor = AiPoseColors.Warning,
        shadowOffset = 3.dp,
        onClick = onClick
    ) {
        Icon(
            painter = painterResource(Res.drawable.ic_refresh_cw),
            contentDescription = "Flip Camera",
            tint = AiPoseColors.Foreground,
            modifier = Modifier.size(22.dp)
        )
    }
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
            .width(144.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(AiPoseColors.Foreground)
            .border(2.dp, AiPoseColors.Foreground, RoundedCornerShape(16.dp))
            .padding(6.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        // Flash
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .clickable {
                    val nextMode = when (uiState.flashMode) {
                        FlashMode.OFF -> FlashMode.AUTO
                        FlashMode.AUTO -> FlashMode.ON
                        FlashMode.ON -> FlashMode.OFF
                    }
                    onFlashSelected(nextMode)
                }
                .padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(painter = painterResource(Res.drawable.ic_zap), contentDescription = null, tint = AiPoseColors.Surface, modifier = Modifier.size(16.dp))
                Text("Flash", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = AiPoseColors.Surface, letterSpacing = 0.5.sp)
            }
            Text(uiState.flashMode.name, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = AiPoseColors.Warning, letterSpacing = 0.5.sp)
        }

        Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(AiPoseColors.Surface.copy(alpha = 0.1f)))

        // Grid Toggle
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .clickable { onToggleGrid() }
                .padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(painter = painterResource(Res.drawable.ic_grid), contentDescription = null, tint = AiPoseColors.Surface, modifier = Modifier.size(16.dp))
                Text("Grid", fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = AiPoseColors.Surface, letterSpacing = 0.5.sp)
            }
            Box(
                modifier = Modifier.width(28.dp).height(16.dp).clip(CircleShape).background(if (uiState.isGridVisible) AiPoseColors.AccentBlue else AiPoseColors.Surface.copy(alpha = 0.2f)).padding(horizontal = 2.dp),
                contentAlignment = if (uiState.isGridVisible) Alignment.CenterEnd else Alignment.CenterStart
            ) {
                Box(modifier = Modifier.size(12.dp).clip(CircleShape).background(AiPoseColors.Surface))
            }
        }
    }
}
