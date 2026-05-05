// settings.gradle.kts
rootProject.name = "ai-pose"

include(":composeApp")
project(":composeApp").projectDir = file("mobile/composeApp")

include(":shared")
project(":shared").projectDir = file("mobile/shared")

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
