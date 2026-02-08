import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { MainTabParamList } from "@/navigation/MainTabNavigator";
import { useHRMSStore } from "@/store/hrmsStore";
import { Spacing } from "@/constants/theme";

type HeaderRightNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>;

export function HeaderRight() {
  const navigation = useNavigation<HeaderRightNavigationProp>();
  const { employee, announcements } = useHRMSStore();
  const unreadCount = announcements.filter((a) => !a.isRead).length;

  return (
    <View style={styles.container}>
      {/* Bell Icon - Disabled/Locked */}
      <View
        style={[styles.iconButton, { opacity: 0.5 }]}
      >
        <Feather name="bell" size={24} color="#5D4037" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
          </View>
        )}
      </View>

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
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F44336",
    borderWidth: 2,
    borderColor: "#EFF6FF",
  },
  badgeDot: {
    flex: 1,
    borderRadius: 5,
    backgroundColor: "#F44336",
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

