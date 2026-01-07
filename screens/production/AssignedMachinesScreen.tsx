import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Alert, RefreshControl } from "react-native";
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
import { apiService, MachineAPI } from "@/services/api";

type AssignedMachinesScreenNavigationProp = NativeStackNavigationProp<
  ProductionStackParamList,
  "AssignedMachines"
>;

export default function AssignedMachinesScreen() {
  const navigation = useNavigation<AssignedMachinesScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();

  const [machines, setMachines] = useState<MachineAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadMachines();
  }, []);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadMachines();
    }, [])
  );

  const loadMachines = async () => {
    if (!employee.adminId || !employee.id) {
      Alert.alert("Error", "Employee information not found. Please login again.");
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log("AssignedMachinesScreen: Loading machines for:", {
        adminId: employee.adminId,
        userId: employee.id,
      });
      const response = await apiService.getUserAssignedMachines(employee.adminId, employee.id);
      console.log("AssignedMachinesScreen: API Response:", {
        status: response.status,
        hasData: !!response.data,
        dataLength: response.data?.length || 0,
      });
      
      if (response.status === 200 && response.data) {
        setMachines(response.data);
        console.log("AssignedMachinesScreen: Machines loaded:", response.data.length);
      } else {
        console.log("AssignedMachinesScreen: No machines found or error:", response.message);
        setMachines([]);
      }
    } catch (error: any) {
      console.error("AssignedMachinesScreen: Error loading machines:", error);
      setMachines([]);
      // Don't show alert on initial load, just log
      if (!isLoading) {
        Alert.alert("Error", error.message || "Failed to load machines");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMachines();
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

  const handleMachinePress = (machine: MachineAPI) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("MachineDetail", { machineId: machine.id });
  };

  if (isLoading && machines.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Spacer height={Spacing.md} />
          <ThemedText style={{ color: theme.textMuted }}>Loading machines...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScreenScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {isLoading && machines.length === 0 ? (
          <>
            <Spacer height={Spacing["5xl"]} />
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
              <Spacer height={Spacing.md} />
              <ThemedText style={{ textAlign: "center", color: theme.textMuted }}>
                Loading machines...
              </ThemedText>
            </View>
            <Spacer height={Spacing["5xl"]} />
          </>
        ) : (
          <>
            <Spacer height={Spacing.lg} />
            <RefreshButton onPress={handleRefresh} isLoading={isRefreshing} />
            <Spacer height={Spacing.md} />

            {/* Header */}
            <View style={styles.header}>
              <ThemedText type="h2" style={styles.title}>
                Assigned Machines
              </ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textMuted }]}>
                {machines.length} machine{machines.length !== 1 ? "s" : ""} assigned
              </ThemedText>
            </View>

            <Spacer height={Spacing.lg} />

        {/* Machines List */}
        {machines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="cpu" size={48} color={theme.textMuted} />
            <Spacer height={Spacing.md} />
            <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
              No machines assigned
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: theme.textMuted }]}>
              Contact your administrator to assign machines
            </ThemedText>
          </View>
        ) : (
          machines.map((machine) => (
            <Pressable
              key={machine.id}
              onPress={() => handleMachinePress(machine)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderLeftColor: getStatusColor(machine.status),
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.iconContainer}>
                    <Feather name="cpu" size={24} color={getStatusColor(machine.status)} />
                  </View>
                  <View style={styles.machineInfo}>
                    <ThemedText type="h3" style={styles.machineName}>
                      {machine.name}
                    </ThemedText>
                    <ThemedText style={[styles.machineCode, { color: theme.textMuted }]}>
                      Code: {machine.code}
                    </ThemedText>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textMuted} />
              </View>

              <Spacer height={Spacing.sm} />

              <View style={styles.statusContainer}>
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
            </Pressable>
          ))
        )}
          </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
  },
  emptyContainer: {
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
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.xs,
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
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary + "10",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  machineInfo: {
    flex: 1,
  },
  machineName: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  machineCode: {
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});

