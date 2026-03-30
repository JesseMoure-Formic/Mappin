import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { fetchRegions, deleteRegion } from "../../src/api/regions";
import { Region } from "../../src/types";

export default function RegionsScreen() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  function confirmDelete(region: Region) {
    Alert.alert(
      "Delete Region",
      `Delete "${region.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRegion(region.id);
              setRegions((prev) => prev.filter((r) => r.id !== region.id));
            } catch {
              Alert.alert("Error", "Failed to delete region.");
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Regions</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/create-region")}
        >
          <Text style={styles.createButtonText}>+ Create area</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {regions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No regions yet.</Text>
          <Text style={styles.emptySubtext}>
            Tap "Create area" to define your first territory.
          </Text>
        </View>
      ) : (
        <FlatList
          data={regions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.regionRow}
              onPress={() => router.push(`/region/${item.id}`)}
              onLongPress={() => confirmDelete(item)}
            >
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <View style={styles.regionInfo}>
                <Text style={styles.regionName}>{item.name}</Text>
                {item.pointCount !== undefined && (
                  <Text style={styles.regionMeta}>
                    {item.pointCount} points
                  </Text>
                )}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e1e",
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  createButton: {
    backgroundColor: "#7c3aed",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  list: { padding: 12 },
  regionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  dot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  regionInfo: { flex: 1 },
  regionName: { color: "#fff", fontSize: 15, fontWeight: "500" },
  regionMeta: { color: "#888", fontSize: 12, marginTop: 2 },
  chevron: { color: "#555", fontSize: 20 },
  errorBanner: {
    backgroundColor: "#7f1d1d",
    margin: 12,
    borderRadius: 10,
    padding: 12,
  },
  errorText: { color: "#fca5a5", fontSize: 13 },
  emptyText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  emptySubtext: { color: "#888", fontSize: 13, marginTop: 8, textAlign: "center" },
});
