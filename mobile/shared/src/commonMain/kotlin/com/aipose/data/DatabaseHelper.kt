package com.aipose.data

fun createDatabase(driverFactory: DatabaseDriverFactory): AiPoseDatabase {
    return AiPoseDatabase(driverFactory.createDriver())
}
