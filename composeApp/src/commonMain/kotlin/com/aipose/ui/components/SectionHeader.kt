package com.aipose.ui.components

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.em
import com.aipose.ui.theme.AiPoseColors
import com.aipose.ui.theme.AiPoseTypography

@Composable
fun SectionHeader(
    title: String,
    count: Int,
    modifier: Modifier = Modifier
) {
    Text(
        text = "${title.uppercase()} • $count",
        modifier = modifier,
        style = AiPoseTypography.CaptionBold,
        color = AiPoseColors.Subtext,
        letterSpacing = 0.08.em
    )
}
