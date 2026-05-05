package com.aipose.data

object DatabaseProvider {
    private var database: AiPoseDatabase? = null

    fun getOrCreate(factory: DatabaseDriverFactory): AiPoseDatabase {
        val existing = database
        if (existing != null) {
            return existing
        }
        val created = AiPoseDatabase(factory.createDriver())
        database = created
        return created
    }
}
