import React from "react";
import { View, StyleSheet, Pressable, Platform, Image } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

interface ProfessionalHeaderProps {
  title?: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
}

export function ProfessionalHeader({ 
  title, 
  showBackButton = true,
  rightComponent 
}: ProfessionalHeaderProps) {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Check if we can go back
  const canGoBack = navigation.canGoBack();
  
  // Get title from route params or use provided title
  const displayTitle = title || route.name;

  const handleBackPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (canGoBack) {
      navigation.goBack();
    }
  };

  return (
    <View 
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundRoot || "#FFFFFF",
          paddingTop: insets.top,
          borderBottomColor: "#E2E8F0",
        }
      ]}
    >
      <View style={styles.content}>
        {/* Left Section - Back Button */}
        <View style={styles.leftSection}>
          {showBackButton && canGoBack && (
            <Pressable
              onPress={handleBackPress}
              style={({ pressed }) => [
                styles.backButton,
                {
                  backgroundColor: pressed ? "#F3F4F6" : "transparent",
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather 
                name="arrow-left" 
                size={22} 
                color={theme.text || "#0F172A"} 
              />
            </Pressable>
          )}
        </View>

        {/* Center Section - Logo and Title */}
        <View style={styles.centerSection}>
          {!title && route.name === "Home" ? (
            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/images/logo4.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          ) : (
            <ThemedText style={[styles.title, { color: theme.text || "#0F172A" }]}>
              {displayTitle}
            </ThemedText>
          )}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightComponent}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
      },
    }),
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: Spacing.lg,
  },
  leftSection: {
    width: 48,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
  },
  rightSection: {
    width: 48,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
      },
    }),
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
  },
  logo: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
    textAlign: "center",
  },
});
