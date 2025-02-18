import React, { useState, useEffect, useRef } from "react";
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
  SafeAreaView,
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

const CountryCodeDropdown = ({ selectedCode, onSelect, countries }) => {
  const [isOpen, setIsOpen] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  const toggleDropdown = () => {
    const toValue = isOpen ? 0 : 200;
    Animated.timing(animatedHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsOpen(!isOpen);
  };

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity style={styles.countryCodeButton} onPress={toggleDropdown}>
        <Text style={styles.countryCodeButtonText}>{selectedCode}</Text>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color="#000" />
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

export default function EditProfile({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [profileImage, setProfileImage] = useState(require("../../../assets/placeholder.jpg"));
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);

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
            setCountryCode(res.ParticipantCountryCode || "+91");
            if (res.profileImage && res.profileImage.trim() !== "") {
              setProfileImage({ uri: `${API_BASE_URL_UPLOADS}/${res.profileImage}` });
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

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
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
  };

  const handleSave = async () => {
    try {
      const participantId = await AsyncStorage.getItem("role");
      if (!participantId) return;

      // Build the FormData payload
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("contactNumber", phoneNumber);
      formData.append("ParticipantCountryCode", countryCode);

      // Append the profile image if a new image is selected (local file)
      if (profileImage && profileImage.uri && !profileImage.uri.startsWith("http")) {
        const uriParts = profileImage.uri.split(".");
        const fileType = uriParts[uriParts.length - 1];
        formData.append("profileImage", {
          uri: profileImage.uri,
          name: `profile.${fileType}`,
          type: `image/${fileType}`,
        });
      }
      console.log("kkkkkkkkkkk",formData)
      // Call the new updateProfileByApp API helper
      const response = await updateProfileByApp(participantId, formData);
      console.log(response)
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
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="chevron-back" size={18} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Personal Info</Text>
              </View>
              <View style={styles.profileImageContainer}>
                <TouchableOpacity onPress={handlePickImage}>
                  <Image
                    source={
                      typeof profileImage === "string"
                        ? { uri: profileImage }
                        : profileImage
                    }
                    style={styles.profileImage}
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage}>
                  <Ionicons name="camera" size={20} color="#000" />
                </TouchableOpacity>
              </View>
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Enter first name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Enter last name"
                    placeholderTextColor="#9CA3AF"
                  />
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
                      style={styles.phoneInput}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      placeholder="Enter phone number"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.pinButton}
                  onPress={() => navigation.navigate("ChangePin")}
                >
                  <View style={styles.pinButtonLeft}>
                    <Ionicons name="lock-closed-outline" size={20} color="#1F2937" />
                    <Text style={styles.pinButtonText}>Change PIN</Text>
                  </View>
                  <Text style={styles.pinDots}>• • • • • •</Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 200,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 25 : 15,
    marginBottom: 32,
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
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
    position: "absolute",
    bottom: 32,
    left: 20,
    right: 20,
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
