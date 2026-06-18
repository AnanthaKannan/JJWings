## JJ Brain Wings

## Version
Node: v24.14.0

## Credential
Admin: JW001
Password: Welcome123

## Build
1. cd android
2. ./gradlew assembleRelease
3. The generated APK will be located in `android/app/build/outputs/apk/release

## Connect device to wifi
### verify deice connected
```adb devices
```
### connect to wifi
```adb tcpip 5555
adb connect 10.70.190.83:5555
```

## how to get device Ipaddress
1. Go to Settings on your Android device.
2. Navigate to "Network & Internet" or "Wi-Fi" settings.
3. Tap on the connected Wi-Fi network to view its details.

## Keystore
keystore.properties - android\keystore.properties
jjwings-upload-key.keystore - android\app\jjwings-upload-key.keystore