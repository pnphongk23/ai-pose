package com.aipose.ui.screens.gallery

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.Apps
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.aipose.ui.components.PrimaryButton
import com.aipose.ui.components.SectionHeader
import com.aipose.ui.components.cardChrome
import com.aipose.ui.components.neoBorder
import com.aipose.ui.components.neoShadow
import com.aipose.ui.theme.AiPoseColors
import com.aipose.ui.theme.AiPoseTypography
import com.aipose.ui.theme.CornerRadius
import com.aipose.ui.theme.Spacing
import com.aipose.platform.saveImageToPhotos
import kotlinx.coroutines.launch

@Composable
fun GalleryScreen(
    viewModel: GalleryViewModel,
    onOpenCamera: () -> Unit,
    onBack: (() -> Unit)? = null,
) {
    val uiState by viewModel.uiState.collectAsState()
    LaunchedEffect(Unit) { viewModel.load() }

    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    Box(modifier = Modifier.fillMaxSize()) {
    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = AiPoseColors.Background
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = Spacing.md)
        ) {
            // ── Header row ──────────────────────────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = Spacing.md),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (onBack != null) {
                    IconButton(onClick = { onBack() }) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = AiPoseColors.Foreground
                        )
                    }
                }

                Text(
                    text = "GALLERY",
                    style = AiPoseTypography.GalleryTitle,
                    color = AiPoseColors.Foreground,
                    letterSpacing = 0.08.em,
                    modifier = Modifier.weight(1f)
                )

                // GRID button
                val isGrid = uiState.viewMode == ViewMode.GRID
                IconButton(
                    onClick = { if (!isGrid) viewModel.toggleViewMode() },
                    modifier = Modifier
                        .background(
                            color = if (isGrid) AiPoseColors.AccentBlue else AiPoseColors.Background,
                            shape = RoundedCornerShape(CornerRadius.sm)
                        )
                        .neoBorder()
                        .neoShadow(1.dp, 1.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Apps,
                        contentDescription = "Grid view",
                        tint = AiPoseColors.Foreground,
                        modifier = Modifier.size(20.dp)
                    )
                }

                // LIST button
                val isList = uiState.viewMode == ViewMode.LIST
                IconButton(
                    onClick = { if (!isList) viewModel.toggleViewMode() },
                    modifier = Modifier
                        .background(
                            color = if (isList) AiPoseColors.AccentBlue else AiPoseColors.Background,
                            shape = RoundedCornerShape(CornerRadius.sm)
                        )
                        .neoBorder()
                        .neoShadow(1.dp, 1.dp)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.List,
                        contentDescription = "List view",
                        tint = AiPoseColors.Foreground,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            // ── Content states ───────────────────────────────────────────────
            when {
                uiState.isLoading -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = AiPoseColors.Primary)
                    }
                }

                uiState.photos.isEmpty() -> {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(
                            modifier = Modifier
                                .cardChrome()
                                .padding(Spacing.lg),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(Spacing.md)
                        ) {
                            Text("📸", fontSize = 48.sp)
                            Text("NO PHOTOS YET", style = AiPoseTypography.Heading3)
                            PrimaryButton(text = "OPEN CAMERA", onClick = { onOpenCamera() })
                        }
                    }
                }

                else -> {
                    if (uiState.viewMode == ViewMode.GRID) {
                        LazyVerticalGrid(
                            columns = GridCells.Fixed(2),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            uiState.groupedByDate.forEach { (dateKey, photos) ->
                                item(span = { GridItemSpan(2) }) {
                                    SectionHeader(
                                        title = dateKey,
                                        count = photos.size,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = Spacing.xs)
                                    )
                                }
                                items(photos) { photo ->
                                    PhotoCard(
                                        photo = photo,
                                        onClick = { viewModel.selectPhoto(photo) }
                                    )
                                }
                            }
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            uiState.groupedByDate.forEach { (dateKey, photos) ->
                                item {
                                    SectionHeader(
                                        title = dateKey,
                                        count = photos.size,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = Spacing.xs)
                                    )
                                }
                                items(photos) { photo ->
                                    PhotoCard(
                                        photo = photo,
                                        onClick = { viewModel.selectPhoto(photo) },
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                }
                            }
                            item { Spacer(Modifier.height(Spacing.md)) }
                        }
                    }
                }
            }
        }
    }

    // ── PhotoDetailDialog ────────────────────────────────────────────────────
    uiState.selectedPhoto?.let { photo ->
        PhotoDetailDialog(
            photo = photo,
            onDismiss = { viewModel.selectPhoto(null) },
            onDelete = { id -> scope.launch { viewModel.deletePhoto(id) } },
            onToggleFavorite = { id -> scope.launch { viewModel.toggleFavorite(id) } },
            onSave = { photo ->
                val result = saveImageToPhotos(photo.imagePath, null)
                if (!result) scope.launch { snackbarHostState.showSnackbar("Save failed") }
            }
        )
    }
    } // end Box overlay
}
