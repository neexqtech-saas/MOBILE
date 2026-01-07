import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { ProductionStackParamList } from "@/navigation/ProductionStackNavigator";
import Spacer from "@/components/Spacer";
import { RefreshButton } from "@/components/RefreshButton";
import { apiService, MaterialRequisitionAPI } from "@/services/api";

type MaterialRequisitionsScreenNavigationProp = NativeStackNavigationProp<
  ProductionStackParamList,
  "MaterialRequisitions"
>;

const FILTERS = ["All", "Pending", "Approved", "Rejected", "Issued"] as const;
type Filter = (typeof FILTERS)[number];

export default function MaterialRequisitionsScreen() {
  const navigation = useNavigation<MaterialRequisitionsScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();

  const [requisitions, setRequisitions] = useState<MaterialRequisitionAPI[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadRequisitions();
  }, []);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRequisitions();
    }, [])
  );

  const loadRequisitions = async () => {
    if (!employee.adminId || !employee.id) {
      Alert.alert("Error", "Employee information not found. Please login again.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.getMyMaterialRequisitions(
        employee.adminId,
        employee.id
      );
      if (response.status === 200 && response.data) {
        setRequisitions(response.data);
      } else {
        console.error("Failed to load requisitions:", response.message);
      }
    } catch (error: any) {
      console.error("Error loading requisitions:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRequisitions();
  };

  const filteredRequisitions = requisitions.filter((req) => {
    if (activeFilter === "All") return true;
    return req.status === activeFilter.toLowerCase();
  });

  const getStatusColor = (status: MaterialRequisitionAPI["status"]) => {
    switch (status) {
      case "approved":
      case "issued":
        return Colors.dark.success;
      case "pending":
        return Colors.dark.pending;
      case "rejected":
        return Colors.dark.error;
      default:
        return theme.textMuted;
    }
  };

  if (isLoading && requisitions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  const handleCreateNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("MaterialRequisitionForm");
  };

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
            <ThemedText style={styles.createButtonText}>New</ThemedText>
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

        {/* Requisitions List */}
        {filteredRequisitions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="shopping-cart" size={48} color={theme.textMuted} />
            <Spacer height={Spacing.md} />
            <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
              No material requisitions found
            </ThemedText>
          </View>
        ) : (
          filteredRequisitions.map((req) => (
            <View
              key={req.id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderLeftColor: getStatusColor(req.status),
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View>
                  <ThemedText type="h3" style={styles.requisitionNumber}>
                    {req.requisition_number}
                  </ThemedText>
                  <ThemedText style={[styles.date, { color: theme.textMuted }]}>
                    {new Date(req.requisition_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(req.status) + "20" },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.statusText,
                      { color: getStatusColor(req.status) },
                    ]}
                  >
                    {req.status.toUpperCase()}
                  </ThemedText>
                </View>
              </View>

              <Spacer height={Spacing.md} />

              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Feather name="briefcase" size={14} color={theme.textMuted} />
                  <ThemedText style={[styles.footerText, { color: theme.textMuted }]}>
                    {req.department}
                  </ThemedText>
                </View>
                <View style={styles.footerItem}>
                  <Feather name="package" size={14} color={theme.textMuted} />
                  <ThemedText style={[styles.footerText, { color: theme.textMuted }]}>
                    {req.total_items} items
                  </ThemedText>
                </View>
              </View>
            </View>
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
    alignItems: "flex-start",
  },
  requisitionNumber: {
    fontWeight: "700",
  },
  date: {
    fontSize: 12,
    marginTop: Spacing.xs,
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
  cardFooter: {
    flexDirection: "row",
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
            paddingVertical: Spacing["5xl"],
  },
  emptyText: {
    fontSize: 16,
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
});

