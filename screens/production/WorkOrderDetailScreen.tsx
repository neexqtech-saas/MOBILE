import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Alert, ScrollView } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { ProductionStackParamList } from "@/navigation/ProductionStackNavigator";
import Spacer from "@/components/Spacer";
import { apiService, WorkOrderAPI } from "@/services/api";

type WorkOrderDetailScreenRouteProp = RouteProp<
  ProductionStackParamList,
  "WorkOrderDetail"
>;

type WorkOrderDetailScreenNavigationProp = NativeStackNavigationProp<
  ProductionStackParamList,
  "WorkOrderDetail"
>;

export default function WorkOrderDetailScreen() {
  const route = useRoute<WorkOrderDetailScreenRouteProp>();
  const navigation = useNavigation<WorkOrderDetailScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();
  const { workOrderId } = route.params;

  const [workOrder, setWorkOrder] = useState<WorkOrderAPI | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWorkOrder();
  }, [workOrderId]);

  const loadWorkOrder = async () => {
    if (!employee.adminId || !employee.id) {
      Alert.alert("Error", "Employee information not found. Please login again.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.getWorkOrder(
        employee.adminId,
        employee.id,
        workOrderId
      );
      if (response.status === 200 && response.data) {
        setWorkOrder(response.data);
      } else {
        Alert.alert("Error", response.message || "Failed to load work order");
      }
    } catch (error: any) {
      console.error("Error loading work order:", error);
      Alert.alert("Error", error.message || "Failed to load work order");
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!workOrder) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ThemedText>Work order not found</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.backgroundDefault,
            borderLeftColor: getPriorityColor(workOrder.priority),
          },
        ]}
      >
        <View style={styles.headerRow}>
          <ThemedText type="h2" style={styles.orderCode}>
            {workOrder.code}
          </ThemedText>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(workOrder.status) + "20" },
            ]}
          >
            <ThemedText
              style={[styles.statusText, { color: getStatusColor(workOrder.status) }]}
            >
              {workOrder.status.replace("_", " ").toUpperCase()}
            </ThemedText>
          </View>
        </View>

        <Spacer height={Spacing.md} />

        <ThemedText type="h3" style={styles.productName}>
          {workOrder.product_name}
        </ThemedText>

        <Spacer height={Spacing.md} />

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
            {workOrder.priority.toUpperCase()} PRIORITY
          </ThemedText>
        </View>
      </View>

      {/* Progress Card */}
      <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Progress
        </ThemedText>
        <Spacer height={Spacing.md} />

        <View style={styles.progressInfo}>
          <ThemedText style={[styles.label, { color: theme.textMuted }]}>
            Completion
          </ThemedText>
          <ThemedText type="h3" style={styles.value}>
            {workOrder.completion_percentage.toFixed(1)}%
          </ThemedText>
        </View>

        <Spacer height={Spacing.sm} />

        <View
          style={[
            styles.progressBar,
            { backgroundColor: theme.background + "40" },
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

        <Spacer height={Spacing.lg} />

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <ThemedText style={[styles.label, { color: theme.textMuted }]}>
              Target Quantity
            </ThemedText>
            <ThemedText type="body" style={styles.value}>
              {workOrder.target_qty}
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <ThemedText style={[styles.label, { color: theme.textMuted }]}>
              Completed Quantity
            </ThemedText>
            <ThemedText type="body" style={styles.value}>
              {workOrder.completed_qty}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Details Card */}
      <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Details
        </ThemedText>
        <Spacer height={Spacing.md} />

        <View style={styles.detailRow}>
          <Feather name="user" size={18} color={theme.textMuted} />
          <View style={styles.detailContent}>
            <ThemedText style={[styles.label, { color: theme.textMuted }]}>
              Assigned To
            </ThemedText>
            <ThemedText type="body" style={styles.value}>
              {workOrder.assigned_to_name}
            </ThemedText>
          </View>
        </View>

        {workOrder.start_date && (
          <>
            <Spacer height={Spacing.md} />
            <View style={styles.detailRow}>
              <Feather name="calendar" size={18} color={theme.textMuted} />
              <View style={styles.detailContent}>
                <ThemedText style={[styles.label, { color: theme.textMuted }]}>
                  Start Date
                </ThemedText>
                <ThemedText type="body" style={styles.value}>
                  {new Date(workOrder.start_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </ThemedText>
              </View>
            </View>
          </>
        )}

        {workOrder.due_date && (
          <>
            <Spacer height={Spacing.md} />
            <View style={styles.detailRow}>
              <Feather name="clock" size={18} color={theme.textMuted} />
              <View style={styles.detailContent}>
                <ThemedText style={[styles.label, { color: theme.textMuted }]}>
                  Due Date
                </ThemedText>
                <ThemedText type="body" style={styles.value}>
                  {new Date(workOrder.due_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </ThemedText>
              </View>
            </View>
          </>
        )}
      </View>

      <Spacer height={Spacing.xl} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderCode: {
    fontWeight: "700",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  productName: {
    fontWeight: "600",
  },
  priorityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "700",
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  value: {
    fontWeight: "500",
  },
  progressBar: {
    height: 12,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: BorderRadius.md,
  },
  infoGrid: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  infoItem: {
    flex: 1,
  },
  detailRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  detailContent: {
    flex: 1,
  },
});

