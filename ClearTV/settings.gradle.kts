import java.util.Properties

// Google's repository only serves Android/AndroidX/Google artifacts; restricting it keeps every other
// lookup on Maven Central (faster, and it works where dl.google.com is unreachable).
pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
    }
}

rootProject.name = "ClearTV"
include(":core")

// The Android module needs the Android SDK and Google's Maven repository (dl.google.com). Some locked-down
// build environments have neither; there `:core` (pure Kotlin, unit-tested) still builds and the APK is
// produced by scripts/build-nosdk.sh. Pass -PforceAndroid=true to include :app regardless.
val localProps = File(settingsDir, "local.properties").takeIf { it.exists() }?.let { f ->
    Properties().apply { f.inputStream().use { load(it) } }
}
val sdkDir = (System.getenv("ANDROID_HOME") ?: System.getenv("ANDROID_SDK_ROOT") ?: localProps?.getProperty("sdk.dir"))?.let { File(it) }
val includeAndroid = sdkDir?.isDirectory == true || providers.gradleProperty("forceAndroid").orNull == "true"
if (includeAndroid) {
    include(":app")
} else {
    logger.warn("ClearTV: Android SDK not found (ANDROID_HOME / ANDROID_SDK_ROOT / local.properties sdk.dir): the :app module is skipped. Run scripts/build.ps1 on a machine with the SDK, or scripts/build-nosdk.sh.")
}
