// composeApp/src/commonMain/kotlin/com/aipose/App.kt
package com.aipose

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import cafe.adriel.voyager.navigator.tab.CurrentTab
import cafe.adriel.voyager.navigator.tab.TabNavigator
import com.aipose.navigation.BottomNavigation
import com.aipose.navigation.CameraTab
import com.aipose.ui.theme.AiPoseTheme

@Composable
fun App() {
    AiPoseTheme {
        TabNavigator(tab = CameraTab) {
            Scaffold(
                bottomBar = { BottomNavigation() }
            ) { paddingValues ->
                Box(modifier = Modifier.padding(paddingValues)) {
                    CurrentTab()
                }
            }
        }
    }
}
