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
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import {
  fetchEvents,
  getEventCategoriesByPartner,
  SaveEvent,
} from "../api/event_api";
import { API_BASE_URL, API_BASE_URL_UPLOADS } from "@env";
import { formatDateRange } from "../helper/helper_Function";

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

export default function EventsScreen({ navigation }) {
  const [searchVisible, setSearchVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All events");
  const [likedEvents, setLikedEvents] = useState({});
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState([]);
  const [events, setEvents] = useState([]);
  const [perPage, setPerPage] = useState(2);
  const [catId, setCatId] = useState("");
  const [firstTime, setFirstTime] = useState(true);
  const [pageNo, setPageNo] = useState(0);
  const [activeEvent, setActiveEvents] = useState([]);
  const [count, setCount] = useState(0);
  const [allEvent, setAllEvent] = useState([]);

  useEffect(() => {
    fetchCategory();
  }, []);
  useEffect(() => {
    fetchEvent();
  }, [searchText, perPage, pageNo, selectedCategory]);

  // useEffect(()=>{
  //   SaveUserEvent()
  // },[likedEvents])

  const fetchEvent = async () => {
    const res = await fetchEvents(
      pageNo,
      perPage,
      searchText,
      (categoryFilter = catId)
    );
    console.log("kkkkkkkkkkk", res);
    if (res.data.length > 0) {
      setCount(res.count);
      if (firstTime) setAllEvent(res.data);
      setEvents(res.data);
      setFirstTime(false);
    } else {
      setCount(0);
      setEvents([]);
    }
  };

  const fetchCategory = async () => {
    const res = await getEventCategoriesByPartner();
    console.log(res.data);
    if (res.data.data?.length > 0) {
      setCategory(res.data.data);
    }
  };

  // const SaveUserEvent = async () => {
  //   const res = await SaveEvent({savedEvent:likedEvents});
  //   console.log("kkkkkkkkkkk", res);
  //   if (res.data.length > 0) {
  //     setCount(res.count)
  //     if(firstTime) setAllEvent(res.data)
  //     setEvents(res.data);
  //     setFirstTime(false)
  //   }
  //   else {
  //     setCount(0)
  //     setEvents([])
  //   }
  // };

  const toggleLike = (id) => {
    setLikedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
          />
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconCircle}>
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

      <View style={styles.whiteSection}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.eventsHeader}>
            <Text style={styles.eventsTitle}>Events</Text>
            <TouchableOpacity
              onPress={() => {
                setSearchVisible((prev) => !prev);
                if (!searchVisible) setSearchText("");
              }}
            >
              <Ionicons name="search-outline" size={24} color="#000" />
            </TouchableOpacity>
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

          <View style={styles.dropdownWrapper}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setDropdownOpen(!dropdownOpen)}
            >
              <Text style={styles.dropdownButtonText}>{selectedCategory}</Text>
              <Ionicons name="chevron-down-outline" size={20} color="#000" />
            </TouchableOpacity>
            {dropdownOpen && (
              <View style={styles.dropdownList}>
                {category?.map((cat, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCatId(cat._id);
                      setSelectedCategory(cat.name);
                      setDropdownOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setCatId("All");
                    setSelectedCategory("All");
                    setDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>All</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.tabsContainer}>
            <View style={styles.tabsWrapper}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "All" && styles.activeTab,
                ]}
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
                style={[
                  styles.tabButton,
                  activeTab === "Saved" && styles.activeTab,
                ]}
                onPress={() => setActiveTab("Saved")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "Saved" && styles.activeTabText,
                  ]}
                >
                  Saved
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {events.length > 0 && (
            <>
              {events.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  onPress={() =>
                    navigation.navigate("App", {
                      screen: "EventsDetail",
                      params: { eventDetail: item },
                    })
                  }
                >
                  <View style={styles.categoryCard}>
                    <Image
                      source={{
                        uri: item.EventImage
                          ? `${API_BASE_URL_UPLOADS}/${item.EventImage}`
                          : require("../../assets/placeholder.jpg"),
                      }}
                      style={styles.categoryCardImage}
                    />
                    <View style={styles.categoryCardContent}>
                      <Text style={styles.categoryCardTitle} numberOfLines={1}>
                        {item.EventName}
                      </Text>
                      <Text style={styles.categoryCardDate}>
                        {formatDateRange(item.StartDate, item.EndDate)}
                      </Text>
                      <View style={styles.categoryLocationContainer}>
                        <Ionicons
                          name="location-outline"
                          size={12}
                          color="#666"
                        />
                        <Text
                          style={styles.categoryLocationText}
                          numberOfLines={2}
                        >
                          {item.EventLocation}
                        </Text>
                      </View>
                      <View style={styles.dflex2}>
                        {console.log(item.EventCategoryDetail.length)}
                        {item.EventCategoryDetail?.map((data, index2) => (
                          <View style={styles.categoryPill} key={index2}>
                            <Text style={styles.categoryText}>
                              {data.category}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {count > perPage && (
                <View style={styles.viewMoreContainer}>
                  <TouchableOpacity
                    style={styles.viewMoreButton}
                    onPress={() => {
                      setPerPage(perPage + 5);
                      console.log(perPage + 5);
                    }}
                  >
                    <View style={styles.viewMoreButtonContent}>
                      <Text style={styles.viewMoreText}>View More</Text>
                      <Ionicons name="chevron-forward" size={16} color="#000" />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {allEvent.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Other events</Text>
              {allEvent.map((item) => (
                <View key={item._id} style={styles.eventCard}>
                  <Image
                    source={{
                      uri: item.EventImage
                        ? `${API_BASE_URL_UPLOADS}/${item.EventImage}`
                        : require("../../assets/placeholder.jpg"),
                    }}
                    style={styles.eventImage}
                  />
                  <TouchableOpacity
                    style={styles.heartButtonEvent}
                    onPress={() => toggleLike(item._id)}
                  >
                    <Ionicons
                      name={likedEvents[item._id] ? "heart" : "heart-outline"}
                      size={20}
                      color={likedEvents[item._id] ? "#E3000F" : "#000"}
                    />
                  </TouchableOpacity>
                  <BlurWrapper style={styles.eventContent}>
                    <View style={styles.eventDetailsColumn}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {item.EventName}
                      </Text>
                      <View style={styles.eventDetail}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color="#fff"
                        />
                        <Text style={styles.eventDetailText} numberOfLines={2}>
                          {item.EventLocation}
                        </Text>
                      </View>
                      <View style={styles.eventDetail}>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color="#fff"
                        />
                        <Text style={styles.eventDetailText}>
                          {formatDateRange(item.StartDate, item.EndDate)}
                        </Text>
                      </View>
                    </View>
                    {activeTab === "All" && (
                      <View style={styles.registerContainer}>
                        <TouchableOpacity
                          style={styles.registerButton}
                          onPress={() =>
                            navigation.navigate("App", {
                              screen: "EventsDetail",
                              params: { eventDetail: item },
                            })
                          }
                        >
                          <Text style={styles.registerText}>Register</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </BlurWrapper>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dflex2: {
    gap: 10,
    display: "flex",
    flexDirection: "row", // Aligns items in a row
    alignItems: "center", // Ensures vertical alignment
    width: "100%", // Ensures it takes full width
  },
  container: { flex: 1, backgroundColor: "#000" },
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
  logo: { width: 160, height: 50, resizeMode: "contain" },
  headerIcons: { flexDirection: "row", gap: 12 },
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
  scrollContainer: { paddingBottom: 120 },
  eventsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  eventsTitle: { fontSize: 24, fontWeight: "700", color: "#000" },
  searchWrapper: { marginBottom: 16 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 46,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#000" },
  dropdownWrapper: { marginBottom: 16 },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownButtonText: { fontSize: 14, color: "#000" },
  dropdownList: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: "#fff",
  },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 10 },
  dropdownItemText: { fontSize: 14, color: "#000" },
  tabsContainer: { marginBottom: 16 },
  tabsWrapper: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tabButton: { paddingHorizontal: 16, paddingBottom: 12 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: "#E3000F" },
  tabText: { fontSize: 14, color: "#666" },
  activeTabText: { fontSize: 14, fontWeight: "600", color: "#E3000F" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
    marginTop: 16,
  },
  categoryCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    overflow: "hidden",
    width: "100%",
  },
  categoryCardImage: {
    width: 120,
    height: "100%",
    maxHeight: 140,
    minHeight: 140,
    resizeMode: "cover",
  },
  categoryCardContent: { flex: 1, padding: 12, justifyContent: "center" },
  categoryCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  categoryCardDate: { fontSize: 12, color: "#666", marginBottom: 4 },
  categoryLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryLocationText: { fontSize: 12, color: "#666", marginLeft: 4 },
  categoryPill: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  categoryText: { fontSize: 10, fontWeight: "500", color: "#666" },
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
  viewMoreButtonContent: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewMoreText: { fontSize: 14, color: "#000", fontWeight: "600" },
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
    height: 200,
  },
  eventImage: { width: "100%", height: "100%", resizeMode: "cover" },
  heartButtonEvent: {
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
  eventDetailsColumn: { flex: 1, justifyContent: "center" },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  eventDetail: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  eventDetailText: { color: "#fff", marginLeft: 6, fontSize: 12 },
  registerContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 8,
  },
  registerButton: {
    backgroundColor: "#E3000F",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  registerText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
