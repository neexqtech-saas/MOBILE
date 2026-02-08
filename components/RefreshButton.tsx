import React from "react";
import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface RefreshButtonProps {
  onPress: () => void | Promise<void>;
  isLoading?: boolean;
  label?: string;
}

export function RefreshButton({ onPress, isLoading = false, label = "Refresh" }: RefreshButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      style={({ pressed }) => [
        styles.refreshButton,
        { opacity: isLoading || pressed ? 0.7 : 1 },
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#2563EB" />
      ) : (
        <Feather name="refresh-cw" size={18} color="#2563EB" />
      )}
      <ThemedText type="small" style={styles.refreshButtonText}>
        {isLoading ? "Refreshing..." : label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: "#DBEAFE",
    backgroundColor: "#FFFFFF",
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
});

