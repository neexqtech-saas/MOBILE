import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Text,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { apiService, type LiftComplianceRecord } from "@/services/api";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { formatDisplayDate, getCurrentMonthDates, getLastNDaysRange } from "@/utils/dateHelpers";

type Nav = NativeStackNavigationProp<HomeStackParamList, "COCCertificates">;

type DateFilterKey = "all" | "month" | "3d" | "7d" | "30d";

const FILTER_OPTIONS: { key: DateFilterKey; label: string }[] = [
  { key: "3d", label: "Last 3 days" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "month", label: "This month" },
  { key: "all", label: "All" },
];

function rangeForFilter(key: DateFilterKey): { date_from?: string; date_to?: string } {
  if (key === "all") return {};
  const range =
    key === "month"
      ? getCurrentMonthDates()
      : key === "3d"
        ? getLastNDaysRange(3)
        : key === "7d"
          ? getLastNDaysRange(7)
          : getLastNDaysRange(30);
  return { date_from: range.from, date_to: range.to };
}

export default function COCCertificatesScreen() {
  const navigation = useNavigation<Nav>();
  const { employee } = useHRMSStore();
  const [items, setItems] = useState<LiftComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterKey>("3d");
  const [totalCount, setTotalCount] = useState(0);

  const load = useCallback(async () => {
    const userId = employee.id;
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const range = rangeForFilter(dateFilter);
      const res = await apiService.getMyCOCertificates(userId, {
        ...range,
        page: 1,
        page_size: 50,
      });
      setItems(Array.isArray(res.data) ? res.data : []);
      setTotalCount(res.pagination?.total_items ?? res.data?.length ?? 0);
    } catch (e: any) {
      setItems([]);
      Alert.alert("Error", e?.message || "Failed to load certificates");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [employee.id, dateFilter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  React.useEffect(() => {
    setLoading(true);
    load();
  }, [dateFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const renderItem = ({ item }: { item: LiftComplianceRecord }) => (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.cardIcon}>
          <Feather name="file-text" size={20} color={Colors.dark.primary} />
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.certNo}>{item.certificate_number}</Text>
          <Text style={styles.certDate}>
            Issued {item.date_of_issue ? formatDisplayDate(item.date_of_issue) : formatDisplayDate(item.created_at)}
          </Text>
        </View>
      </View>
      <View style={styles.metaBlock}>
        <Text style={styles.metaLine} numberOfLines={1}>
          <Text style={styles.metaLabel}>Site: </Text>
          {item.site_location_name || "—"} · {item.location_number || "—"}
        </Text>
        <Text style={styles.metaLine} numberOfLines={1}>
          <Text style={styles.metaLabel}>Lift: </Text>
          {item.lift_serial_number || "—"}
          {item.lift_model ? ` · ${item.lift_model}` : ""}
        </Text>
      </View>
    </View>
  );

  const listHeader = (
    <>
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setDateFilter(opt.key);
            }}
            style={[styles.filterChip, dateFilter === opt.key && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, dateFilter === opt.key && styles.filterChipTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.countLine}>
        {totalCount} certificate{totalCount === 1 ? "" : "s"} in selected period
      </Text>
    </>
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <ThemedText style={styles.hint}>Loading your certificates…</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.dark.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No certificates in this period</Text>
            <Text style={styles.emptySub}>Submit a new COC or change the date filter.</Text>
          </View>
        }
      />
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}
        onPress={() => navigation.navigate("COCComplianceForm")}
      >
        <Feather name="plus" size={24} color="#FFF" />
        <Text style={styles.fabText}>New COC</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  hint: { marginTop: Spacing.md, color: "#64748B" },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFF",
  },
  filterChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  filterChipText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  filterChipTextActive: { color: "#FFF" },
  countLine: { fontSize: 13, color: "#64748B", marginBottom: Spacing.md },
  card: {
    backgroundColor: "#FFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHead: { flexDirection: "row", alignItems: "flex-start", marginBottom: Spacing.sm },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.dark.primary + "14",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  cardTitleWrap: { flex: 1, minWidth: 0 },
  certNo: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  certDate: { fontSize: 12, color: "#64748B", marginTop: 2 },
  metaBlock: { marginBottom: 0 },
  metaLine: { fontSize: 13, color: "#475569", lineHeight: 18, marginTop: 2 },
  metaLabel: { fontWeight: "600", color: "#334155" },
  empty: { alignItems: "center", paddingTop: 48, paddingHorizontal: Spacing.xl },
  emptyTitle: { marginTop: Spacing.lg, fontSize: 16, fontWeight: "700", color: "#1E293B" },
  emptySub: { marginTop: Spacing.sm, fontSize: 14, color: "#64748B", textAlign: "center" },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: 999,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
