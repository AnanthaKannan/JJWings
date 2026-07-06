## JJ Brain Wings


https://sites.google.com/view/jjwings-abacus-privacy-policy/home

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
```
adb tcpip 5555
adb connect <phone_ip>:5555

to get the phone_ip, select the wifi network on the mobile and click on it, then scroll down to find the IP address. It should be something like 192.168.x.x
```

## Keystore
keystore.properties - android\keystore.properties
jjwings-upload-key.keystore - android\app\jjwings-upload-key.keystore
4. 


## Release details
Welcome to JJ Brainwings Abacus!

🎉 Initial release of the JJ Brainwings Abacus app.

Features:
• Access abacus learning materials and practice activities.
• View daily homework and assignments.
• Stay updated with class information and announcements.
• User-friendly interface designed for children and parents.
• Performance improvements and a smooth learning experience.

Thank you for choosing JJ Brainwings Abacus. We look forward to helping children build strong mental math skills!
