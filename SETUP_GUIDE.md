# Nimbuild App - Setup & Run Guide

## ✅ Current Status
- ✅ React Native project initialized
- ✅ Dependencies installed
- ✅ Metro bundler running on port 8081
- ✅ Project structure created
- ✅ Theme configured

## 🎯 Next Steps to Run the App

### Option 1: iOS (Recommended for Mac users)

#### Prerequisites
1. **Install CocoaPods globally** (requires password):
   ```bash
   sudo gem install cocoapods
   ```

2. **Install iOS dependencies**:
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Run the app**:
   ```bash
   npm run ios
   ```

The app will open in the iOS Simulator.

---

### Option 2: Android

#### Prerequisites
1. **Install Android Studio** from https://developer.android.com/studio

2. **Set ANDROID_HOME environment variable**:
   
   Add this to your `~/.zshrc` file:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

3.  **Reload your shell**:
   ```bash
   source ~/.zshrc
   ```

4. **Create an Android Virtual Device (AVD)**:
   - Open Android Studio
   - Go to Tools → Device Manager
   - Create a new device (e.g., Pixel 5 with Android 11+)

5. **Start the emulator**:
   - In Android Studio Device Manager, click the play button next to your AVD

6. **Run the app**:
   ```bash
   npm run android
   ```

---

## 🚀 Quick Start (After Setup)

1. **Start Metro Bundler** (if not already running):
   ```bash
   npm start
   ```

2. **In a new terminal**, run:
   - iOS: `npm run ios`
   - Android: `npm run android`

---

## 🛠 Troubleshooting

### iOS Issues
- **"pod: command not found"**: Run `sudo gem install cocoapods`
- **Build fails**: Try `cd ios && pod deintegrate && pod install && cd ..`

### Android Issues
- **"SDK location not found"**: Ensure ANDROID_HOME is set correctly
- **"adb: command not found"**: Add Android SDK platform-tools to PATH
- **No emulator**: Create one in Android Studio Device Manager

---

## 📱 What You'll See

When the app launches, you'll see a welcome screen with:
- "Welcome to Nimbuild" title in yellow/amber
- "Project Initialization Complete ✅" subtitle
- Ready message

This confirms the app is working correctly!
