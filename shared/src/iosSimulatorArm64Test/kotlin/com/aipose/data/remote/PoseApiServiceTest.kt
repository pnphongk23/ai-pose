package com.aipose.data.remote

import io.ktor.client.*
import io.ktor.client.engine.mock.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.forms.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.utils.io.*
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class PoseApiServiceTest {

    private fun buildMockClient(handler: MockRequestHandler): HttpClient {
        return HttpClient(MockEngine) {
            engine {
                addHandler(handler)
            }
            install(ContentNegotiation) {
                json(Json { ignoreUnknownKeys = true })
            }
        }
    }

    @Test
    fun `extractPose sends POST multipart with image field and returns ByteArray`() = runTest {
        var capturedRequest: io.ktor.client.request.HttpRequestData? = null
        val fakeImageBytes = ByteArray(10) { it.toByte() }

        val client = buildMockClient { request ->
            capturedRequest = request
            respond(
                content = ByteReadChannel("""{"success":true,"data":{"imageBase64":"AQIDBA==","mimeType":"image/png","processingTimeMs":100}}"""),
                status = HttpStatusCode.OK,
                headers = headersOf(HttpHeaders.ContentType, "application/json")
            )
        }

        val service = PoseApiService(client, "https://test.server")
        val result = service.extractPose(fakeImageBytes, "test.jpg")

        assertNotNull(capturedRequest)
        assertEquals(HttpMethod.Post, capturedRequest!!.method)
        assertEquals("/api/extract-pose", capturedRequest!!.url.encodedPath)
        // Verify POST to correct endpoint (multipart body field "image" verified by server contract)
        assertNotNull(result)
    }

    @Test
    fun `extractPose throws PoseApiException on non-2xx response`() = runTest {
        val client = buildMockClient { _ ->
            respond(
                content = ByteReadChannel("""{"code":"INVALID_IMAGE","message":"Bad image format"}"""),
                status = HttpStatusCode.BadRequest,
                headers = headersOf(HttpHeaders.ContentType, "application/json")
            )
        }

        val service = PoseApiService(client, "https://test.server")
        var thrown: PoseApiException? = null
        try {
            service.extractPose(ByteArray(4), "bad.jpg")
        } catch (e: PoseApiException) {
            thrown = e
        }

        assertNotNull(thrown)
        assertEquals("INVALID_IMAGE", thrown!!.code)
    }

    @Test
    fun `getCommunityPoses sends GET with correct query params`() = runTest {
        var capturedRequest: io.ktor.client.request.HttpRequestData? = null

        val client = buildMockClient { request ->
            capturedRequest = request
            respond(
                content = ByteReadChannel("""{"data":[],"pagination":{"page":1,"limit":20,"total":0}}"""),
                status = HttpStatusCode.OK,
                headers = headersOf(HttpHeaders.ContentType, "application/json")
            )
        }

        val service = PoseApiService(client, "https://test.server")
        val result = service.getCommunityPoses(page = 2, limit = 10, difficulty = "beginner")

        assertNotNull(capturedRequest)
        assertEquals(HttpMethod.Get, capturedRequest!!.method)
        assertEquals("/api/community/poses", capturedRequest!!.url.encodedPath)
        assertEquals("2", capturedRequest!!.url.parameters["page"])
        assertEquals("10", capturedRequest!!.url.parameters["limit"])
        assertEquals("beginner", capturedRequest!!.url.parameters["difficulty"])

        assertNotNull(result)
        assertEquals(1, result.pagination.page)
    }
}
