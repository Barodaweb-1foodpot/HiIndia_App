import React, { useState, useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
import SkeletonLoader from "./SkeletonLoader";

// Global cache object to persist loaded states
const loadedCache = {};

const ProfileImage = React.memo(({ source, style }) => {
  const [loaded, setLoaded] = useState(false);
  const isRemote = source && source.uri;

  // Check cache on mount/update
  useEffect(() => {
    if (isRemote && loadedCache[source.uri]) {
      setLoaded(true);
    } else if (!isRemote) {
      // For local images, set as loaded immediately
      setLoaded(true);
    }
  }, [isRemote, source]);

  return (
    <View style={style}>
      {isRemote && !loaded && (
        <SkeletonLoader
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: style?.borderRadius || 0 },
          ]}
        />
      )}
      <Image
        source={source}
        style={[style, { opacity: loaded ? 1 : 0 }]}
        resizeMode="cover"
        onLoad={() => {
          setLoaded(true);
          if (isRemote) {
            loadedCache[source.uri] = true;
          }
        }}
      />
    </View>
  );
});

export default ProfileImage;
