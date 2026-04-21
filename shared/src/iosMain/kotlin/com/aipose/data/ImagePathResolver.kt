package com.aipose.data

import kotlinx.cinterop.ExperimentalForeignApi
import platform.Foundation.NSApplicationSupportDirectory
import platform.Foundation.NSFileManager
import platform.Foundation.NSString
import platform.Foundation.NSUserDomainMask
import platform.Foundation.stringByAppendingPathComponent
import platform.Foundation.lastPathComponent

@OptIn(ExperimentalForeignApi::class)
actual fun resolveImagePath(storedPath: String): String? {
    // Get current Application Support directory (current UUID)
    val directoryUrl = NSFileManager.defaultManager.URLForDirectory(
        directory = NSApplicationSupportDirectory,
        inDomain = NSUserDomainMask,
        appropriateForURL = null,
        create = false,
        error = null,
    ) ?: return null
    val folderPath = directoryUrl.path ?: return null
    val aiposePath = (folderPath as NSString).stringByAppendingPathComponent("aipose")

    // Extract filename: if storedPath is absolute path, take lastPathComponent
    // If storedPath is already just a filename, use it directly
    val filename = if (storedPath.contains("/")) {
        (storedPath as NSString).lastPathComponent
    } else {
        storedPath
    }

    val fullPath = (aiposePath as NSString).stringByAppendingPathComponent(filename)

    // Verify file exists
    return if (NSFileManager.defaultManager.fileExistsAtPath(fullPath)) fullPath else null
}
