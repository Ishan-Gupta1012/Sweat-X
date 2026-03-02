---
description: Build an APK for Android for external testing or direct installation
---

To build an APK that you can download and install directly on your phone, follow these steps:

1. **Install EAS CLI** (if you haven't already):
   ```bash
   npm install -g eas-cli
   ```

2. **Log in to your Expo account**:
   ```bash
   eas login
   ```

3. **Configure the project** (only required the first time):
   ```bash
   eas build:configure
   ```

// turbo
4. **Run the build command**:
   ```bash
   eas build -p android --profile preview
   ```

**What happens next?**
- Expo will build your app on their servers.
- Once finished, you will get a dashboard link.
- On that page, there will be a **Download APK** button or a QR code you can scan with your phone to download the file directly.

> [!NOTE]
> Ensure your Android package name in `app.json` is unique. I have already set it to `com.truefit.app` for you.
