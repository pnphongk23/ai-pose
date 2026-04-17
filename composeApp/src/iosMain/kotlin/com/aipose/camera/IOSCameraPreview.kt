package com.aipose.camera

import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.interop.UIKitView
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.readValue
import platform.AVFoundation.AVCaptureVideoPreviewLayer
import platform.AVFoundation.AVLayerVideoGravityResizeAspectFill
import platform.CoreGraphics.CGRectZero
import platform.QuartzCore.CATransaction
import platform.QuartzCore.kCATransactionDisableActions
import platform.UIKit.UIView

@OptIn(ExperimentalForeignApi::class)
@Composable
internal fun IOSCameraPreview(
    modifier: Modifier,
    cameraController: IOSCameraController,
) {
    val session = cameraController.session

    UIKitView(
        modifier = modifier,
        factory = {
            val previewLayer = AVCaptureVideoPreviewLayer(session = session).apply {
                videoGravity = AVLayerVideoGravityResizeAspectFill
            }

            object : UIView(frame = CGRectZero.readValue()) {
                override fun layoutSubviews() {
                    super.layoutSubviews()
                    CATransaction.begin()
                    CATransaction.setValue(true, kCATransactionDisableActions)
                    previewLayer.frame = bounds
                    CATransaction.commit()
                }
            }.apply {
                layer.addSublayer(previewLayer)
            }
        },
    )

    DisposableEffect(cameraController) {
        cameraController.startPreview()
        onDispose {
            cameraController.stopPreview()
        }
    }
}
