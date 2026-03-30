import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polygon, PROVIDER_DEFAULT } from "react-native-maps";
import { useFocusEffect } from "expo-router";
import { fetchRegions } from "../../src/api/regions";
import { Region } from "../../src/types";
import { INITIAL_REGION } from "../../src/constants";

export default function MapScreen() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  useFocusEffect(
    useCallback(() => {
      loadRegions();
    }, [])
  );

  async function loadRegions() {
    try {
      setError(null);
      const data = await fetchRegions();
      setRegions(data);
    } catch {
      setError("Failed to load regions.");
    } finally {
      setLoading(false);
    }
  }

  function fitToRegions() {
    if (!regions.length || !mapRef.current) return;
    const allCoords = regions.flatMap((r) => r.coordinates);
    mapRef.current.fitToCoordinates(allCoords, {
      edgePadding: { top: 60, right: 40, bottom: 60, left: 40 },
      animated: true,
    });
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        onMapReady={fitToRegions}
      >
        {regions.map((region) => (
          <React.Fragment key={region.id}>
            {region.coordinates.length > 2 && (
              <Polygon
                coordinates={region.coordinates}
                fillColor={region.color + "40"}
                strokeColor={region.color}
                strokeWidth={2}
              />
            )}
            <Marker
              coordinate={region.center}
              pinColor={region.color}
              title={region.name}
              description={
                region.pointCount !== undefined
                  ? `${region.pointCount} points`
                  : undefined
              }
            />
          </React.Fragment>
        ))}
      </MapView>

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadRegions}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  map: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00000066",
  },
  errorBanner: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#7f1d1d",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: { color: "#fca5a5", flex: 1, fontSize: 13 },
  retryText: { color: "#fff", fontWeight: "600", marginLeft: 12 },
});
