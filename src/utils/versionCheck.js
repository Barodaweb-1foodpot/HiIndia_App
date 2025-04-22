import { Alert, Linking, Platform } from "react-native";
import Constants from "expo-constants";
import axios from "axios";
import firebaseApp from "@react-native-firebase/app";
import remoteConfig from "@react-native-firebase/remote-config";

// Store URLs and IDs for both platforms
const APP_STORE_ID = "com.hiindia.app"; // Your App Store ID (iOS bundle identifier)
const PLAY_STORE_PACKAGE = "com.deep_1012.HiIndia_App"; // Your Play Store package name

const STORE_URLS = {
  ios: `https://itunes.apple.com/lookup?id=YOUR_NUMERIC_APP_ID`, // Replace YOUR_NUMERIC_APP_ID with actual ID
  android: `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`,
};

const STORE_LINK_URLS = {
  ios: `https://apps.apple.com/app/id${APP_STORE_ID}`,
  android: `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`,
};

// Remote Config keys
const REMOTE_CONFIG_KEYS = {
  MIN_VERSION_IOS: "min_version_ios",
  MIN_VERSION_ANDROID: "min_version_android",
  RECOMMENDED_VERSION_IOS: "recommended_version_ios",
  RECOMMENDED_VERSION_ANDROID: "recommended_version_android",
  FORCE_UPDATE: "force_update",
};

/**
 * Initialize Firebase Remote Config
 */
export const initializeRemoteConfig = async () => {
  try {
    // Set default values for remote config (fallback values)
    await remoteConfig().setDefaults({
      [REMOTE_CONFIG_KEYS.MIN_VERSION_IOS]: "0.0.09",
      [REMOTE_CONFIG_KEYS.MIN_VERSION_ANDROID]: "0.0.09",
      [REMOTE_CONFIG_KEYS.RECOMMENDED_VERSION_IOS]: "0.0.09",
      [REMOTE_CONFIG_KEYS.RECOMMENDED_VERSION_ANDROID]: "0.0.09",
      [REMOTE_CONFIG_KEYS.FORCE_UPDATE]: "false",
    });

    // Set minimum fetch interval to allow frequent refreshes during development
    await remoteConfig().setConfigSettings({
      minimumFetchIntervalMillis: __DEV__ ? 0 : 3600000, // 1 hour in production
    });

    // Fetch and activate remote config
    await remoteConfig().fetchAndActivate();

    console.log("Remote Config initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing Remote Config:", error);
    return false;
  }
};

/**
 * Get the current installed app version
 * @returns {string} Current app version
 */
export const getCurrentVersion = () => {
  return Constants.expoConfig?.version || "0.0.09"; // Default to version in app.json
};

/**
 * Compare version strings (semantic versioning)
 * @param {string} v1 - First version string (e.g., "1.2.3")
 * @param {string} v2 - Second version string (e.g., "1.2.4")
 * @returns {number} - -1 if v1 < v2, 0 if v1 = v2, 1 if v1 > v2
 */
export const compareVersions = (v1, v2) => {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = i < parts1.length ? parts1[i] : 0;
    const part2 = i < parts2.length ? parts2[i] : 0;

    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }

  return 0;
};

/**
 * Check App Store for the latest iOS app version
 */
const checkAppStoreVersion = async () => {
  try {
    const response = await axios.get(STORE_URLS.ios);
    const storeData = response.data;

    if (storeData.resultCount > 0) {
      return storeData.results[0].version;
    }
    return null;
  } catch (error) {
    console.error("Error checking App Store version:", error);
    return null;
  }
};

/**
 * Check Play Store for the latest Android app version
 * Note: Google doesn't provide an official API for this
 * This approach parses the Play Store page HTML (may break if Google changes their page structure)
 */
