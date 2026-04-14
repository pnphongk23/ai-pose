# Phase 1: KMP Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Setup Kotlin Multiplatform + Compose Multiplatform project structure with theme system, SQLDelight database, and Voyager navigation as foundation for iOS app.

**Architecture:** Monorepo approach adding composeApp/ (Compose UI), shared/ (business logic), and iosApp/ (native shell) to existing Next.js repo. Uses expect/actual pattern for iOS-specific implementations.

**Tech Stack:** Kotlin 2.0.0, Compose Multiplatform 1.6.x, Voyager 1.1.0-beta02, SQLDelight 2.0.0, Koin 4.0.0 (bản 4.1.x yêu cầu Kotlin 2.1+), CocoaPods

---

## File Structure

### New Files to Create

```
ai-pose/
├── gradle/
│   └── libs.versions.toml              # Version catalog
├── settings.gradle.kts                 # Module includes
├── build.gradle.kts                    # Root Gradle
├── gradle.properties                   # Gradle config
├── gradlew                             # Gradle wrapper
├── gradlew.bat                         # Gradle wrapper (Windows)
├── gradle/wrapper/
│   ├── gradle-wrapper.jar
│   └── gradle-wrapper.properties
│
├── composeApp/
│   ├── build.gradle.kts
│   └── src/
│       ├── commonMain/kotlin/com/aipose/
│       │   ├── App.kt
│       │   ├── ui/theme/
│       │   │   ├── Color.kt
│       │   │   ├── Typography.kt
│       │   │   ├── Spacing.kt
│       │   │   └── Theme.kt
│       │   ├── ui/components/
│       │   │   ├── PrimaryButton.kt
│       │   │   ├── SecondaryButton.kt
│       │   │   └── Modifiers.kt
│       │   └── navigation/
│       │       └── Navigation.kt
│       └── iosMain/kotlin/com/aipose/
│           └── MainViewController.kt
│
├── shared/
│   ├── build.gradle.kts
│   └── src/
│       ├── commonMain/
│       │   ├── kotlin/com/aipose/data/
│       │   │   └── DatabaseDriverFactory.kt    # expect
│       │   └── sqldelight/com/aipose/
│       │       ├── Pose.sq
│       │       └── Photo.sq
│       └── iosMain/kotlin/com/aipose/data/
│           └── DatabaseDriverFactory.kt        # actual
│
└── iosApp/
    ├── Podfile
    ├── iosApp/
    │   ├── AppDelegate.swift
    │   ├── ContentView.swift
    │   └── Info.plist
    └── iosApp.xcodeproj/
        └── project.pbxproj
```

---

## Task 1: Gradle Wrapper Setup

**Files:**
- Create: `gradle/wrapper/gradle-wrapper.properties`
- Create: `gradle.properties`
- Download: `gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.jar`

- [x] **Step 1.1: Create gradle wrapper properties**

```properties
# gradle/wrapper/gradle-wrapper.properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.5-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

- [x] **Step 1.2: Create gradle.properties**

```properties
# gradle.properties
org.gradle.jvmargs=-Xmx2048M -Dfile.encoding=UTF-8 -Dkotlin.daemon.jvm.options\="-Xmx2048M"
kotlin.code.style=official
kotlin.native.cacheKind.iosX64=none
kotlin.native.cacheKind.iosArm64=none
kotlin.native.cacheKind.iosSimulatorArm64=none
compose.kotlin.native.manageCacheKind=false
kotlin.apple.xcodeCompatibility.nowarn=true
```

- [x] **Step 1.3: Download Gradle wrapper**

Run:
```bash
cd /Users/phamnhuphong/.cline/worktrees/6a8fd/ai-pose
# Download gradle wrapper from a working KMP project or use gradle init
gradle wrapper --gradle-version 8.5
```

Expected: gradlew, gradlew.bat, and gradle/wrapper/gradle-wrapper.jar exist

- [x] **Step 1.4: Verify wrapper works**

Run:
```bash
./gradlew --version
```

Expected: Shows Gradle 8.5 with Kotlin info

- [ ] **Step 1.5: Commit**

```bash
git add gradle/ gradlew gradlew.bat gradle.properties
git commit -m "chore: add Gradle 8.5 wrapper"
```

---

## Task 2: Version Catalog

**Files:**
- Create: `gradle/libs.versions.toml`

- [x] **Step 2.1: Create version catalog**

```toml
# gradle/libs.versions.toml
[versions]
kotlin = "2.0.0"
compose = "1.6.0"
compose-compiler = "1.5.10"
voyager = "1.1.0-beta02"
sqldelight = "2.0.0"
koin = "4.1.0"
coroutines = "1.8.0"

