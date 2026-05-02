package com.aipose.data

import app.cash.sqldelight.coroutines.asFlow
import app.cash.sqldelight.coroutines.mapToList
import app.cash.sqldelight.coroutines.mapToOneOrNull
import com.aipose.Pose
import com.aipose.data.remote.CommunityPose
import com.aipose.data.remote.PaginatedResult
import com.aipose.data.remote.PoseApiService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow

class PoseRepository(
    private val database: AiPoseDatabase,
    private val apiService: PoseApiService? = null
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

    suspend fun getCommunityPoses(
        page: Int = 1,
        pageSize: Int = 20
    ): PaginatedResult<CommunityPose> {
        val service = requireNotNull(apiService) { "PoseApiService must be provided to use getCommunityPoses" }
        return service.getCommunityPoses(page = page, limit = pageSize)
    }
}
