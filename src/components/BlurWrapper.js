import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

const BlurWrapper = ({ style, children }) => {
  if (Platform.OS === 'android') {
    return <View style={[style, styles.androidBlur]}>{children}</View>;
  }
  return (
    <BlurView intensity={50} tint="dark" style={style}>
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  androidBlur: {
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
});

export default BlurWrapper;
