import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Checkbox from 'expo-checkbox';

const FilterPanel = ({
  priceFilter,
  categories,
  selectedCategoryIds,
  onPriceFilterChange,
  onCategoryToggle,
  onClearFilter,
}) => {
  return (
    <View style={styles.filterPanel}>
      <Text style={styles.filterPanelTitle}>Filter Events</Text>
      <Text style={styles.filterHeading}>Price</Text>
      <View style={styles.filterPriceRow}>
        {['Paid', 'Free', 'All'].map((option) => (
          <TouchableOpacity
            key={option}
            style={styles.filterPriceItem}
            onPress={() => onPriceFilterChange(option)}
          >
            <View style={styles.radioOuter}>
              {priceFilter === option && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.filterPriceLabel}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.filterHeading, { marginTop: 12 }]}>Categories</Text>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat._id}
          style={styles.categoryRow}
          onPress={() => onCategoryToggle(cat._id)}
        >
          <Checkbox
            value={selectedCategoryIds.includes(cat._id)}
            onValueChange={() => onCategoryToggle(cat._id)}
            style={styles.checkbox}
          />
          <Text style={styles.categoryLabel}>{cat.name}</Text>
        </TouchableOpacity>
      ))}
      <View style={styles.filterActions}>
        <TouchableOpacity onPress={onClearFilter}>
          <Text style={styles.filterClearText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  filterPanel: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  filterPanelTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterHeading: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  filterPriceRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  filterPriceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E3000F',
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E3000F',
  },
  filterPriceLabel: {
    fontSize: 14,
    color: '#000',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#000',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  filterClearText: {
    fontSize: 14,
    color: 'red',
  },
});

export default FilterPanel;
