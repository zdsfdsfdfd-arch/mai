# Views referenced from layouts and components named in the manifest are kept by AGP's generated rules;
# the custom row view is listed explicitly for safety.
-keep class com.cleartv.launcher.ui.FocusRow { <init>(...); }
-keepattributes SourceFile,LineNumberTable
-dontwarn kotlin.**
