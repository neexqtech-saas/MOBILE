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
import { apiService, MaterialReturnAPI } from "@/services/api";

type MaterialReturnsScreenNavigationProp = NativeStackNavigationProp<
  ProductionStackParamList,
  "MaterialReturns"
>;

export default function MaterialReturnsScreen() {
  const navigation = useNavigation<MaterialReturnsScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();

  const [returns, setReturns] = useState<MaterialReturnAPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadReturns();
  }, []);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadReturns();
    }, [])
  );

  const loadReturns = async () => {
    if (!employee.adminId || !employee.id) {
      Alert.alert("Error", "Employee information not found. Please login again.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.getMyMaterialReturns(
        employee.adminId,
        employee.id
      );
      if (response.status === 200 && response.data) {
        setReturns(response.data);
      } else {
        console.error("Failed to load returns:", response.message);
      }
    } catch (error: any) {
      console.error("Error loading returns:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReturns();
  };

  const handleCreateNew = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("MaterialReturnForm");
  };

  if (isLoading && returns.length === 0) {
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
            <ThemedText style={styles.createButtonText}>New</ThemedText>
          </Pressable>
        </View>
        <Spacer height={Spacing.md} />

        {/* Returns List */}
        {returns.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="rotate-ccw" size={48} color={theme.textMuted} />
            <Spacer height={Spacing.md} />
            <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
              No material returns found
            </ThemedText>
          </View>
        ) : (
          returns.map((ret) => (
            <View
              key={ret.id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.backgroundDefault,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View>
                  <ThemedText type="h3" style={styles.returnNumber}>
                    {ret.return_number}
                  </ThemedText>
                  <ThemedText style={[styles.date, { color: theme.textMuted }]}>
                    {new Date(ret.return_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </ThemedText>
                </View>
              </View>

              <Spacer height={Spacing.md} />

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Feather name="package" size={16} color={theme.textMuted} />
                  <ThemedText style={[styles.infoText, { color: theme.text }]}>
                    {ret.material_name}
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="trending-down" size={16} color={theme.textMuted} />
                  <ThemedText style={[styles.infoText, { color: theme.text }]}>
                    Quantity: {ret.return_qty}
                  </ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="message-circle" size={16} color={theme.textMuted} />
                  <ThemedText style={[styles.infoText, { color: theme.textMuted }]}>
                    {ret.return_reason}
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
  returnNumber: {
    fontWeight: "700",
  },
  date: {
    fontSize: 12,
    marginTop: Spacing.xs,
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