[libraries]
# Voyager Navigation
voyager-navigator = { module = "cafe.adriel.voyager:voyager-navigator", version.ref = "voyager" }
voyager-tab-navigator = { module = "cafe.adriel.voyager:voyager-tab-navigator", version.ref = "voyager" }
voyager-koin = { module = "cafe.adriel.voyager:voyager-koin", version.ref = "voyager" }

# SQLDelight
sqldelight-runtime = { module = "app.cash.sqldelight:runtime", version.ref = "sqldelight" }
sqldelight-coroutines = { module = "app.cash.sqldelight:coroutines-extensions", version.ref = "sqldelight" }
sqldelight-native = { module = "app.cash.sqldelight:native-driver", version.ref = "sqldelight" }

# Koin DI
koin-core = { module = "io.insert-koin:koin-core", version.ref = "koin" }
koin-compose = { module = "io.insert-koin:koin-compose", version.ref = "koin" }

# Coroutines
coroutines-core = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core", version.ref = "coroutines" }

[plugins]
kotlin-multiplatform = { id = "org.jetbrains.kotlin.multiplatform", version.ref = "kotlin" }
compose = { id = "org.jetbrains.compose", version.ref = "compose" }
compose-compiler = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
sqldelight = { id = "app.cash.sqldelight", version.ref = "sqldelight" }
```

- [ ] **Step 2.2: Commit**

```bash
git add gradle/libs.versions.toml
git commit -m "chore: add version catalog with KMP dependencies"
```

---

## Task 3: Root Gradle Configuration

**Files:**
- Create: `settings.gradle.kts`
- Create: `build.gradle.kts`

- [x] **Step 3.1: Create settings.gradle.kts**

```kotlin
// settings.gradle.kts
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

- [x] **Step 3.2: Create root build.gradle.kts**

```kotlin
// build.gradle.kts
plugins {
    alias(libs.plugins.kotlin.multiplatform) apply false
    alias(libs.plugins.compose) apply false
    alias(libs.plugins.compose.compiler) apply false
    alias(libs.plugins.sqldelight) apply false
}
```

- [x] **Step 3.3: Verify Gradle sync**

Run:
```bash
./gradlew --refresh-dependencies
```

Expected: Sync completes (may warn about missing modules, that's OK)

- [ ] **Step 3.4: Commit**

```bash
git add settings.gradle.kts build.gradle.kts
git commit -m "chore: add root Gradle configuration"
```

---

## Task 4: Shared Module Setup

**Files:**
- Create: `shared/build.gradle.kts`

- [x] **Step 4.1: Create shared directory structure**

```bash
mkdir -p shared/src/commonMain/kotlin/com/aipose/data
mkdir -p shared/src/commonMain/sqldelight/com/aipose
mkdir -p shared/src/iosMain/kotlin/com/aipose/data
```

- [x] **Step 4.2: Create shared/build.gradle.kts**

```kotlin
// shared/build.gradle.kts
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

- [x] **Step 4.3: Verify module recognized**

Run:
```bash
./gradlew :shared:tasks --all
```

Expected: Shows available tasks for shared module

- [ ] **Step 4.4: Commit**

```bash
git add shared/
git commit -m "chore: add shared module with SQLDelight config"
```

---

## Task 5: ComposeApp Module Setup

> **Note:** `compose.kotlin.native.manageCacheKind=false` trong `gradle.properties` (Task 1.2) để Compose plugin không ghi đè `kotlin.native.cacheKind.*`. Với Koin Compose trên iOS, thêm `co.touchlab:stately-common` (xem `libs.stately.common` trong version catalog) để KLIB resolver không lỗi `stately-common`.

**Files:**
- Create: `composeApp/build.gradle.kts`

- [x] **Step 5.1: Create composeApp directory structure**

```bash
mkdir -p composeApp/src/commonMain/kotlin/com/aipose/ui/theme
mkdir -p composeApp/src/commonMain/kotlin/com/aipose/ui/components
mkdir -p composeApp/src/commonMain/kotlin/com/aipose/navigation
mkdir -p composeApp/src/iosMain/kotlin/com/aipose
```

- [x] **Step 5.2: Create composeApp/build.gradle.kts**

```kotlin
// composeApp/build.gradle.kts
plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.compose)
    alias(libs.plugins.compose.compiler)
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
            implementation(compose.materialIconsExtended)
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

