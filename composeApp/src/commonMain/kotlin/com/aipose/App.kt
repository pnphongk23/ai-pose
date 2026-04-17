// composeApp/src/commonMain/kotlin/com/aipose/App.kt
package com.aipose

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
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
            val isCameraTab = it.current == CameraTab
            Scaffold(
                modifier = Modifier.fillMaxSize(),
                bottomBar = {
                    if (!isCameraTab) {
                        BottomNavigation()
                    }
                }
            ) {
                Box(modifier = Modifier.fillMaxSize()) {
                    CurrentTab()
                    if (isCameraTab) {
                        Box(modifier = Modifier.align(Alignment.BottomCenter)) {
                            BottomNavigation()
                        }
                    }
                }
            }
        }
    }
}
