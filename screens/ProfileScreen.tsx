import React from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import Spacer from "@/components/Spacer";

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  "Profile"
>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee, logout } = useHRMSStore();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => logout(),
        },
      ]
    );
  };

  const renderInfoCard = (
    icon: keyof typeof Feather.glyphMap,
    title: string,
    items: { label: string; value: string }[]
  ) => (
    <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.cardHeader}>
        <Feather name={icon} size={20} color={Colors.dark.primary} />
        <ThemedText type="h4">{title}</ThemedText>
      </View>
      {items.map((item, index) => (
        <View
          key={index}
          style={[
            styles.infoRow,
            index !== items.length - 1 && styles.infoRowBorder,
          ]}
        >
          <ThemedText type="small" style={{ color: theme.textMuted }}>
            {item.label}
          </ThemedText>
          <ThemedText style={{ flex: 1, textAlign: "right" }} numberOfLines={1}>
            {item.value}
          </ThemedText>
        </View>
      ))}
    </View>
  );

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <View
          style={[styles.avatar, { backgroundColor: Colors.dark.primary }]}
        >
          <ThemedText type="h1" style={{ color: "#000000" }}>
            {employee.name.charAt(0)}
          </ThemedText>
        </View>
        <ThemedText type="h2" style={styles.name}>
          {employee.name}
        </ThemedText>
        <ThemedText style={{ color: Colors.dark.primary }}>
          {employee.role}
        </ThemedText>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="hash" size={14} color={theme.textMuted} />
            <ThemedText type="small" style={{ color: theme.textMuted }}>
              {employee.employeeId}
            </ThemedText>
          </View>
          <View style={[styles.badge, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="briefcase" size={14} color={theme.textMuted} />
            <ThemedText type="small" style={{ color: theme.textMuted }}>
              {employee.department}
            </ThemedText>
          </View>
        </View>
      </View>

      <Spacer height={Spacing.xl} />

      <Pressable
        onPress={() => navigation.navigate("Settings")}
        style={({ pressed }) => [
          styles.settingsButton,
          { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <View style={styles.settingsButtonContent}>
          <Feather name="settings" size={20} color={theme.text} />
          <ThemedText>Settings</ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textMuted} />
      </Pressable>

      <Spacer height={Spacing.xl} />

      {renderInfoCard("user", "Personal Details", [
        { label: "Email", value: employee.email },
        { label: "Phone", value: employee.phone },
        { label: "Address", value: employee.address },
      ])}

      <Spacer height={Spacing["2xl"]} />

      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => [
          styles.logoutButton,
          { borderColor: Colors.dark.error, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Feather name="log-out" size={20} color={Colors.dark.error} />
        <ThemedText style={{ color: Colors.dark.error, fontWeight: "600" }}>
          Logout
        </ThemedText>
      </Pressable>

      <Spacer height={Spacing["3xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  badgeRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  settingsButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    gap: Spacing.sm,
  },
});
