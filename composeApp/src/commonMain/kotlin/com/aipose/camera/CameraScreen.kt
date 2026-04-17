package com.aipose.camera

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Button
import androidx.compose.material3.IconButton
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
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

    var permissionState by remember { mutableStateOf(controller.currentPermissionState()) }
    var cameraFacing by remember { mutableStateOf(CameraFacing.BACK) }
    var overlayOpacity by remember { mutableStateOf(0.5f) }
    var overlayOffset by remember { mutableStateOf(Offset.Zero) }
    var overlayScale by remember { mutableStateOf(1f) }
    var showGrid by remember { mutableStateOf(false) }
    var overlaySource by remember {
        mutableStateOf<OverlaySourceState>(OverlaySourceState.None)
    }
    val fallbackOverlaySource = remember {
        OverlaySourceState.PlaceholderAsset("camera_overlay_placeholder")
    }
    val effectiveOverlaySource = remember(overlaySource, fallbackOverlaySource) {
        when (overlaySource) {
            is OverlaySourceState.PoseImage -> overlaySource
            OverlaySourceState.None -> fallbackOverlaySource
            is OverlaySourceState.PlaceholderAsset -> overlaySource
        }
    }
    val hasOverlay = overlaySource !is OverlaySourceState.None
    var thumbnailState by remember { mutableStateOf<ThumbnailState>(ThumbnailState.Empty) }
    var showCaptureFlash by remember { mutableStateOf(false) }
    var captureInFlight by remember { mutableStateOf(false) }
    var captureStatus by remember { mutableStateOf<String?>(null) }
    var selectedFlashMode by remember { mutableStateOf(FlashMode.OFF) }

    LaunchedEffect(Unit) {
        val latestPath = photoRepository.getLatestPhotoPath()
        if (latestPath != null) {
            thumbnailState = ThumbnailState.Available(latestPath)
        }
    }

    LaunchedEffect(Unit) {
        controller.setFlashMode(FlashMode.OFF)
        if (permissionState == CameraPermissionState.NOT_DETERMINED) {
            controller.requestPermission {
                permissionState = it
            }
        }
    }

    LaunchedEffect(showCaptureFlash) {
        if (showCaptureFlash) {
            delay(140)
            showCaptureFlash = false
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        CameraPreview(
            modifier = Modifier.fillMaxSize(),
            controller = controller,
        )

        if (showGrid) {
            RuleOfThirdsGrid()
        }

        if (hasOverlay || effectiveOverlaySource is OverlaySourceState.PlaceholderAsset) {
            OverlayPlaceholder(
                modifier = Modifier
                    .align(Alignment.Center)
                    .offset {
                        IntOffset(overlayOffset.x.roundToInt(), overlayOffset.y.roundToInt())
                    }
                    .pointerInput(Unit) {
                        detectTransformGestures { _, pan, zoom, _ ->
                            overlayOffset += pan
                            overlayScale = (overlayScale * zoom).coerceIn(0.4f, 2.5f)
                        }
                    }
                    .alpha(overlayOpacity),
                scale = overlayScale,
            )
        }

        if (showCaptureFlash) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.White.copy(alpha = 0.25f))
            )
        }

        Column(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .fillMaxWidth()
                .padding(top = Spacing.xl, start = Spacing.lg, end = Spacing.lg)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IconButton(onClick = { showGrid = !showGrid }) {
                    Text(
                        text = if (showGrid) "Grid On" else "Grid Off",
                        style = AiPoseTypography.Caption,
                        color = Color.White,
                    )
                }

                IconButton(onClick = {
                    overlaySource = if (overlaySource is OverlaySourceState.None) {
                        fallbackOverlaySource
                    } else {
                        OverlaySourceState.None
                    }
                }) {
                    Text(
                        text = if (overlaySource is OverlaySourceState.None) "Add" else "Remove",
                        style = AiPoseTypography.Caption,
                        color = Color.White,
                    )
                }
            }

            Slider(
                value = overlayOpacity,
                onValueChange = { overlayOpacity = it },
                valueRange = 0f..1f,
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                FlashModeOption(
                    label = "OFF",
                    selected = selectedFlashMode == FlashMode.OFF,
                    onClick = {
                        selectedFlashMode = FlashMode.OFF
                        controller.setFlashMode(FlashMode.OFF)
                    }
                )
                FlashModeOption(
                    label = "AUTO",
                    selected = selectedFlashMode == FlashMode.AUTO,
                    onClick = {
                        selectedFlashMode = FlashMode.AUTO
                        controller.setFlashMode(FlashMode.AUTO)
                    }
                )
                FlashModeOption(
                    label = "ON",
                    selected = selectedFlashMode == FlashMode.ON,
                    onClick = {
                        selectedFlashMode = FlashMode.ON
                        controller.setFlashMode(FlashMode.ON)
                    }
                )
            }
        }

        Row(
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .padding(end = Spacing.lg),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = {
                controller.switchCamera()
                cameraFacing = if (cameraFacing == CameraFacing.BACK) CameraFacing.FRONT else CameraFacing.BACK
            }) {
                Text(
                    text = if (cameraFacing == CameraFacing.BACK) "Rear" else "Front",
                    color = Color.White,
                    style = AiPoseTypography.Caption,
                )
            }
        }

        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(bottom = 96.dp, start = Spacing.lg, end = Spacing.lg),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = { tabNavigator.current = PosesTab }) {
                Text("Poses", color = Color.White, style = AiPoseTypography.Caption)
            }

            CaptureButton(
                enabled = !captureInFlight && permissionState == CameraPermissionState.AUTHORIZED,
                onClick = {
                    if (captureInFlight || permissionState != CameraPermissionState.AUTHORIZED) return@CaptureButton
                    captureInFlight = true
                    captureStatus = null
                    showCaptureFlash = true

                    controller.capture { bytes ->
                        if (bytes.isNotEmpty()) {
                            val path = imageStorage.writeJpeg(bytes)
                            if (path != null) {
                                photoRepository.insertCapturedPhoto(path)
                                val latestPath = photoRepository.getLatestPhotoPath()
                                if (latestPath != null) {
                                    thumbnailState = ThumbnailState.Available(latestPath)
                                }
                            } else {
                                captureStatus = "Failed to save photo"
                            }
                        } else {
                            captureStatus = "Capture unavailable"
                        }
                        captureInFlight = false
                    }
                }
            )

            if (captureStatus != null) {
                Text(
                    text = captureStatus ?: "",
                    color = Color.White,
                    style = AiPoseTypography.Caption,
                )
            }

            GalleryThumbnailButton(
                thumbnailState = thumbnailState,
                onClick = { tabNavigator.current = GalleryTab },
            )
        }

        if (permissionState == CameraPermissionState.DENIED || permissionState == CameraPermissionState.RESTRICTED) {
            PermissionDeniedOverlay(controller = controller)
        }
    }
}

