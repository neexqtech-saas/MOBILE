import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";
import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import AttendanceStackNavigator from "@/navigation/AttendanceStackNavigator";
import LeaveStackNavigator from "@/navigation/LeaveStackNavigator";
import TaskStackNavigator from "@/navigation/TaskStackNavigator";
import ProductionStackNavigator from "@/navigation/ProductionStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import ContactUsScreen from "@/screens/ContactUsScreen";
import HelpScreen from "@/screens/HelpScreen";
import AboutUsScreen from "@/screens/AboutUsScreen";
import { useTheme } from "@/hooks/useTheme";
import { Colors } from "@/constants/theme";

export type MainTabParamList = {
  HomeTab: undefined;
  AttendanceTab: undefined;
  LeaveTab: undefined;
  TaskTab: undefined;
  ProductionTab: undefined;
  ProfileTab: undefined;
  ContactUs: undefined;
  Help: undefined;
  About: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        tabBarActiveTintColor: "#FFB380",
        tabBarInactiveTintColor: "#757575",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1.5,
          borderTopColor: "#FFE0CC",
          elevation: 8,
          shadowColor: "#FFB380",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: Platform.OS === "ios" ? 88 : 70,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: "#FFE8CC",
        },
        headerTintColor: "#5D4037",
        headerTitleStyle: {
          color: "#5D4037",
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AttendanceTab"
        component={AttendanceStackNavigator}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="LeaveTab"
        component={LeaveStackNavigator}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="TaskTab"
        component={TaskStackNavigator}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="ProductionTab"
        component={ProductionStackNavigator}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="ContactUs"
        component={ContactUsScreen}
        options={{
          title: "Contact Us",
          tabBarIcon: ({ color, size }) => (
            <Feather name="mail" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Help"
        component={HelpScreen}
        options={{
          title: "Help",
          tabBarIcon: ({ color, size }) => (
            <Feather name="help-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="About"
        component={AboutUsScreen}
        options={{
          title: "About",
          tabBarIcon: ({ color, size }) => (
            <Feather name="info" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
