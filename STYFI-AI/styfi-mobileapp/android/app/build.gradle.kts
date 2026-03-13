plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
<<<<<<< HEAD
    id("com.google.gms.google-services") // This is REQUIRED
=======
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
}

android {
    namespace = "com.example.styfi"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion
<<<<<<< HEAD

=======
    
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
<<<<<<< HEAD

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

=======
    
    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }
    
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
    defaultConfig {
        applicationId = "com.example.styfi"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }
<<<<<<< HEAD

=======
    
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
<<<<<<< HEAD
}
=======
}
>>>>>>> 9b3456e6285ce023c13c7915bd9d5a11a4f51582
