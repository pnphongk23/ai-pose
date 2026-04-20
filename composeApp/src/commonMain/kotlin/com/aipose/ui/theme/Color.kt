// composeApp/src/commonMain/kotlin/com/aipose/ui/theme/Color.kt
package com.aipose.ui.theme

import androidx.compose.ui.graphics.Color

object AiPoseColors {
    // Brand (from Subframe brand-primary)
    val Primary = Color(0xFFE7A1B0)
    val Primary50 = Color(0xFFFDF0F3)
    val Primary100 = Color(0xFFFAE0E7)
    val Primary700 = Color(0xFFD47A90)
    val Primary900 = Color(0xFF8C3350)

    // Neutral (from Subframe neutral scale)
    val Background = Color(0xFFFAF8F3)   // neutral-50
    val Surface = Color(0xFFFFFFFF)      // neutral-0
    val SurfaceVariant = Color(0xFFF4F1E8) // neutral-100
    val Foreground = Color(0xFF171717)   // neutral-900
    val Subtext = Color(0xFF737373)      // neutral-500
    val Border = Color(0xFFE8E5DF)       // neutral-200

    // Semantic
    val Success = Color(0xFFDFF5D0)      // success-50
    val SuccessForeground = Color(0xFF228715) // success-700
    val Warning = Color(0xFFF4C542)      // warning-400
    val WarningForeground = Color(0xFF9E6E06) // warning-700
    val Error = Color(0xFFEE4848)        // error-500
    val ErrorForeground = Color(0xFFB01E1E) // error-700

    // Gallery
    val AccentBlue = Color(0xFF87CEEB)
}
