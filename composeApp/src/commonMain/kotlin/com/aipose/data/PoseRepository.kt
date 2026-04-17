package com.aipose.data

import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToList
import app.cash.sqldelight.coroutines.mapToOneOrNull
import com.aipose.Pose
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow

class PoseRepository(
    private val database: AiPoseDatabase = AiPoseDatabase(DatabaseDriverFactory().createDriver())
) {
    private val queries = database.poseQueries

    fun getMyPoses(): Flow<List<Pose>> = queries
        .getMyPoses()
        .asFlow()
        .mapToList(Dispatchers.Default)

    fun getPoseById(id: Long): Flow<Pose?> = queries
        .getPoseById(id)
        .asFlow()
        .mapToOneOrNull(Dispatchers.Default)

    suspend fun deletePose(id: Long) {
        queries.deletePose(id)
    }
}
