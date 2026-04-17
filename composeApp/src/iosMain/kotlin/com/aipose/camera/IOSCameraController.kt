package com.aipose.camera

import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.readBytes
import platform.AVFoundation.AVCaptureDevice
import platform.AVFoundation.AVCaptureDeviceInput
import platform.AVFoundation.AVCaptureDevicePositionBack
import platform.AVFoundation.AVCaptureDevicePositionFront
import platform.AVFoundation.AVCaptureDevicePositionUnspecified
import platform.AVFoundation.AVCaptureDeviceTypeBuiltInWideAngleCamera
import platform.AVFoundation.AVCaptureFlashModeAuto
import platform.AVFoundation.AVCaptureFlashModeOff
import platform.AVFoundation.AVCaptureFlashModeOn
import platform.AVFoundation.AVCapturePhoto
import platform.AVFoundation.AVCapturePhotoCaptureDelegateProtocol
import platform.AVFoundation.AVCapturePhotoOutput
import platform.AVFoundation.AVCapturePhotoSettings
import platform.AVFoundation.AVCaptureSession
import platform.AVFoundation.AVCaptureSessionPresetPhoto
import platform.AVFoundation.AVMediaTypeVideo
import platform.AVFoundation.AVVideoCodecKey
import platform.AVFoundation.AVVideoCodecTypeJPEG
import platform.AVFoundation.AVAuthorizationStatusAuthorized
import platform.AVFoundation.AVAuthorizationStatusDenied
import platform.AVFoundation.AVAuthorizationStatusNotDetermined
import platform.AVFoundation.AVAuthorizationStatusRestricted
import platform.AVFoundation.authorizationStatusForMediaType
import platform.AVFoundation.defaultDeviceWithDeviceType
import platform.AVFoundation.requestAccessForMediaType
import platform.Foundation.NSData
import platform.Foundation.NSError
import platform.darwin.NSObject
import platform.objc.sel_registerName
import platform.darwin.dispatch_async
import platform.darwin.dispatch_get_main_queue
import platform.darwin.dispatch_queue_create

@OptIn(ExperimentalForeignApi::class)
internal class IOSCameraController {
    val session: AVCaptureSession = AVCaptureSession()
    val photoOutput: AVCapturePhotoOutput = AVCapturePhotoOutput()

    private val sessionQueue = dispatch_queue_create("com.aipose.camera.session", null)

    private var currentInput: AVCaptureDeviceInput? = null
    private var currentFacing: CameraFacing = CameraFacing.BACK
    private var currentFlashMode: FlashMode = FlashMode.OFF

    private var pendingCaptureCallback: ((ByteArray) -> Unit)? = null
    private val captureDelegate = object : NSObject(), AVCapturePhotoCaptureDelegateProtocol {
        override fun captureOutput(
            output: AVCapturePhotoOutput,
            didFinishProcessingPhoto: AVCapturePhoto,
            error: NSError?
        ) {
            val callback = pendingCaptureCallback
            pendingCaptureCallback = null

            if (callback == null) {
                return
            }

            val bytes = if (error != null) {
                ByteArray(0)
            } else {
                val data = didFinishProcessingPhoto.asNSDataViaObjCMessage("fileDataRepresentation")
                data?.toByteArray() ?: ByteArray(0)
            }

            dispatch_async(dispatch_get_main_queue()) {
                callback(bytes)
            }
        }
    }

    fun permissionState(): CameraPermissionState {
        val status = AVCaptureDevice.authorizationStatusForMediaType(AVMediaTypeVideo).toLong()
        return when (status) {
            AVAuthorizationStatusNotDetermined -> CameraPermissionState.NOT_DETERMINED
            AVAuthorizationStatusAuthorized -> CameraPermissionState.AUTHORIZED
            AVAuthorizationStatusDenied -> CameraPermissionState.DENIED
            AVAuthorizationStatusRestricted -> CameraPermissionState.RESTRICTED
            else -> CameraPermissionState.DENIED
        }
    }

    fun requestPermission(onResult: (CameraPermissionState) -> Unit) {
        if (permissionState() != CameraPermissionState.NOT_DETERMINED) {
            onResult(permissionState())
            return
        }

        AVCaptureDevice.requestAccessForMediaType(AVMediaTypeVideo) {
            dispatch_async(dispatch_get_main_queue()) {
                onResult(permissionState())
            }
        }
    }

