import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Share,
  Animated,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { API_BASE_URL, API_BASE_URL_UPLOADS } from "@env";
import { formatEventDateTime } from "../../helper/helper_Function";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";
import { CheckAccessToken } from "../../api/token_api";

// Import custom SkeletonLoader component
import SkeletonLoader from "../../components/SkeletonLoader";
import LoginPromptModal from "../../components/LoginPromptModal";

const { width } = Dimensions.get("window");

/*
  EventImage Component
  - Uses the custom SkeletonLoader to display a loading indicator.
  - Wrapped with React.memo to avoid unnecessary re-renders.
*/
const EventImage = React.memo(({ uri, style, defaultSource }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <View style={style}>
      {!loaded && (
        <SkeletonLoader
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: style?.borderRadius || 0 },
          ]}
        />
      )}
      <Image
        source={
          uri && !error
            ? { uri }
            : defaultSource || require("../../../assets/placeholder.jpg")
        }
        style={[style, loaded ? {} : { opacity: 0 }]}
        resizeMode="cover"
        onLoadEnd={() => {
          setLoaded(true);
          console.log("Image loaded:", uri);
        }}
        onError={() => {
          setError(true);
          setLoaded(true);
          console.error("Error loading image:", uri);
        }}
      />
    </View>
  );
});

/*
  GalleryItem Component
  - Extracted component for rendering gallery images.
  - Memoized with React.memo.
*/
const GalleryItem = React.memo(({ image, shareGalleryImage }) => (
  <View style={styles.galleryItem}>
    <EventImage
      uri={`${API_BASE_URL_UPLOADS}/${image}`}
      style={styles.galleryImage}
    />
    <TouchableOpacity
      style={styles.shareIcon}
      onPress={() => {
        console.log("Sharing gallery image:", image);
        shareGalleryImage(image);
      }}
    >
      <Ionicons name="share-social-outline" size={18} color="#FFF" />
    </TouchableOpacity>
  </View>
));

