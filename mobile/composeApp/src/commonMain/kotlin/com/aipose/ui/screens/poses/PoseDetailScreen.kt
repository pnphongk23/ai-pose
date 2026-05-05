package com.aipose.ui.screens.poses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.ui.unit.dp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Image
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import coil3.compose.AsyncImage
import com.aipose.Pose
import com.aipose.data.AiPoseDatabase
import com.aipose.data.DatabaseDriverFactory
import com.aipose.data.PoseRepository
import com.aipose.ui.components.PrimaryButton
import com.aipose.ui.theme.AiPoseColors
import com.aipose.ui.theme.AiPoseTypography
import com.aipose.ui.theme.Spacing
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class PoseDetailViewModel(
    private val poseId: Long,
    private val repository: PoseRepository = PoseRepository(AiPoseDatabase(DatabaseDriverFactory().createDriver()))
) {
    private val _uiState = MutableStateFlow<PoseDetailUiState>(PoseDetailUiState.Loading)
    val uiState: StateFlow<PoseDetailUiState> = _uiState.asStateFlow()

    suspend fun load() {
        repository.getPoseById(poseId).collectLatest { pose ->
            _uiState.value = if (pose == null) {
                PoseDetailUiState.NotFound
            } else {
                PoseDetailUiState.Success(pose)
            }
        }
    }

    suspend fun delete() {
        repository.deletePose(poseId)
    }
}

sealed interface PoseDetailUiState {
    data object Loading : PoseDetailUiState
    data object NotFound : PoseDetailUiState
    data class Success(val pose: Pose) : PoseDetailUiState
}

@Composable
fun PoseDetailScreen(
    poseId: Long,
    viewModel: PoseDetailViewModel,
    onUseWithCamera: (Pose) -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    var showDeleteDialog by remember { mutableStateOf(false) }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(viewModel) {
        viewModel.load()
    }

    when (val state = uiState) {
        PoseDetailUiState.Loading -> {
            Column(
                modifier = modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                CircularProgressIndicator(color = AiPoseColors.Primary)
            }
        }

        PoseDetailUiState.NotFound -> {
            Column(
                modifier = modifier
                    .fillMaxSize()
                    .padding(Spacing.lg),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "POSE NOT FOUND",
                    style = AiPoseTypography.Heading3,
                    color = AiPoseColors.Foreground
                )
                TextButton(onClick = onBack) {
                    Text("Go back")
                }
            }
        }

        is PoseDetailUiState.Success -> {
            val pose = state.pose
            Column(
                modifier = modifier
                    .fillMaxSize()
                    .padding(Spacing.lg),
                verticalArrangement = Arrangement.spacedBy(Spacing.lg)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                    IconButton(onClick = { showDeleteDialog = true }) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete pose")
                    }
                }

                if (pose.imagePath.isNotBlank()) {
                    AsyncImage(
                        model = pose.imagePath,
                        contentDescription = pose.name,
                        modifier = Modifier.fillMaxWidth(),
                        contentScale = ContentScale.FillWidth
                    )
                } else {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = Spacing.xxl),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.Image,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = AiPoseColors.Subtext
                        )
                    }
                }

                Text(
                    text = pose.name.uppercase(),
                    style = AiPoseTypography.Heading2,
                    color = AiPoseColors.Foreground
                )
                Text(
                    text = "Created ${pose.createdAt}",
                    style = AiPoseTypography.Body,
                    color = AiPoseColors.Subtext
                )
                PrimaryButton(
                    text = "Use with Camera",
                    onClick = { onUseWithCamera(pose) },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            if (showDeleteDialog) {
                AlertDialog(
                    onDismissRequest = { showDeleteDialog = false },
                    title = { Text("Delete pose?") },
                    text = { Text("This will remove ${pose.name} from your library.") },
                    confirmButton = {
                        TextButton(
                            onClick = {
                                showDeleteDialog = false
                                coroutineScope.launch {
                                    viewModel.delete()
                                    onBack()
                                }
                            }
                        ) {
                            Text("Delete")
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { showDeleteDialog = false }) {
                            Text("Cancel")
                        }
                    }
                )
            }
        }
    }
}
