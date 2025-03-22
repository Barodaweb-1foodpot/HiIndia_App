import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Checkbox from 'expo-checkbox';

const FilterPanel = ({ 
  categories, 
  selectedCategoryIds, 
  toggleCategory, 
  cities, 
  selectedCity, 
  setSelectedCity, 
  priceFilter, 
  handleSelectPrice, 
  handleClearFilter, 
  toggleFilterPanel 
}) => {
  return (
    <View style={styles.filterPanelWrapper}>
      <ScrollView 
        style={styles.filterPanel}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.filterPanelContent}
      >
        {/* Header with title and clear button */}
        <View style={styles.filterPanelHeader}>
          <Text style={styles.filterPanelTitle}>Filter Events</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.clearFiltersButton}
              onPress={handleClearFilter}
            >
              <Ionicons name="refresh-outline" size={14} color="#ffffff" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={toggleFilterPanel}
            >
              <Ionicons name="close" size={18} color="#18516E" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Price Filter (radio) */}
        <View style={styles.filterSection}>
          <Text style={styles.filterHeading}>Price</Text>
          <View style={styles.filterPriceRow}>
            {["Paid", "Free", "All"].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.priceOption,
                  priceFilter === option && styles.priceOptionSelected
                ]}
                onPress={() => handleSelectPrice(option)}
              >
                <Text style={[
                  styles.priceOptionText,
                  priceFilter === option && styles.priceOptionTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category Filter (multi-select) */}
        <View style={styles.filterSection}>
          <Text style={styles.filterHeading}>Categories</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((cat) => {
              const isSelected = selectedCategoryIds.includes(cat._id);
              return (
                <TouchableOpacity
                  key={cat._id}
                  style={[
                    styles.categoryOption,
                    isSelected && styles.categoryOptionSelected
                  ]}
                  onPress={() => toggleCategory(cat._id)}
                >
                  <View style={styles.checkboxWrapper}>
                    <Checkbox
                      value={isSelected}
                      onValueChange={() => toggleCategory(cat._id)}
                      style={styles.checkbox}
                      color={isSelected ? "#18516E" : undefined}
                    />
                  </View>
                  <Text style={[
                    styles.categoryLabel,
                    isSelected && styles.categoryLabelSelected
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Cities Filter (single-select) */}
        <View style={styles.filterSection}>
          <Text style={styles.filterHeading}>Cities</Text>
          <View style={styles.citiesContainer}>
            {cities.map((city) => {
              const isSelected = selectedCity === city;
              return (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.cityOption,
                    isSelected && styles.cityOptionSelected
                  ]}
                  onPress={() => setSelectedCity(city)}
                >
                  <View style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected
                  ]}>
                    {isSelected && <View style={styles.radioFill} />}
                  </View>
                  <Text style={[
                    styles.cityLabel,
                    isSelected && styles.cityLabelSelected
                  ]}>
                    {city}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filterPanelWrapper: {
    maxHeight: 490,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  filterPanel: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  filterPanelContent: {
    padding: 14,
    paddingTop: 12,
    paddingBottom: 60,
  },
  filterPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filterPanelTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#18516E",
    textAlign: "left",
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#18516E",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    elevation: 2,
    shadowColor: "#18516E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginRight: 8,
  },
  clearButtonText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
    marginLeft: 4,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  filterSection: {
    marginBottom: 10,
  },
  filterHeading: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#18516E",
  },
  filterPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  priceOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginHorizontal: 2,
    backgroundColor: "#f5f9fc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e9f0",
  },
  priceOptionSelected: {
    backgroundColor: "#e6f2fa",
    borderColor: "#18516E",
  },
  priceOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4a6572",
  },
  priceOptionTextSelected: {
    color: "#18516E",
    fontWeight: "600",
  },
  categoriesContainer: {
    marginBottom: 6,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f5f9fc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e9f0",
  },
  categoryOptionSelected: {
    backgroundColor: "#e6f2fa",
    borderColor: "#18516E",
  },
  checkboxWrapper: {
    marginRight: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderColor: "#18516E",
  },
  categoryLabel: {
    fontSize: 14,
    color: "#4a6572",
    fontWeight: "500",
  },
  categoryLabelSelected: {
    color: "#18516E",
    fontWeight: "600",
  },
  citiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 5,
  },
  cityOption: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%", 
    marginRight: "4%",
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f5f9fc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e9f0",
  },
  cityOptionSelected: {
    backgroundColor: "#e6f2fa",
    borderColor: "#18516E",
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#4a6572",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioCircleSelected: {
    borderColor: "#18516E",
  },
  radioFill: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#18516E",
  },
  cityLabel: {
    fontSize: 14,
    color: "#4a6572",
    fontWeight: "500",
  },
  cityLabelSelected: {
    color: "#18516E",
    fontWeight: "600",
  },
});

export default FilterPanel;