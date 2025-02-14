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
import { getEventCategoriesByPartner } from "../api/event_api";

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
  const [category , setCategory] = useState([])
  useEffect(() => {
    fetchCategory()
  },[])
  const fetchCategory = async () => {
    const res = await getEventCategoriesByPartner()
    console.log(res.data)
    if(res.data.data?.length>0)
    {
      setCategory(res.data.data)
    }
  }

  const categories = [
    "All events",
    "Music Festival",
    "Workshop & Seminar",
    "Esports Tournament",
    "Cultural Festival",
    "Hospitality & Tourism Expo",
    "Real Estate Summit",
    "Agriculture & Farming Event",
  ];

  const categoryData = [
    {
      id: "category-1",
      title: "Global Music Fest",
      date: "Aug 30 - Sep 2, 2025",
      location: "Springfield, IL",
      category: "Music Festival",
      image: require("../../assets/placeholder.jpg"),
    },
    {
      id: "category-2",
      title: "Global Healthcare Congress",
      date: "Aug 30 - Sep 2, 2025",
      location: "123 Oakwood Dr.",
      category: "Workshop & Seminar",
      image: require("../../assets/placeholder.jpg"),
    },
  ];

  const Events = [
    {
      id: "events-1",
      title: "Atul Purohit Graba",
      image: require("../../assets/Atul_dada.png"),
      category: "Music Festival",
    },
    {
      id: "events-2",
      title: "Falguni Pathak Hits",
      image: require("../../assets/placeholder.jpg"),
      category: "Cultural Festival",
    },
    {
      id: "events-3",
      title: "DJ Music Event",
      image: require("../../assets/placeholder.jpg"),
      category: "Esports Tournament",
    },
  ];

  let filteredCategoryData = categoryData.filter((item) => {
    return selectedCategory === "All events" || item.category === selectedCategory;
  });

  let filteredEvents = Events.filter((item) => {
    return selectedCategory === "All events" || item.category === selectedCategory;
  });

  if (searchText) {
    filteredCategoryData = filteredCategoryData.filter((item) =>
      item.title.toLowerCase().includes(searchText.toLowerCase()) ||
      item.category.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.location?.toLowerCase().includes(searchText.toLowerCase()) || false)
    );

    filteredEvents = filteredEvents.filter((item) =>
      item.title.toLowerCase().includes(searchText.toLowerCase()) ||
      item.category.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  if (activeTab === "Saved") {
    filteredCategoryData = filteredCategoryData.filter((item) => likedEvents[item.id]);
    filteredEvents = filteredEvents.filter((item) => likedEvents[item.id]);
  }

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
            <TouchableOpacity style={styles.iconCircle}>
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
                setSearchVisible(prev => !prev);
                if (!searchVisible) setSearchText('');
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
                    // onPress={() => {
                    //   setSelectedCategory(cat);
                    //   setDropdownOpen(false);
                    // }}
                  >
                    <Text style={styles.dropdownItemText}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
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

          {filteredCategoryData.length > 0 && (
            <>
              {filteredCategoryData.map((item) => (
                <View key={item.id} style={styles.categoryCard}>
                  <Image source={item.image} style={styles.categoryCardImage} />
                  <View style={styles.categoryCardContent}>
                    <Text style={styles.categoryCardTitle}>{item.title}</Text>
                    <Text style={styles.categoryCardDate}>{item.date}</Text>
                    <View style={styles.categoryLocationContainer}>
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color="#666"
                      />
                      <Text style={styles.categoryLocationText}>
                        {item.location}
                      </Text>
                    </View>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  </View>
                </View>
              ))}
              <View style={styles.viewMoreContainer}>
                <TouchableOpacity style={styles.viewMoreButton}>
                  <View style={styles.viewMoreButtonContent}>
                    <Text style={styles.viewMoreText}>View More</Text>
                    <Ionicons name="chevron-forward" size={16} color="#000" />
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}

          {filteredEvents.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Other events</Text>
              {filteredEvents.map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <Image source={event.image} style={styles.eventImage} />
                  <TouchableOpacity
                    style={styles.heartButtonEvent}
                    onPress={() => toggleLike(event.id)}
                  >
                    <Ionicons
                      name={likedEvents[event.id] ? "heart" : "heart-outline"}
                      size={20}
                      color={likedEvents[event.id] ? "#E3000F" : "#000"}
                    />
                  </TouchableOpacity>
                  <BlurWrapper style={styles.eventContent}>
                    <View style={styles.eventDetailsColumn}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View style={styles.eventDetail}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color="#fff"
                        />
                        <Text style={styles.eventDetailText}>
                          Event Location
                        </Text>
                      </View>
                      <View style={styles.eventDetail}>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color="#fff"
                        />
                        <Text style={styles.eventDetailText}>Event Date</Text>
                      </View>
                    </View>
                    {activeTab === "All" && (
                      <View style={styles.registerContainer}>
                        <TouchableOpacity style={styles.registerButton}>
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
  categoryCardImage: { width: 120, height: 120, resizeMode: "cover" },
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