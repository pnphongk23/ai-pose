# Phase 1: KMP Project Foundation & Design System

**Date:** 2026-04-14  
**Issue:** [#17](https://github.com/pnphongk23/ai-pose/issues/17)  
**Status:** Design Approved

## Context

AI Pose đang có web app (Next.js) hoàn chỉnh. Issue #17 yêu cầu setup Kotlin Multiplatform + Compose Multiplatform project làm foundation cho iOS app.

**Goal:** Setup KMP project structure, theme system, database, và navigation - làm foundation cho các phases tiếp theo.

**Decisions:**
- **Project location:** Monorepo - thêm composeApp/, shared/, iosApp/ vào root
- **iOS integration:** CocoaPods
- **Approach:** Sequential setup (KMP → Theme → SQLDelight → Navigation)

## Architecture

```
ai-pose/                           # Existing repo root
├── src/                           # Existing Next.js web app
├── docs/superpowers/specs/
│
├── composeApp/                    # Shared Compose UI
│   ├── src/
│   │   ├── commonMain/kotlin/com/aipose/
│   │   │   ├── App.kt
│   │   │   ├── ui/theme/
│   │   │   │   ├── Theme.kt
│   │   │   │   ├── Color.kt
│   │   │   │   ├── Typography.kt
│   │   │   │   └── Spacing.kt
│   │   │   ├── ui/components/
│   │   │   │   ├── PrimaryButton.kt
│   │   │   │   ├── SecondaryButton.kt
│   │   │   │   └── Modifiers.kt
│   │   │   └── navigation/
│   │   │       └── Navigation.kt
│   │   └── iosMain/kotlin/com/aipose/
│   │       └── MainViewController.kt
│   └── build.gradle.kts
│
├── shared/                        # Business logic (no UI)
│   ├── src/
│   │   ├── commonMain/
│   │   │   ├── kotlin/com/aipose/
│   │   │   │   ├── domain/
│   │   │   │   │   ├── Pose.kt
│   │   │   │   │   └── Photo.kt
│   │   │   │   └── data/
│   │   │   │       ├── DatabaseDriverFactory.kt
│   │   │   │       └── Database.kt
│   │   │   └── sqldelight/com/aipose/
│   │   │       ├── Pose.sq
│   │   │       └── Photo.sq
│   │   └── iosMain/kotlin/com/aipose/data/
│   │       └── DatabaseDriverFactory.kt
│   └── build.gradle.kts
│
├── iosApp/                        # iOS native shell
│   ├── iosApp/
│   │   ├── AppDelegate.swift
│   │   ├── ContentView.swift
│   │   └── Info.plist
│   ├── iosApp.xcodeproj/
│   └── Podfile
│
├── build.gradle.kts               # Root Gradle
├── settings.gradle.kts            # Module includes
└── gradle/libs.versions.toml      # Version catalog
```

## Tech Stack & Versions

| Component | Version | Purpose |
|-----------|---------|---------|
| Kotlin | 2.0.0+ | Language |
| Compose Multiplatform | 1.6.0+ | UI framework |
| Voyager | 1.1.0-beta02 | Navigation |
| SQLDelight | 2.0.0 | Database |
| Koin | 4.1.0 | Dependency injection |
| Gradle | 8.5+ | Build system |

## Task 1.1: KMP Project Setup

### Files to Create

**gradle/libs.versions.toml:**
```toml
[versions]
kotlin = "2.0.0"
compose = "1.6.0"
voyager = "1.1.0-beta02"
sqldelight = "2.0.0"
koin = "4.1.0"
ktor = "2.3.0"
coroutines = "1.8.0"

[libraries]
# Compose
compose-runtime = { module = "org.jetbrains.compose.runtime:runtime", version.ref = "compose" }
compose-foundation = { module = "org.jetbrains.compose.foundation:foundation", version.ref = "compose" }
compose-material3 = { module = "org.jetbrains.compose.material3:material3", version.ref = "compose" }

# Voyager
voyager-navigator = { module = "cafe.adriel.voyager:voyager-navigator", version.ref = "voyager" }
voyager-tab-navigator = { module = "cafe.adriel.voyager:voyager-tab-navigator", version.ref = "voyager" }
voyager-koin = { module = "cafe.adriel.voyager:voyager-koin", version.ref = "voyager" }

# SQLDelight
sqldelight-runtime = { module = "app.cash.sqldelight:runtime", version.ref = "sqldelight" }
sqldelight-coroutines = { module = "app.cash.sqldelight:coroutines-extensions", version.ref = "sqldelight" }
sqldelight-native = { module = "app.cash.sqldelight:native-driver", version.ref = "sqldelight" }

# Koin
koin-core = { module = "io.insert-koin:koin-core", version.ref = "koin" }
koin-compose = { module = "io.insert-koin:koin-compose", version.ref = "koin" }

# Coroutines
coroutines-core = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core", version.ref = "coroutines" }

[plugins]
kotlin-multiplatform = { id = "org.jetbrains.kotlin.multiplatform", version.ref = "kotlin" }
compose = { id = "org.jetbrains.compose", version.ref = "compose" }
sqldelight = { id = "app.cash.sqldelight", version.ref = "sqldelight" }
```

**settings.gradle.kts:**
```kotlin
rootProject.name = "ai-pose"

include(":composeApp")
include(":shared")

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositories {
        google()
        mavenCentral()
    }
}
```

**build.gradle.kts (root):**
```kotlin
plugins {
    alias(libs.plugins.kotlin.multiplatform) apply false
    alias(libs.plugins.compose) apply false
    alias(libs.plugins.sqldelight) apply false
}
```

**composeApp/build.gradle.kts:**
```kotlin
plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.compose)
}

kotlin {
    iosX64()
    iosArm64()
    iosSimulatorArm64()

    listOf(iosX64(), iosArm64(), iosSimulatorArm64()).forEach { target ->
        target.binaries.framework {
            baseName = "ComposeApp"
            isStatic = true
        }
    }

    sourceSets {
        commonMain.dependencies {
            implementation(compose.runtime)
            implementation(compose.foundation)
            implementation(compose.material3)
            implementation(libs.voyager.navigator)
            implementation(libs.voyager.tab.navigator)
            implementation(libs.voyager.koin)
            implementation(libs.koin.core)
            implementation(libs.koin.compose)
            implementation(project(":shared"))
        }
    }
}
```

**shared/build.gradle.kts:**
```kotlin
plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.sqldelight)
}

kotlin {
    iosX64()
    iosArm64()
    iosSimulatorArm64()

    sourceSets {
        commonMain.dependencies {
            implementation(libs.sqldelight.runtime)
            implementation(libs.sqldelight.coroutines)
            implementation(libs.coroutines.core)
        }
        iosMain.dependencies {
            implementation(libs.sqldelight.native)
        }
    }
}

sqldelight {
    databases {
        create("AiPoseDatabase") {
            packageName.set("com.aipose.data")
        }
    }
}
```

**iosApp/Podfile:**
```ruby
platform :ios, '15.0'

target 'iosApp' do
  use_frameworks!
  pod 'ComposeApp', :path => '../composeApp'
end
```

### Verification

```bash
./gradlew :composeApp:iosSimulatorArm64Test
./gradlew :shared:iosSimulatorArm64Test
```

## Task 1.2: Theme System

### Color.kt

Map từ Subframe theme tokens:

```kotlin
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
}
```

### Typography.kt

```kotlin
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
        letterSpacing = 0.88.sp // 0.08em
    )
    val CaptionBold = TextStyle(
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        lineHeight = 16.sp,
        letterSpacing = 0.88.sp
    )
}
```

### Spacing.kt

```kotlin
package com.aipose.ui.theme

import androidx.compose.ui.unit.dp

object Spacing {
    val xs = 4.dp
    val sm = 8.dp
    val md = 12.dp
    val lg = 16.dp
    val xl = 24.dp
    val xxl = 32.dp
}

object CornerRadius {
    val sm = 8.dp
    val md = 12.dp
    val lg = 16.dp
    val full = 9999.dp
}
```

### Theme.kt

```kotlin
package com.aipose.ui.theme

// Note: No dark theme for now - iOS only supports light mode
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

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
```

### Components: PrimaryButton.kt, SecondaryButton.kt

```kotlin
// PrimaryButton.kt
@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier
            .height(48.dp)
            .neoBorder()
            .neoShadow(),
        shape = RoundedCornerShape(CornerRadius.sm),
        colors = ButtonDefaults.buttonColors(
            containerColor = AiPoseColors.Primary,
            contentColor = AiPoseColors.Foreground
        )
    ) {
        Text(
            text = text.uppercase(),
            style = AiPoseTypography.BodyBold,
            letterSpacing = 0.08.em
        )
    }
}
```

### Modifiers.kt (Neo-brutalism utilities)

```kotlin
fun Modifier.neoBorder(
    width: Dp = 2.dp,
    color: Color = AiPoseColors.Foreground
) = this.border(width, color)

fun Modifier.neoShadow(
    offsetX: Dp = 3.dp,
    offsetY: Dp = 3.dp,
    color: Color = AiPoseColors.Foreground
) = this.shadow(0.dp, shape = RectangleShape)
    .offset(x = offsetX, y = offsetY)
    // Note: Custom shadow implementation needed for hard shadow effect

fun Modifier.ghostBorder() = this.border(
    width = 1.dp,
    color = AiPoseColors.Border,
    shape = RoundedCornerShape(CornerRadius.md)
)

fun Modifier.cardChrome() = this
    .background(AiPoseColors.Surface, RoundedCornerShape(CornerRadius.md))
    .neoBorder()
    .neoShadow(offsetX = 4.dp, offsetY = 4.dp)

fun Modifier.badgeChrome(color: Color) = this
    .background(color, RoundedCornerShape(CornerRadius.sm))
    .padding(horizontal = Spacing.sm, vertical = Spacing.xs)
```

## Task 1.3: SQLDelight Setup

### Pose.sq

```sql
CREATE TABLE Pose (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    imagePath TEXT NOT NULL,
    thumbnailPath TEXT,
    originalImagePath TEXT,
    createdAt TEXT NOT NULL,
    isMine INTEGER NOT NULL DEFAULT 1,
    likes INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_pose_createdAt ON Pose(createdAt);
CREATE INDEX idx_pose_isMine ON Pose(isMine);

getAllPoses:
SELECT * FROM Pose ORDER BY createdAt DESC;

getPoseById:
SELECT * FROM Pose WHERE id = ?;

getMyPoses:
SELECT * FROM Pose WHERE isMine = 1 ORDER BY createdAt DESC;

insertPose:
INSERT INTO Pose(name, imagePath, thumbnailPath, originalImagePath, createdAt, isMine, likes)
VALUES (?, ?, ?, ?, ?, ?, ?);

deletePose:
DELETE FROM Pose WHERE id = ?;

updatePose:
UPDATE Pose SET name = ?, thumbnailPath = ?, likes = ? WHERE id = ?;
```

### Photo.sq

```sql
CREATE TABLE Photo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imagePath TEXT NOT NULL,
    poseId INTEGER,
    poseName TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL,
    isFavorite INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (poseId) REFERENCES Pose(id) ON DELETE SET NULL
);

CREATE INDEX idx_photo_createdAt ON Photo(createdAt);
CREATE INDEX idx_photo_poseId ON Photo(poseId);
CREATE INDEX idx_photo_isFavorite ON Photo(isFavorite);

getAllPhotos:
SELECT * FROM Photo ORDER BY createdAt DESC;

getPhotoById:
SELECT * FROM Photo WHERE id = ?;

getPhotosByPoseId:
SELECT * FROM Photo WHERE poseId = ? ORDER BY createdAt DESC;

getFavoritePhotos:
SELECT * FROM Photo WHERE isFavorite = 1 ORDER BY createdAt DESC;

insertPhoto:
INSERT INTO Photo(imagePath, poseId, poseName, createdAt, isFavorite)
VALUES (?, ?, ?, ?, ?);

deletePhoto:
DELETE FROM Photo WHERE id = ?;

toggleFavorite:
UPDATE Photo SET isFavorite = CASE WHEN isFavorite = 0 THEN 1 ELSE 0 END WHERE id = ?;
```

### DatabaseDriverFactory.kt

```kotlin
// commonMain - expect
package com.aipose.data

import app.cash.sqldelight.db.SqlDriver

expect class DatabaseDriverFactory {
    fun createDriver(): SqlDriver
}

// iosMain - actual
package com.aipose.data

import app.cash.sqldelight.db.SqlDriver
import app.cash.sqldelight.driver.native.NativeSqliteDriver

actual class DatabaseDriverFactory {
    actual fun createDriver(): SqlDriver {
        return NativeSqliteDriver(AiPoseDatabase.Schema, "aipose.db")
    }
}
```

## Task 1.4: Navigation (Voyager)

### App.kt

```kotlin
package com.aipose

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import cafe.adriel.voyager.navigator.tab.CurrentTab
import cafe.adriel.voyager.navigator.tab.TabNavigator
import com.aipose.navigation.*
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
```

### Navigation.kt

```kotlin
package com.aipose.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import cafe.adriel.voyager.navigator.tab.*
import com.aipose.ui.theme.*

object CameraTab : Tab {
    override val options: TabOptions
        @Composable get() = TabOptions(
            index = 0u,
            title = "Camera",
            icon = null
        )

    @Composable
    override fun Content() {
        // Placeholder - Phase 2
        PlaceholderScreen("Camera")
    }
}

object PosesTab : Tab {
    override val options: TabOptions
        @Composable get() = TabOptions(
            index = 1u,
            title = "Poses",
            icon = null
        )

    @Composable
    override fun Content() {
        // Placeholder - Phase 3
        PlaceholderScreen("Poses")
    }
}

object GalleryTab : Tab {
    override val options: TabOptions
        @Composable get() = TabOptions(
            index = 2u,
            title = "Gallery",
            icon = null
        )

    @Composable
    override fun Content() {
        // Placeholder - Phase 4
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
            icon = Icons.Default.PersonOutline,
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
```

### MainViewController.kt (iosMain)

```kotlin
package com.aipose

import androidx.compose.ui.window.ComposeUIViewController

fun MainViewController() = ComposeUIViewController { App() }
```

## Verification

```bash
# Build tests
./gradlew :composeApp:iosSimulatorArm64Test
./gradlew :shared:iosSimulatorArm64Test

# Generate iOS framework
./gradlew :composeApp:linkDebugFrameworkIosSimulatorArm64

# Open Xcode project
open iosApp/iosApp.xcodeproj

# Build and run on iOS Simulator from Xcode
```

### Expected Results

1. ✅ Gradle sync thành công
2. ✅ SQLDelight generate code
3. ✅ iOS framework build
4. ✅ Xcode build và run trên simulator
5. ✅ App hiển thị với 3 tabs (Camera, Poses, Gallery)
6. ✅ Tab navigation hoạt động
7. ✅ Theme colors và typography đúng

## References

- **Migration Spec:** `docs/superpowers/specs/2026-04-14-kmp-compose-migration-design.md`
- **Subframe Design:** https://app.subframe.com/6f0b27e61709/design/54e0d2b4-5e3d-4793-9f09-dddb5544874b
- **Web App Data Model:** `src/lib/db.js`
- **Web App Theme:** `src/app/globals.css`
