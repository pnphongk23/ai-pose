package com.aipose.data

class PhotoRepository(
    private val database: AiPoseDatabase,
) {
    private val queries = database.photoQueries

    fun insertCapturedPhoto(imagePath: String): Long {
        val createdAt = currentTimestampString()
        queries.insertPhoto(
            imagePath = imagePath,
            poseId = null,
            poseName = "",
            createdAt = createdAt,
            isFavorite = 0,
        )
        return queries.getLatestPhoto().executeAsOne().id
    }

    fun getLatestPhotoPath(): String? {
        return queries.getLatestPhoto().executeAsOneOrNull()?.imagePath
    }

    private fun currentTimestampString(): String {
        return kotlin.system.getTimeMillis().toString()
    }
}
