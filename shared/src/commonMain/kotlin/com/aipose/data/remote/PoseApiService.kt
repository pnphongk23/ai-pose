package com.aipose.data.remote

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.client.request.forms.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.util.decodeBase64Bytes
import kotlinx.serialization.Serializable

@Serializable
data class ExtractPoseResponse(
    val success: Boolean,
    val data: ExtractPoseData
)

@Serializable
data class ExtractPoseData(
    val imageBase64: String,
    val mimeType: String,
    val processingTimeMs: Long
)

@Serializable
data class CommunityPose(
    val id: String = "",
    val name: String = "",
    val imagePath: String = "",
    val thumbnailPath: String? = null,
    val difficulty: String = "",
    val tags: List<String> = emptyList()
)

@Serializable
data class PaginationInfo(
    val page: Int,
    val limit: Int,
    val total: Int
)

@Serializable
data class PaginatedResult<T>(
    val data: List<T>,
    val pagination: PaginationInfo
)

@Serializable
private data class ApiErrorResponse(
    val code: String? = null,
    val message: String? = null
)

private fun mimeTypeFromFileName(fileName: String): String = when {
    fileName.endsWith(".png", ignoreCase = true) -> "image/png"
    fileName.endsWith(".webp", ignoreCase = true) -> "image/webp"
    fileName.endsWith(".gif", ignoreCase = true) -> "image/gif"
    else -> "image/jpeg"
}

class PoseApiService(
    private val httpClient: HttpClient,
    private val baseUrl: String
) {
    suspend fun extractPose(imageBytes: ByteArray, fileName: String): ByteArray {
        val mimeType = mimeTypeFromFileName(fileName)
        val httpResponse: HttpResponse = httpClient.submitFormWithBinaryData(
            url = "$baseUrl/api/extract-pose",
            formData = formData {
                append("image", imageBytes, Headers.build {
                    append(HttpHeaders.ContentType, mimeType)
                    append(HttpHeaders.ContentDisposition, "filename=$fileName")
                })
            }
        )
        if (!httpResponse.status.isSuccess()) {
            val error = try {
                httpResponse.body<ApiErrorResponse>()
            } catch (_: Exception) {
                null
            }
            throw PoseApiException(
                code = error?.code ?: httpResponse.status.value.toString(),
                message = error?.message ?: "Server error: ${httpResponse.status}"
            )
        }
        val response: ExtractPoseResponse = httpResponse.body()
        return response.data.imageBase64.decodeBase64Bytes()
    }

    suspend fun getCommunityPoses(
        page: Int = 1,
        limit: Int = 20,
        difficulty: String? = null,
        tag: String? = null
    ): PaginatedResult<CommunityPose> {
        return httpClient.get("$baseUrl/api/community/poses") {
            parameter("page", page)
            parameter("limit", limit)
            difficulty?.let { parameter("difficulty", it) }
            tag?.let { parameter("tag", it) }
        }.body()
    }
}
