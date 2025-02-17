import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
// import MapView, { Marker } from "react-native-maps";
import { API_BASE_URL, API_BASE_URL_UPLOADS } from '@env';
import RenderHTML from "react-native-render-html";
import { formatDateRange, formatTimeRange } from "../../helper/helper_Function";

const { width, height } = Dimensions.get("window");

export default function EventsDetail({ navigation, route }) {
  const [readMore, setReadMore] = useState(false);
  const [titleReadMore, setTitleReadMore] = useState(false);

  const { eventDetail } = route.params || {}; // Default to empty object in case params are undefined
  console.log("00000000",eventDetail)
  useEffect(() => {
    if (eventDetail?.EventCatalogue && eventDetail?.EventCatalogue !== "null") {
      fetchFileSize(`${API_BASE_URL_UPLOADS}/${eventDetail?.EventCatalogue}`);
    }
    
  }, [eventDetail?.EventCatalogue]);
  const [fileSize, setFileSize] = useState(null);

  const fetchFileSize = async (url) => {
    try {
      const encodedUrl = encodeURI(url); 

      const response = await fetch(encodedUrl, { method: "HEAD" });

      if (!response.ok) {
        return
        // throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
      }

      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        const sizeInMB = (parseInt(contentLength, 10) / (1024 * 1024)).toFixed(2); // Convert bytes to MB
        
        setFileSize(sizeInMB);
      } else {
        console.warn("Content-Length header is missing.");
      }
    } catch (error) {
      console.error("Error fetching file size:", error);
    }
  };

  const [selectedTab, setSelectedTab] = useState("Event Catalogue");
 
 

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" />

      {/* Top Section */}
      <View style={styles.topSection}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <Image
          source={{
            uri: eventDetail?.EventImage
              ? `${API_BASE_URL_UPLOADS}/${eventDetail?.EventImage}` : require('../../../assets/placeholder.jpg')
          }}
          style={styles.topImage}
          resizeMode="cover"
        />

        {/* Floating Card */}
        <View style={styles.headerCard}>
          <View>
            <Text style={styles.headerCardTitle} numberOfLines={titleReadMore ? undefined : 2}>
              {eventDetail?.EventName}

            </Text>
            {eventDetail?.EventName?.length > 50 && (
              <TouchableOpacity onPress={() => setTitleReadMore(!titleReadMore)}>
                <Text style={styles.readMoreText}>{titleReadMore ? "Read Less" : "Read More"}</Text>
              </TouchableOpacity>
            )}

          </View>


          {/* Location row */}
          <View style={styles.headerCardRow2}>
            <Ionicons
              name="location-outline"
              size={16}
              color="#666666"
              style={styles.headerCardIcon}
            />
            <Text style={styles.headerCardSubtitle}>
              {eventDetail?.EventLocation}
            </Text>
          </View>

          {/* Date row */}
          <View style={styles.headerCardRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color="#666666"
              style={styles.headerCardIcon}
            />
            <Text style={styles.headerCardSubtitle}>
              {formatDateRange(eventDetail?.StartDate, eventDetail?.EndDate)}
            </Text>
          </View>

          {/* Time row */}
          <View style={styles.headerCardRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color="#666666"
              style={styles.headerCardIcon}
            />
            <Text style={styles.headerCardSubtitle}>{formatTimeRange(eventDetail?.StartDate, eventDetail?.EndDate)}</Text>
          </View>
        </View>
      </View>

      {/* White Section */}
      <View style={styles.whiteContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Artist Info with Circular Image */}
          <View style={styles.artistInfoContainer}>
            <Image
              source={{
                uri: eventDetail?.EventImage
                  ? `${API_BASE_URL_UPLOADS}/${eventDetail?.EventImage}` : require('../../../assets/placeholder.jpg')
              }}
              style={styles.artistImage}
            />
            <View style={styles.artistTextContainer}>
              <Text style={styles.artistName}>{eventDetail?.artistName}</Text>
              <Text style={styles.artistDetail}>
                {eventDetail?.artistDesc}
                {/* {console.log(eventDetail)} */}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {readMore ? (
                eventDetail?.EventDescreption.replace(/<[^>]+>/g, "")
              ) : (
                <Text numberOfLines={2} ellipsizeMode="tail">
                  {eventDetail?.ShortDescreption}
                </Text>
              )}
            </Text>
            <TouchableOpacity onPress={() => setReadMore(!readMore)}>
              <Text style={styles.readMoreText}>
                {readMore ? "Read Less" : "Read More"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Venue & Location */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Venue & Location</Text>

            {/* COMMENTED MAP
            <View style={styles.mapContainer}>
              <MapView style={styles.mapStyle} initialRegion={initialRegion}>
                <Marker
                  coordinate={{
                    latitude: latitude,
                    longitude: longitude,
                  }}
                />
              </MapView>
            </View> 
            */}

            {/* CLICKABLE LINK */}
            <TouchableOpacity onPress={() => Linking.openURL(eventDetail?.googleMapLink)} style={styles.locationLink}>
              <Ionicons name="location-sharp" size={20} color="#E3000F" />
              <Text style={styles.locationLinkText}>Open in Maps</Text>
            </TouchableOpacity>
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
          {selectedTab === "Event Catalogue" && eventDetail?.EventCatalogue && eventDetail?.EventCatalogue !== "null" ? (
            <View style={styles.catalogueContainer}> 
              <View style={styles.pdfCard}>
                <Ionicons
                  name="document-text-outline"
                  size={32}
                  color="#000"
                  style={styles.pdfIcon}
                />
                <View style={styles.pdfInfo}>
                  <Text style={styles.pdfTitle}>Download Catalogue</Text>
                  <Text style={styles.pdfSize}>{fileSize} MB</Text>
                </View>
                <TouchableOpacity style={styles.downloadIcon}>
                  <Ionicons name="download-outline" size={24} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Text>No Catalogue</Text>
            </View>
          )}


          {selectedTab === "Gallery" && (
            <View style={styles.galleryGrid}>
              {eventDetail?.GalleryImages && eventDetail?.GalleryImages.length > 0 ? (
                eventDetail?.GalleryImages.map((image, index) => (
                  <View key={index} style={styles.galleryItem}>
                    <Image
                      source={{ uri: `${API_BASE_URL_UPLOADS}/${image}` || require('../../../assets/placeholder.jpg') }} // Assuming image is a URL, otherwise adjust as necessary
                      style={styles.galleryImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity style={styles.shareIcon}>
                      <Ionicons
                        name="share-social-outline"
                        size={18}
                        color="#FFF"
                      />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text>No Images</Text>
              )}
            </View>
          )}


          {/* Extra space so content isn't hidden by the bottom bar */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <Text style={styles.priceText}>
            {eventDetail?.eventRates.length > 0 ? (
              `Start from ${eventDetail?.countryDetail[0].Currency} ${Math.max(...eventDetail?.eventRates.map(rate => rate.ratesForParticipant))}`
            ) : (
              "Free Event"
            )}
          </Text>
          {new Date(eventDetail?.StartDate) > Date.now() &&
            <TouchableOpacity
              style={styles.buyButton}
              onPress={() => navigation.navigate("BuyTicket")}
            >
              <Text style={styles.buyButtonText}>Buy Ticket</Text>
            </TouchableOpacity>
          }
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  topSection: {
    position: "relative",
    paddingTop: Platform.OS === "ios" ? 40 : 0,
    backgroundColor: "#000",
    height: 360,
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 15, 
    left: 16,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#FFF",
    // backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  topImage: {
    width: "100%",
    height: "100%",
  },
  headerCard: {
    position: "absolute",
    bottom: 25,
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
  },
  headerCardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  headerCardRow2: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  headerCardIcon: {
    marginRight: 4,
  },
  headerCardSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: -80,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 20,
  },
  artistInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  artistImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    resizeMode: "cover",
  },
  artistTextContainer: {
    marginLeft: 12,
  },
  artistName: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    marginBottom: 4,
  },
  artistDetail: {
    fontSize: 12,
    paddingRight: 30,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
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

  // Map Container (commented out) & clickable link
  /*
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
  */
  locationLink: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  locationLinkText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#E3000F",
    fontFamily: "Poppins-Medium",
    textDecorationLine: "underline",
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
  readMoreText: {
    color: "black",
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

  // Catalogue
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    backgroundColor: "#E3000F",
    borderRadius: 24,
    paddingHorizontal: 24,
    marginLeft: 20,
    shadowColor: "#E3000F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buyButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Poppins-Medium",
  },
});
