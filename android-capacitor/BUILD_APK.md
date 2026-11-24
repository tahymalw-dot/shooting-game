# خطوات تحويل اللعبة إلى ملف APK حقيقي على الجوال (Android)

تم تجهيز مشروع **Capacitor** في هذا المجلد (`android-capacitor/`) بحيث يغلّف اللعبة كتطبيق أندرويد مستقل (`APK`) يعمل بدون شريط متصفح.

## الخطوات:
1. تأكد من تثبيت **Node.js** و **Android Studio** (مع Android SDK و Gradle) على جهازك.
2. افتح الطرفية داخل مجلد `android-capacitor/` ونفّذ:
   ```bash
   npm install
   npx cap add android
   npx cap sync android
   ```
3. لبناء ملف الـ **APK**:
   - **عبر الطرفية (داخل مجلد `android/`)**:
     ```bash
     ./gradlew assembleDebug
     ```
     وستجد ملف الـ APK في المسار:
     `android/app/build/outputs/apk/debug/app-debug.apk`
   - **أو عبر Android Studio**:
     نفّذ `npx cap open android` ثم اختر **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. انقل ملف `app-debug.apk` إلى جوالك الأندرويد وثبّته مباشرة.
