import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";

export default function EditProfile({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(
    require("../../../assets/placeholder.jpg")
  );

  
  const countryList = [
    { country: "India", code: "+91" },
    { country: "USA", code: "+1" },
    { country: "UK", code: "+44" },
  ];

 
  const handlePickImage = async () => {
    try {
      
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: "Gallery access is required to select an image.",
        });
        return;
      }

      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      console.log("Image picker result:", result); 

      if (!result.canceled && result.assets?.length) {
        setProfileImage(result.assets[0].uri);
        Toast.show({
          type: "success",
          text1: "Image Selected",
          text2: "Profile image updated locally! Save changes to upload.",
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to pick image.",
      });
    }
  };

  const handleCountryCodePress = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSelectCountry = (selectedCode) => {
    setCountryCode(selectedCode);
    setIsDropdownOpen(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.container}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 200 }}
          >
            
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
                  <TouchableOpacity
                    style={styles.countryCode}
                    onPress={handleCountryCodePress}
                  >
                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                    <Ionicons name="chevron-down" size={16} color="#1F2937" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.phoneInput}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    placeholder="Enter phone number"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                
                {isDropdownOpen && (
                  <View style={styles.dropdown}>
                    {countryList.map((item) => (
                      <TouchableOpacity
                        key={item.code}
                        style={styles.dropdownItem}
                        onPress={() => handleSelectCountry(item.code)}
                      >
                        <Text style={styles.dropdownItemText}>
                          {item.country} ({item.code})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity
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
              </TouchableOpacity>
            </View>
          </ScrollView>

         
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Platform.OS === "ios" ? 55 : 15,
    paddingHorizontal: 20,
    marginBottom: 32,
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
  countryCode: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  countryCodeText: {
    fontSize: 14,
    color: "#1F2937",
    marginRight: 4,
    fontFamily: "Poppins-Regular",
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: "#1F2937",
    fontFamily: "Poppins-Regular",
  },
  dropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
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
