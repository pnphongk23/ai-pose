// composeApp/src/commonMain/kotlin/com/aipose/navigation/Navigation.kt
package com.aipose.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import cafe.adriel.voyager.navigator.tab.LocalTabNavigator
import cafe.adriel.voyager.navigator.tab.Tab
import cafe.adriel.voyager.navigator.tab.TabOptions
import com.aipose.ui.theme.AiPoseColors
import com.aipose.ui.theme.AiPoseTypography
import com.aipose.ui.theme.Spacing

object CameraTab : Tab {
    override val options: TabOptions
        @Composable
        get() {
            val icon = rememberVectorPainter(Icons.Default.CameraAlt)
            return remember {
                TabOptions(
                    index = 0u,
                    title = "Camera",
                    icon = icon
                )
            }
        }

    @Composable
    override fun Content() {
        PlaceholderScreen("Camera")
    }
}

object PosesTab : Tab {
    override val options: TabOptions
        @Composable
        get() {
            val icon = rememberVectorPainter(Icons.Default.Person)
            return remember {
                TabOptions(
                    index = 1u,
                    title = "Poses",
                    icon = icon
                )
            }
        }

    @Composable
    override fun Content() {
        PlaceholderScreen("Poses")
    }
}

object GalleryTab : Tab {
    override val options: TabOptions
        @Composable
        get() {
            val icon = rememberVectorPainter(Icons.Default.PhotoLibrary)
            return remember {
                TabOptions(
                    index = 2u,
                    title = "Gallery",
                    icon = icon
                )
            }
        }

    @Composable
    override fun Content() {
        PlaceholderScreen("Gallery")
    }
}

@Composable
fun BottomNavigation() {
    val tabNavigator = LocalTabNavigator.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(AiPoseColors.Background)
            .padding(Spacing.lg),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        TabItem(
            title = "Camera",
            icon = Icons.Default.CameraAlt,
            isSelected = tabNavigator.current == CameraTab,
            onClick = { tabNavigator.current = CameraTab }
        )
        TabItem(
            title = "Poses",
            icon = Icons.Default.Person,
            isSelected = tabNavigator.current == PosesTab,
            onClick = { tabNavigator.current = PosesTab }
        )
        TabItem(
            title = "Gallery",
            icon = Icons.Default.PhotoLibrary,
            isSelected = tabNavigator.current == GalleryTab,
            onClick = { tabNavigator.current = GalleryTab }
        )
    }
}

@Composable
private fun TabItem(
    title: String,
    icon: ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .clickable(onClick = onClick)
            .padding(Spacing.sm),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = icon,
            contentDescription = title,
            tint = if (isSelected) AiPoseColors.Primary else AiPoseColors.Subtext
        )
        Spacer(modifier = Modifier.height(Spacing.xs))
        Text(
            text = title.uppercase(),
            style = AiPoseTypography.Caption,
            color = if (isSelected) AiPoseColors.Foreground else AiPoseColors.Subtext
        )
    }
}

@Composable
private fun PlaceholderScreen(name: String) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(AiPoseColors.Background),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = name,
            style = AiPoseTypography.Heading1,
            color = AiPoseColors.Foreground
        )
    }
}
