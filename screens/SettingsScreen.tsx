import React from "react";
import { View, StyleSheet, Pressable, Switch, Linking, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import Constants from "expo-constants";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";

interface SettingItem {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  type: "toggle" | "link" | "info";
  value?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
}

export default function SettingsScreen() {
  const { theme } = useTheme();

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  const settingItems: SettingItem[] = [
    {
      icon: "help-circle",
      title: "Help Center",
      subtitle: "FAQs and support articles",
      type: "link",
      onPress: () => {
        Alert.alert(
          "Help Center",
          "Visit our help center for FAQs, tutorials, and support documentation on all neexQ hrms features.",
          [{ text: "Got it" }]
        );
      },
    },
    {
      icon: "mail",
      title: "Contact HR",
      subtitle: "Get in touch with HR team",
      type: "link",
      onPress: () => Linking.openURL("mailto:hr@company.com"),
    },
    {
      icon: "info",
      title: "App Version",
      subtitle: `v${appVersion}`,
      type: "info",
    },
  ];

  const renderSettingItem = (item: SettingItem, index: number) => {
    const content = (
      <View
        style={[
          styles.settingItem,
          { backgroundColor: theme.backgroundDefault },
          index === 0 && styles.firstItem,
          index === settingItems.length - 1 && styles.lastItem,
        ]}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.iconContainer, { backgroundColor: Colors.dark.primary + "20" }]}>
            <Feather name={item.icon} size={20} color={Colors.dark.primary} />
          </View>
          <View style={styles.settingText}>
            <ThemedText style={{ fontWeight: "500" }}>{item.title}</ThemedText>
            {item.subtitle ? (
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                {item.subtitle}
              </ThemedText>
            ) : null}
          </View>
        </View>
        {item.type === "toggle" ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: theme.border, true: Colors.dark.primary + "60" }}
            thumbColor={item.value ? Colors.dark.primary : "#f4f3f4"}
          />
        ) : item.type === "link" ? (
          <Feather name="chevron-right" size={20} color={theme.textMuted} />
        ) : null}
      </View>
    );

    if (item.type === "link") {
      return (
        <Pressable
          key={item.title}
          onPress={item.onPress}
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          {content}
        </Pressable>
      );
    }

    return <View key={item.title}>{content}</View>;
  };

  return (
    <ScreenScrollView>
      <View style={styles.settingsGroup}>
        {settingItems.map((item, index) => renderSettingItem(item, index))}
      </View>

      <Spacer height={Spacing["2xl"]} />

      <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="shield" size={24} color={Colors.dark.primary} />
        <View style={styles.infoContent}>
          <ThemedText style={{ fontWeight: "600" }}>Privacy & Security</ThemedText>
          <ThemedText type="small" style={{ color: theme.textMuted, marginTop: Spacing.xs }}>
            Your data is encrypted and stored securely. We never share your personal information with third parties.
          </ThemedText>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <View style={styles.linksRow}>
        <Pressable
          onPress={() => {
            Alert.alert(
              "Terms of Service",
              "By using neexQ hrms, you agree to our terms and conditions. This includes responsible use of employee data and compliance with company policies.",
              [{ text: "Agree" }]
            );
          }}
          style={styles.linkButton}
        >
          <ThemedText type="small" style={{ color: Colors.dark.primary }}>
            Terms of Service
          </ThemedText>
        </Pressable>
        <ThemedText style={{ color: theme.textMuted }}>|</ThemedText>
        <Pressable
          onPress={() => {
            Alert.alert(
              "Privacy Policy",
              "Your privacy is important to us. All personal information is encrypted and protected according to industry standards.",
              [{ text: "OK" }]
            );
          }}
          style={styles.linkButton}
        >
          <ThemedText type="small" style={{ color: Colors.dark.primary }}>
            Privacy Policy
          </ThemedText>
        </Pressable>
      </View>

      <Spacer height={Spacing["3xl"]} />

      <View style={styles.footer}>
        <ThemedText type="small" style={{ color: theme.textMuted }}>
          neexQ hrms
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textMuted }}>
          Made with care for employees everywhere
        </ThemedText>
      </View>

      <Spacer height={Spacing["2xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  settingsGroup: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.1)",
  },
  firstItem: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  lastItem: {
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  settingText: {
    flex: 1,
  },
  infoCard: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  linksRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  linkButton: {
    padding: Spacing.xs,
  },
  footer: {
    alignItems: "center",
    gap: Spacing.xs,
  },
});
