package com.aipose.ui.screens.poses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.aipose.Pose
import com.aipose.data.PoseRepository
import com.aipose.ui.components.PrimaryButton
import com.aipose.ui.components.SectionHeader
import com.aipose.ui.components.TabSwitcher
import com.aipose.ui.theme.AiPoseColors
import com.aipose.ui.theme.AiPoseTypography
import com.aipose.ui.theme.Spacing
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest

class PosesViewModel(
    private val repository: PoseRepository = PoseRepository()
) {
    private val _uiState = MutableStateFlow(PosesUiState())
    val uiState: StateFlow<PosesUiState> = _uiState.asStateFlow()

    suspend fun load() {
        repository.getMyPoses().collectLatest { poses ->
            _uiState.value = _uiState.value.copy(
                poses = poses,
                isLoading = false
            )
        }
    }

    fun selectTab(index: Int) {
        _uiState.value = _uiState.value.copy(selectedTab = index)
    }
}

data class PosesUiState(
    val poses: List<Pose> = emptyList(),
    val isLoading: Boolean = true,
    val selectedTab: Int = 0
)

@Composable
fun PosesScreen(
    viewModel: PosesViewModel,
    onPoseClick: (Long) -> Unit,
    onExtractPoseClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()
    var headerMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(viewModel) {
        viewModel.load()
    }

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
            Text(
                text = "POSES",
                style = AiPoseTypography.Heading1,
                color = AiPoseColors.Foreground
            )

            Row(horizontalArrangement = Arrangement.spacedBy(Spacing.xs)) {
                IconButton(onClick = { headerMessage = "Coming soon" }) {
                    Icon(Icons.Default.Search, contentDescription = "Search")
                }
                IconButton(onClick = { headerMessage = "Coming soon" }) {
                    Icon(Icons.Default.Add, contentDescription = "Add pose")
                }
            }
        }

        headerMessage?.let {
            Text(
                text = it,
                style = AiPoseTypography.Caption,
                color = AiPoseColors.Subtext
            )
        }

        TabSwitcher(
            tabs = listOf("My Poses", "Community"),
            selectedIndex = uiState.selectedTab,
            onSelect = viewModel::selectTab,
            disabledIndices = setOf(1)
        )

        when {
            uiState.isLoading -> {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    CircularProgressIndicator(color = AiPoseColors.Primary)
                }
            }

            uiState.poses.isEmpty() -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = Spacing.lg),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "NO POSES YET",
                        style = AiPoseTypography.Heading3,
                        color = AiPoseColors.Foreground
                    )
                    Text(
                        text = "Extract your first pose to start building your library.",
                        modifier = Modifier.padding(top = Spacing.sm, bottom = Spacing.lg),
                        style = AiPoseTypography.Body,
                        color = AiPoseColors.Subtext
                    )
                    PrimaryButton(
                        text = "Extract Pose",
                        onClick = onExtractPoseClick
                    )
                }
            }

            else -> {
                Column(
                    verticalArrangement = Arrangement.spacedBy(Spacing.md)
                ) {
                    SectionHeader(title = "Recent", count = uiState.poses.size)
                    LazyVerticalGrid(
                        modifier = Modifier.fillMaxSize(),
                        columns = GridCells.Fixed(2),
                        horizontalArrangement = Arrangement.spacedBy(Spacing.md),
                        verticalArrangement = Arrangement.spacedBy(Spacing.md)
                    ) {
                        items(uiState.poses, key = { it.id }) { pose ->
                            PoseCard(
                                pose = pose,
                                onClick = { onPoseClick(pose.id) }
                            )
                        }
                    }
                }
            }
        }
    }
}
