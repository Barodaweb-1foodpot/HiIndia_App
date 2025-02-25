import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  Share,
  Animated,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import { fetchEvents, listActiveEvents } from "../api/event_api";
import { API_BASE_URL_UPLOADS } from "@env";
import moment from "moment";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

// Wrapper for blur effect (iOS uses BlurView; Android gets a fallback background)
const BlurWrapper = ({ style, children }) => {
  if (Platform.OS === "android") {
    return (
      <View style={[style, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
        {children}
      </View>
    );
  }
  return (
    <BlurView intensity={50} tint="dark" style={style}>
      {children}
    </BlurView>
  );
};

// Skeleton Loader Component for Images
const SkeletonLoader = ({ style }) => {
  const [animation] = useState(new Animated.Value(0));
  
  useEffect(() => {
    Animated.loop(
      Animated.timing(animation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      })
    ).start();
  }, []);
  
  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });
  
  return (
    <View style={[style, { backgroundColor: '#E0E0E0', overflow: 'hidden' }]}>
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>
    </View>
  );
};

// Component for handling event images with a skeleton loader until loaded
const EventImage = ({ uri, style }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <View style={style}>
      {!loaded && <SkeletonLoader style={StyleSheet.absoluteFill} />}
      <Image
        source={uri && !error ? { uri } : require("../../assets/placeholder.jpg")}
        style={[style, loaded ? {} : { opacity: 0 }]}
        resizeMode="cover"
        onLoadEnd={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
      />
    </View>
  );
};

