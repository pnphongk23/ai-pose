package com.aipose.ui.screens.poses

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Image
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import coil3.compose.AsyncImage
import com.aipose.Pose
import com.aipose.ui.components.Badge
import com.aipose.ui.components.BadgeType
import com.aipose.ui.components.cardChrome
import com.aipose.ui.theme.AiPoseColors
import com.aipose.ui.theme.AiPoseTypography
import com.aipose.ui.theme.CornerRadius
import com.aipose.ui.theme.Spacing

@Composable
fun PoseCard(
    pose: Pose,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        verticalArrangement = Arrangement.spacedBy(Spacing.sm)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .cardChrome()
                .clip(androidx.compose.foundation.shape.RoundedCornerShape(CornerRadius.md))
                .background(AiPoseColors.Surface),
            contentAlignment = Alignment.Center
        ) {
            val imageModel = pose.thumbnailPath ?: pose.imagePath
            if (imageModel.isNotBlank()) {
                AsyncImage(
                    model = imageModel,
                    contentDescription = pose.name,
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

            Badge(
                text = if (pose.isMine == 1L) "Mine" else "Pose",
                type = BadgeType.MINE,
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(Spacing.sm)
            )
        }

        Text(
            text = pose.name.uppercase(),
            style = AiPoseTypography.BodyBold,
            color = AiPoseColors.Foreground,
            letterSpacing = 0.08.em,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}