- [x] **Step 5.3: Verify Gradle sync**

Run:
```bash
./gradlew :composeApp:tasks --all
```

Expected: Shows tasks including linkDebugFrameworkIos*

- [ ] **Step 5.4: Commit**

```bash
git add composeApp/
git commit -m "chore: add composeApp module with Compose Multiplatform"
```

---

## Task 6: Theme - Color.kt

**Files:**
- Create: `composeApp/src/commonMain/kotlin/com/aipose/ui/theme/Color.kt`

- [x] **Step 6.1: Create Color.kt**

```kotlin
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
}
```

- [x] **Step 6.2: Verify compilation**

Run:
```bash
./gradlew :composeApp:compileKotlinIosSimulatorArm64 2>&1 | head -20
```

Expected: BUILD SUCCESSFUL or progress without Color.kt errors

- [ ] **Step 6.3: Commit**

```bash
git add composeApp/src/commonMain/kotlin/com/aipose/ui/theme/Color.kt
git commit -m "feat: add AiPoseColors theme palette"
```

---

## Task 7: Theme - Typography.kt

**Files:**
- Create: `composeApp/src/commonMain/kotlin/com/aipose/ui/theme/Typography.kt`

- [x] **Step 7.1: Create Typography.kt**

```kotlin
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
```

- [ ] **Step 7.2: Commit**

```bash
git add composeApp/src/commonMain/kotlin/com/aipose/ui/theme/Typography.kt
git commit -m "feat: add AiPoseTypography text styles"
```

---

## Task 8: Theme - Spacing.kt

**Files:**
- Create: `composeApp/src/commonMain/kotlin/com/aipose/ui/theme/Spacing.kt`

- [x] **Step 8.1: Create Spacing.kt**

```kotlin
// composeApp/src/commonMain/kotlin/com/aipose/ui/theme/Spacing.kt
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

- [ ] **Step 8.2: Commit**

```bash
git add composeApp/src/commonMain/kotlin/com/aipose/ui/theme/Spacing.kt
git commit -m "feat: add Spacing and CornerRadius design tokens"
```

---

## Task 9: Theme - Theme.kt

**Files:**
- Create: `composeApp/src/commonMain/kotlin/com/aipose/ui/theme/Theme.kt`

- [x] **Step 9.1: Create Theme.kt**

```kotlin
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
```

- [x] **Step 9.2: Verify theme compilation**

Run:
```bash
./gradlew :composeApp:compileKotlinIosSimulatorArm64 2>&1 | head -20
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 9.3: Commit**

```bash
git add composeApp/src/commonMain/kotlin/com/aipose/ui/theme/Theme.kt
git commit -m "feat: add AiPoseTheme MaterialTheme wrapper"
```

---

## Task 10: Components - Modifiers.kt

**Files:**
- Create: `composeApp/src/commonMain/kotlin/com/aipose/ui/components/Modifiers.kt`

- [x] **Step 10.1: Create Modifiers.kt**

```kotlin
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
```

- [ ] **Step 10.2: Commit**

```bash
git add composeApp/src/commonMain/kotlin/com/aipose/ui/components/Modifiers.kt
git commit -m "feat: add neo-brutalism modifier utilities"
```

---

## Task 11: Components - PrimaryButton.kt

**Files:**
- Create: `composeApp/src/commonMain/kotlin/com/aipose/ui/components/PrimaryButton.kt`

- [x] **Step 11.1: Create PrimaryButton.kt**

```kotlin
// composeApp/src/commonMain/kotlin/com/aipose/ui/components/PrimaryButton.kt
package com.aipose.ui.components

import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import com.aipose.ui.theme.AiPoseColors
import com.aipose.ui.theme.AiPoseTypography
import com.aipose.ui.theme.CornerRadius

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
            .neoShadow()
            .neoBorder(),
        shape = RoundedCornerShape(CornerRadius.sm),
        colors = ButtonDefaults.buttonColors(
            containerColor = AiPoseColors.Primary,
            contentColor = AiPoseColors.Foreground,
            disabledContainerColor = AiPoseColors.Border,
            disabledContentColor = AiPoseColors.Subtext
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

- [ ] **Step 11.2: Commit**

```bash
git add composeApp/src/commonMain/kotlin/com/aipose/ui/components/PrimaryButton.kt
git commit -m "feat: add PrimaryButton component"
```

---

## Task 12: Components - SecondaryButton.kt

**Files:**
- Create: `composeApp/src/commonMain/kotlin/com/aipose/ui/components/SecondaryButton.kt`

- [x] **Step 12.1: Create SecondaryButton.kt**

```kotlin
// composeApp/src/commonMain/kotlin/com/aipose/ui/components/SecondaryButton.kt
package com.aipose.ui.components

