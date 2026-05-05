@file:OptIn(
    androidx.compose.ui.ExperimentalComposeUiApi::class,
    androidx.compose.ui.text.ExperimentalTextApi::class,
    androidx.compose.animation.ExperimentalAnimationApi::class,
    androidx.compose.foundation.ExperimentalFoundationApi::class,
    androidx.compose.material3.ExperimentalMaterial3Api::class,
    androidx.compose.runtime.ExperimentalComposeApi::class
)
package com.aipose

import androidx.compose.ui.platform.AccessibilitySyncOptions
import androidx.compose.ui.window.ComposeUIViewController

@OptIn(androidx.compose.ui.ExperimentalComposeUiApi::class, androidx.compose.runtime.ExperimentalComposeApi::class)
fun MainViewController() = ComposeUIViewController(
    configure = {
        accessibilitySyncOptions = AccessibilitySyncOptions.Always(debugLogger = null)
    }
) { App() }
