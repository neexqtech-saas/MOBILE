import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { ProductionStackParamList } from "@/navigation/ProductionStackNavigator";
import Spacer from "@/components/Spacer";
import { apiService, MachineAPI } from "@/services/api";

type MachineDetailScreenRouteProp = RouteProp<
  ProductionStackParamList,
  "MachineDetail"
>;

export default function MachineDetailScreen() {
  const route = useRoute<MachineDetailScreenRouteProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();
  const { machineId } = route.params;

  const [machine, setMachine] = useState<MachineAPI | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMachineDetails();
  }, [machineId]);

  const loadMachineDetails = async () => {
    if (!employee.adminId || !employee.id) {
      Alert.alert("Error", "Employee information not found. Please login again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get all assigned machines and find the one with matching ID
      const response = await apiService.getUserAssignedMachines(employee.adminId, employee.id);
      if (response.status === 200 && response.data) {
        const foundMachine = response.data.find((m) => m.id === machineId);
        if (foundMachine) {
          setMachine(foundMachine);
        } else {
          Alert.alert("Error", "Machine not found");
        }
      }
    } catch (error: any) {
      console.error("Error loading machine details:", error);
      Alert.alert("Error", error.message || "Failed to load machine details");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "operational":
        return Colors.dark.success;
      case "maintenance":
        return Colors.dark.warning;
      case "breakdown":
        return Colors.dark.error;
      case "idle":
        return Colors.dark.textMuted;
      default:
        return theme.textMuted;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Spacer height={Spacing.md} />
          <ThemedText style={{ color: theme.textMuted }}>Loading machine details...</ThemedText>
        </View>
      </View>
    );
  }

  if (!machine) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.emptyContainer}>
          <Feather name="alert-circle" size={48} color={theme.textMuted} />
          <Spacer height={Spacing.md} />
          <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
            Machine not found
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScreenScrollView>
        <Spacer height={Spacing.lg} />

        {/* Machine Header Card */}
        <View style={[styles.headerCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.iconContainer}>
            <Feather name="cpu" size={48} color={getStatusColor(machine.status)} />
          </View>
          <Spacer height={Spacing.md} />
          <ThemedText type="h2" style={styles.machineName}>
            {machine.name}
          </ThemedText>
          <ThemedText style={[styles.machineCode, { color: theme.textMuted }]}>
            Code: {machine.code}
          </ThemedText>
          <Spacer height={Spacing.md} />
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(machine.status) + "20" },
            ]}
          >
            <ThemedText
              style={[
                styles.statusText,
                { color: getStatusColor(machine.status) },
              ]}
            >
              {machine.status.charAt(0).toUpperCase() + machine.status.slice(1)}
            </ThemedText>
          </View>
        </View>

        <Spacer height={Spacing.lg} />

        {/* Details Card */}
        <View style={[styles.detailsCard, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Machine Information
          </ThemedText>
          <Spacer height={Spacing.md} />

          <View style={styles.detailRow}>
            <Feather name="hash" size={18} color={theme.textMuted} />
            <View style={styles.detailContent}>
              <ThemedText style={[styles.label, { color: theme.textMuted }]}>
                Machine Code
              </ThemedText>
              <ThemedText type="body" style={styles.value}>
                {machine.code}
              </ThemedText>
            </View>
          </View>

          <Spacer height={Spacing.md} />

          <View style={styles.detailRow}>
            <Feather name="tag" size={18} color={theme.textMuted} />
            <View style={styles.detailContent}>
              <ThemedText style={[styles.label, { color: theme.textMuted }]}>
                Machine Name
              </ThemedText>
              <ThemedText type="body" style={styles.value}>
                {machine.name}
              </ThemedText>
            </View>
          </View>

          <Spacer height={Spacing.md} />

          <View style={styles.detailRow}>
            <Feather name="activity" size={18} color={theme.textMuted} />
            <View style={styles.detailContent}>
              <ThemedText style={[styles.label, { color: theme.textMuted }]}>
                Status
              </ThemedText>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadgeSmall,
                    { backgroundColor: getStatusColor(machine.status) + "20" },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.statusTextSmall,
                      { color: getStatusColor(machine.status) },
                    ]}
                  >
                    {machine.status.charAt(0).toUpperCase() + machine.status.slice(1)}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        </View>

        <Spacer height={Spacing.xl} />
      </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerCard: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.primary + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  machineName: {
    fontWeight: "700",
    textAlign: "center",
  },
  machineCode: {
    fontSize: 16,
    textAlign: "center",
  },
  statusBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  detailsCard: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  detailContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  value: {
    fontWeight: "500",
  },
  statusContainer: {
    flexDirection: "row",
  },
  statusBadgeSmall: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusTextSmall: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});