import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import com.aipose.ui.theme.AiPoseColors
import com.aipose.ui.theme.AiPoseTypography
import com.aipose.ui.theme.CornerRadius

@Composable
fun SecondaryButton(
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
            .ghostBorder(),
        shape = RoundedCornerShape(CornerRadius.md),
        colors = ButtonDefaults.buttonColors(
            containerColor = AiPoseColors.Surface,
            contentColor = AiPoseColors.Foreground,
            disabledContainerColor = AiPoseColors.SurfaceVariant,
            disabledContentColor = AiPoseColors.Subtext
        )
    ) {
        Text(
            text = text,
            style = AiPoseTypography.Body
        )
    }
}
```

- [x] **Step 12.2: Verify theme components compile**

Run:
```bash
./gradlew :composeApp:compileKotlinIosSimulatorArm64 2>&1 | tail -10
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 12.3: Commit**

```bash
git add composeApp/src/commonMain/kotlin/com/aipose/ui/components/SecondaryButton.kt
git commit -m "feat: add SecondaryButton component"
```

---

## Task 13: SQLDelight - Pose.sq

**Files:**
- Create: `shared/src/commonMain/sqldelight/com/aipose/Pose.sq`

- [x] **Step 13.1: Create Pose.sq**

```sql
-- shared/src/commonMain/sqldelight/com/aipose/Pose.sq
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

- [ ] **Step 13.2: Commit**

```bash
git add shared/src/commonMain/sqldelight/com/aipose/Pose.sq
git commit -m "feat: add Pose SQLDelight schema"
```

---

## Task 14: SQLDelight - Photo.sq

**Files:**
- Create: `shared/src/commonMain/sqldelight/com/aipose/Photo.sq`

- [x] **Step 14.1: Create Photo.sq**

```sql
-- shared/src/commonMain/sqldelight/com/aipose/Photo.sq
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

- [x] **Step 14.2: Verify SQLDelight generates code**

Run:
```bash
./gradlew :shared:generateCommonMainAiPoseDatabaseInterface 2>&1 | tail -10
```

Expected: BUILD SUCCESSFUL, generates code in shared/build/generated/sqldelight

- [ ] **Step 14.3: Commit**

```bash
git add shared/src/commonMain/sqldelight/com/aipose/Photo.sq
git commit -m "feat: add Photo SQLDelight schema"
```

---

## Task 15: DatabaseDriverFactory - expect

**Files:**
- Create: `shared/src/commonMain/kotlin/com/aipose/data/DatabaseDriverFactory.kt`

- [x] **Step 15.1: Create expect declaration**

```kotlin
// shared/src/commonMain/kotlin/com/aipose/data/DatabaseDriverFactory.kt
package com.aipose.data

import app.cash.sqldelight.db.SqlDriver

expect class DatabaseDriverFactory {
    fun createDriver(): SqlDriver
}
```

- [ ] **Step 15.2: Commit**

```bash
git add shared/src/commonMain/kotlin/com/aipose/data/DatabaseDriverFactory.kt
git commit -m "feat: add DatabaseDriverFactory expect declaration"
```

---

## Task 16: DatabaseDriverFactory - actual (iOS)

**Files:**
- Create: `shared/src/iosMain/kotlin/com/aipose/data/DatabaseDriverFactory.kt`

- [x] **Step 16.1: Create iOS actual implementation**

```kotlin
// shared/src/iosMain/kotlin/com/aipose/data/DatabaseDriverFactory.kt
package com.aipose.data

import app.cash.sqldelight.db.SqlDriver
import app.cash.sqldelight.driver.native.NativeSqliteDriver

actual class DatabaseDriverFactory {
    actual fun createDriver(): SqlDriver {
        return NativeSqliteDriver(AiPoseDatabase.Schema, "aipose.db")
    }
}
```

- [x] **Step 16.2: Verify shared module compiles**

