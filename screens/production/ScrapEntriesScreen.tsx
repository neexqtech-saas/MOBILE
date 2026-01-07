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
import { apiService, ScrapEntryAPI } from "@/services/api";

type ScrapEntriesScreenNavigationProp = NativeStackNavigationProp<
  ProductionStackParamList,
  "ScrapEntries"
>;

export default function ScrapEntriesScreen() {
  const navigation = useNavigation<ScrapEntriesScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();

  const [scrapEntries, setScrapEntries] = useState<ScrapEntryAPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadScrapEntries();
  }, []);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadScrapEntries();
    }, [])
  );

  const loadScrapEntries = async () => {
    if (!employee.adminId || !employee.id) {
      Alert.alert("Error", "Employee information not found. Please login again.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.getMyScrapEntries(
        employee.adminId,
        employee.id
      );
      if (response.status === 200 && response.data) {
        setScrapEntries(response.data);
      } else {
        console.error("Failed to load scrap entries:", response.message);
      }
    } catch (error: any) {
      console.error("Error loading scrap entries:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadScrapEntries();
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

  if (isLoading && scrapEntries.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  const handleCreateNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("ScrapEntryForm");
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

        {/* Scrap Entries List */}
        {scrapEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="trash-2" size={48} color={theme.textMuted} />
            <Spacer height={Spacing.md} />
            <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
              No scrap entries found
            </ThemedText>
          </View>
        ) : (
          scrapEntries.map((entry) => (
            <View
              key={entry.id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundDefault,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View>
                  <ThemedText type="h3" style={styles.productName}>
                    {entry.product_name}
                  </ThemedText>
                  <ThemedText style={[styles.date, { color: theme.textMuted }]}>
                    {formatDateTime(entry.scrap_date)}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.qtyBadge,
                    { backgroundColor: Colors.dark.error + "20" },
                  ]}
                >
                  <ThemedText
                    style={[styles.qtyText, { color: Colors.dark.error }]}
                  >
                    {entry.qty}
                  </ThemedText>
                </View>
              </View>

              <Spacer height={Spacing.md} />

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Feather name="cpu" size={16} color={theme.textMuted} />
                  <ThemedText style={[styles.infoText, { color: theme.text }]}>
                    {entry.machine_name}
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="alert-triangle" size={16} color={theme.textMuted} />
                  <ThemedText style={[styles.infoText, { color: theme.text }]}>
                    {entry.reason.replace("_", " ").toUpperCase()}
                  </ThemedText>
                </View>
                {entry.reason_description && (
                  <View style={styles.infoRow}>
                    <Feather name="message-circle" size={16} color={theme.textMuted} />
                    <ThemedText
                      style={[styles.infoText, { color: theme.textMuted }]}
                      numberOfLines={2}
                    >
                      {entry.reason_description}
                    </ThemedText>
                  </View>
                )}
                {entry.scrap_cost && (
                  <View style={styles.infoRow}>
                    <Feather name="dollar-sign" size={16} color={theme.textMuted} />
                    <ThemedText style={[styles.infoText, { color: Colors.dark.error }]}>
                      Cost: ₹{entry.scrap_cost.toFixed(2)}
                    </ThemedText>
                  </View>
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
  productName: {
    fontWeight: "700",
  },
  date: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  qtyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: "700",
  },
  cardBody: {
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
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

