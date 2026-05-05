package com.aipose.ui.screens.poses

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.unit.dp
import org.jetbrains.compose.resources.painterResource
import ai_pose.composeapp.generated.resources.Res
import ai_pose.composeapp.generated.resources.ic_chevron_left
import coil3.compose.AsyncImage
import com.aipose.Pose
import com.aipose.data.AiPoseDatabase
import com.aipose.data.AppConfig
import com.aipose.data.DatabaseDriverFactory
import com.aipose.data.PoseRepository
import com.aipose.data.createDatabase
import com.aipose.data.remote.CommunityPose
import com.aipose.data.remote.PoseApiException
import com.aipose.data.remote.PoseApiService
import com.aipose.platform.ImagePicker
import com.aipose.ui.components.NeoBrutalismContainer
import com.aipose.ui.components.PrimaryButton
import com.aipose.ui.components.SectionHeader
import com.aipose.ui.components.TabSwitcher
import com.aipose.ui.theme.AiPoseColors
import com.aipose.ui.theme.AiPoseTypography
import com.aipose.ui.theme.Spacing
import io.ktor.client.HttpClient
import io.ktor.client.engine.darwin.Darwin
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.serialization.kotlinx.json.json
import io.ktor.util.encodeBase64
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock

sealed class UploadState {
    object Idle : UploadState()
    object Uploading : UploadState()
    data class Error(val message: String) : UploadState()
}

data class PosesUiState(
    val myPoses: List<Pose> = emptyList(),
    val communityPoses: List<CommunityPose> = emptyList(),
    val isLoading: Boolean = true,
    val isCommunityLoading: Boolean = false,
    val selectedTab: Int = 0,
    val uploadState: UploadState = UploadState.Idle,
    val communityPage: Int = 1,
    val hasMoreCommunity: Boolean = true
)

// Module-level singletons — shared HttpClient and ApiService (no Koin required, no per-ViewModel instance)
private val sharedHttpClient: HttpClient by lazy {
    HttpClient(Darwin) { install(ContentNegotiation) { json() } }
}
private val sharedApiService: PoseApiService by lazy {
    PoseApiService(sharedHttpClient, AppConfig.SERVER_BASE_URL)
}
private val sharedDatabase: AiPoseDatabase by lazy {
    createDatabase(DatabaseDriverFactory())
}

class PosesViewModel(
    private val repository: PoseRepository = PoseRepository(sharedDatabase, sharedApiService),
    private val apiService: PoseApiService = sharedApiService
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val _uiState = MutableStateFlow(PosesUiState())
    val uiState: StateFlow<PosesUiState> = _uiState.asStateFlow()

    suspend fun load() {
        repository.getMyPoses().collectLatest { poses ->
            _uiState.value = _uiState.value.copy(myPoses = poses, isLoading = false)
        }
    }

    fun selectTab(index: Int) {
        _uiState.value = _uiState.value.copy(selectedTab = index)
    }

    fun loadCommunityPoses(refresh: Boolean = false) {
        if (_uiState.value.isCommunityLoading) return
        scope.launch {
            _uiState.value = _uiState.value.copy(isCommunityLoading = true)
            try {
                val result = repository.getCommunityPoses(page = 1)
                _uiState.value = _uiState.value.copy(
                    communityPoses = result.data,
                    communityPage = 1,
                    hasMoreCommunity = result.data.size >= 20,
                    isCommunityLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isCommunityLoading = false)
            }
        }
    }

    fun loadMoreCommunityPoses() {
        val state = _uiState.value
        if (state.isCommunityLoading || !state.hasMoreCommunity) return
        scope.launch {
            _uiState.value = state.copy(isCommunityLoading = true)
            try {
                val nextPage = state.communityPage + 1
                val result = repository.getCommunityPoses(page = nextPage)
                _uiState.value = _uiState.value.copy(
                    communityPoses = state.communityPoses + result.data,
                    communityPage = nextPage,
                    hasMoreCommunity = result.data.size >= 20,
                    isCommunityLoading = false
                )
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(isCommunityLoading = false)
            }
        }
    }

    fun onPickImageResult(imageBytes: ByteArray) {
        scope.launch {
            _uiState.value = _uiState.value.copy(uploadState = UploadState.Uploading)
            try {
                val outlineBytes = apiService.extractPose(imageBytes, "pose.jpg")
                val base64 = outlineBytes.encodeBase64()
                val dataUri = "data:image/png;base64,$base64"
                repository.insertPose(
                    name = "Extracted Pose ${Clock.System.now().epochSeconds}",
                    imagePath = dataUri,
                    isMine = true
                )
                _uiState.value = _uiState.value.copy(uploadState = UploadState.Idle)
            } catch (e: PoseApiException) {
                val userMessage = when (e.code) {
                    "ALL_KEYS_EXHAUSTED" -> "Service unavailable, please try again later."
                    "INVALID_IMAGE" -> "Invalid image. Please pick a different photo."
                    else -> e.message ?: "Upload failed"
                }
                _uiState.value = _uiState.value.copy(uploadState = UploadState.Error(userMessage))
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    uploadState = UploadState.Error(e.message ?: "Upload failed")
                )
            }
        }
    }

    fun clearUploadError() {
        _uiState.value = _uiState.value.copy(uploadState = UploadState.Idle)
    }
}

