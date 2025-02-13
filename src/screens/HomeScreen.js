import React, { useState } from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BlurView } from 'expo-blur';

const BlurWrapper = ({ style, children }) => {
  if (Platform.OS === 'android') {
    return (
      <View style={[style, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
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

export default function HomeScreen({ navigation }) {
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [likedEvents, setLikedEvents] = useState({});
  const [activeTab, setActiveTab] = useState('All');

  const toggleLike = (index) => {
    setLikedEvents((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const eventsData = [
    { title: 'Atul Purohit Graba', image: require('../../assets/Atul_dada.png') },
    { title: 'Falguni Pathak Hits', image: require('../../assets/placeholder.jpg') },
    { title: 'DJ Music Event', image: require('../../assets/placeholder.jpg') },
  ];

  const hubData = [
    {
      title: 'Global Music Fest',
      date: 'Aug 30 - Sep 2, 2025',
      location: 'Springfield, IL',
      category: 'Music Festival',
      image: require('../../assets/placeholder.jpg'),
    },
    {
      title: 'Global Healthcare Congress',
      date: 'Aug 30 - Sep 2, 2025',
      location: '123 Oakwood Dr.',
      category: 'Healthcare',
      image: require('../../assets/placeholder.jpg'),
    },
  ];

  const filteredEventsData = eventsData.filter((item) =>
    item.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredHubData = hubData.filter((item) => {
    return (
      item.title.toLowerCase().includes(searchText.toLowerCase()) ||
      item.category.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.location?.toLowerCase().includes(searchText.toLowerCase()) || false) ||
      item.date.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
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

      {/* Main Content */}
      <View style={styles.whiteSection}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Header */}
          <View style={styles.eventsHeader}>
            <Text style={styles.eventsTitle}>Events</Text>
            <TouchableOpacity
              onPress={() => {
                setSearchVisible((prev) => !prev);
                if (!searchVisible) setSearchText('');
              }}
            >
              <Ionicons name="search-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Search Wrapper */}
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

          {/* Tabs Section */}
          <View style={styles.tabsContainer}>
            <View style={styles.tabsWrapper}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'All' && styles.activeTab,
                ]}
                onPress={() => setActiveTab('All')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'All' && styles.activeTabText,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === 'Upcoming' && styles.activeTab,
                ]}
                onPress={() => setActiveTab('Upcoming')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'Upcoming' && styles.activeTabText,
                  ]}
                >
                  Upcoming
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'Past' && styles.activeTab]}
                onPress={() => setActiveTab('Past')}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'Past' && styles.activeTabText,
                  ]}
                >
                  Past
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Trending Events Section */}
          <View style={styles.section}>
            {activeTab === 'All' && (
              <Text style={styles.sectionTitle}>Trending Events</Text>
            )}

            {filteredEventsData.map((event, index) => (
              <View key={index} style={styles.eventCard}>
                <Image source={event.image} style={styles.eventImage} />
                <TouchableOpacity
                  style={styles.heartButton}
                  onPress={() => toggleLike(index)}
                >
                  <Ionicons
                    name={likedEvents[index] ? 'heart' : 'heart-outline'}
                    size={20}
                    color={likedEvents[index] ? '#E3000F' : '#000'}
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
                        Gelora Bung Karno Stadium..
                      </Text>
                    </View>
                    <View style={styles.eventDetail}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color="#fff"
                      />
                      <Text style={styles.eventDetailText}>
                        Aug 30 - Sep 2, 2025
                      </Text>
                    </View>
                  </View>
                  {activeTab === 'All' && (
                    <View style={styles.registerContainer}>
                      <TouchableOpacity style={styles.registerButton}>
                        <Text style={styles.registerText}>Register</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </BlurWrapper>
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
          </View>

          {/* Event Hub Section (shown only in the All tab) */}
          {activeTab === 'All' && (
            <View style={styles.hubSection}>
              <Text style={styles.sectionTitle}>The Event Hub</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.hubScrollView}
              >
                {filteredHubData.map((item, index) => (
                  <View key={index} style={styles.hubCard}>
                    <Image source={item.image} style={styles.hubCardImage} />
                    <View style={styles.hubCardContent}>
                      <Text style={styles.hubCardTitle}>{item.title}</Text>
                      <Text style={styles.hubCardDate}>{item.date}</Text>
                      <View style={styles.hubLocationContainer}>
                        <Ionicons
                          name="location-outline"
                          size={12}
                          color="#666"
                        />
                        <Text style={styles.hubLocationText}>
                          {item.location}
                        </Text>
                      </View>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryText}>
                          {item.category}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
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
    backgroundColor: '#000',
  },
  header: {
    height: '15%',
    backgroundColor: '#000',
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 50,
    resizeMode: 'contain',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  scrollContainer: {
    paddingBottom: 120,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  searchWrapper: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 46,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    marginLeft: 8,
  },
  tabsContainer: {
    marginBottom: 24,
  },
  tabsWrapper: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#E3000F',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E3000F',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  eventCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    height: 200,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  eventContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 20,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 6,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  eventDetailsColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDetailText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 12,
  },
  registerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  registerButton: {
    backgroundColor: '#E3000F',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  registerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  viewMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  viewMoreButton: {
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  viewMoreButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewMoreText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  hubSection: {
    marginTop: 0,
  },
  hubScrollView: {
    marginTop: 16,
  },
  hubCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 16,
    width: 300,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
    alignItems: 'center',
  },
  hubCardImage: {
    width: 100,
    height: '100%',
    resizeMode: 'cover',
  },
  hubCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  hubCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  hubCardDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  hubLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hubLocationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  categoryPill: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
  },
});