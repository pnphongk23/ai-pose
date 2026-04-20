package com.aipose.platform

import platform.Photos.PHAssetChangeRequest
import platform.Photos.PHPhotoLibrary
import platform.Foundation.NSURL
import kotlinx.cinterop.ExperimentalForeignApi

@OptIn(ExperimentalForeignApi::class)
actual fun saveImageToPhotos(imagePath: String, context: Any?): Boolean {
    var success = false
    val url = NSURL.fileURLWithPath(imagePath)
    PHPhotoLibrary.sharedPhotoLibrary().performChangesAndWait({
        PHAssetChangeRequest.creationRequestForAssetFromImageAtFileURL(url)
        success = true
    }, null)
    return success
}
