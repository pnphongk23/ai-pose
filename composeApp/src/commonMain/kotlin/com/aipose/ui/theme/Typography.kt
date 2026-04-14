// composeApp/src/commonMain/kotlin/com/aipose/ui/theme/Typography.kt
package com.aipose.ui.theme

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

object AiPoseTypography {
    val Heading1 = TextStyle(
        fontSize = 32.sp,
        fontWeight = FontWeight.ExtraBold,
        lineHeight = 38.sp
    )
    val Heading2 = TextStyle(
        fontSize = 24.sp,
        fontWeight = FontWeight.Bold,
        lineHeight = 30.sp
    )
    val Heading3 = TextStyle(
        fontSize = 18.sp,
        fontWeight = FontWeight.Bold,
        lineHeight = 24.sp
    )
    val Body = TextStyle(
        fontSize = 14.sp,
        fontWeight = FontWeight.Normal,
        lineHeight = 20.sp
    )
    val BodyBold = TextStyle(
        fontSize = 14.sp,
        fontWeight = FontWeight.Medium,
        lineHeight = 20.sp
    )
    val Caption = TextStyle(
        fontSize = 11.sp,
        fontWeight = FontWeight.Medium,
        lineHeight = 16.sp,
        letterSpacing = 0.88.sp
    )
    val CaptionBold = TextStyle(
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        lineHeight = 16.sp,
        letterSpacing = 0.88.sp
    )
}
