package com.aipose.data

import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToList
import com.aipose.Photo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow

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

    fun getAllPhotos(): Flow<List<Photo>> = queries
        .getAllPhotos()
        .asFlow()
        .mapToList(Dispatchers.Default)

    suspend fun deletePhoto(id: Long) {
        queries.deletePhoto(id)
    }

    suspend fun toggleFavorite(id: Long) {
        queries.toggleFavorite(id)
    }

    private fun currentTimestampString(): String {
        return kotlin.system.getTimeMillis().toString()
    }
}
