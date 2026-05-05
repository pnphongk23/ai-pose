package com.aipose.data

expect class ImageStorage() {
    fun writeJpeg(bytes: ByteArray): String?
}
