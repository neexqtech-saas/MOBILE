import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Platform, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore, Holiday } from "@/store/hrmsStore";
import Spacer from "@/components/Spacer";
import { RefreshButton } from "@/components/RefreshButton";

export default function HolidayScreen() {
  const { theme } = useTheme();
  const { holidays, fetchHolidays } = useHRMSStore();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch holidays when screen loads
  useEffect(() => {
    const loadHolidays = async () => {
      setIsLoading(true);
      const result = await fetchHolidays();
      setIsLoading(false);
      if (!result.success) {
        console.error('Failed to fetch holidays:', result.error);
      }
    };
    loadHolidays();
  }, [fetchHolidays]);

  const sortedHolidays = [...holidays].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const getTypeColor = (type: Holiday["type"]) => {
    switch (type) {
      case "public":
        return Colors.dark.success;
      case "company":
        return Colors.dark.primary;
      case "optional":
        return Colors.dark.warning;
      default:
        return theme.textMuted;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getDay = (dateStr: string) => {
    return new Date(dateStr).getDate();
  };

  const getMonth = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short" });
  };


  if (isLoading) {
    return (
      <ScreenScrollView>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
          </View>
          <ThemedText style={styles.loadingText}>
            Loading holidays...
          </ThemedText>
        </View>
      </ScreenScrollView>
    );
  }

  const handleRefresh = async () => {
    setIsLoading(true);
    const result = await fetchHolidays();
    setIsLoading(false);
    if (!result.success) {
      console.error('Failed to fetch holidays:', result.error);
    }
  };

  return (
    <ScreenScrollView>
      <View style={styles.refreshHeader}>
        <View style={{ flex: 1 }} />
        <RefreshButton
          onPress={handleRefresh}
          isLoading={isLoading}
          label="Refresh"
        />
      </View>
      <Spacer height={Spacing.md} />
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleIconContainer}>
            <Feather name="calendar" size={22} color={Colors.dark.primary} />
          </View>
          <ThemedText type="h4" style={styles.sectionTitle}>
            All Holidays
          </ThemedText>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      {sortedHolidays.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Feather name="calendar" size={56} color={theme.textMuted} />
          </View>
          <ThemedText style={styles.emptyTitle}>No Holidays</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            No holidays found for this period
          </ThemedText>
        </View>
      ) : (
        sortedHolidays.map((holiday) => {
          const typeColor = getTypeColor(holiday.type);
          const isPast = new Date(holiday.date) < new Date();

          return (
            <View
              key={holiday.id}
              style={[
                styles.holidayCard,
                {
                  opacity: isPast ? 0.6 : 1,
                },
              ]}
            >
              <View style={styles.dateBox}>
                <View style={styles.dateBoxContainer}>
                  <ThemedText type="h3" style={styles.dateDay}>
                    {getDay(holiday.date)}
                  </ThemedText>
                  <ThemedText type="small" style={styles.dateMonth}>
                    {getMonth(holiday.date)}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.holidayDetails}>
                <ThemedText style={styles.holidayName}>{holiday.name}</ThemedText>
                <View style={styles.holidayMeta}>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: typeColor + "15", borderColor: typeColor + "40" },
                    ]}
                  >
                    <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
                    <ThemedText
                      type="small"
                      style={[styles.typeText, { color: typeColor }]}
                    >
                      {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}
                    </ThemedText>
                  </View>
                  <View style={styles.dateBadge}>
                    <Feather name="calendar" size={12} color={theme.textMuted} />
                    <ThemedText type="small" style={styles.dateText}>
                      {formatDate(holiday.date)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
          );
        })
      )}

      <Spacer height={Spacing["3xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  refreshHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing.md,
  },
  header: {
    paddingHorizontal: Spacing["2xl"],
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  titleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 24 : 20,
      default: 20,
    }),
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  holidayCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Platform.select({
      web: Dimensions.get('window').width > 768 ? Spacing.xl : Spacing.lg,
      default: Spacing.lg,
    }),
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.md,
    marginHorizontal: Spacing["2xl"],
    gap: Spacing.lg,
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      },
    }),
  },
  dateBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  dateBoxContainer: {
    width: Platform.select({
      web: Dimensions.get('window').width > 768 ? 64 : 56,
      default: 56,
    }),
    height: Platform.select({
      web: Dimensions.get('window').width > 768 ? 64 : 56,
      default: 56,
    }),
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.primary + "10",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.primary + "20",
  },
  dateDay: {
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 24 : 20,
      default: 20,
    }),
    fontWeight: "800",
    color: Colors.dark.primary,
    lineHeight: 28,
  },
  dateMonth: {
    color: Colors.dark.primary,
    fontWeight: "600",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: -2,
  },
  holidayDetails: {
    flex: 1,
    minWidth: 0,
  },
  holidayName: {
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 18 : 17,
      default: 17,
    }),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  holidayMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    borderWidth: 1,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typeText: {
    fontWeight: "700",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#F1F5F9",
  },
  dateText: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 11,
  },
  emptyState: {
    padding: Platform.select({
      web: Dimensions.get('window').width > 768 ? Spacing["3xl"] : Spacing["2xl"],
      default: Spacing["2xl"],
    }),
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    marginHorizontal: Spacing["2xl"],
    backgroundColor: "#F8FAFC",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["3xl"],
    minHeight: 200,
  },
  loadingIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.dark.primary + "10",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "500",
  },
});
