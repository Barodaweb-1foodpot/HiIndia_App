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
  ActivityIndicator,
  Linking,
  RefreshControl,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import Checkbox from "expo-checkbox";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";

import {
  fetchEvents,
  listActiveEvents,
  getEventCategoriesByPartner,
} from "../api/event_api";

import { API_BASE_URL_UPLOADS } from "@env";
import { formatEventDateTime } from "../helper/helper_Function";

// Reusable Blur wrapper for iOS vs Android
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

/**
 * SkeletonLoader - a shimmering placeholder while an image is loading
 */
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
  }, [animation]);

  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View style={[style, { backgroundColor: "#E0E0E0", overflow: "hidden" }]}>
      <Animated.View
        style={{
          width: "100%",
          height: "100%",
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0)",
            "rgba(255, 255, 255, 0.5)",
            "rgba(255, 255, 255, 0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: "100%", height: "100%" }}
        />
      </Animated.View>
    </View>
  );
};

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
  // Search & Filter States
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Price filter radio: "All", "Paid", or "Free"
  const [priceFilter, setPriceFilter] = useState("All");

  // Category filter (multi-select)
  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  // Tab states: "Upcoming" or "Past"
  const [activeTab, setActiveTab] = useState("Upcoming");

  // Grouped events (by artist)
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // For pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setHidden(false);
      StatusBar.setBarStyle("light-content");
      return () => {};
    }, [])
  );

  useEffect(() => {
    fetchActiveEvent();
    loadCategories();
  }, []);

  useEffect(() => {
    fetchEvent();
  }, [activeTab, searchText, priceFilter, selectedCategoryIds]);

  const loadCategories = async () => {
    try {
      const res = await getEventCategoriesByPartner();
      if (res?.data?.data) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const fetchActiveEvent = async () => {
    try {
      await listActiveEvents();
      // No direct usage here, but you can expand if needed
    } catch (error) {
      console.error("Error fetching active events:", error);
    }
  };

  const fetchEvent = async () => {
    try {
      setLoading(true);

      const catFilter = selectedCategoryIds.length
        ? selectedCategoryIds
        : "All";
      const filterDate = activeTab;

      // Expecting grouped data like:
      // [ { count, data: [ { artistName, data: [event objects] }, ... ], status: 200 } ]
      const data = await fetchEvents(searchText, catFilter, filterDate, priceFilter);

      if (Array.isArray(data) && data.length > 0 && data[0].data) {
        setEvents(data[0].data);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh function for main content
  const onRefresh = async () => {
    setRefreshing(true);
    // Re-fetch without showing center loader
    await fetchEvent();
    setRefreshing(false);
  };

  const navigateToDetails = (event) => {
    navigation.navigate("App", {
      screen: "EventsDetail",
      params: { eventDetail: event },
    });
  };

  const shareEvent = async (event) => {
    try {
      const eventDate = formatEventDateTime(event.StartDate, event.EndDate);
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
      console.error("Error sharing event:", error);
    }
  };

  const toggleFilterPanel = () => {
    setShowFilterPanel(!showFilterPanel);
  };

  const handleSelectPrice = (value) => {
    setPriceFilter(value);
  };

  const toggleCategory = (catId) => {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(catId)) {
        return prev.filter((id) => id !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  const handleClearFilter = () => {
    setPriceFilter("All");
    setSelectedCategoryIds([]);
  };

  const handleBookNow = (event) => {
    if (event.hasExternalLink && event.externalLink) {
      Linking.openURL(event.externalLink);
    } else {
      navigation.navigate("App", {
        screen: "BuyTicket",
        params: { eventDetail: event },
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent animated />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} />
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => navigation.navigate("App", { screen: "Notification" })}
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

      {/* White Section */}
      <View style={styles.whiteSection}>
        {/* Sticky Header (Title, Search, Filter & Tabs) */}
        <View style={styles.stickyContainer}>
          <View style={styles.eventsHeader}>
            <Text style={styles.eventsTitle}>All Events</Text>
            <View style={{ flexDirection: "row" }}>
              {/* Toggle search bar */}
              <TouchableOpacity
                onPress={() => {
                  setSearchVisible((prev) => !prev);
                  if (!searchVisible) setSearchText("");
                }}
                style={{ marginRight: 16 }}
              >
                <Ionicons name="search-outline" size={24} color="#000" />
              </TouchableOpacity>
              {/* Toggle filter panel */}
              <TouchableOpacity onPress={toggleFilterPanel}>
                <Ionicons name="options-outline" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

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

          {/* Filter Panel */}
          {showFilterPanel && (
            <View style={styles.filterPanel}>
              <Text style={styles.filterPanelTitle}>Filter Events</Text>

              {/* Price Filter (radio) */}
              <Text style={styles.filterHeading}>Price</Text>
              <View style={styles.filterPriceRow}>
                <TouchableOpacity
                  style={styles.filterPriceItem}
                  onPress={() => handleSelectPrice("Paid")}
                >
                  <View style={styles.radioOuter}>
                    {priceFilter === "Paid" && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.filterPriceLabel}>Paid</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterPriceItem}
                  onPress={() => handleSelectPrice("Free")}
                >
                  <View style={styles.radioOuter}>
                    {priceFilter === "Free" && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.filterPriceLabel}>Free</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterPriceItem}
                  onPress={() => handleSelectPrice("All")}
                >
                  <View style={styles.radioOuter}>
                    {priceFilter === "All" && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.filterPriceLabel}>All</Text>
                </TouchableOpacity>
              </View>

              {/* Category Filter (multi-select) */}
              <Text style={[styles.filterHeading, { marginTop: 12 }]}>Categories</Text>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  style={styles.categoryRow}
                  onPress={() => toggleCategory(cat._id)}
                >
                  <Checkbox
                    value={selectedCategoryIds.includes(cat._id)}
                    onValueChange={() => toggleCategory(cat._id)}
                    style={styles.checkbox}
                  />
                  <Text style={styles.categoryLabel}>{cat.name}</Text>
                </TouchableOpacity>
              ))}

              {/* Filter Actions */}
              <View style={styles.filterActions}>
                <TouchableOpacity onPress={handleClearFilter}>
                  <Text style={styles.filterClearText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleFilterPanel}>
                  <Text style={styles.filterDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Tabs: Upcoming / Past */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "Upcoming" && styles.activeTab]}
              onPress={() => setActiveTab("Upcoming")}
            >
              <Text style={[styles.tabText, activeTab === "Upcoming" && styles.activeTabText]}>
                Upcoming
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "Past" && styles.activeTab]}
              onPress={() => setActiveTab("Past")}
            >
              <Text style={[styles.tabText, activeTab === "Past" && styles.activeTabText]}>
                Past
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content with Refresh Control */}
        <ScrollView
          contentContainerStyle={styles.mainContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Show center loader only if loading and not refreshing */}
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#000" style={styles.loader} />
          ) : events.length === 0 ? (
            <Text style={styles.noEventsText}>
              {activeTab === "Past" ? "No past events" : "No events found"}
            </Text>
          ) : (
            // Map each "artist group"
            events.map((group, groupIndex) => (
              <View key={groupIndex} style={{ marginBottom: 24 }}>
                {/* Artist Name */}
                <Text style={styles.artistName}>
                  {group.artistName || "Unknown Artist"}
                </Text>

                {/* Map the events in group.data */}
                {group.data.map((event, index) => {
                  const eventImageUri = event.EventImage
                    ? `${API_BASE_URL_UPLOADS}/${event.EventImage}`
                    : null;
                  const eventDate = formatEventDateTime(event.StartDate, event.EndDate);

                  return (
                    <View key={index} style={styles.eventCard}>
                      {/* Badge: Paid or Free */}
                      {event.IsPaid ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>Paid</Text>
                        </View>
                      ) : (
                        <View style={[styles.badge, styles.freeBadge]}>
                          <Text style={styles.badgeText}>Free</Text>
                        </View>
                      )}

                      {/* Event image */}
                      <EventImage uri={eventImageUri} style={styles.eventImage} />

                      {/* Top-right icons (info + share) */}
                      <View style={styles.topRightIcons}>
                        <TouchableOpacity
                          style={styles.infoButton}
                          onPress={() => navigateToDetails(event)}
                        >
                          <Ionicons name="information-circle-outline" size={20} color="#000" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.shareButton}
                          onPress={() => shareEvent(event)}
                        >
                          <Ionicons name="share-social-outline" size={20} color="#000" />
                        </TouchableOpacity>
                      </View>

                      {/* Event content overlay (title, location, date, Book Now) */}
                      <BlurWrapper style={styles.eventContent}>
                        <View style={styles.eventDetailsColumn}>
                          <Text style={styles.eventTitle} numberOfLines={1}>
                            {event.EventName}
                          </Text>
                          <View style={styles.eventDetail}>
                            <Ionicons name="location-outline" size={14} color="#fff" />
                            <Text style={styles.eventDetailText} numberOfLines={2}>
                              {event.EventLocation}
                            </Text>
                          </View>
                          <View style={styles.eventDetail}>
                            <Ionicons name="calendar-outline" size={14} color="#fff" />
                            <Text style={styles.eventDetailText}>
                              {eventDate}
                            </Text>
                          </View>
                        </View>

                        {/* Book Now button */}
                        <View style={styles.registerContainer}>
                          <TouchableOpacity
                            style={styles.registerButton}
                            onPress={() => handleBookNow(event)}
                          >
                            <Text style={styles.registerText}>Book Now</Text>
                          </TouchableOpacity>
                        </View>
                      </BlurWrapper>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

// ------------------- STYLES -------------------
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  whiteSection: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  stickyContainer: {
    backgroundColor: "#fff",
  },
  mainContent: {
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
  filterPanel: {
    backgroundColor: "#f8f8f8",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  filterPanelTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  filterHeading: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  filterPriceRow: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
  },
  filterPriceItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E3000F",
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E3000F",
  },
  filterPriceLabel: {
    fontSize: 14,
    color: "#000",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginLeft: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    color: "#000",
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  filterClearText: {
    fontSize: 14,
    color: "red",
  },
  filterDoneText: {
    fontSize: 14,
    color: "#E3000F",
    fontWeight: "600",
  },
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
    borderBottomColor: "#000",
  },
  tabText: {
    fontSize: 16,
    color: "#6B7280",
  },
  activeTabText: {
    color: "#000",
    fontWeight: "600",
  },
  loader: {
    marginTop: 30,
    alignSelf: "center",
  },
  noEventsText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  // Artist grouping
  artistName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
    marginLeft: 4,
  },
  // Event card
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
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#E3000F",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  freeBadge: {
    backgroundColor: "#28a745",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  eventImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  topRightIcons: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    zIndex: 2,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginRight: 4,
  },
  shareButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
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
  eventDetailsColumn: {
    flex: 1,
    justifyContent: "center",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  eventDetail: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  registerButton: {
    backgroundColor: "#E3000F",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  registerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
