package com.aipose.data

import kotlin.test.Test
import kotlin.test.assertEquals

class PhotoRepositoryTest {
    @Test
    fun insertCapturedPhoto_doesNotCrash_whenMultipleRowsExist() {
        val driver = DatabaseDriverFactory().createDriver()
        try {
            val database = AiPoseDatabase(driver)
            val repository = PhotoRepository(database)

            repository.insertCapturedPhoto("/tmp/first.jpg")
            repository.insertCapturedPhoto("/tmp/second.jpg")

            assertEquals("/tmp/second.jpg", repository.getLatestPhotoPath())
        } finally {
            driver.close()
        }
    }
}