@Composable
fun PosesScreen(
    viewModel: PosesViewModel,
    onPoseClick: (Long) -> Unit,
    onExtractPoseClick: () -> Unit,
    onCommunityPoseClick: (CommunityPose) -> Unit = {},
    onBack: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    val imagePicker = remember { ImagePicker() }

    LaunchedEffect(viewModel) {
        viewModel.load()
    }

    LaunchedEffect(uiState.selectedTab) {
        if (uiState.selectedTab == 1 && uiState.communityPoses.isEmpty()) {
            viewModel.loadCommunityPoses()
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .padding(Spacing.lg),
            verticalArrangement = Arrangement.spacedBy(Spacing.lg)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (onBack != null) {
                        NeoBrutalismContainer(
                            modifier = Modifier.size(32.dp),
                            shape = RoundedCornerShape(10.dp),
                            backgroundColor = AiPoseColors.Background,
                            shadowOffset = 2.dp,
                            borderWidth = 2.dp,
                            onClick = onBack
                        ) {
                            Icon(
                                painter = painterResource(Res.drawable.ic_chevron_left),
                                contentDescription = "Back",
                                tint = AiPoseColors.Foreground,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                    Text(
                        text = "POSES",
                        style = AiPoseTypography.Heading1,
                        color = AiPoseColors.Foreground
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(Spacing.xs)) {
                    NeoBrutalismContainer(
                        modifier = Modifier.size(32.dp),
                        shape = RoundedCornerShape(10.dp),
                        backgroundColor = AiPoseColors.Background,
                        shadowOffset = 2.dp,
                        borderWidth = 2.dp,
                        onClick = {}
                    ) {
                        Icon(
                            imageVector = Icons.Default.Search,
                            contentDescription = "Search",
                            tint = AiPoseColors.Foreground,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                    NeoBrutalismContainer(
                        modifier = Modifier.size(32.dp),
                        shape = RoundedCornerShape(10.dp),
                        backgroundColor = AiPoseColors.Background,
                        shadowOffset = 2.dp,
                        borderWidth = 2.dp,
                        onClick = {
                            imagePicker.pickImageFromGallery { bytes ->
                                bytes?.let { viewModel.onPickImageResult(it) }
                            }
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Add,
                            contentDescription = "Add pose",
                            tint = AiPoseColors.Foreground,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }

            if (uiState.uploadState is UploadState.Error) {
                Text(
                    text = (uiState.uploadState as UploadState.Error).message,
                    style = AiPoseTypography.Caption,
                    color = AiPoseColors.Error
                )
            }

            TabSwitcher(
                tabs = listOf("My Poses", "Community"),
                selectedIndex = uiState.selectedTab,
                onSelect = viewModel::selectTab
            )

            when (uiState.selectedTab) {
                0 -> MyPosesContent(
                    uiState = uiState,
                    onPoseClick = onPoseClick,
                    onExtractPoseClick = onExtractPoseClick
                )
                1 -> CommunityContent(
                    uiState = uiState,
                    onPoseClick = onCommunityPoseClick,
                    onLoadMore = viewModel::loadMoreCommunityPoses
                )
            }
        }

        // M4: dimmed scrim overlay while uploading
        if (uiState.uploadState is UploadState.Uploading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.5f)),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = AiPoseColors.Primary)
                    Text(
                        text = "Extracting pose...",
                        style = AiPoseTypography.Caption,
                        color = Color.White,
                        modifier = Modifier.padding(top = Spacing.sm)
                    )
                }
            }
        }
    }
}

@Composable
private fun MyPosesContent(
    uiState: PosesUiState,
    onPoseClick: (Long) -> Unit,
    onExtractPoseClick: () -> Unit
) {
    when {
        uiState.isLoading -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = AiPoseColors.Primary)
            }
        }
        uiState.myPoses.isEmpty() -> {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = Spacing.lg),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text("NO POSES YET", style = AiPoseTypography.Heading3, color = AiPoseColors.Foreground)
                Text(
                    text = "Extract your first pose to start building your library.",
                    modifier = Modifier.padding(top = Spacing.sm, bottom = Spacing.lg),
                    style = AiPoseTypography.Body,
                    color = AiPoseColors.Subtext
                )
                PrimaryButton(text = "Extract Pose", onClick = onExtractPoseClick)
            }
        }
        else -> {
            Column(verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
                SectionHeader(title = "Recent", count = uiState.myPoses.size)
                LazyVerticalGrid(
                    modifier = Modifier.fillMaxSize(),
                    columns = GridCells.Fixed(2),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.md),
                    verticalArrangement = Arrangement.spacedBy(Spacing.md)
                ) {
                    items(uiState.myPoses, key = { it.id }) { pose ->
                        PoseCard(pose = pose, onClick = { onPoseClick(pose.id) })
                    }
                }
            }
        }
    }
}

