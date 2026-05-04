package com.aipose.platform

import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.usePinned
import platform.Foundation.NSData
import platform.posix.memcpy
import platform.UIKit.UIImagePickerController
import platform.UIKit.UIImagePickerControllerDelegateProtocol
import platform.UIKit.UIImagePickerControllerEditedImage
import platform.UIKit.UIImagePickerControllerOriginalImage
import platform.UIKit.UIImagePickerControllerSourceType
import platform.UIKit.UINavigationControllerDelegateProtocol
import platform.UIKit.UIApplication
import platform.UIKit.UIImage
import platform.UIKit.UIImageJPEGRepresentation
import platform.darwin.NSObject

actual class ImagePicker {
    actual fun pickImageFromGallery(onResult: (ByteArray?) -> Unit) {
        val picker = UIImagePickerController()
        picker.sourceType = UIImagePickerControllerSourceType.UIImagePickerControllerSourceTypePhotoLibrary
        picker.allowsEditing = false

        val delegate = object : NSObject(),
            UIImagePickerControllerDelegateProtocol,
            UINavigationControllerDelegateProtocol {

            @OptIn(ExperimentalForeignApi::class)
            override fun imagePickerController(
                picker: UIImagePickerController,
                didFinishPickingMediaWithInfo: Map<Any?, *>
            ) {
                val image = (didFinishPickingMediaWithInfo[UIImagePickerControllerEditedImage]
                    ?: didFinishPickingMediaWithInfo[UIImagePickerControllerOriginalImage]) as? UIImage
                val bytes = image?.let { img ->
                    UIImageJPEGRepresentation(img, 0.9)?.let { nsData ->
                        ByteArray(nsData.length.toInt()).also { arr ->
                            arr.usePinned { pinned ->
                                memcpy(pinned.addressOf(0), nsData.bytes, nsData.length)
                            }
                        }
                    }
                }
                picker.dismissViewControllerAnimated(true, null)
                onResult(bytes)
            }

            override fun imagePickerControllerDidCancel(picker: UIImagePickerController) {
                picker.dismissViewControllerAnimated(true, null)
                onResult(null)
            }
        }

        picker.delegate = delegate
        UIApplication.sharedApplication.keyWindow?.rootViewController
            ?.presentViewController(picker, animated = true, completion = null)
    }
}
