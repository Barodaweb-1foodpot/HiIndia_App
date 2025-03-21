import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import {
  fetchProfile,
  fetchActiveCountries,
  updateProfileByApp,
} from "../../api/auth_api";
import { API_BASE_URL_UPLOADS } from "@env";

// Import the provided SkeletonLoader component
import SkeletonLoader from "../../components/SkeletonLoader";

// CountryCodeDropdown component remains unchanged
const CountryCodeDropdown = ({ selectedCode, onSelect, countries }) => {
  const [isOpen, setIsOpen] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  const toggleDropdown = useCallback(() => {
    const toValue = isOpen ? 0 : 200;
    Animated.timing(animatedHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsOpen((prev) => !prev);
  }, [isOpen, animatedHeight]);

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.countryCodeButton}
        onPress={toggleDropdown}
      >
        <Text style={styles.countryCodeButtonText}>{selectedCode}</Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={16}
          color="#000"
        />
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.dropdownList,
          {
            maxHeight: animatedHeight,
            opacity: animatedHeight.interpolate({
              inputRange: [0, 200],
              outputRange: [0, 1],
            }),
          },
        ]}
      >
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {countries.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={styles.dropdownItem}
              onPress={() => {
                onSelect("+" + item.CountryCode);
                toggleDropdown();
              }}
            >
              <Text style={styles.countryCodeText}>+{item.CountryCode}</Text>
              <Text style={styles.countryNameText}>{item.CountryName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

// ---------------------------
// ProfileImage Component
// ---------------------------
// Moved outside of EditProfile and wrapped with React.memo.
const ProfileImage = React.memo(({ source, style }) => {
  const [loaded, setLoaded] = useState(false);
  const onLoadHandler = useCallback(() => {
    console.log("[ProfileImage] Image loaded successfully");
    setLoaded(true);
  }, []);

  // For local images, mark as loaded immediately.
  useEffect(() => {
    if (!source.uri) {
      setLoaded(true);
    }
  }, [source]);

  return (
    <View style={style}>
      {source.uri && !loaded && (
        <SkeletonLoader
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: style?.borderRadius || 0 },
          ]}
        />
      )}
      <Image
        source={source}
        style={[style, { opacity: loaded ? 1 : 0 }]}
        resizeMode="cover"
        onLoad={onLoadHandler}
      />
    </View>
  );
});