@Composable
private fun OverlayPlaceholder(
    modifier: Modifier,
    scale: Float,
) {
    Box(
        modifier = modifier
            .size((220f * scale).dp, (300f * scale).dp)
            .background(AiPoseColors.Primary.copy(alpha = 0.35f)),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = "POSE",
            style = AiPoseTypography.Heading1,
            color = Color.White,
        )
    }
}

@Composable
private fun RuleOfThirdsGrid() {
    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            Spacer(modifier = Modifier.weight(1f))
            Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Color.White.copy(alpha = 0.35f)))
            Spacer(modifier = Modifier.weight(1f))
            Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Color.White.copy(alpha = 0.35f)))
            Spacer(modifier = Modifier.weight(1f))
        }

        Row(modifier = Modifier.fillMaxSize()) {
            Spacer(modifier = Modifier.weight(1f))
            Box(modifier = Modifier.width(1.dp).fillMaxHeight().background(Color.White.copy(alpha = 0.35f)))
            Spacer(modifier = Modifier.weight(1f))
            Box(modifier = Modifier.width(1.dp).fillMaxHeight().background(Color.White.copy(alpha = 0.35f)))
            Spacer(modifier = Modifier.weight(1f))
        }
    }
}

@Composable
private fun FlashModeOption(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    Button(onClick = onClick) {
        Text(
            text = if (selected) "[$label]" else label,
            style = AiPoseTypography.Caption,
        )
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
            Text(
                text = "Camera permission required",
                style = AiPoseTypography.Heading2,
                color = Color.White,
            )
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
            .size(76.dp)
            .clip(CircleShape)
            .background(Color.White)
    ) {
        IconButton(
            modifier = Modifier.align(Alignment.Center),
            enabled = enabled,
            onClick = onClick,
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(AiPoseColors.Primary)
            )
        }
    }
}

@Composable
private fun GalleryThumbnailButton(
    thumbnailState: ThumbnailState,
    onClick: () -> Unit,
) {
    IconButton(onClick = onClick) {
        Box(
            modifier = Modifier
                .size(52.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.95f)),
            contentAlignment = Alignment.Center,
        ) {
            when (thumbnailState) {
                is ThumbnailState.Available -> {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(AiPoseColors.Primary700)
                    )
                }

                ThumbnailState.Empty -> {
                    Text(
                        text = "G",
                        style = AiPoseTypography.Caption,
                        color = AiPoseColors.Foreground,
                    )
                }
            }
        }
    }
}
