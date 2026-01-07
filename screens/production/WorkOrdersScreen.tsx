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
import { apiService, WorkOrderAPI } from "@/services/api";

type WorkOrdersScreenNavigationProp = NativeStackNavigationProp<
  ProductionStackParamList,
  "WorkOrders"
>;

const FILTERS = ["All", "Pending", "In Progress", "Completed", "Cancelled"] as const;
type Filter = (typeof FILTERS)[number];

export default function WorkOrdersScreen() {
  const navigation = useNavigation<WorkOrdersScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();

  const [workOrders, setWorkOrders] = useState<WorkOrderAPI[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    console.log("WorkOrdersScreen: Component mounted");
    console.log("WorkOrdersScreen: Employee adminId:", employee.adminId);
    console.log("WorkOrdersScreen: Employee id:", employee.id);
    loadWorkOrders();
  }, []);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadWorkOrders();
    }, [])
  );

  const loadWorkOrders = async () => {
    console.log("WorkOrdersScreen: loadWorkOrders called");
    if (!employee.adminId || !employee.id) {
      console.error("WorkOrdersScreen: Employee information missing");
      Alert.alert("Error", "Employee information not found. Please login again.");
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log("WorkOrdersScreen: Calling API...");
      const response = await apiService.getMyWorkOrders(employee.adminId, employee.id);
      console.log("WorkOrdersScreen: API Response:", response);
      if (response.status === 200 && response.data) {
        console.log("WorkOrdersScreen: Work orders loaded:", response.data.length);
        setWorkOrders(response.data);
      } else {
        console.error("WorkOrdersScreen: API Error:", response.message);
        // Don't show alert on initial load, just log
        if (workOrders.length === 0) {
          console.log("WorkOrdersScreen: No work orders found");
        }
      }
    } catch (error: any) {
      console.error("WorkOrdersScreen: Error loading work orders:", error);
      // Don't show alert on initial load, just log
      if (workOrders.length === 0) {
        console.log("WorkOrdersScreen: Error occurred, showing empty state");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadWorkOrders();
  };

  const filteredWorkOrders = workOrders.filter((wo) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Pending") return wo.status === "pending";
    if (activeFilter === "In Progress") return wo.status === "in_progress";
    if (activeFilter === "Completed") return wo.status === "completed";
    if (activeFilter === "Cancelled") return wo.status === "cancelled";
    return true;
  });

  const getStatusColor = (status: WorkOrderAPI["status"]) => {
    switch (status) {
      case "completed":
        return Colors.dark.success;
      case "in_progress":
        return Colors.dark.primary;
      case "pending":
        return Colors.dark.pending;
      case "cancelled":
        return Colors.dark.error;
      default:
        return theme.textMuted;
    }
  };

  const getStatusLabel = (status: WorkOrderAPI["status"]) => {
    switch (status) {
      case "in_progress":
        return "In Progress";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getPriorityColor = (priority: WorkOrderAPI["priority"]) => {
    switch (priority) {
      case "urgent":
      case "high":
        return Colors.dark.error;
      case "medium":
        return Colors.dark.warning;
      case "low":
        return Colors.dark.success;
      default:
        return theme.textMuted;
    }
  };

  const handleWorkOrderPress = (workOrderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("WorkOrderDetail", { workOrderId });
  };

  const handleAcceptWorkOrder = async (workOrder: WorkOrderAPI, e: any) => {
    e.stopPropagation(); // Prevent card press
    if (workOrder.status !== "pending") return;

    setUpdatingOrderId(workOrder.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const response = await apiService.updateWorkOrderStatus(
        employee.adminId!,
        employee.id!,
        workOrder.id,
        "in_progress"
      );

      if (response.status === 200 && response.data) {
        // Update local state
        setWorkOrders((prev) =>
          prev.map((wo) =>
            wo.id === workOrder.id
              ? { ...wo, status: "in_progress" as const }
              : wo
          )
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("✅ Success", "Work order accepted and started!");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", response.message || "Failed to accept work order");
      }
    } catch (error: any) {
      console.error("Error accepting work order:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to accept work order");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  console.log("WorkOrdersScreen: Rendering, isLoading:", isLoading, "workOrders.length:", workOrders.length);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScreenScrollView>
        {isLoading && workOrders.length === 0 ? (
          <>
            <Spacer height={Spacing["5xl"]} />
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
              <Spacer height={Spacing.md} />
              <ThemedText style={{ textAlign: "center", color: theme.textMuted }}>
                Loading work orders...
              </ThemedText>
            </View>
            <Spacer height={Spacing["5xl"]} />
          </>
        ) : (
          <>
            <RefreshButton onPress={handleRefresh} isLoading={isRefreshing} />
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

        {/* Work Orders List */}
        {filteredWorkOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="package" size={48} color={theme.textMuted} />
            <Spacer height={Spacing.md} />
            <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
              No work orders found
            </ThemedText>
          </View>
        ) : (
          filteredWorkOrders.map((workOrder) => (
            <Pressable
              key={workOrder.id}
              onPress={() => handleWorkOrderPress(workOrder.id)}
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderLeftColor: getPriorityColor(workOrder.priority),
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <ThemedText type="h3" style={styles.orderCode}>
                    {workOrder.code}
                  </ThemedText>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(workOrder.status) + "20" },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.statusText,
                        { color: getStatusColor(workOrder.status) },
                      ]}
                    >
                      {getStatusLabel(workOrder.status)}
                    </ThemedText>
                  </View>
                </View>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(workOrder.priority) + "20" },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.priorityText,
                      { color: getPriorityColor(workOrder.priority) },
                    ]}
                  >
                    {workOrder.priority.toUpperCase()}
                  </ThemedText>
                </View>
              </View>

              <Spacer height={Spacing.sm} />

              <ThemedText type="body" style={styles.productName}>
                {workOrder.product_name}
              </ThemedText>

              <Spacer height={Spacing.md} />

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressInfo}>
                  <ThemedText style={[styles.progressText, { color: theme.textMuted }]}>
                    Progress
                  </ThemedText>
                  <ThemedText style={[styles.progressText, { color: theme.text }]}>
                    {workOrder.completion_percentage.toFixed(1)}%
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: theme.backgroundRoot + "40" },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${workOrder.completion_percentage}%`,
                        backgroundColor: Colors.light.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              <Spacer height={Spacing.sm} />

              <View style={styles.cardFooter}>
                <View style={styles.cardFooterItem}>
                  <Feather name="target" size={14} color={theme.textMuted} />
                  <ThemedText style={[styles.footerText, { color: theme.textMuted }]}>
                    {workOrder.target_qty} / {workOrder.completed_qty}
                  </ThemedText>
                </View>
                {workOrder.due_date && (
                  <View style={styles.cardFooterItem}>
                    <Feather name="calendar" size={14} color={theme.textMuted} />
                    <ThemedText style={[styles.footerText, { color: theme.textMuted }]}>
                      {new Date(workOrder.due_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Accept Button - Only show for pending work orders */}
              {workOrder.status === "pending" && (
                <>
                  <Spacer height={Spacing.md} />
                  <Pressable
                    onPress={(e) => handleAcceptWorkOrder(workOrder, e)}
                    disabled={updatingOrderId === workOrder.id}
                    style={({ pressed }) => [
                      styles.acceptButton,
                      {
                        backgroundColor: Colors.light.primary,
                        opacity: pressed || updatingOrderId === workOrder.id ? 0.7 : 1,
                      },
                    ]}
                  >
                    {updatingOrderId === workOrder.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="check-circle" size={18} color="#FFFFFF" />
                        <ThemedText style={styles.acceptButtonText}>Accept</ThemedText>
                      </>
                    )}
                  </Pressable>
                </>
              )}
            </Pressable>
          ))
        )}

            <Spacer height={Spacing.xl} />
          </>
        )}
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
    alignItems: "center",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  orderCode: {
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
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700",
  },
  productName: {
    fontWeight: "500",
  },
  progressContainer: {
    marginVertical: Spacing.sm,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "500",
  },
  progressBar: {
    height: 8,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: BorderRadius.sm,
  },
  cardFooter: {
    flexDirection: "row",
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  cardFooterItem: {
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
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

