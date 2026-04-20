package com.aipose.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.offset
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.aipose.ui.theme.AiPoseColors

@Composable
fun NeoBrutalismContainer(
    modifier: Modifier = Modifier,
    shape: Shape,
    backgroundColor: Color,
    borderColor: Color = AiPoseColors.Foreground,
    borderWidth: Dp = 2.dp,
    shadowColor: Color = Color.Black,
    shadowOffset: Dp = 4.dp,
    hasShadow: Boolean = true,
    contentAlignment: Alignment = Alignment.Center,
    onClick: (() -> Unit)? = null,
    content: @Composable () -> Unit
) {
    val clickableModifier = if (onClick != null) {
        Modifier.clickable(role = Role.Button, onClick = onClick)
    } else Modifier

    Box(modifier = modifier) {
        if (hasShadow) {
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .offset(x = shadowOffset, y = shadowOffset)
                    .background(shadowColor, shape)
            )
        }
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(backgroundColor, shape)
                .border(borderWidth, borderColor, shape)
                .then(clickableModifier),
            contentAlignment = contentAlignment
        ) {
            content()
        }
    }
}
