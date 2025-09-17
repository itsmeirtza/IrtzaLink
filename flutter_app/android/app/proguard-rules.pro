# Keep Flutter framework classes
-keep class io.flutter.embedding.** { *; }
-keep class io.flutter.plugins.** { *; }

# Keep Firebase models and annotations
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Keep Google Play Core classes (fix R8 missing classes)
-dontwarn com.google.android.play.core.**
-keep class com.google.android.play.core.** { *; }

# Keep Kotlin metadata
-keep class kotlin.Metadata { *; }
-dontwarn kotlinx.**
