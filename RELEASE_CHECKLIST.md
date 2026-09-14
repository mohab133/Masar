# Masar release checklist

1. Ensure `android/app/google-services.json` exists on the build machine when push notifications are required.
2. Run `npm ci`.
3. Run `npm run lint`.
4. Run `npm run build:android`. This builds the web app, runs Capacitor sync, then verifies that Android assets exactly match `dist`.
5. Build the APK with a complete JDK (`java -version` and `javac -version` must both work).
6. Test first launch and Android notification permission, including Allow and Deny.
7. Test online/offline transitions and return from background.
8. Test feedback length/rate limiting and verify the Edge Function enforces the same limits server-side.
9. Test external links and file downloads on a real Android device.
