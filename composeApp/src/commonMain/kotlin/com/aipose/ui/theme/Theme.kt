// composeApp/src/commonMain/kotlin/com/aipose/ui/theme/Theme.kt
package com.aipose.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

// Note: No dark theme for now - iOS only supports light mode
private val LightColorScheme = lightColorScheme(
    primary = AiPoseColors.Primary,
    onPrimary = AiPoseColors.Foreground,
    secondary = AiPoseColors.Primary700,
    background = AiPoseColors.Background,
    surface = AiPoseColors.Surface,
    onBackground = AiPoseColors.Foreground,
    onSurface = AiPoseColors.Foreground,
    error = AiPoseColors.Error
)

@Composable
fun AiPoseTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