Run:
```bash
./gradlew :shared:compileKotlinIosSimulatorArm64 2>&1 | tail -10
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 16.3: Commit**

```bash
git add shared/src/iosMain/kotlin/com/aipose/data/DatabaseDriverFactory.kt
git commit -m "feat: add DatabaseDriverFactory iOS implementation"
```

---

## Task 17: Navigation - Navigation.kt

**Files:**
- Create: `composeApp/src/commonMain/kotlin/com/aipose/navigation/Navigation.kt`

- [x] **Step 17.1: Create Navigation.kt**

```kotlin
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
```

- [ ] **Step 17.2: Commit**

```bash
git add composeApp/src/commonMain/kotlin/com/aipose/navigation/Navigation.kt
git commit -m "feat: add Voyager tab navigation with 3 tabs"
```

---

## Task 18: App.kt - Main Entry Point

**Files:**
- Create: `composeApp/src/commonMain/kotlin/com/aipose/App.kt`

- [x] **Step 18.1: Create App.kt**

```kotlin
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
```

- [ ] **Step 18.2: Commit**

```bash
git add composeApp/src/commonMain/kotlin/com/aipose/App.kt
git commit -m "feat: add App composable with TabNavigator"
```

---

## Task 19: MainViewController.kt - iOS Entry

**Files:**
- Create: `composeApp/src/iosMain/kotlin/com/aipose/MainViewController.kt`

- [x] **Step 19.1: Create MainViewController.kt**

```kotlin
// composeApp/src/iosMain/kotlin/com/aipose/MainViewController.kt
package com.aipose

import androidx.compose.ui.window.ComposeUIViewController

fun MainViewController() = ComposeUIViewController { App() }
```

- [x] **Step 19.2: Verify composeApp compiles**

Run:
```bash
./gradlew :composeApp:compileKotlinIosSimulatorArm64 2>&1 | tail -10
```

Expected: BUILD SUCCESSFUL

- [ ] **Step 19.3: Commit**

```bash
git add composeApp/src/iosMain/kotlin/com/aipose/MainViewController.kt
git commit -m "feat: add iOS MainViewController entry point"
```

---

## Task 20: iOS App - Podfile

**Files:**
- Create: `iosApp/Podfile`

- [x] **Step 20.1: Create iosApp directory and Podfile**

```bash
mkdir -p iosApp/iosApp
```

```ruby
# iosApp/Podfile
platform :ios, '15.0'

target 'iosApp' do
  use_frameworks!
  pod 'ComposeApp', :path => '../composeApp'
end
```

- [ ] **Step 20.2: Commit**

```bash
git add iosApp/Podfile
git commit -m "chore: add iOS Podfile for CocoaPods integration"
```

---

## Task 21: iOS App - Swift Files

**Files:**
- Create: `iosApp/iosApp/AppDelegate.swift`
- Create: `iosApp/iosApp/ContentView.swift`
- Create: `iosApp/iosApp/Info.plist`

- [x] **Step 21.1: Create AppDelegate.swift**

```swift
// iosApp/iosApp/AppDelegate.swift
import UIKit
import ComposeApp

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        window = UIWindow(frame: UIScreen.main.bounds)
        let mainViewController = MainViewControllerKt.MainViewController()
        window?.rootViewController = mainViewController
        window?.makeKeyAndVisible()
        return true
    }
}
```

- [x] **Step 21.2: Create ContentView.swift**

```swift
// iosApp/iosApp/ContentView.swift
import SwiftUI
import ComposeApp

struct ContentView: View {
    var body: some View {
        ComposeView()
            .ignoresSafeArea(.all)
    }
}

struct ComposeView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> UIViewController {
        MainViewControllerKt.MainViewController()
    }

    func updateUIViewController(_ uiViewController: UIViewController, context: Context) {}
}
```

- [x] **Step 21.3: Create Info.plist**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UIApplicationSceneManifest</key>
    <dict>
        <key>UIApplicationSupportsMultipleScenes</key>
        <false/>
    </dict>
    <key>UILaunchStoryboardName</key>
    <string>LaunchScreen</string>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
    </array>
    <key>UISupportedInterfaceOrientations~ipad</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationPortraitUpsideDown</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
</dict>
</plist>
```

- [ ] **Step 21.4: Commit**

```bash
git add iosApp/iosApp/
git commit -m "feat: add iOS app Swift files"
```

---

## Task 22: Build iOS Framework

**Files:**
- None (build verification)

- [x] **Step 22.1: Build debug framework**

Run:
```bash
./gradlew :composeApp:linkDebugFrameworkIosSimulatorArm64
```

