import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { MainTabParamList } from "@/navigation/MainTabNavigator";
import { useHRMSStore } from "@/store/hrmsStore";
import { Spacing, Colors } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";

type HeaderRightNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>;

export function HeaderRight() {
  const navigation = useNavigation<HeaderRightNavigationProp>();
  const { employee, unreadNotificationsCount } = useHRMSStore();

  return (
    <View style={styles.container}>
      {/* Bell Icon - Enabled */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate("Notifications");
        }}
        style={({ pressed }) => [
          styles.iconButton,
          { opacity: pressed ? 0.7 : 1 }
        ]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="bell" size={24} color="#2563EB" />
        {unreadNotificationsCount > 0 && (
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </ThemedText>
          </View>
        )}
      </Pressable>

      {/* Profile Icon */}
      <Pressable
        onPress={() => navigation.navigate("ProfileTab")}
        style={styles.profileButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {employee.avatar ? (
          <Image source={{ uri: employee.avatar }} style={styles.profileImage} />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Feather name="user" size={20} color="#5D4037" />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingRight: Spacing.md,
  },
  iconButton: {
    position: "relative",
    padding: Spacing.xs,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#F44336",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "700",
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#2563EB",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  profilePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
