import React from "react";
import { View, StyleSheet, Image, Linking, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Constants from "expo-constants";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";

export default function AboutUsScreen() {
  const { theme } = useTheme();
  const appVersion = Constants.expoConfig?.version || "1.0.0";

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/images/logo4.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <ThemedText type="h2" style={styles.title}>
          About neexQ hrms
        </ThemedText>
        <ThemedText style={[styles.description, { color: theme.textMuted }]}>
          A comprehensive Human Resource Management System designed to streamline your workplace operations.
        </ThemedText>

        <Spacer height={Spacing["2xl"]} />

        <View style={[styles.infoCard, { backgroundColor: "#FFFFFF", borderColor: "#FFE0CC" }]}>
          <Feather name="info" size={24} color="#FFB380" />
          <View style={styles.infoContent}>
            <ThemedText style={styles.infoTitle}>App Version</ThemedText>
            <ThemedText style={[styles.infoValue, { color: theme.textMuted }]}>
              v{appVersion}
            </ThemedText>
          </View>
        </View>

        <Spacer height={Spacing.lg} />

        <View style={[styles.infoCard, { backgroundColor: "#FFFFFF", borderColor: "#FFE0CC" }]}>
          <Feather name="shield" size={24} color="#FFB380" />
          <View style={styles.infoContent}>
            <ThemedText style={styles.infoTitle}>Privacy & Security</ThemedText>
            <ThemedText style={[styles.infoValue, { color: theme.textMuted }]}>
              Your data is encrypted and secure
            </ThemedText>
          </View>
        </View>

        <Spacer height={Spacing["2xl"]} />

        <View style={styles.linksSection}>
          <Pressable
            onPress={() => {
              // Terms of Service
            }}
            style={styles.linkButton}
          >
            <ThemedText style={[styles.linkText, { color: "#FFB380" }]}>
              Terms of Service
            </ThemedText>
          </Pressable>
          <ThemedText style={{ color: theme.textMuted }}>|</ThemedText>
          <Pressable
            onPress={() => {
              // Privacy Policy
            }}
            style={styles.linkButton}
          >
            <ThemedText style={[styles.linkText, { color: "#FFB380" }]}>
              Privacy Policy
            </ThemedText>
          </Pressable>
        </View>

        <Spacer height={Spacing["3xl"]} />

        <ThemedText style={[styles.copyright, { color: theme.textMuted }]}>
          © 2025 neexQ hrms. All rights reserved.
        </ThemedText>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing["2xl"],
    alignItems: "center",
  },
  logoContainer: {
    marginBottom: Spacing.xl,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFE0CC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#FFE8CC",
    padding: Spacing.md,
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#424242",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    width: "100%",
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
  },
  linksSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  linkButton: {
    padding: Spacing.xs,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "500",
  },
  copyright: {
    fontSize: 12,
    textAlign: "center",
  },
});

