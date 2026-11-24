# تشغيل اللعبة بدون متصفح (مجاني 100%)

## أسهل طريقة: ارفع على GitHub (مجاني) → تطلع لك رابط + APK
1. حساب GitHub مجاني ← New repository ← ارفع محتويات مجلد legend-shooter (Add file > Upload files).
2. Settings > Pages > Source: **GitHub Actions**.
3. تبويب Actions: يشتغل تلقائيا `Build Android APK` و `Deploy PWA`.
4. **أندرويد**: من Actions > Build Android APK > Artifacts حمّل `Legend-Shooter-APK` (فيه app-debug.apk). ثبّته (فعّل "تثبيت من مصادر غير معروفة"). يشتغل أوفلاين.
5. **آيفون**: افتح رابط Pages في Safari ← زر المشاركة ← **إضافة إلى الشاشة الرئيسية**. تصير أيقونة تفتح ملء الشاشة بدون شريط متصفح، وتشتغل أوفلاين بعد أول فتح.

## ملاحظة App Store
النشر في App Store يحتاج حساب Apple Developer مدفوع (99$ بالسنة) وجهاز ماك، فما فيه طريقة مجانية. الـ PWA هي البديل المجاني.

## بناء محلي (اختياري)
افتح android-native-app في Android Studio ← Build APK. (حمّل three.min.js في www/vendor وعدّل المسار في index.html للأوفلاين.)
