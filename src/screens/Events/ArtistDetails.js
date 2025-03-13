import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
  Platform,
  Share,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { API_BASE_URL_UPLOADS } from "@env";
import { Ionicons } from "@expo/vector-icons";
import { SharedElement } from "react-navigation-shared-element";
import SkeletonLoader from "../../components/SkeletonLoader";
import BlurWrapper from "../../components/BlurWrapper";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = Platform.OS === "ios" ? 110 : 100; 
const ArtistDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    artistName,
    artistImage,
    artistDesc,
    eventName,
    eventDateTime,
    eventLocation,
  } = route.params;

  // State for loading and animations
  const [isLoading, setIsLoading] = useState(true);
  const [scrollY] = useState(new Animated.Value(0));
  const [isFavorite, setIsFavorite] = useState(false);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Header animation based on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100, 200],
    outputRange: [0, 0.7, 1], // Fade in as you scroll
    extrapolate: "clamp",
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 150, 200],
    outputRange: [0, 0.5, 1],
    extrapolate: "clamp",
  });

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

  // const toggleFavorite = () => {
  //   setIsFavorite(!isFavorite);
  // };

  // Animation values for content
  const opacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.9],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
        animated
      />

      {/* Fixed Header with Blur - Now fades in on scroll */}
      <Animated.View 
        style={[
          styles.headerContainer, 
          { opacity: headerOpacity }
        ]}
      >
        <BlurWrapper style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Animated.Text 
            style={[styles.headerTitle, { opacity: headerTitleOpacity }]}
            numberOfLines={1}
          >
            {artistName || "Artist Profile"}
          </Animated.Text>
          
          <View style={styles.headerActions}>
            {/* <TouchableOpacity 
              style={styles.headerButton} 
              onPress={toggleFavorite}
            >
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={24} 
                color={isFavorite ? "#FF4D6D" : "#FFFFFF"} 
              />
            </TouchableOpacity> */}
            
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={handleShare}
            >
              <Ionicons name="share-social-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </BlurWrapper>
      </Animated.View>

      {/* Floating back button for when header is transparent */}
      <Animated.View 
        style={[
          styles.floatingBackButton, 
          { opacity: scrollY.interpolate({
            inputRange: [0, 100],
            outputRange: [1, 0],
            extrapolate: "clamp",
          })}
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Scroll Content */}
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Add padding to the top to account for the status bar */}
        <View style={{ height: Platform.OS === "ios" ? 10 : 0 }} />

        {/* Profile Area with Cover Image and Profile Photo */}
        <View style={styles.coverContainer}>
          {isLoading ? (
            <SkeletonLoader style={styles.coverImage} />
          ) : (
            <View style={styles.coverImageContainer}>
              <Image
                source={require("../../../assets/gradient.jpg")}
                style={styles.coverImage}
                blurRadius={3}
              />
              <BlurWrapper style={styles.coverOverlay} />
            </View>
          )}
          
          <View style={styles.profileContainer}>
            {isLoading ? (
              <SkeletonLoader style={styles.artistImagePlaceholder} />
            ) : (
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
            )}
            
            {isLoading ? (
              <View style={{ alignItems: "center" }}>
                <SkeletonLoader style={styles.namePlaceholder} />
              </View>
            ) : (
              <View style={styles.artistInfo}>
                <SharedElement id={`artist.${artistName}.name`}>
                  <Text style={styles.artistName}>
                    {artistName || "Artist Name Unavailable"}
                  </Text>
                </SharedElement>
              </View>
            )}
          </View>
        </View>

        {/* Content Sections */}
        <Animated.View style={[styles.contentContainer, { opacity }]}>
          {/* About Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>About</Text>
            </View>
            
            {isLoading ? (
              <View>
                <SkeletonLoader style={styles.descPlaceholder} />
                <SkeletonLoader style={styles.descPlaceholder} />
                <SkeletonLoader style={[styles.descPlaceholder, { width: '70%' }]} />
              </View>
            ) : (
              <Text style={styles.artistDesc}>
                {artistDesc || "No artist description available."}
              </Text>
            )}
          </View>
          
          {/* Upcoming Events Section */}
          {eventName && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Upcoming Event</Text>
              </View>
              
              {isLoading ? (
                <View>
                  <SkeletonLoader style={styles.eventPlaceholder} />
                  <SkeletonLoader style={[styles.eventPlaceholder, { width: '80%' }]} />
                </View>
              ) : (
                <View style={styles.eventCard}>
                  <Text style={styles.eventName}>{eventName}</Text>
                  
                  {eventDateTime && (
                    <View style={styles.eventDetail}>
                      <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                      <Text style={styles.eventDetailText}>{eventDateTime}</Text>
                    </View>
                  )}
                  
                  {eventLocation && (
                    <View style={styles.eventDetail}>
                      <Ionicons name="location-outline" size={18} color="#6B7280" />
                      <Text style={styles.eventDetailText}>{eventLocation}</Text>
                    </View>
                  )}
                  
                  <TouchableOpacity style={styles.eventButton}>
                    <Text style={styles.eventButtonText}>Get Tickets</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </Animated.View>

        {/* Extra space at bottom for better scrolling */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>
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
    height: HEADER_HEIGHT,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 45,
    paddingBottom: 12,
    height: "100%",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    flex: 1,
    marginHorizontal: 10,
  },
  headerButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 4,
  },
  headerActions: {
    flexDirection: "row",
  },
  floatingBackButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 45,
    left: 16,
    zIndex: 9,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  coverContainer: {
    height: 320, // Increased height to accommodate profile pic and name
    marginTop: Platform.OS === "ios" ? -10 : 0,
  },
  coverImageContainer: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  profileContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    paddingHorizontal: 20,
    paddingTop: 40, // Added padding to push down profile content
  },
  artistImagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 16,
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
  artistInfo: {
    alignItems: "center",
  },
  namePlaceholder: {
    width: 200,
    height: 28,
    borderRadius: 8,
    marginBottom: 12,
  },
  artistName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  contentContainer: {
    paddingTop: 20,
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
  },
  descPlaceholder: {
    height: 16,
    width: "100%",
    marginBottom: 8,
    borderRadius: 4,
  },
  artistDesc: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4B5563",
  },
  eventPlaceholder: {
    height: 22,
    width: "100%",
    marginBottom: 12,
    borderRadius: 4,
  },
  eventCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  eventName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  eventDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  eventDetailText: {
    fontSize: 15,
    color: "#6B7280",
    marginLeft: 8,
  },
  eventButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  eventButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  bottomSpacing: {
    height: 40,
  },
});