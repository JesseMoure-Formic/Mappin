import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { MapPressEvent, Polygon, PROVIDER_DEFAULT } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { createRegion } from "../src/api/regions";
import { LatLng } from "../src/types";
import { INITIAL_REGION, REGION_COLORS } from "../src/constants";

export default function CreateRegionScreen() {
  const [name, setName] = useState("");
  const [color, setColor] = useState(REGION_COLORS[0]);
  const [coordinates, setCoordinates] = useState<LatLng[]>([]);
  const [saving, setSaving] = useState(false);
  const mapRef = useRef<MapView>(null);

  function handleMapPress(e: MapPressEvent) {
    const coord = e.nativeEvent.coordinate;
    setCoordinates((prev) => [...prev, coord]);
  }

  function undoLastPoint() {
    setCoordinates((prev) => prev.slice(0, -1));
  }

  function computeCenter(coords: LatLng[]): LatLng {
    const lat = coords.reduce((s, c) => s + c.latitude, 0) / coords.length;
    const lng = coords.reduce((s, c) => s + c.longitude, 0) / coords.length;
    return { latitude: lat, longitude: lng };
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter a name for this region.");
      return;
    }
    if (coordinates.length < 3) {
      Alert.alert("Draw area", "Tap at least 3 points on the map to define the region.");
      return;
    }

    setSaving(true);
    try {
      await createRegion({
        name: name.trim(),
        color,
        coordinates,
        center: computeCenter(coordinates),
      });
      router.replace("/regions");
    } catch {
      Alert.alert("Error", "Failed to save region. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Area</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#7c3aed" />
          ) : (
            <Text style={styles.save}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Name input */}
      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={setName}
        placeholder="Region name (e.g. FS: 02-BOS)"
        placeholderTextColor="#555"
      />

      {/* Color picker */}
      <View style={styles.colorRow}>
        {REGION_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorSelected]}
            onPress={() => setColor(c)}
          />
        ))}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={INITIAL_REGION}
          onPress={handleMapPress}
        >
          {coordinates.length > 2 && (
            <Polygon
              coordinates={coordinates}
              fillColor={color + "40"}
              strokeColor={color}
              strokeWidth={2}
            />
          )}
        </MapView>

        <View style={styles.mapHint}>
          <Text style={styles.mapHintText}>
            {coordinates.length === 0
              ? "Tap the map to draw your region"
              : `${coordinates.length} point${coordinates.length !== 1 ? "s" : ""} — keep tapping to add more`}
          </Text>
        </View>

        {coordinates.length > 0 && (
          <TouchableOpacity style={styles.undoButton} onPress={undoLastPoint}>
            <Text style={styles.undoText}>↩ Undo</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e1e",
  },
  cancel: { color: "#888", fontSize: 16 },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  save: { color: "#7c3aed", fontSize: 16, fontWeight: "700" },
  nameInput: {
    backgroundColor: "#111",
    color: "#fff",
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  colorSwatch: { width: 28, height: 28, borderRadius: 14 },
  colorSelected: { borderWidth: 3, borderColor: "#fff" },
  mapContainer: { flex: 1, position: "relative" },
  map: { flex: 1 },
  mapHint: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    backgroundColor: "#000000bb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mapHintText: { color: "#ccc", fontSize: 12 },
  undoButton: {
    position: "absolute",
    bottom: 20,
    right: 16,
    backgroundColor: "#1e1e1e",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  undoText: { color: "#fff", fontSize: 14 },
});
