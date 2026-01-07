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
import { apiService, MachineDowntimeAPI } from "@/services/api";

type MachineDowntimeScreenNavigationProp = NativeStackNavigationProp<
  ProductionStackParamList,
  "MachineDowntime"
>;

export default function MachineDowntimeScreen() {
  const navigation = useNavigation<MachineDowntimeScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();

  const [downtimes, setDowntimes] = useState<MachineDowntimeAPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDowntimes();
  }, []);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDowntimes();
    }, [])
  );

  const loadDowntimes = async () => {
    if (!employee.adminId || !employee.id) {
      Alert.alert("Error", "Employee information not found. Please login again.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.getMyMachineDowntimes(
        employee.adminId,
        employee.id
      );
      if (response.status === 200 && response.data) {
        setDowntimes(response.data);
      } else {
        console.error("Failed to load downtimes:", response.message);
      }
    } catch (error: any) {
      console.error("Error loading downtimes:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDowntimes();
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (isLoading && downtimes.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  const handleCreateNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("MachineDowntimeForm");
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
            <ThemedText style={styles.createButtonText}>Report</ThemedText>
          </Pressable>
        </View>
        <Spacer height={Spacing.md} />

        {/* Downtime List */}
        {downtimes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="alert-circle" size={48} color={theme.textMuted} />
            <Spacer height={Spacing.md} />
            <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
              No downtime records found
            </ThemedText>
          </View>
        ) : (
          downtimes.map((downtime) => (
            <View
              key={downtime.id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundDefault,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View>
                  <ThemedText type="h3" style={styles.machineName}>
                    {downtime.machine_name}
                  </ThemedText>
                  <View
                    style={[
                      styles.durationBadge,
                      { backgroundColor: Colors.dark.error + "20" },
                    ]}
                  >
                    <Feather name="clock" size={14} color={Colors.dark.error} />
                    <ThemedText
                      style={[styles.durationText, { color: Colors.dark.error }]}
                    >
                      {formatDuration(downtime.downtime_minutes)}
                    </ThemedText>
                  </View>
                </View>
              </View>

              <Spacer height={Spacing.md} />

              <View style={styles.cardBody}>
                <View style={styles.timeRow}>
                  <View style={styles.timeItem}>
                    <Feather name="play-circle" size={16} color={Colors.dark.success} />
                    <ThemedText style={[styles.timeText, { color: theme.textMuted }]}>
                      Start: {formatDateTime(downtime.start_time)}
                    </ThemedText>
                  </View>
                  <View style={styles.timeItem}>
                    <Feather name="stop-circle" size={16} color={Colors.dark.error} />
                    <ThemedText style={[styles.timeText, { color: theme.textMuted }]}>
                      End: {formatDateTime(downtime.end_time)}
                    </ThemedText>
                  </View>
                </View>

                <Spacer height={Spacing.sm} />

                <View style={styles.infoRow}>
                  <Feather name="alert-triangle" size={16} color={theme.textMuted} />
                  <ThemedText style={[styles.infoText, { color: theme.text }]}>
                    {downtime.downtime_reason}
                  </ThemedText>
                </View>

                {downtime.impact_on_production && (
                  <>
                    <Spacer height={Spacing.xs} />
                    <View style={styles.infoRow}>
                      <Feather name="trending-down" size={16} color={theme.textMuted} />
                      <ThemedText
                        style={[styles.infoText, { color: theme.textMuted }]}
                        numberOfLines={2}
                      >
                        {downtime.impact_on_production}
                      </ThemedText>
                    </View>
                  </>
                )}
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
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
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
  machineName: {
    fontWeight: "700",
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  durationText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardBody: {
    gap: Spacing.xs,
  },
  timeRow: {
    gap: Spacing.xs,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  timeText: {
    fontSize: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
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

