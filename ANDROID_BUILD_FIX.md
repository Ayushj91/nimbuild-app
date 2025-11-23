# Android Build Issue & Solutions

## ⚠️ Current Issue
The Android build is failing with:
```
Execution failed for task ':app:configureCMakeDebug[arm64-v8a]'.
> WARNING: A restricted method in java.lang.System has been called
```

## 🔍 Root Cause
- **Java Version**: You have Java 24 installed
- **React Native 0.82**: Requires new architecture (with CMake)
- **Problem**: Java 24 has stricter security restrictions that block system calls used by CMake

## ✅ Solutions (Pick One)

### Option 1: Install Java 17 (Recommended)
Java 17 is the recommended LTS version for React Native development.

```bash
# Install Java 17 via Homebrew
brew install openjdk@17

# Set JAVA_HOME for this session
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home

# Add to ~/.zshrc for permanent use
echo 'export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home' >> ~/.zshrc
echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> ~/.zshrc

# Verify
java -version  # Should show Java 17

# Then rebuild
cd ~/Documents/nimbuild app
cd android && ./gradlew clean && cd ..
npm run android
```

### Option 2: Use iOS (Mac Only - Easier Setup)
iOS setup is typically easier once CocoaPods is installed:

```bash
# Install CocoaPods
sudo gem install cocoapods

# Install dependencies
cd ios
pod install
cd ..

# Run iOS app
npm run ios
```

### Option 3: Use Expo (Easiest - No build tools needed)
Convert to Expo for immediate testing without native build setup:

```bash
# This would require restructuring the project
# Not recommended if you want full native control
```

## 🎯 Recommended Next Steps

1. **For Quick Testing**: Use iOS (Option 2)
2. **For Production Android**: Install Java 17 (Option 1)

## 📝 What's Working
- ✅ Metro bundler running
- ✅ Android emulator available (`Medium_Phone_API_36.1`)
- ✅ Project structure created
- ✅ Dependencies installed
- ✅ Android SDK configured

## 🚀 Once Java 17 is Installed

Simply run:
```bash
npm run android
```

The app will build and launch in the emulator!
