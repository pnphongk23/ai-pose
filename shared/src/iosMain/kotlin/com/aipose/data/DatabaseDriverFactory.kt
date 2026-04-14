// shared/src/iosMain/kotlin/com/aipose/data/DatabaseDriverFactory.kt
package com.aipose.data

import app.cash.sqldelight.db.SqlDriver
import app.cash.sqldelight.driver.native.NativeSqliteDriver

actual class DatabaseDriverFactory {
    actual fun createDriver(): SqlDriver {
        return NativeSqliteDriver(AiPoseDatabase.Schema, "aipose.db")
    }
}
