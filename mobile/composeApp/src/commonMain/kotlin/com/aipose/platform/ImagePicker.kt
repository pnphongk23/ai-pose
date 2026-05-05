package com.aipose.platform

expect class ImagePicker() {
    fun pickImageFromGallery(onResult: (ByteArray?) -> Unit)
}