    fun startPreview() {
        dispatch_async(sessionQueue) {
            ensureConfigured()
            if (!session.running) {
                session.startRunning()
            }
        }
    }

    fun stopPreview() {
        dispatch_async(sessionQueue) {
            if (session.running) {
                session.stopRunning()
            }
        }
    }

    fun switchCamera() {
        dispatch_async(sessionQueue) {
            val nextFacing = if (currentFacing == CameraFacing.BACK) CameraFacing.FRONT else CameraFacing.BACK
            switchToFacing(nextFacing)
        }
    }

    fun setFlashMode(mode: FlashMode) {
        currentFlashMode = mode
    }

    fun capture(onResult: (ByteArray) -> Unit) {
        dispatch_async(sessionQueue) {
            if (pendingCaptureCallback != null) {
                dispatch_async(dispatch_get_main_queue()) {
                    onResult(ByteArray(0))
                }
                return@dispatch_async
            }

            ensureConfigured()

            val settings = AVCapturePhotoSettings.photoSettingsWithFormat(
                mapOf(AVVideoCodecKey to AVVideoCodecTypeJPEG)
            )

            settings.flashMode = when (currentFlashMode) {
                FlashMode.OFF -> AVCaptureFlashModeOff
                FlashMode.ON -> AVCaptureFlashModeOn
                FlashMode.AUTO -> AVCaptureFlashModeAuto
            }

            pendingCaptureCallback = onResult
            photoOutput.capturePhotoWithSettings(settings, captureDelegate)
        }
    }

    private fun ensureConfigured() {
        if (currentInput != null) {
            return
        }

        session.beginConfiguration()
        session.sessionPreset = AVCaptureSessionPresetPhoto

        val device = findDeviceForFacing(currentFacing)
        val input = device?.let { createInput(it) }

        if (input != null && session.canAddInput(input)) {
            session.addInput(input)
            currentInput = input
        }

        if (session.canAddOutput(photoOutput)) {
            session.addOutput(photoOutput)
        }

        session.commitConfiguration()
    }

    private fun switchToFacing(facing: CameraFacing) {
        val oldInput = currentInput ?: run {
            currentFacing = facing
            return
        }

        val newDevice = findDeviceForFacing(facing) ?: return
        val newInput = createInput(newDevice) ?: return

        session.beginConfiguration()
        session.removeInput(oldInput)

        if (session.canAddInput(newInput)) {
            session.addInput(newInput)
            currentInput = newInput
            currentFacing = facing
        } else {
            session.addInput(oldInput)
        }

        session.commitConfiguration()
    }

    private fun findDeviceForFacing(facing: CameraFacing): AVCaptureDevice? {
        val position = when (facing) {
            CameraFacing.BACK -> AVCaptureDevicePositionBack
            CameraFacing.FRONT -> AVCaptureDevicePositionFront
        }

        return AVCaptureDevice.defaultDeviceWithDeviceType(
            deviceType = AVCaptureDeviceTypeBuiltInWideAngleCamera,
            mediaType = AVMediaTypeVideo,
            position = position,
        ) ?: AVCaptureDevice.defaultDeviceWithDeviceType(
            deviceType = AVCaptureDeviceTypeBuiltInWideAngleCamera,
            mediaType = AVMediaTypeVideo,
            position = AVCaptureDevicePositionUnspecified,
        )
    }

    private fun createInput(device: AVCaptureDevice): AVCaptureDeviceInput? {
        return AVCaptureDeviceInput.deviceInputWithDevice(device = device, error = null) as? AVCaptureDeviceInput
    }
}

@OptIn(ExperimentalForeignApi::class)
private fun NSData.toByteArray(): ByteArray {
    val lengthValue = length.toInt()
    if (lengthValue == 0) {
        return ByteArray(0)
    }
    val bytesPtr = bytes ?: return ByteArray(0)
    return bytesPtr.readBytes(lengthValue)
}

@OptIn(ExperimentalForeignApi::class)
private fun AVCapturePhoto.asNSDataViaObjCMessage(selectorName: String): NSData? {
    val selector = sel_registerName(selectorName)
    val unmanaged = this.performSelector(selector)
    return unmanaged as? NSData
}
