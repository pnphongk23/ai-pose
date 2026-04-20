package com.aipose.ui.screens.gallery

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.rememberTransformableState
import androidx.compose.foundation.gestures.transformable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.FileDownload
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil3.compose.AsyncImage
import com.aipose.Photo
import com.aipose.ui.components.cardChrome
import com.aipose.ui.theme.AiPoseColors
import com.aipose.ui.theme.AiPoseTypography
import com.aipose.ui.theme.CornerRadius
import com.aipose.ui.theme.Spacing

@Composable
fun PhotoDetailDialog(
    photo: Photo,
    onDismiss: () -> Unit,
    onDelete: (Long) -> Unit,
    onToggleFavorite: (Long) -> Unit,
    onSave: (Photo) -> Unit,
) {
    var scale by remember { mutableFloatStateOf(1f) }
    var showDeleteConfirm by remember { mutableStateOf(false) }

    val transformableState = rememberTransformableState { zoomChange, _, _ ->
        scale = (scale * zoomChange).coerceIn(0.5f, 5f)
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(AiPoseColors.Background)
        ) {
            // Zoomable image
            AsyncImage(
                model = photo.imagePath,
                contentDescription = photo.poseName,
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer(scaleX = scale, scaleY = scale)
                    .transformable(state = transformableState),
                contentScale = ContentScale.Fit
            )

            // Top bar – back button
            Box(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(Spacing.md)
                    .cardChrome()
            ) {
                IconButton(onClick = onDismiss) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = AiPoseColors.Foreground
                    )
                }
            }

            // Bottom action bar
            Row(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(horizontal = Spacing.lg, vertical = Spacing.md),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // SAVE
                Button(
                    onClick = { onSave(photo) },
                    colors = ButtonDefaults.buttonColors(containerColor = AiPoseColors.AccentBlue)
                ) {
                    Icon(
                        imageVector = Icons.Default.FileDownload,
                        contentDescription = null,
                        tint = AiPoseColors.Foreground,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "SAVE",
                        style = AiPoseTypography.Caption,
                        color = AiPoseColors.Foreground,
                        modifier = Modifier.padding(start = Spacing.xs)
                    )
                }

                // FAVORITE toggle
                IconButton(onClick = { onToggleFavorite(photo.id) }) {
                    Icon(
                        imageVector = if (photo.isFavorite == 1L) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                        contentDescription = "Favorite",
                        tint = if (photo.isFavorite == 1L) AiPoseColors.Primary else AiPoseColors.Subtext,
                        modifier = Modifier.size(28.dp)
                    )
                }

                // DELETE
                Button(
                    onClick = { showDeleteConfirm = true },
                    colors = ButtonDefaults.buttonColors(containerColor = AiPoseColors.Primary)
                ) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = null,
                        tint = AiPoseColors.Foreground,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "DELETE",
                        style = AiPoseTypography.Caption,
                        color = AiPoseColors.Foreground,
                        modifier = Modifier.padding(start = Spacing.xs)
                    )
                }
            }
        }
    }

    // Delete confirmation dialog
    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Delete Photo") },
            text = { Text("This photo will be permanently deleted.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        onDelete(photo.id)
                        onDismiss()
                    }
                ) {
                    Text("DELETE", color = AiPoseColors.Error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) {
                    Text("CANCEL")
                }
            }
        )
    }
}
