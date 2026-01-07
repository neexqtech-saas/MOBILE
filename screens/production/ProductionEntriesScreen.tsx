import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { ProductionStackParamList } from "@/navigation/ProductionStackNavigator";
import Spacer from "@/components/Spacer";
import { RefreshButton } from "@/components/RefreshButton";
import { apiService, ProductionEntryAPI } from "@/services/api";

type ProductionEntriesScreenNavigationProp = NativeStackNavigationProp<
  ProductionStackParamList,
  "ProductionEntries"
>;

const FILTERS = ["All", "Draft", "Submitted", "Approved", "Rejected"] as const;
type Filter = (typeof FILTERS)[number];

export default function ProductionEntriesScreen() {
  const navigation = useNavigation<ProductionEntriesScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();

  const [productionEntries, setProductionEntries] = useState<ProductionEntryAPI[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadProductionEntries();
  }, []);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProductionEntries();
    }, [])
  );

  const loadProductionEntries = async () => {
    if (!employee.adminId || !employee.id) {
      Alert.alert("Error", "Employee information not found. Please login again.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.getMyProductionEntries(
        employee.adminId,
        employee.id
      );
      if (response.status === 200 && response.data) {
        setProductionEntries(response.data);
      } else {
        Alert.alert("Error", response.message || "Failed to load production entries");
      }
    } catch (error: any) {
      console.error("Error loading production entries:", error);
      Alert.alert("Error", error.message || "Failed to load production entries");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProductionEntries();
  };

  const handleCreateNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("ProductionEntryForm", {});
  };

  const filteredEntries = productionEntries.filter((entry) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Draft") return entry.status === "draft";
    if (activeFilter === "Submitted") return entry.status === "submitted";
    if (activeFilter === "Approved") return entry.status === "approved";
    if (activeFilter === "Rejected") return entry.status === "rejected";
    return true;
  });

  const getStatusColor = (status: ProductionEntryAPI["status"]) => {
    switch (status) {
      case "approved":
        return Colors.dark.success;
      case "submitted":
        return Colors.dark.primary;
      case "draft":
        return Colors.dark.pending;
      case "rejected":
        return Colors.dark.error;
      default:
        return theme.textMuted;
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading && productionEntries.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScreenScrollView>
        <View style={styles.headerRow}>
          <RefreshButton onPress={handleRefresh} isLoading={isRefreshing} />
          <Pressable
            onPress={handleCreateNew}
            style={[
              styles.createButton,
              { backgroundColor: Colors.light.primary },
            ]}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
            <ThemedText style={styles.createButtonText}>New Entry</ThemedText>
          </Pressable>
        </View>
        <Spacer height={Spacing.md} />

        {/* Filters */}
        <View style={styles.filterContainer}>
          {FILTERS.map((filter) => (
            <Pressable
              key={filter}
              onPress={() => {
                setActiveFilter(filter);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    activeFilter === filter ? Colors.light.primary : theme.backgroundDefault,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  {
                    color:
                      activeFilter === filter ? "#FFFFFF" : theme.text,
                    fontWeight: activeFilter === filter ? "600" : "400",
                  },
                ]}
              >
                {filter}
              </ThemedText>
            </Pressable>
          ))}
        </View>
        <Spacer height={Spacing.lg} />

        {/* Production Entries List */}
        {filteredEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="clipboard" size={48} color={theme.textMuted} />
            <Spacer height={Spacing.md} />
            <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
              No production entries found
            </ThemedText>
          </View>
        ) : (
          filteredEntries.map((entry) => (
            <Pressable
              key={entry.id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderLeftColor: getStatusColor(entry.status),
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <ThemedText type="h3" style={styles.workOrderCode}>
                    {entry.work_order_code}
                  </ThemedText>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(entry.status) + "20" },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.statusText,
                        { color: getStatusColor(entry.status) },
                      ]}
                    >
                      {entry.status.toUpperCase()}
                    </ThemedText>
                  </View>
                </View>
              </View>

              <Spacer height={Spacing.sm} />

              <View style={styles.infoRow}>
                <Feather name="cpu" size={16} color={theme.textMuted} />
                <ThemedText style={[styles.infoText, { color: theme.text }]}>
                  {entry.machine_name}
                </ThemedText>
              </View>

              <Spacer height={Spacing.xs} />

              <View style={styles.infoRow}>
                <Feather name="clock" size={16} color={theme.textMuted} />
                <ThemedText style={[styles.infoText, { color: theme.textMuted }]}>
                  {formatDateTime(entry.start_time)} - {formatDateTime(entry.end_time)}
                </ThemedText>
              </View>

              <Spacer height={Spacing.md} />

              <View style={styles.quantityRow}>
                <View style={styles.quantityItem}>
                  <ThemedText style={[styles.quantityLabel, { color: theme.textMuted }]}>
                    Good Qty
                  </ThemedText>
                  <ThemedText type="h3" style={[styles.quantityValue, { color: Colors.dark.success }]}>
                    {entry.good_qty}
                  </ThemedText>
                </View>
                <View style={styles.quantityItem}>
                  <ThemedText style={[styles.quantityLabel, { color: theme.textMuted }]}>
                    Scrap Qty
                  </ThemedText>
                  <ThemedText type="h3" style={[styles.quantityValue, { color: Colors.dark.error }]}>
                    {entry.scrap_qty}
                  </ThemedText>
                </View>
                <View style={styles.quantityItem}>
                  <ThemedText style={[styles.quantityLabel, { color: theme.textMuted }]}>
                    Efficiency
                  </ThemedText>
                  <ThemedText type="h3" style={[styles.quantityValue, { color: Colors.dark.primary }]}>
                    {typeof entry.efficiency === 'number' 
                      ? entry.efficiency.toFixed(1) 
                      : parseFloat(String(entry.efficiency || 0)).toFixed(1)}%
                  </ThemedText>
                </View>
              </View>

              {entry.shift && (
                <>
                  <Spacer height={Spacing.sm} />
                  <View style={styles.infoRow}>
                    <Feather name="sun" size={16} color={theme.textMuted} />
                    <ThemedText style={[styles.infoText, { color: theme.textMuted }]}>
                      {entry.shift} Shift
                    </ThemedText>
                  </View>
                </>
              )}
            </Pressable>
          ))
        )}

        <Spacer height={Spacing.xl} />
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  filterText: {
    fontSize: 14,
  },
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  workOrderCode: {
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  quantityRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  quantityItem: {
    flex: 1,
  },
  quantityLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  quantityValue: {
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyText: {
    fontSize: 16,
  },
});

