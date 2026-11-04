// Root project. Plugins are declared in the modules themselves so that the Android Gradle Plugin is only
// resolved when the :app module is part of the build (see settings.gradle.kts).
tasks.register("printVersion") {
    doLast {
        val props = java.util.Properties().apply { file("version.properties").inputStream().use { load(it) } }
        println("ClearTV ${props["versionName"]} (${props["versionCode"]})")
    }
}