@Composable
private fun CommunityContent(
    uiState: PosesUiState,
    onPoseClick: (CommunityPose) -> Unit,
    onLoadMore: () -> Unit
) {
    when {
        uiState.isCommunityLoading && uiState.communityPoses.isEmpty() -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = AiPoseColors.Primary)
            }
        }
        uiState.communityPoses.isEmpty() -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No community poses yet.", style = AiPoseTypography.Body, color = AiPoseColors.Subtext)
            }
        }
        else -> {
            LazyVerticalGrid(
                modifier = Modifier.fillMaxSize(),
                columns = GridCells.Fixed(2),
                horizontalArrangement = Arrangement.spacedBy(Spacing.md),
                verticalArrangement = Arrangement.spacedBy(Spacing.md)
            ) {
                items(uiState.communityPoses, key = { it.id }) { pose ->
                    CommunityPoseCard(pose = pose, onClick = { onPoseClick(pose) })
                }
                if (uiState.hasMoreCommunity) {
                    item {
                        LaunchedEffect(Unit) { onLoadMore() }
                        Box(contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = AiPoseColors.Primary)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CommunityPoseCard(
    pose: CommunityPose,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(Spacing.xs),
        verticalArrangement = Arrangement.spacedBy(Spacing.sm)
    ) {
        AsyncImage(
            model = pose.thumbnailPath ?: pose.imagePath,
            contentDescription = pose.name,
            modifier = Modifier.fillMaxWidth()
        )
        Text(
            text = pose.name,
            style = AiPoseTypography.Caption,
            color = AiPoseColors.Foreground,
            maxLines = 1
        )
    }
}
