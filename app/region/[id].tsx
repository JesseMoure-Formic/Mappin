import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { fetchBoundaries, fetchPointsInRegion, fetchRegions } from "../../src/api/regions";
import { BoundaryResult, BoundaryType, Region } from "../../src/types";

const BOUNDARY_TABS: { label: string; type: BoundaryType }[] = [
  { label: "ZIP Codes", type: "zipCodes" },
  { label: "Counties", type: "counties" },
  { label: "States", type: "states" },
];

export default function RegionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [region, setRegion] = useState<Region | null>(null);
  const [pointCount, setPointCount] = useState<number | null>(null);
  const [boundaries, setBoundaries] = useState<BoundaryResult[]>([]);
  const [activeTab, setActiveTab] = useState<BoundaryType>("zipCodes");
  const [loading, setLoading] = useState(true);
  const [boundaryLoading, setBoundaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRegion();
  }, [id]);

  useEffect(() => {
    if (region) loadBoundaries(activeTab);
  }, [activeTab, region]);

  async function loadRegion() {
    try {
      const [regions, points] = await Promise.all([
        fetchRegions(),
        fetchPointsInRegion(id),
      ]);
      const found = regions.find((r) => r.id === id) ?? null;
      setRegion(found);
      setPointCount(points.length);
    } catch {
      setError("Failed to load region details.");
    } finally {
      setLoading(false);
    }
  }

  async function loadBoundaries(type: BoundaryType) {
    setBoundaryLoading(true);
    try {
      const data = await fetchBoundaries(id, type);
      setBoundaries(data);
    } catch {
      setBoundaries([]);
    } finally {
      setBoundaryLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (!region) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Region not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{region.name}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pointCount ?? "—"}</Text>
            <Text style={styles.statLabel}>Points total</Text>
          </View>
        </View>

        {/* Boundary tabs */}
        <View style={styles.tabs}>
          {BOUNDARY_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.type}
              style={[styles.tab, activeTab === tab.type && styles.tabActive]}
              onPress={() => setActiveTab(tab.type)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.type && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {boundaryLoading ? (
          <ActivityIndicator color="#7c3aed" style={{ marginTop: 24 }} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              List of {activeTab === "zipCodes" ? "zip codes" : activeTab}
            </Text>
            <Text style={styles.sectionMeta}>Results: {boundaries.length}</Text>
            {boundaries.map((b) => (
              <View key={b.code} style={styles.boundaryRow}>
                <Text style={styles.boundaryCode}>{b.code}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[styles.barFill, { width: `${b.coveragePct}%` }]}
                  />
                </View>
                <Text style={styles.boundaryPct}>{b.coveragePct}%</Text>
              </View>
            ))}
          </>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e1e",
  },
  back: { color: "#7c3aed", fontSize: 17 },
  title: { color: "#fff", fontSize: 17, fontWeight: "700", flex: 1, textAlign: "center" },
  scroll: { padding: 16 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: { color: "#7c3aed", fontSize: 28, fontWeight: "700" },
  statLabel: { color: "#888", fontSize: 12, marginTop: 4 },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    marginBottom: 16,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#7c3aed" },
  tabText: { color: "#888", fontSize: 14 },
  tabTextActive: { color: "#7c3aed", fontWeight: "600" },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  sectionMeta: { color: "#888", fontSize: 13, marginBottom: 12 },
  boundaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  boundaryCode: { color: "#fff", fontSize: 14, width: 70 },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#222",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: "#2dd4bf", borderRadius: 4 },
  boundaryPct: { color: "#888", fontSize: 12, width: 36, textAlign: "right" },
  errorBanner: {
    backgroundColor: "#7f1d1d",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  errorText: { color: "#fca5a5", fontSize: 13 },
});
