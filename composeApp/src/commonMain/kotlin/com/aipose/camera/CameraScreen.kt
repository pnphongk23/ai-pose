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
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.IconButton
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
                .padding(top = 12.dp, start = 12.dp, end = 12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "9:41",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = AiPoseColors.Foreground,
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("WiFi", fontSize = 10.sp, color = AiPoseColors.Foreground)
                    Text("Bat", fontSize = 10.sp, color = AiPoseColors.Foreground)
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
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
                .align(Alignment.TopEnd)
                .padding(top = 56.dp, end = 16.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(Color(0xFFF4C542))
                .border(2.dp, AiPoseColors.Foreground, RoundedCornerShape(10.dp))
                .padding(horizontal = 10.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("👤", fontSize = 10.sp)
            Text(
                text = "DANCING",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = AiPoseColors.Foreground,
            )
        }

        Box(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(start = 12.dp, bottom = 92.dp)
                .size(40.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(Color(0xFFF6F1E8))
                .border(2.dp, Color(0xFFD4CDC0), RoundedCornerShape(10.dp))
                .clickable(enabled = hasOverlay) {
                    overlaySource = OverlaySourceState.None
                },
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "🗑",
                fontSize = 15.sp,
                color = AiPoseColors.Foreground,
                modifier = Modifier.alpha(if (hasOverlay) 1f else 0.4f),
            )
        }

        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 92.dp)
                .size(36.dp)
                .clip(CircleShape)
                .background(Color(0xFFF6F1E8))
                .border(2.dp, Color(0xFFD4CDC0), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "1x",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = AiPoseColors.Foreground,
            )
        }
        Row(
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .padding(end = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color(0xFFF6F1E8).copy(alpha = 0.9f))
                    .border(2.dp, Color(0xFFD4CDC0), RoundedCornerShape(10.dp))
                    .clickable {
                        controller.switchCamera()
                        cameraFacing = if (cameraFacing == CameraFacing.BACK) CameraFacing.FRONT else CameraFacing.BACK
                    }
                    .padding(horizontal = 10.dp, vertical = 6.dp),
            ) {
                Text(
                    text = if (cameraFacing == CameraFacing.BACK) "Rear" else "Front",
                    color = AiPoseColors.Foreground,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                )
            }
        }

        if (showCaptureFlash) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.White.copy(alpha = 0.25f))
            )
        }

        if (captureStatus != null) {
            Text(
                text = captureStatus ?: "",
                color = Color.White,
                style = AiPoseTypography.Caption,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 168.dp)
            )
        }

        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(bottom = 24.dp, start = 24.dp, end = 24.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.Bottom,
        ) {
            GalleryThumbnailButton(
                thumbnailState = thumbnailState,
                onClick = { tabNavigator.current = GalleryTab },
            )

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

            PoseShortcutButton(onClick = { tabNavigator.current = PosesTab })
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
            .size((220f * scale).dp, (300f * scale).dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .border(2.dp, Color.White.copy(alpha = 0.9f), CircleShape)
            )
            Box(
                modifier = Modifier
                    .width(2.dp)
                    .height(80.dp)
                    .background(Color.White.copy(alpha = 0.9f))
            )
            Row(modifier = Modifier.offset(y = (-56).dp)) {
                Box(
                    modifier = Modifier
                        .width(64.dp)
                        .height(2.dp)
                        .background(Color.White.copy(alpha = 0.9f))
                        .offset(x = (-8).dp)
                )
                Box(
                    modifier = Modifier
                        .width(64.dp)
                        .height(2.dp)
                        .background(Color.White.copy(alpha = 0.9f))
                        .offset(x = 8.dp)
                )
            }
            Row(modifier = Modifier.offset(y = (-4).dp)) {
                Box(
                    modifier = Modifier
                        .width(80.dp)
                        .height(2.dp)
                        .background(Color.White.copy(alpha = 0.9f))
                )
                Box(
                    modifier = Modifier
                        .width(80.dp)
                        .height(2.dp)
                        .background(Color.White.copy(alpha = 0.9f))
                )
            }
        }
    }
}

@Composable
private fun RuleOfThirdsGrid() {
    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            Spacer(modifier = Modifier.weight(1f))
            Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Color.White.copy(alpha = 0.15f)))
            Spacer(modifier = Modifier.weight(1f))
            Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Color.White.copy(alpha = 0.15f)))
            Spacer(modifier = Modifier.weight(1f))
        }
        Row(modifier = Modifier.fillMaxSize()) {
            Spacer(modifier = Modifier.weight(1f))
            Box(modifier = Modifier.width(1.dp).fillMaxHeight().background(Color.White.copy(alpha = 0.15f)))
            Spacer(modifier = Modifier.weight(1f))
            Box(modifier = Modifier.width(1.dp).fillMaxHeight().background(Color.White.copy(alpha = 0.15f)))
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
                .alpha(if (enabled) 1f else 0.35f)
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
                        .background(Color(0xFFF4C542))
                )
                ThumbnailState.Empty -> Text("G", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = AiPoseColors.Foreground)
            }
        }
        Text("GALLERY", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
    }
}

@Composable
private fun PoseShortcutButton(onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(Color(0xFF87CEEB))
                .border(2.dp, AiPoseColors.Foreground, RoundedCornerShape(10.dp))
                .clickable(onClick = onClick),
            contentAlignment = Alignment.Center,
        ) {
            Text("👥", fontSize = 18.sp)
        }
        Text("POSES", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
    }
}