export default function EventsDetail({ navigation, route }) {
  const [readMore, setReadMore] = useState(false);
  const [titleReadMore, setTitleReadMore] = useState(false);
  const [fileSize, setFileSize] = useState(null);
  const [selectedTab, setSelectedTab] = useState("Event Catalogue");
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  const { eventDetail } = route.params || {};

  // Compute catalogueUrl only if available and valid
  const catalogueUrl =
    eventDetail?.EventCatalogue && eventDetail?.EventCatalogue !== "null"
      ? `${API_BASE_URL_UPLOADS}/${eventDetail?.EventCatalogue}`
      : null;

  // Fetch file size when catalogueUrl is available
  useEffect(() => {
    if (catalogueUrl) {
      console.log("Fetching file size for:", catalogueUrl);
      fetchFileSize(catalogueUrl);
    }
  }, [catalogueUrl]);

  // Function to fetch file size using HEAD request
  const fetchFileSize = async (url) => {
    try {
      const encodedUrl = encodeURI(url);
      const response = await fetch(encodedUrl, { method: "HEAD" });
      if (!response.ok) return;
      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        const sizeInMB = (parseInt(contentLength, 10) / (1024 * 1024)).toFixed(2);
        console.log("Fetched file size:", sizeInMB, "MB");
        setFileSize(sizeInMB);
      } else {
        console.warn("Content-Length header is missing for:", url);
      }
    } catch (error) {
      console.error("Error fetching file size:", error);
    }
  };

  // Download PDF with progress tracking, using useCallback
  const downloadPDF = useCallback(async () => {
    if (!catalogueUrl) return;
    console.log("Starting PDF download from:", catalogueUrl);

    try {
      setDownloading(true);
      const encodedPdfUrl = encodeURI(catalogueUrl);
      const fileName = eventDetail.EventCatalogue.split("/").pop();
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        encodedPdfUrl,
        fileUri,
        {},
        (downloadProgressData) => {
          const progress =
            downloadProgressData.totalBytesWritten /
            downloadProgressData.totalBytesExpectedToWrite;
          setDownloadProgress(progress);
          console.log("Download progress:", Math.round(progress * 100) + "%");
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      console.log("Download completed, file saved at:", uri);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        console.log("Sharing file:", uri);
        await Sharing.shareAsync(uri);
      } else {
        alert("Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download the file. Please try again.");
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  }, [catalogueUrl, eventDetail]);

  // Preview PDF using WebBrowser
  const previewPDF = useCallback(async () => {
    if (!catalogueUrl) return;
    console.log("Previewing PDF from:", catalogueUrl);

    try {
      const encodedPdfUrl = encodeURI(catalogueUrl);
      await WebBrowser.openBrowserAsync(encodedPdfUrl);
      console.log("PDF preview opened successfully");
    } catch (error) {
      console.error("Error previewing PDF:", error);
      alert("Failed to open the preview. Please try downloading instead.");
    }
  }, [catalogueUrl]);

  // Share event details
  const shareEvent = useCallback(async () => {
    try {
      console.log("Sharing event:", eventDetail?.EventName);
      const eventDate = formatEventDateTime(
        eventDetail?.StartDate,
        eventDetail?.EndDate
      );
      const shareMessage =
        `🎶 Check out this event!\n\n` +
        `Event: ${eventDetail?.EventName}\n` +
        `Location: ${eventDetail?.EventLocation}\n` +
        `Date: ${eventDate}\n` +
        (eventDetail?.EventImage
          ? `Image: ${API_BASE_URL_UPLOADS}/${eventDetail.EventImage}\n`
          : "");
      await Share.share({ message: shareMessage });
    } catch (error) {
      console.error("Error sharing event", error);
    }
  }, [eventDetail]);

  // Share a gallery image
  const shareGalleryImage = useCallback(async (galleryImage) => {
    try {
      console.log("Sharing gallery image:", galleryImage);
      const imageUrl = `${API_BASE_URL_UPLOADS}/${galleryImage}`;
      await Share.share({ message: imageUrl });
    } catch (error) {
      console.error("Error sharing gallery image", error);
    }
  }, []);

  // Memoize percentage sold calculation
  const percentageSold = useMemo(() => {
    const ticketsSold = eventDetail?.EventRegisterDetail?.length || 0;
    const totalTickets = eventDetail?.NoOfParticipants || 0;
    return totalTickets > 0 ? (ticketsSold / totalTickets) * 100 : 0;
  }, [eventDetail?.EventRegisterDetail, eventDetail?.NoOfParticipants]);

  // Toggle "Read More" states using useCallback
  const toggleReadMore = useCallback(() => {
    setReadMore((prev) => !prev);
  }, []);

  const toggleTitleReadMore = useCallback(() => {
    console.log("Toggling title read more state");
    setTitleReadMore((prev) => !prev);
  }, []);

  // Update the handler for the Buy Ticket button
  const handleBuyTicket = useCallback(async () => {
    if (eventDetail.hasExternalLink && eventDetail.externalLink) {
      Linking.openURL(eventDetail.externalLink);
      return;
    }
    
    const isAuthenticated = await CheckAccessToken();
    if (!isAuthenticated) {
      // Show login modal instead of direct navigation
      setLoginModalVisible(true);
      return;
    }
    
    // If authenticated, proceed to buy ticket flow
    navigation.navigate("BuyTicket", {
      eventDetail: eventDetail,
    });
  }, [eventDetail, navigation]);

  const handleLoginContinue = () => {
    setLoginModalVisible(false);
    // Navigate to login screen
    navigation.navigate("Auth", { screen: "Login" });
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar style="auto" />

      {/* Top Section */}
      <View style={styles.topSection}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log("Navigating back");
            navigation.goBack();
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        {/* Share Button */}
        <TouchableOpacity style={styles.shareTopButton} onPress={shareEvent}>
          <Ionicons name="share-social-outline" size={20} color="#FFF" />
        </TouchableOpacity>

        <EventImage
          uri={
            eventDetail?.EventImage
              ? `${API_BASE_URL_UPLOADS}/${eventDetail?.EventImage}`
              : undefined
          }
          style={styles.topImage}
          defaultSource={require("../../../assets/placeholder.jpg")}
        />

       
      </View>

      {/* White Section */}
      <View style={styles.whiteContainer}>
         {/* Floating Card with ONLY Event Name now */}
         <View style={styles.headerCard}>
          <View>
            <Text
              style={styles.headerCardTitle}
              numberOfLines={titleReadMore ? undefined : 2}
            >
              {eventDetail?.EventName || "Event Name Unavailable"}
            </Text>
            {eventDetail?.EventName?.length > 50 && (
              <TouchableOpacity onPress={toggleTitleReadMore}>
                <Text style={styles.readMoreText}>
                  {titleReadMore ? "Read Less" : "Read More"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Ticket Indicator */}
          {percentageSold >= 100 ? (
            <View style={styles.ticketIndicatorContainer}>
              <View
                style={[
                  styles.ticketIndicatorBox,
                  { backgroundColor: "#fdecea", borderColor: "#f5c6cb" },
                ]}
              >
                <FontAwesome
                  name="exclamation-triangle"
                  size={18}
                  color="#721c24"
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.ticketIndicatorText, { color: "#721c24" }]}>
                  Registrations are full!
                </Text>
              </View>
            </View>
          ) : percentageSold >= 50 ? (
            <View style={styles.ticketIndicatorContainer}>
              <View
                style={[
                  styles.ticketIndicatorBox,
                  { backgroundColor: "#fff8e1", borderColor: "#ffecb3" },
                ]}
              >
                <FontAwesome
                  name="exclamation-triangle"
                  size={18}
                  color="#856404"
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.ticketIndicatorText, { color: "#856404" }]}>
                  Tickets filling fast!
                </Text>
              </View>
              {/* Progress Bar */}
              <View style={styles.progressBarContainer2}>
                <View style={styles.progressBarBackground2}>
                  <View
                    style={[
                      styles.progressBar2,
                      { width: `${Math.min(percentageSold, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressBarLabel}>
                  {Math.round(percentageSold)}% Sold
                </Text>
              </View>
            </View>
          ) : null}

          {/* Artist Info */}
          <View style={styles.artistInfoContainer}>
            <View style={styles.artistNameRow}>
              <EventImage
                uri={
                  eventDetail?.artistImage
                    ? `${API_BASE_URL_UPLOADS}/${eventDetail?.artistImage}`
                    : undefined
                }
                style={styles.artistImage}
                defaultSource={require("../../../assets/placeholder.jpg")}
              />
              <View style={styles.nameInfoColumn}>
                <Text style={styles.artistName}>
                  {eventDetail?.artistName || "Artist Name Unavailable"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    console.log(
                      "Navigating to ArtistDetails for:",
                      eventDetail.artistName
                    );
                    navigation.navigate("ArtistDetails", {
                      artistName: eventDetail.artistName,
                      artistImage: eventDetail.artistImage,
                      artistDesc: eventDetail.artistDesc,
                      eventName: eventDetail.EventName,
                      eventDateTime: formatEventDateTime(
                        eventDetail.StartDate,
                        eventDetail.EndDate
                      ),
                      eventLocation: eventDetail.EventLocation,
                    });
                  }}
                >
                  <Text style={styles.viewArtistInfoText}>View artist info</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 
            NEW SECTION: Event Location & Date/Time 
            Moved here from the floating card
          */}
          <View style={styles.eventDetailsRowContainer}>
            {/* Location row */}
            <View style={styles.headerCardRow2}>
              <Ionicons
                name="location-outline"
                size={16}
                color="#666666"
                style={styles.headerCardIcon}
              />
              <Text style={styles.headerCardSubtitle}>
                {eventDetail?.EventLocation || "Location Unavailable"}
              </Text>
            </View>
            {/* Date/Time row */}
            <View style={styles.headerCardRow}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color="#666666"
                style={styles.headerCardIcon}
              />
              <Text style={styles.headerCardSubtitle}>
                {formatEventDateTime(
                  eventDetail?.StartDate,
                  eventDetail?.EndDate
                ) || "Date/Time not available"}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {readMore ? (
                eventDetail?.EventDescreption?.replace(/<[^>]+>/g, "") ||
                "No description available"
              ) : (
                <Text numberOfLines={2} ellipsizeMode="tail">
                  {eventDetail?.ShortDescreption ||
                    "No short description available"}
                </Text>
              )}
            </Text>
            <TouchableOpacity onPress={toggleReadMore}>
              <Text style={styles.readMoreText}>
                {readMore ? "Read Less" : "Read More"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Venue & Location */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Venue & Location</Text>
            <TouchableOpacity
              onPress={() => {
                console.log("Opening Maps for:", eventDetail?.googleMapLink);
                Linking.openURL(
                  eventDetail?.googleMapLink || "https://maps.google.com"
                );
              }}
              style={styles.locationLink}
            >
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
              onPress={() => {
                console.log("Switching to Event Catalogue tab");
                setSelectedTab("Event Catalogue");
              }}
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
              onPress={() => {
                console.log("Switching to Gallery tab");
                setSelectedTab("Gallery");
              }}
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
              {catalogueUrl ? (
                <View style={styles.pdfCard}>
                  <View style={styles.pdfHeader}>
                    <Ionicons
                      name="document-text-outline"
                      size={28}
                      color="#333"
                      style={styles.pdfIcon}
                    />
                    <View style={styles.pdfInfo}>
                      <Text style={styles.pdfTitle}>Event Catalogue</Text>
                      <Text style={styles.pdfSize}>{fileSize} MB</Text>
                    </View>
                  </View>
                  <View style={styles.pdfActions}>
                    <TouchableOpacity
                      style={styles.pdfActionButton}
                      onPress={() => {
                        console.log("Preview PDF button pressed");
                        previewPDF();
                      }}
                    >
                      <Ionicons name="eye-outline" size={18} color="#E3000F" />
                      <Text style={styles.pdfActionText}>Preview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pdfActionButton}
                      onPress={() => {
                        console.log("Download PDF button pressed");
                        downloadPDF();
                      }}
                      disabled={downloading}
                    >
                      <Ionicons name="download-outline" size={18} color="#E3000F" />
                      <Text style={styles.pdfActionText}>
                        {downloading
                          ? `${Math.round(downloadProgress * 100)}%`
                          : "Download"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.noCatalogueContainer}>
                  <Ionicons
                    name="document-text-outline"
                    size={40}
                    color="#CCC"
                  />
                  <Text style={styles.noCatalogueText}>
                    No Catalogue Available
                  </Text>
                </View>
              )}
            </View>
          )}

          {selectedTab === "Gallery" && (
            <View style={styles.galleryGrid}>
              {eventDetail?.GalleryImages &&
              eventDetail?.GalleryImages.length > 0 ? (
                eventDetail.GalleryImages.map((image, index) => (
                  <GalleryItem
                    key={index}
                    image={image}
                    shareGalleryImage={shareGalleryImage}
                  />
                ))
              ) : (
                <View style={styles.noImagesContainer}>
                  <Ionicons name="images-outline" size={40} color="#CCC" />
                  <Text style={styles.noImagesText}>No Images Available</Text>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Bottom Bar */}
        {eventDetail?.EventRegisterDetail?.length <
          eventDetail?.NoOfParticipants && (
          <View style={styles.bottomBar}>
            <Text
              style={[
                styles.priceText,
                eventDetail.hasExternalLink ? { opacity: 0 } : {},
              ]}
            >
              {eventDetail?.eventRates &&
              eventDetail.eventRates.length > 0 &&
              eventDetail.IsPaid
                ? `Start from ${
                    (eventDetail?.countryDetail &&
                      eventDetail.countryDetail[0]?.Currency) ||
                    "$"
                  } ${Math.max(
                    ...eventDetail.eventRates.map(
                      (rate) => rate.ratesForParticipant
                    )
                  )}`
                : "Free Event"}
            </Text>

            {eventDetail?.StartDate &&
              new Date(eventDetail.StartDate) > Date.now() && (
                <TouchableOpacity
                  style={styles.buyButton}
                  onPress={() => {
                    console.log("Buy Ticket button pressed");
                    handleBuyTicket();
                  }}
                >
                  <Text style={styles.buyButtonText}>Buy Ticket</Text>
                </TouchableOpacity>
              )}
          </View>
        )}
      </View>

      <LoginPromptModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onContinue={handleLoginContinue}
      />
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
    top: Platform.OS === "ios" ? 50 : 25,
    left: 16,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#FFF",
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareTopButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 25,
    right: 16,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#FFF",
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  topImage: {
    width: "100%",
    height: "100%",
  },
  headerCard: {
    position: "absolute",
    top: -35,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1111,
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
    marginTop: -65,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex:10,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 20,
  },
  ticketIndicatorContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  ticketIndicatorBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  ticketIndicatorText: {
    fontWeight: "bold",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  progressBarContainer2: {
    width: "90%",
    alignItems: "center",
  },
  progressBarBackground2: {
    width: "100%",
    height: 8,
    backgroundColor: "#ddd",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressBar2: {
    height: "100%",
    backgroundColor: "#f1a50f",
    borderRadius: 4,
  },
  progressBarLabel: {
    fontSize: 12,
    color: "#555",
    fontFamily: "Poppins-Medium",
  },
  artistInfoContainer: {
    marginBottom: 20,
  },
  artistNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  nameInfoColumn: {
    flexDirection: "column",
  },
  artistImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    resizeMode: "cover",
    marginRight: 12,
  },
  artistName: {
    fontSize: 16,
    fontFamily: "Poppins-Bold",
    color: "#000000",
    marginBottom: 4,
  },
  viewArtistInfoText: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#E3000F",
  },
  eventDetailsRowContainer: {
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins-Medium",
    color: "#000000",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: "Poppins-Regular",
    color: "#666666",
    lineHeight: 20,
    textAlign: "justify",
  },
  readMoreText: {
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#E3000F",
    marginTop: 4,
  },
  locationLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationLinkText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#E3000F",
    fontFamily: "Poppins-Medium",
    textDecorationLine: "underline",
  },
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
  catalogueContainer: {
    marginBottom: 20,
  },
  pdfCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: Platform.OS === "android" ? 0 : 6,
  },
  pdfHeader: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  pdfIcon: {
    marginRight: 16,
    color: "#333333",
  },
  pdfInfo: {
    flex: 1,
  },
  pdfTitle: {
    fontSize: 16,
    fontFamily: "Poppins-SemiBold",
    color: "#000000",
    marginBottom: 4,
  },
  pdfSize: {
    fontSize: 12,
    fontFamily: "Poppins-Regular",
    color: "#666666",
  },
  pdfActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  pdfActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3000F",
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 6,
    width: 130,
  },
  pdfActionText: {
    marginLeft: 6,
    fontSize: 12,
    fontFamily: "Poppins-Medium",
    color: "#E3000F",
  },
  noCatalogueContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
  },
  noCatalogueText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#999",
  },
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
  noImagesContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  noImagesText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: "Poppins-Medium",
    color: "#999",
  },
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
