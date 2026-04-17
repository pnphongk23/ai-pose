package com.aipose.camera

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import platform.Foundation.NSURL
import platform.UIKit.UIApplication
import platform.UIKit.UIApplicationOpenSettingsURLString

actual class CameraController {
    internal val impl = IOSCameraController()

    actual fun currentPermissionState(): CameraPermissionState {
        return impl.permissionState()
    }

    actual fun requestPermission(onResult: (CameraPermissionState) -> Unit) {
        impl.requestPermission(onResult)
    }

    actual fun startPreview() {
        impl.startPreview()
    }

    actual fun stopPreview() {
        impl.stopPreview()
    }

    actual fun capture(onResult: (ByteArray) -> Unit) {
        impl.capture(onResult)
    }

    actual fun switchCamera() {
        impl.switchCamera()
    }

    actual fun setFlashMode(mode: FlashMode) {
        impl.setFlashMode(mode)
    }

    actual fun openAppSettings() {
        val url = NSURL.URLWithString(UIApplicationOpenSettingsURLString)
        if (url != null) {
            UIApplication.sharedApplication.openURL(url)
        }
    }
}

@Composable
actual fun CameraPreview(
    modifier: Modifier,
    controller: CameraController,
) {
    val cameraController = remember(controller) { controller }
    IOSCameraPreview(
        modifier = modifier,
        cameraController = cameraController.impl,
    )
}
