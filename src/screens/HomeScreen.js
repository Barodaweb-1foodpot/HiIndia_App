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
  ActivityIndicator,
  Linking,
  RefreshControl,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";

import {
  fetchEvents,
  listActiveEvents,
  getEventCategoriesByPartner,
  getCitiesByEventPartner,
} from "../api/event_api";

import { API_BASE_URL_UPLOADS } from "@env";
import { formatEventDateTime } from "../helper/helper_Function";
import { CheckAccessToken } from "../api/token_api";

// Custom components
import Header from "../components/Header";
import SkeletonLoader from "../components/SkeletonLoader";
import BlurWrapper from "../components/BlurWrapper";
import FilterPanel from "../components/FilterPanel";

import Checkbox from "expo-checkbox";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const EventImage = ({ uri, style }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <View style={style}>
      {!loaded && <SkeletonLoader style={StyleSheet.absoluteFill} />}
      <Image
        source={
          uri && !error ? { uri } : require("../../assets/placeholder.jpg")
        }
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

  // Cities filter (single-select)
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("All");

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
    loadCities();
  }, []);

  // Re-fetch events whenever filters/tabs/search changes
  useEffect(() => {
    fetchEvent();
  }, [activeTab, searchText, priceFilter, selectedCategoryIds, selectedCity]);

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

  const loadCities = async () => {
    try {
      const res = await getCitiesByEventPartner();
      if (res?.cities) {
        // Prepend "All" as the default option
        setCities(["All", ...res.cities]);
      }
    } catch (err) {
      console.error("Error loading cities:", err);
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

      // If user selected a city other than "All", override search text with that city
      const finalQuery = selectedCity !== "All" ? selectedCity : searchText;

      // Now call fetchEvents with finalQuery instead of cityFilter
      const data = await fetchEvents(
        finalQuery,
        catFilter,
        filterDate,
        priceFilter
      );

      if (Array.isArray(data) && data.length > 0 && data[0].data) {
        // Sort each group's events by StartDate
        const sortedGroups = data[0].data.map((group) => {
          // Clone group.data before sorting to avoid mutating original array
          const sortedEvents = [...group.data].sort(
            (a, b) => new Date(a.StartDate) - new Date(b.StartDate)
          );
          return { ...group, data: sortedEvents };
        });

        // (Optional) Sort the entire array of groups by earliest event date
        sortedGroups.sort((a, b) => {
          const earliestA = a.data[0]
            ? new Date(a.data[0].StartDate).getTime()
            : Infinity;
          const earliestB = b.data[0]
            ? new Date(b.data[0].StartDate).getTime()
            : Infinity;
          return earliestA - earliestB;
        });

        setEvents(sortedGroups);
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
    setSelectedCity("All");
  };

  const handleBookNow = async (event) => {
    if (event.hasExternalLink && event.externalLink) {
      Linking.openURL(event.externalLink);
      return;
    }
    
    const isAuthenticated = await CheckAccessToken();
    if (!isAuthenticated) {
      // Redirect to Login if not authenticated
      navigation.navigate("Auth", { screen: "Login" });
      return;
    }
    
    // If authenticated, proceed to buy ticket flow
    navigation.navigate("App", {
      screen: "BuyTicket",
      params: { eventDetail: event },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
        animated
      />

      {/* Header Section using custom Header component */}
      <Header
        onNotificationPress={() =>
          navigation.navigate("App", { screen: "Notification" })
        }
        onCalendarPress={() =>
          navigation.navigate("App", { screen: "Calender" })
        }
      />

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
                {searchText !== "" && (
                  <TouchableOpacity onPress={() => setSearchText("")}>
                    <Ionicons name="close-circle" size={24} color="#000" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Filter Panel */}
          {showFilterPanel && (
            <FilterPanel
              categories={categories}
              selectedCategoryIds={selectedCategoryIds}
              toggleCategory={toggleCategory}
              cities={cities}
              selectedCity={selectedCity}
              setSelectedCity={setSelectedCity}
              priceFilter={priceFilter}
              handleSelectPrice={handleSelectPrice}
              handleClearFilter={handleClearFilter}
              toggleFilterPanel={toggleFilterPanel}
            />
          )}

          {/* Tabs: Upcoming / Past */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "Upcoming" && styles.activeTab]}
              onPress={() => setActiveTab("Upcoming")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "Upcoming" && styles.activeTabText,
                ]}
              >
                Upcoming
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
        </View>

        {/* Main Content with Refresh Control */}
        <ScrollView
          contentContainerStyle={styles.mainContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Show center loader only if loading and not refreshing */}
          {loading && !refreshing ? (
            <ActivityIndicator
              size="large"
              color="#000"
              style={styles.loader}
            />
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
                  {group.artistName || "Events"}
                </Text>

                {/* Map the events in group.data */}
                {group.data.map((event, index) => {
                  const eventImageUri = event.EventImage
                    ? `${API_BASE_URL_UPLOADS}/${event.EventImage}`
                    : null;
                  const eventDate = formatEventDateTime(
                    event.StartDate,
                    event.EndDate
                  );

                  return (
                    <View key={index} style={styles.eventCard}>
                      {!event.IsPaid &&
                      !event.hasExternalLink &&
                      event.externalLink !== "" ? (
                        <View style={[styles.badge, styles.freeBadge]}>
                          <Text style={styles.badgeText}>Free</Text>
                        </View>
                      ) : (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>Paid</Text>
                        </View>
                      )}

                      {/* Event image */}
                      <EventImage
                        uri={eventImageUri}
                        style={styles.eventImage}
                      />

                      {/* Top-right icons (info + share) */}
                      <View style={styles.topRightIcons}>
                        <TouchableOpacity
                          style={styles.infoButton}
                          onPress={() => navigateToDetails(event)}
                        >
                          <Ionicons
                            name="information-circle-outline"
                            size={20}
                            color="#000"
                          />
                        </TouchableOpacity>
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
                      </View>

                      {/* Event content overlay (title, location, date, Book Now) */}
                      <BlurWrapper style={styles.eventContent}>
                        <View style={styles.eventDetailsColumn}>
                          <Text style={styles.eventTitle} numberOfLines={1}>
                            {event.EventName}
                          </Text>
                          <View style={styles.eventDetail}>
                            <Ionicons
                              name="calendar-outline"
                              size={14}
                              color="#fff"
                            />
                            <Text style={styles.eventDetailText}>
                              {eventDate}
                            </Text>
                          </View>
                          <View style={styles.eventDetail}>
                            <Ionicons
                              name="location-outline"
                              size={14}
                              color="#fff"
                            />
                            <Text
                              style={styles.eventDetailText}
                              numberOfLines={2}
                            >
                              {event.EventLocation}
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
    zIndex: 10,
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
  filterPanelWrapper: {
    maxHeight: SCREEN_HEIGHT * 0.6,
    marginBottom: 16,
  },
  filterPanel: {
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterPanelContent: {
    padding: 20,
  },
  filterPanelTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    color: "#000",
  },
  filterHeading: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 16,
    color: "#000",
  },
  filterPriceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
    marginBottom: 12,
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E3000F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioFill: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E3000F",
  },
  radioLabel: {
    fontSize: 16,
    color: "#000",
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  checkboxOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 2,
  },
  checkboxWrapper: {
    marginRight: 10,
  },
  checkbox: {
    width: 15,
    height: 15,
    borderRadius: 14,
    borderColor: "#E3000F",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#000",
  },
  citiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  filterActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: "#E3000F",
    fontWeight: "500",
  },
  doneButton: {
    backgroundColor: "#E3000F",
    borderRadius: 8,
  },
  doneButtonText: {
    fontSize: 16,
    color: "#fff",
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
  artistName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
    marginLeft: 4,
  },
  eventCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#fff",
    elevation: Platform.OS === "android" ? 2 : 0,
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
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 20,
  },
  registerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
