package com.aipose.data

import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.usePinned
import platform.Foundation.NSApplicationSupportDirectory
import platform.Foundation.NSData
import platform.Foundation.NSFileManager
import platform.Foundation.NSString
import platform.Foundation.NSURL
import platform.Foundation.NSUserDomainMask
import platform.Foundation.create
import platform.Foundation.stringByAppendingPathComponent
import platform.Foundation.writeToFile
import platform.posix.time

@OptIn(ExperimentalForeignApi::class)
actual class ImageStorage actual constructor() {
    actual fun writeJpeg(bytes: ByteArray): String? {
        if (bytes.isEmpty()) return null

        val directoryUrl = NSFileManager.defaultManager.URLForDirectory(
            directory = NSApplicationSupportDirectory,
            inDomain = NSUserDomainMask,
            appropriateForURL = null,
            create = true,
            error = null,
        ) ?: return null

        val folderPath = directoryUrl.path ?: return null
        val aiposePath = (folderPath as NSString).stringByAppendingPathComponent("aipose")

        NSFileManager.defaultManager.createDirectoryAtPath(
            path = aiposePath,
            withIntermediateDirectories = true,
            attributes = null,
            error = null,
        )

        val filename = "capture_${time(null).toLong()}.jpg"
        val fullPath = (aiposePath as NSString).stringByAppendingPathComponent(filename)

        val data = bytes.toNSData()
        val written = data.writeToFile(fullPath, atomically = true)
        return if (written) fullPath else null
    }
}

@OptIn(ExperimentalForeignApi::class)
private fun ByteArray.toNSData(): NSData {
    return this.usePinned {
        NSData.create(
            bytes = it.addressOf(0),
            length = this.size.toULong(),
        )
    }
}
