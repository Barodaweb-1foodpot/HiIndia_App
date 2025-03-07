import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
  Share,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { API_BASE_URL_UPLOADS } from "@env";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { SharedElement } from "react-navigation-shared-element";

const ArtistDetails = () => {
  const navigation = useNavigation();
  const { 
    artistName, 
    artistImage, 
    artistDesc, 
    artistGenres = [],
    eventName,
    eventDateTime,
    eventLocation 
  } = useRoute().params;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${artistName}'s profile!`,
        title: `${artistName} - Artist Profile`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f7f7f7"
        animated
      />
      
      {/* Fixed Header with Blur: Only back and share icons */}
      <View style={styles.headerContainer}>
        <BlurView intensity={80} tint="light" style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          {/* <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-social-outline" size={24} color="#1F2937" />
          </TouchableOpacity> */}
        </BlurView>
      </View>
      
      {/* Regular ScrollView */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Area with Circular Image */}
        <View style={styles.profileContainer}>
          <SharedElement id={`artist.${artistName}.image`}>
            <Image
              source={
                artistImage
                  ? { uri: `${API_BASE_URL_UPLOADS}/${artistImage}` }
                  : require("../../../assets/placeholder.jpg")
              }
              style={styles.artistImage}
            />
          </SharedElement>
          <SharedElement id={`artist.${artistName}.name`}>
            <Text style={styles.artistName}>
              {artistName || "Artist Name Unavailable"}
            </Text>
          </SharedElement>
        </View>
        
        {/* About Section with Share Icon */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          <Text style={styles.artistDesc}>
            {artistDesc || "No artist description available."}
          </Text>
        </View>
        
        {/* Extra space at bottom for better scrolling */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

export default ArtistDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#f7f7f7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === "ios" ? 44 : 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  shareButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  scrollContent: {
    paddingTop: Platform.OS === "ios" ? 120 : 80,
    paddingBottom: 40,
  },
  profileContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  artistImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  artistName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
 
  eventDetailsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  eventName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  sectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
  },
  artistDesc: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4B5563",
    textAlign: "justify",
  },
  bottomSpacing: {
    height: 40,
  },
});