export default function HomeScreen({ navigation }) {
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [events, setEvents] = useState([]);
  const [activeEvent, setActiveEvents] = useState([]);

  // Configure status bar when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setHidden(false);
      StatusBar.setBarStyle("light-content");
      return () => {};
    }, [])
  );

  // Fetch events and active events when search text changes
  useEffect(() => {
    fetchEvent();
    fetchActiveEvent();
  }, [searchText]);

  // Re-fetch events when the active tab changes
  useEffect(() => {
    setEvents([]);
    fetchEvent();
  }, [activeTab]);

  // Fetch events based on search text and active tab
  const fetchEvent = async () => {
    const res = await fetchEvents(searchText, "All", activeTab);
    console.log("Fetched events:", res);
    if (res && res.data && res.data.length > 0) {
      setEvents(res.data);
    } else {
      setEvents([]);
    }
  };

  // Fetch active events for the Event Hub section
  const fetchActiveEvent = async () => {
    const res = await listActiveEvents();
    if (res && res.data && res.data.length > 0) {
      setActiveEvents(res.data);
    }
  };

  // Share event details using the device's share functionality
  const shareEvent = async (event) => {
    try {
      const eventDate =
        event.StartDate && event.EndDate
          ? `${moment(event.StartDate).format("D/M/YY HH:mm")} to ${moment(
              event.EndDate
            ).format("D/M/YY HH:mm")}`
          : "Date not available";
      const eventImageUri = event.EventImage
        ? `${API_BASE_URL_UPLOADS}/${event.EventImage}`
        : null;
      const shareMessage =
        `🎶 *Check out this event!*\n\n` +
        `📌 *Event:* ${event.EventName}\n` +
        `📍 *Location:* ${event.EventLocation}\n` +
        `🗓️ *Date:* ${eventDate}\n` +
        (eventImageUri ? `🖼️ *Image:* ${eventImageUri}\n` : "");
      await Share.share({ message: shareMessage });
    } catch (error) {
      console.error("Error sharing event", error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
          />
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() =>
                navigation.navigate("App", { screen: "Notification" })
              }
            >
              <Ionicons name="notifications-outline" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => navigation.navigate("App", { screen: "Calender" })}
            >
              <Ionicons name="calendar-outline" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.whiteSection}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Header */}
          <View style={styles.eventsHeader}>
            <Text style={styles.eventsTitle}>All Events</Text>
            <TouchableOpacity
              onPress={() => {
                setSearchVisible((prev) => !prev);
                if (!searchVisible) setSearchText("");
              }}
            >
              <Ionicons name="search-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          {searchVisible && (
            <View style={styles.searchWrapper}>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search event..."
                  placeholderTextColor="#666"
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
            </View>
          )}

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "All" && styles.activeTab]}
              onPress={() => setActiveTab("All")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "All" && styles.activeTabText,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "Past" && styles.activeTab]}
              onPress={() => setActiveTab("Past")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "Past" && styles.activeTabText,
                ]}
              >
                Past
              </Text>
            </TouchableOpacity>
          </View>

          {/* Event Cards */}
          <View style={styles.section}>
            {events.map((event, index) => {
              const eventImageUri = event.EventImage
                ? `${API_BASE_URL_UPLOADS}/${event.EventImage}`
                : null;
              const eventDate =
                event.StartDate && event.EndDate
                  ? `${moment(event.StartDate).format(
                      "D/M/YY HH:mm"
                    )} to ${moment(event.EndDate).format("D/M/YY HH:mm")}`
                  : "Date not available";

              return (
                <View key={index} style={styles.eventCard}>
                  <EventImage uri={eventImageUri} style={styles.eventImage} />
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => shareEvent(event)}
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={20}
                      color="#000"
                    />
                  </TouchableOpacity>
                  <BlurWrapper style={styles.eventContent}>
                    <View style={styles.eventDetailsColumn}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {event.EventName}
                      </Text>
                      <View style={styles.dflex}>
                        <View style={styles.eventDetail}>
                          <Text
                            style={styles.eventDetailText}
                            numberOfLines={2}
                          >
                            <Ionicons
                              name="location-outline"
                              size={14}
                              color="#fff"
                            />{" "}
                            {event.EventLocation}
                          </Text>
                          <Text style={styles.eventDetailText}>
                            <Ionicons
                              name="calendar-outline"
                              size={14}
                              color="#fff"
                            />{" "}
                            {eventDate}
                          </Text>
                        </View>
                        <View style={styles.registerContainer}>
                          <TouchableOpacity
                            style={styles.registerButton}
                            onPress={() =>
                              navigation.navigate("App", {
                                screen: "EventsDetail",
                                params: { eventDetail: event },
                              })
                            }
                          >
                            <Text style={styles.registerText}>Register</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </BlurWrapper>
                </View>
              );
            })}
          </View>

          {/* Event Hub Section (visible only in "All" tab) */}
          {activeTab === "All" && (
            <View style={styles.hubSection}>
              <Text style={styles.sectionTitle}>The Event Hub</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.hubScrollView}
              >
                {activeEvent.map((item, index) => {
                  const eventImageUri =
                    item.EventImage &&
                    `${API_BASE_URL_UPLOADS}/${item.EventImage}`;
                  const eventDate =
                    item.StartDate && item.EndDate
                      ? `${moment(item.StartDate).format(
                          "D/M/YY HH:mm"
                        )} to ${moment(item.EndDate).format("D/M/YY HH:mm")}`
                      : "Date not available";
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        // Navigate to event details if found in the main events list
                        const selectedEvent = events.find(
                          (e) => e._id === item._id
                        );
                        if (selectedEvent) {
                          navigation.navigate("App", {
                            screen: "EventsDetail",
                            params: { eventDetail: selectedEvent },
                          });
                        }
                      }}
                    >
                      <View style={styles.hubCard}>
                        <EventImage
                          uri={eventImageUri}
                          style={styles.hubCardImage}
                        />
                        <View style={styles.hubCardContent}>
                          <Text style={styles.hubCardTitle} numberOfLines={1}>
                            {item.EventName}
                          </Text>
                          <Text style={styles.hubCardDate}>
                            <Ionicons
                              name="calendar-outline"
                              style={styles.iconCircle}
                            />{" "}
                            {eventDate}
                          </Text>
                          <View style={styles.hubLocationContainer}>
                            <Ionicons
                              name="location-outline"
                              size={12}
                              color="#666"
                            />
                            <Text
                              style={styles.hubLocationText}
                              numberOfLines={1}
                            >
                              {item.EventLocation}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    height: "15%",
    backgroundColor: "#000",
    paddingHorizontal: 16,
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: 160,
    height: 50,
    resizeMode: "contain",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  whiteSection: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  scrollContainer: {
    paddingBottom: 120,
  },
  eventsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  eventsTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 10,
  },
  searchWrapper: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 46,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    marginLeft: 8,
  },
  /* Tabs */
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 16,
  },
  tab: {
    paddingBottom: 8,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "rgba(0, 0, 0, 1)",
  },
  tabText: {
    fontSize: 16,
    color: "#6B7280",
  },
  activeTabText: {
    color: "rgba(0, 0, 0, 1)",
    fontWeight: "600",
  },

  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  eventCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#fff",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    height: 250,
  },
  eventImage: {
    width: "100%",
    height: "100%",
  },
  shareButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  eventContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 20,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 6,
    overflow: "hidden",
    flexDirection: "row",
  },
  eventDetailsColumn: {},
  dflex: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  dflex2: {
    gap: 10,
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  eventDetail: {
    width: "60%",
    marginBottom: 4,
  },
  eventDetailText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 12,
  },
  registerContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 8,
    width: "40%",
    flex: 1,
    alignSelf: "flex-end",
  },
  registerButton: {
    backgroundColor: "#E3000F",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  registerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  viewMoreContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    marginBottom: 16,
  },
  viewMoreButton: {
    borderWidth: 1,
    borderColor: "#000",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  viewMoreButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewMoreText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
  },
  hubSection: {
    marginTop: 0,
  },
  hubScrollView: {
    marginTop: 16,
  },
  hubCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginRight: 16,
    width: 340,
    minHeight: 100,
    maxHeight: 120,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    overflow: "hidden",
    alignItems: "center",
  },
  hubCardImage: {
    width: 100,
    height: "100%",
  },
  hubCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  hubCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  hubCardDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  hubLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  hubLocationText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  categoryPill: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#666",
  },
});