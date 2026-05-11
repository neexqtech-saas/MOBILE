import React from "react";
import { View, StyleSheet, Pressable, Alert, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import Spacer from "@/components/Spacer";

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  "Profile"
>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { theme, isDark } = useTheme();
  const { employee, logout } = useHRMSStore();

  const initial = employee?.name?.trim()?.charAt(0)?.toUpperCase() ?? "?";

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await logout();
            } catch (error) {
              console.error("Logout error:", error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Error", "Failed to logout. Please try again.", [{ text: "OK" }]);
            }
          },
        },
      ]
    );
  };

  const renderInfoCard = (
    icon: keyof typeof Feather.glyphMap,
    title: string,
    items: { label: string; value: string }[]
  ) => (
    <View
      style={[
        styles.infoCard,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
        <View style={styles.cardHeaderIcon}>
          <Feather name={icon} size={18} color={Colors.dark.primary} />
        </View>
        <ThemedText style={[styles.cardTitle, { color: theme.text }]}>{title}</ThemedText>
      </View>
      {items.map((item, index) => (
        <View
          key={index}
          style={[
            styles.infoRow,
            index !== items.length - 1 && [styles.infoRowBorder, { borderBottomColor: theme.border }],
          ]}
        >
          <ThemedText style={[styles.infoLabel, { color: theme.textMuted }]}>{item.label}</ThemedText>
          <ThemedText
            style={[styles.infoValue, { color: theme.text }]}
            numberOfLines={2}
          >
            {item.value || "—"}
          </ThemedText>
        </View>
      ))}
    </View>
  );

  return (
    <ScreenScrollView contentContainerStyle={styles.scrollContent}>
      {/* Profile hero */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.avatarWrap}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: Colors.dark.primary,
                borderColor: isDark ? theme.backgroundSecondary : "#FFFFFF",
              },
            ]}
          >
            <ThemedText style={styles.avatarInitial}>{initial}</ThemedText>
          </View>
        </View>
        <ThemedText style={[styles.displayName, { color: theme.text }]} numberOfLines={2}>
          {employee.name}
        </ThemedText>
        <ThemedText style={styles.rolePill} numberOfLines={1}>
          {employee.role}
        </ThemedText>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: isDark ? theme.backgroundSecondary : "#F1F5F9" }]}>
            <Feather name="hash" size={14} color={theme.textMuted} />
            <ThemedText style={[styles.badgeText, { color: theme.textMuted }]} numberOfLines={1}>
              {employee.employeeId}
            </ThemedText>
          </View>
          <View style={[styles.badge, { backgroundColor: isDark ? theme.backgroundSecondary : "#F1F5F9" }]}>
            <Feather name="briefcase" size={14} color={theme.textMuted} />
            <ThemedText style={[styles.badgeText, { color: theme.textMuted }]} numberOfLines={1}>
              {employee.department}
            </ThemedText>
          </View>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate("Settings");
        }}
        style={({ pressed }) => [
          styles.settingsRow,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <View style={styles.settingsRowLeft}>
          <View style={styles.settingsIconBox}>
            <Feather name="settings" size={20} color={Colors.dark.primary} />
          </View>
          <View>
            <ThemedText style={[styles.settingsTitle, { color: theme.text }]}>Settings</ThemedText>
            <ThemedText style={[styles.settingsSubtitle, { color: theme.textMuted }]}>
              Account & preferences
            </ThemedText>
          </View>
        </View>
        <Feather name="chevron-right" size={22} color={theme.textMuted} />
      </Pressable>

      <Spacer height={Spacing.xl} />

      {renderInfoCard("user", "Personal details", [
        { label: "Email", value: employee.email },
        { label: "Phone", value: employee.phone },
        { label: "Address", value: employee.address },
      ])}

      <Spacer height={Spacing["2xl"]} />

      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => [
          styles.logoutButton,
          {
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <Feather name="log-out" size={20} color="#DC2626" />
        <ThemedText style={styles.logoutLabel}>Log out</ThemedText>
      </Pressable>

      <Spacer height={Spacing["3xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing["2xl"],
  },
  heroCard: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
      web: { boxShadow: "0 2px 12px rgba(15, 23, 42, 0.06)" },
    }),
  },
  avatarWrap: {
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      web: { boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)" },
    }),
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  displayName: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.35,
    textAlign: "center",
    marginTop: Spacing.sm,
    maxWidth: "100%",
  },
  rolePill: {
    marginTop: Spacing.sm,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.primary,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    maxWidth: "100%",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    maxWidth: "100%",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      web: { boxShadow: "0 1px 8px rgba(15, 23, 42, 0.05)" },
    }),
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
    minWidth: 0,
  },
  settingsIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.primary + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  settingsSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  infoCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      web: { boxShadow: "0 1px 8px rgba(15, 23, 42, 0.05)" },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cardHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.primary + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.25,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: {
    ...Typography.small,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    width: "32%",
    minWidth: 72,
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.1,
    textAlign: "right",
    lineHeight: 21,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: Spacing.buttonHeight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    gap: Spacing.sm,
  },
  logoutLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#DC2626",
    letterSpacing: -0.1,
  },
});