Expected: BUILD SUCCESSFUL, framework in composeApp/build/bin/iosSimulatorArm64/debugFramework/

- [x] **Step 22.2: Verify framework exists**

Run:
```bash
ls -la composeApp/build/bin/iosSimulatorArm64/debugFramework/
```

Expected: ComposeApp.framework directory exists

- [ ] **Step 22.3: Commit any generated files if needed**

```bash
git status
# If there are important generated files, add them
```

---

## Task 23: Create Xcode Project

**Files:**
- Create: `iosApp/iosApp.xcodeproj/project.pbxproj`

- [x] **Step 23.1: Create Xcode project using xcodegen or manual setup**

Option A - Using Xcode (recommended):
1. Open Xcode
2. Create new iOS App project
3. Product Name: iosApp
4. Bundle Identifier: com.aipose.app
5. Language: Swift
6. Location: ai-pose/iosApp/
7. Close and move contents if needed

Option B - Manual (if Xcode not available for automation):

```bash
# Create project.yml for xcodegen
cat > iosApp/project.yml << 'EOF'
name: iosApp
options:
  bundleIdPrefix: com.aipose
  deploymentTarget:
    iOS: "15.0"
targets:
  iosApp:
    type: application
    platform: iOS
    sources:
      - iosApp
    settings:
      PRODUCT_BUNDLE_IDENTIFIER: com.aipose.app
      INFOPLIST_FILE: iosApp/Info.plist
    scheme:
      testTargets:
        - iosAppTests
EOF

# Generate project
cd iosApp && xcodegen generate
```

- [x] **Step 23.2: Install CocoaPods dependencies**

Run:
```bash
cd iosApp && pod install
```

Expected: Pod installation complete, iosApp.xcworkspace created

- [ ] **Step 23.3: Commit Xcode project** (pending user request)

```bash
git add iosApp/
git commit -m "chore: add Xcode project with CocoaPods"
```

---

## Task 24: Final Verification

**Files:**
- None (verification only)

- [x] **Step 24.1: Clean build**

Run:
```bash
./gradlew clean
./gradlew :composeApp:linkDebugFrameworkIosSimulatorArm64
./gradlew :shared:compileKotlinIosSimulatorArm64
```

Expected: All BUILD SUCCESSFUL

- [x] **Step 24.2: Verify Xcode build**

Run:
```bash
cd iosApp
xcodebuild -workspace iosApp.xcworkspace -scheme iosApp -sdk iphonesimulator -configuration Debug build | tail -20
```

Expected: ** BUILD SUCCEEDED **

- [ ] **Step 24.3: Run on iOS Simulator (manual)**

1. Open iosApp/iosApp.xcworkspace in Xcode
2. Select iPhone 15 simulator
3. Press Cmd+R to build and run
4. Expected: App launches with 3 tabs (Camera, Poses, Gallery)
5. Tap each tab to verify navigation works
6. Verify pink theme color on selected tab

- [x] **Step 24.4: Update .gitignore for KMP**

```bash
cat >> .gitignore << 'EOF'

# Kotlin/Gradle
.gradle/
build/
*.iml
.idea/
local.properties
composeApp/build/
shared/build/

# iOS
iosApp/Pods/
iosApp/*.xcworkspace/xcuserdata/
iosApp/*.xcodeproj/xcuserdata/
*.xcuserstate
DerivedData/
EOF
```

- [ ] **Step 24.5: Final commit** (pending user request)

```bash
git add .gitignore
git commit -m "chore: update gitignore for KMP project"
git push origin HEAD
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Gradle Wrapper | gradle-wrapper.properties, gradle.properties |
| 2 | Version Catalog | libs.versions.toml |
| 3 | Root Gradle | settings.gradle.kts, build.gradle.kts |
| 4 | Shared Module | shared/build.gradle.kts |
| 5 | ComposeApp Module | composeApp/build.gradle.kts |
| 6-9 | Theme System | Color.kt, Typography.kt, Spacing.kt, Theme.kt |
| 10-12 | Components | Modifiers.kt, PrimaryButton.kt, SecondaryButton.kt |
| 13-14 | SQLDelight | Pose.sq, Photo.sq |
| 15-16 | DatabaseDriver | expect/actual pattern |
| 17-19 | Navigation | Navigation.kt, App.kt, MainViewController.kt |
| 20-21 | iOS App | Podfile, Swift files |
| 22-24 | Build & Verify | Framework, Xcode, Final test |

**Total:** 24 tasks, ~70 steps