export default function EditProfile({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [profileImage, setProfileImage] = useState(
    require("../../../assets/placeholder.jpg")
  );
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  const [errors, setErrors] = useState({});

  // Load user data from API and AsyncStorage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const participantId = await AsyncStorage.getItem("role");
        if (participantId) {
          const res = await fetchProfile(participantId);
          if (res && res._id) {
            setFirstName(res.firstName || "");
            setLastName(res.lastName || "");
            setPhoneNumber(res.contactNumber || "");
            setEmail(res.emailId || "");
            setCountryCode(res.ParticipantCountryCode || "+91");
            if (res.profileImage && res.profileImage.trim() !== "") {
              setProfileImage({
                uri: `${API_BASE_URL_UPLOADS}/${res.profileImage}`,
              });
            }
          } else {
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Failed to load profile data",
              position: "bottom",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  // Load list of active countries
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const data = await fetchActiveCountries();
        setCountries(data);
      } catch (error) {
        console.error("Error loading countries:", error);
      }
    };
    loadCountries();
  }, []);

  const handlePickImage = useCallback(async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: "Gallery access is required to select an image.",
          position: "bottom",
        });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled && result.assets?.length) {
        setProfileImage({ uri: result.assets[0].uri });
        Toast.show({
          type: "success",
          text1: "Image Selected",
          text2: "Profile image updated locally! Save changes to upload.",
          position: "bottom",
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to pick image.",
        position: "bottom",
      });
    }
  }, []);

  // Validate required fields
  const validateFields = () => {
    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = "Please fill this field";
    if (!lastName.trim()) newErrors.lastName = "Please fill this field";
    if (!phoneNumber.trim()) newErrors.phoneNumber = "Please fill this field";
    if (!email.trim()) newErrors.email = "Please fill this field";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Before saving, validate that required fields are not empty
  const handleSave = useCallback(async () => {
    if (!validateFields()) {
      // Get the first empty field to show in the toast
      const emptyField = Object.keys(errors)[0];
      if (emptyField) {
        // Capitalize the field name and insert space if needed
        const formattedField =
          emptyField.charAt(0).toUpperCase() + emptyField.slice(1);
        Toast.show({
          type: "error",
          text1: "Validation Error",
          text2: `${formattedField} cannot be empty.`,
          position: "bottom",
        });
      }
      return;
    }
    try {
      const participantId = await AsyncStorage.getItem("role");
      if (!participantId) return;

      // Build the FormData payload
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("contactNumber", phoneNumber);
      formData.append("ParticipantCountryCode", countryCode);

      // Append the profile image if a new local image is selected
      if (profileImage && profileImage.uri && !profileImage.uri.startsWith("http")) {
        const uriParts = profileImage.uri.split(".");
        const fileType = uriParts[uriParts.length - 1];
        formData.append("profileImage", {
          uri: profileImage.uri,
          name: `profile.${fileType}`,
          type: `image/${fileType}`,
        });
      }
      console.log("FormData payload:", formData);
      const response = await updateProfileByApp(participantId, formData);
      console.log("Update response:", response);
      if (response && response.success) {
        Toast.show({
          type: "success",
          text1: "Profile Updated",
          text2: "Your profile has been updated successfully.",
          position: "bottom",
        });
        navigation.goBack();
      } else {
        Toast.show({
          type: "error",
          text1: "Update Failed",
          text2: "Profile update failed.",
          position: "bottom",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Toast.show({
        type: "error",
        text1: "Update Error",
        text2: "Something went wrong while updating profile.",
        position: "bottom",
      });
    }
  }, [firstName, lastName, phoneNumber, email, countryCode, profileImage, navigation, errors]);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile Info</Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.profileImageContainer}>
              <TouchableOpacity onPress={handlePickImage}>
                <ProfileImage
                  source={
                    typeof profileImage === "string"
                      ? { uri: profileImage }
                      : profileImage
                  }
                  style={styles.profileImage}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={handlePickImage}
              >
                <Ionicons name="camera" size={20} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.firstName && styles.errorInput,
                  ]}
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    setErrors((prev) => ({ ...prev, firstName: "" }));
                  }}
                  placeholder="Enter first name"
                  placeholderTextColor="#9CA3AF"
                />
                {errors.firstName && (
                  <Text style={styles.errorText}>{errors.firstName}</Text>
                )}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.lastName && styles.errorInput,
                  ]}
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    setErrors((prev) => ({ ...prev, lastName: "" }));
                  }}
                  placeholder="Enter last name"
                  placeholderTextColor="#9CA3AF"
                />
                {errors.lastName && (
                  <Text style={styles.errorText}>{errors.lastName}</Text>
                )}
              </View>
              {/* Added Email Field (read-only) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: "#F3F4F6" }]}
                  value={email}
                  editable={false}
                  selectTextOnFocus={false}
                  placeholder="Email"
                  placeholderTextColor="#9CA3AF"
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.phoneInputContainer}>
                  <CountryCodeDropdown
                    selectedCode={countryCode}
                    onSelect={setCountryCode}
                    countries={countries}
                  />
                  <TextInput
                    style={[
                      styles.phoneInput,
                      errors.phoneNumber && styles.errorInput,
                    ]}
                    value={phoneNumber}
                    onChangeText={(text) => {
                      setPhoneNumber(text);
                      setErrors((prev) => ({ ...prev, phoneNumber: "" }));
                    }}
                    keyboardType="phone-pad"
                    placeholder="Enter phone number"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                {errors.phoneNumber && (
                  <Text style={styles.errorText}>{errors.phoneNumber}</Text>
                )}
              </View>
              {/* <TouchableOpacity
                style={styles.pinButton}
                onPress={() => navigation.navigate("ChangePin")}
              >
                <View style={styles.pinButtonLeft}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#1F2937"
                  />
                  <Text style={styles.pinButtonText}>Change PIN</Text>
                </View>
                <Text style={styles.pinDots}>• • • • • •</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity> */}
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 65 : 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 8,
    fontFamily: "Poppins-Bold",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 32,
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    backgroundColor: "#fff",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formContainer: {
    paddingHorizontal: 10,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    fontFamily: "Poppins-Regular",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1F2937",
    fontFamily: "Poppins-Regular",
  },
  errorInput: {
    borderColor: "#E3000F",
  },
  errorText: {
    color: "#E3000F",
    fontSize: 12,
    marginTop: 4,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
  },
  dropdownContainer: {
    position: "relative",
    zIndex: 1000,
    width: 78,
  },
  countryCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 6,
    height: 48,
    marginRight: 8,
    backgroundColor: "#FFFFFF",
    width: 70,
    justifyContent: "space-between",
  },
  countryCodeButtonText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000000",
  },
  dropdownList: {
    position: "absolute",
    top: 52,
    left: 0,
    width: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    width: "100%",
  },
  countryCodeText: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: "#000000",
    width: 50,
  },
  countryNameText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    flex: 1,
    marginLeft: 8,
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: "#1F2937",
    fontFamily: "Poppins-Regular",
  },
  pinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginTop: 8,
  },
  pinButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pinButtonText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
    fontFamily: "Poppins-Regular",
  },
  pinDots: {
    fontSize: 14,
    color: "#6B7280",
    letterSpacing: 2,
    fontFamily: "Poppins-Regular",
  },
  saveButton: {
    marginTop: 32,
    marginHorizontal: 20,
    backgroundColor: "#E3000F",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
  },
});

export { EditProfile };
