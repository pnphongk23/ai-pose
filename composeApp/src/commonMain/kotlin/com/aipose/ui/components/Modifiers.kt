// composeApp/src/commonMain/kotlin/com/aipose/ui/components/Modifiers.kt
package com.aipose.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.aipose.ui.theme.AiPoseColors
import com.aipose.ui.theme.CornerRadius
import com.aipose.ui.theme.Spacing

fun Modifier.neoBorder(
    width: Dp = 2.dp,
    color: Color = AiPoseColors.Foreground,
    cornerRadius: Dp = CornerRadius.sm
): Modifier = this.border(width, color, RoundedCornerShape(cornerRadius))

fun Modifier.neoShadow(
    offsetX: Dp = 3.dp,
    offsetY: Dp = 3.dp,
    color: Color = AiPoseColors.Foreground
): Modifier = this.drawBehind {
    drawIntoCanvas { canvas ->
        val paint = Paint().apply {
            this.color = color
        }
        canvas.drawRect(
            left = offsetX.toPx(),
            top = offsetY.toPx(),
            right = size.width + offsetX.toPx(),
            bottom = size.height + offsetY.toPx(),
            paint = paint
        )
    }
}

fun Modifier.ghostBorder(): Modifier = this.border(
    width = 1.dp,
    color = AiPoseColors.Border,
    shape = RoundedCornerShape(CornerRadius.md)
)

fun Modifier.cardChrome(): Modifier = this
    .neoShadow(offsetX = 4.dp, offsetY = 4.dp)
    .background(AiPoseColors.Surface, RoundedCornerShape(CornerRadius.md))
    .neoBorder(cornerRadius = CornerRadius.md)

fun Modifier.badgeChrome(color: Color): Modifier = this
    .background(color, RoundedCornerShape(CornerRadius.sm))
    .padding(horizontal = Spacing.sm, vertical = Spacing.xs)
