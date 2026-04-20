package com.aipose.ui.screens.gallery

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Image
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.aipose.Photo
import com.aipose.ui.components.badgeChrome
import com.aipose.ui.components.cardChrome
import com.aipose.ui.theme.AiPoseColors
import com.aipose.ui.theme.AiPoseTypography
import com.aipose.ui.theme.CornerRadius
import com.aipose.ui.theme.Spacing

@Composable
fun PhotoCard(
    photo: Photo,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        verticalArrangement = Arrangement.spacedBy(Spacing.xs)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .cardChrome()
                .clip(RoundedCornerShape(CornerRadius.md))
                .background(AiPoseColors.Surface),
            contentAlignment = Alignment.Center
        ) {
            if (photo.imagePath.isNotBlank()) {
                AsyncImage(
                    model = photo.imagePath,
                    contentDescription = photo.poseName,
                    modifier = Modifier.fillMaxWidth(),
                    contentScale = ContentScale.Crop
                )
            } else {
                Icon(
                    imageVector = Icons.Default.Image,
                    contentDescription = null,
                    modifier = Modifier.size(40.dp),
                    tint = AiPoseColors.Subtext
                )
            }

            if (photo.poseName.isNotBlank()) {
                val badgeColor = when (photo.id % 4) {
                    0L -> AiPoseColors.Primary
                    1L -> AiPoseColors.Warning
                    2L -> AiPoseColors.AccentBlue
                    else -> AiPoseColors.Success
                }
                Text(
                    text = photo.poseName,
                    style = AiPoseTypography.Caption,
                    color = AiPoseColors.Foreground,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(Spacing.sm)
                        .badgeChrome(badgeColor)
                )
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 2.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            val timeStr = formatEpochToTime(photo.createdAt)
            Text(
                text = timeStr,
                style = AiPoseTypography.Caption,
                color = AiPoseColors.Subtext.copy(alpha = 0.6f),
                fontSize = 9.sp
            )
            Icon(
                imageVector = if (photo.isFavorite == 1L) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                contentDescription = null,
                modifier = Modifier.size(14.dp),
                tint = if (photo.isFavorite == 1L) AiPoseColors.Primary else AiPoseColors.Subtext
            )
        }
    }
}

private fun formatEpochToTime(createdAt: String): String {
    return try {
        val millis = createdAt.toLong()
        val totalSeconds = millis / 1000
        val totalMinutes = totalSeconds / 60
        val totalHours = totalMinutes / 60
        val minutes = totalMinutes % 60
        // UTC hours; simple display
        val hoursUtc = totalHours % 24
        val amPm = if (hoursUtc < 12) "AM" else "PM"
        val hours12 = when {
            hoursUtc == 0L -> 12L
            hoursUtc > 12L -> hoursUtc - 12L
            else -> hoursUtc
        }
        val minStr = if (minutes < 10) "0$minutes" else "$minutes"
        "$hours12:$minStr $amPm"
    } catch (e: Exception) {
        createdAt
    }
}
