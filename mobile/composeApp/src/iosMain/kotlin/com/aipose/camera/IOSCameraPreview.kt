package com.aipose.camera

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.interop.UIKitView
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.readValue
import platform.CoreGraphics.CGRectZero
import platform.UIKit.UIColor
import platform.UIKit.UIView

@OptIn(ExperimentalForeignApi::class)
@Composable
internal fun IOSCameraPreview(
    modifier: Modifier,
    cameraController: IOSCameraController,
) {
    UIKitView(
        modifier = modifier,
        factory = {
            UIView(frame = CGRectZero.readValue()).apply {
                backgroundColor = UIColor.blackColor
            }
        },
        update = { hostView ->
            cameraController.attachPreviewHost(hostView)
        },
        onRelease = {
            cameraController.detachPreviewHost()
        },
    )

    DisposableEffect(cameraController) {
        cameraController.startPreview()
        onDispose {
            cameraController.stopPreview()
        }
    }
}
