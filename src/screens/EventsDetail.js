import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";

const { width, height } = Dimensions.get("window");

const EventsDetail = ({ navigation }) => {
  // Toggle for "Read More" in Description
  const [readMore, setReadMore] = useState(false);

  // Toggle for Tab Selection
  const [selectedTab, setSelectedTab] = useState("Event Catalogue");

  // Sample short and full descriptions
  const shortDescription =
    "Join us for an unforgettable Garba Night, where tradition meets celebration! Dance to the electrifying beats of dandiya and Garba, dressed in vibrant festive attire...";
  const fullDescription = `
Join us for an unforgettable Garba Night, where tradition meets celebration! Dance to the electrifying beats of dandiya and Garba, dressed in vibrant festive attire. Experience the energy of Navratri with live music, traditional décor, and an enthusiastic crowd. 
\nCelebrate the spirit of togetherness as you twirl and swirl to the mesmerizing tunes of Garba. Whether you're a seasoned dancer or a first-timer, this night promises joy, laughter, and cherished memories. Get ready to immerse yourself in the cultural extravaganza and make new friends on the dance floor!
`;

  // Sample region for the MapView
  const initialRegion = {
    latitude: 22.308387,
    longitude: 73.168029,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" />

      {/* Top Section (Black Background + Event Image + Back Button) */}
      <View style={styles.topSection}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation && navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <Image
          source={require("../../assets/Atul_bhai.png")} // <-- Update path
          style={styles.topImage}
          resizeMode="cover"
        />

        {/* Bridging Card (half on image, half on white) */}
        <View style={styles.headerCard}>
          <Text style={styles.headerCardTitle}>Atul Purohit Graba</Text>
          <Text style={styles.headerCardSubtitle}>
            Gelora Bung Karno Stadium, Ahmedabad
            {"\n"}August 30 - September 2, 2024
            {"\n"}09:00 AM - 07:00 PM
          </Text>

          <View style={styles.divider} />

          <Text style={styles.artistName}>Atul Purohit</Text>
          <Text style={styles.artistDetail}>
            Singer, artist, 26 instrumental player
          </Text>
        </View>
      </View>

      {/* White Container */}
      <View style={styles.whiteContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Description Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {readMore ? fullDescription : shortDescription}
            </Text>
            <TouchableOpacity onPress={() => setReadMore(!readMore)}>
              <Text style={styles.readMoreText}>
                {readMore ? "Read Less" : "Read More"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Venue & Location Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Venue & Location</Text>
            <View style={styles.mapContainer}>
              <MapView style={styles.mapStyle} initialRegion={initialRegion}>
                <Marker
                  coordinate={{
                    latitude: 22.308387,
                    longitude: 73.168029,
                  }}
                />
              </MapView>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabsWrapper}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === "Event Catalogue" && styles.activeTab,
              ]}
              onPress={() => setSelectedTab("Event Catalogue")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "Event Catalogue" && styles.activeTabText,
                ]}
              >
                Event Catalogue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === "Gallery" && styles.activeTab,
              ]}
              onPress={() => setSelectedTab("Gallery")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === "Gallery" && styles.activeTabText,
                ]}
              >
                Gallery
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {selectedTab === "Event Catalogue" && (
            <View style={styles.catalogueContainer}>
              {/* Example PDF card */}
              <View style={styles.pdfCard}>
                <Ionicons
                  name="document-text-outline"
                  size={32}
                  color="#000"
                  style={styles.pdfIcon}
                />
                <View style={styles.pdfInfo}>
                  <Text style={styles.pdfTitle}>Policy_catalogue.pdf</Text>
                  <Text style={styles.pdfSize}>2.2MB</Text>
                </View>
                <TouchableOpacity style={styles.downloadIcon}>
                  <Ionicons name="download-outline" size={24} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {selectedTab === "Gallery" && (
            <View style={styles.galleryGrid}>
              {[1, 2, 3, 4].map((_, index) => (
                <View key={index} style={styles.galleryItem}>
                  <Image
                    source={require("../../assets/placeholder.jpg")} // <-- Update path
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                  {/* Share icon overlay */}
                  <TouchableOpacity style={styles.shareIcon}>
                    <Ionicons name="share-social-outline" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Extra space so content isn't hidden behind the fixed bottom bar */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Fixed Bottom Bar: Price + Buy Ticket */}
        <View style={styles.bottomBar}>
          <Text style={styles.priceText}>Start from IDR1.100.000</Text>
          <TouchableOpacity style={styles.buyButton}>
            <Text style={styles.buyButtonText}>Buy Ticket</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default EventsDetail;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#000000", // black background to match top section
  },
  topSection: {
    position: "relative",
    backgroundColor: "#000",
    height: 200, // Adjust as needed
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    zIndex: 10,
  },
  topImage: {
    width: "100%",
    height: "100%",
  },
  headerCard: {
    position: "absolute",
    bottom: -40, // negative margin to overlap white container
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 11,
  },
  headerCardTitle: {
    fontSize: 20,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    marginBottom: 4,
  },
  headerCardSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    lineHeight: 18,
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
  },
  artistName: {
    fontSize: 14,
    fontFamily: "Poppins-Bold",
    color: "#000000",
  },
  artistDetail: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    marginTop: 4,
  },

  whiteContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: -40, // Pull up to align with the bridging card
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingTop: 60, // Enough space for bridging card
    paddingBottom: 20,
  },

  // Sections
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    lineHeight: 20,
  },
  readMoreText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#E3000F",
    marginTop: 8,
  },

  // Map
  mapContainer: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
  },
  mapStyle: {
    width: "100%",
    height: "100%",
  },

  // Tabs
  tabsWrapper: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    marginBottom: 20,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#E3000F",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
  activeTabText: {
    color: "#E3000F",
    fontFamily: "Poppins-SemiBold",
  },

  // Catalogue (PDF)
  catalogueContainer: {
    marginBottom: 20,
  },
  pdfCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 12,
  },
  pdfIcon: {
    marginRight: 12,
  },
  pdfInfo: {
    flex: 1,
  },
  pdfTitle: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#000",
  },
  pdfSize: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666",
  },
  downloadIcon: {
    marginLeft: 8,
  },

  // Gallery
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  galleryItem: {
    width: (width - 60) / 2,
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
    position: "relative",
    overflow: "hidden",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  shareIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 16,
    padding: 6,
  },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#000",
  },
  buyButton: {
    backgroundColor: "#E3000F",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  buyButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
});