const checkPlayStoreVersion = async () => {
  try {
    const response = await axios.get(STORE_URLS.android);

    // Extract version from HTML content
    // This is a simplified approach and might break if Google changes their HTML structure
    const html = response.data;
    const versionMatch = html.match(
      /Current Version\s*<\/div><span[^>]*>([\d.]+)<\/span>/i
    );

    if (versionMatch && versionMatch[1]) {
      return versionMatch[1];
    }
    return null;
  } catch (error) {
    console.error("Error checking Play Store version:", error);
    return null;
  }
};

/**
 * Check Firebase Remote Config for version requirements
 * @returns {Object} Update info from Remote Config
 */
const checkRemoteConfigVersion = async () => {
  try {
    // Make sure Remote Config is initialized
    await initializeRemoteConfig();

    const platform = Platform.OS;
    const currentVersion = getCurrentVersion();

    // Get minimum required version for this platform
    const minVersionKey =
      platform === "ios"
        ? REMOTE_CONFIG_KEYS.MIN_VERSION_IOS
        : REMOTE_CONFIG_KEYS.MIN_VERSION_ANDROID;

    const minVersion = remoteConfig().getValue(minVersionKey).asString();

    // Get recommended version for this platform
    const recommendedVersionKey =
      platform === "ios"
        ? REMOTE_CONFIG_KEYS.RECOMMENDED_VERSION_IOS
        : REMOTE_CONFIG_KEYS.RECOMMENDED_VERSION_ANDROID;

    const recommendedVersion = remoteConfig()
      .getValue(recommendedVersionKey)
      .asString();

    // Check if force update is enabled
    const forceUpdate = remoteConfig()
      .getValue(REMOTE_CONFIG_KEYS.FORCE_UPDATE)
      .asBoolean();

    // Determine if update is required or recommended
    const isUpdateRequired = compareVersions(currentVersion, minVersion) < 0;
    const isUpdateRecommended =
      compareVersions(currentVersion, recommendedVersion) < 0;

    return {
      currentVersion,
      minVersion,
      recommendedVersion,
      isUpdateRequired,
      isUpdateRecommended,
      forceUpdate,
    };
  } catch (error) {
    console.error("Error checking Remote Config version:", error);
    return {
      isUpdateRequired: false,
      isUpdateRecommended: false,
      forceUpdate: false,
    };
  }
};

/**
 * Comprehensive check for app updates using both store APIs and Firebase Remote Config
 * @returns {Promise<boolean>} True if update is needed
 */
export const checkForUpdate = async () => {
  try {
    // First, check Remote Config (fastest and most reliable)
    const remoteConfigResult = await checkRemoteConfigVersion();

    if (
      remoteConfigResult.isUpdateRequired ||
      (remoteConfigResult.forceUpdate && remoteConfigResult.isUpdateRecommended)
    ) {
      console.log("Update required based on Remote Config");
      return true;
    }

    // Skip store version checks during development or if the app isn't published yet
    if (__DEV__ || !process.env.PRODUCTION) {
      console.log("Skipping store version check during development");
      return false;
    }

    // If Remote Config doesn't indicate a required update, check store versions
    const currentVersion = getCurrentVersion();
    let storeVersion = null;

    if (Platform.OS === "ios") {
      storeVersion = await checkAppStoreVersion();
    } else if (Platform.OS === "android") {
      storeVersion = await checkPlayStoreVersion();
    }

    if (!storeVersion) {
      console.log("Could not retrieve store version");
      return false;
    }

    console.log(
      `Current version: ${currentVersion}, Store version: ${storeVersion}`
    );
    return compareVersions(currentVersion, storeVersion) < 0;
  } catch (error) {
    console.error("Error in comprehensive update check:", error);
    return false; // Assume no update needed if checks fail
  }
};

/**
 * Show a non-dismissible update alert
 */
export const showUpdateAlert = () => {
  const storeUrl =
    Platform.OS === "ios" ? STORE_LINK_URLS.ios : STORE_LINK_URLS.android;

  Alert.alert(
    "Update Required",
    "A new version of the app is available. Please update to continue.",
    [
      {
        text: "Update Now",
        onPress: () => Linking.openURL(storeUrl),
      },
    ],
    { cancelable: false } // Make alert non-dismissible
  );
};
