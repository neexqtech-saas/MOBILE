import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeStackNavigator from "@/navigation/HomeStackNavigator";
import AttendanceStackNavigator from "@/navigation/AttendanceStackNavigator";
import LeaveStackNavigator from "@/navigation/LeaveStackNavigator";
import TaskStackNavigator from "@/navigation/TaskStackNavigator";
import ProductionStackNavigator from "@/navigation/ProductionStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import ContactUsScreen from "@/screens/ContactUsScreen";
import HelpScreen from "@/screens/HelpScreen";
import AboutUsScreen from "@/screens/AboutUsScreen";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";

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
  const insets = useSafeAreaInsets();
  // Room for icon + label above home indicator / Android gesture bar (labels were clipping)
  const tabBarTopPad = 4;
  const bottomInset = Math.max(insets.bottom, Platform.OS === "android" ? 12 : 0);
  const tabBarBottomPad = bottomInset + (Platform.OS === "ios" ? 6 : 8);
  const tabBarContentMin = 54;
  const tabBarHeight = tabBarContentMin + tabBarTopPad + tabBarBottomPad;

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#757575",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1.5,
          borderTopColor: "#DBEAFE",
          elevation: 8,
          shadowColor: "#2563EB",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: tabBarHeight,
          paddingBottom: tabBarBottomPad,
          paddingTop: tabBarTopPad,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: "#EFF6FF",
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
          title: "",
          tabBarButton: () => null,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="LeaveTab"
        component={LeaveStackNavigator}
        options={{
          title: "",
          tabBarButton: () => null,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="TaskTab"
        component={TaskStackNavigator}
        options={{
          title: "",
          tabBarButton: () => null,
          headerShown: false,
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
          title: "",
          tabBarButton: () => null,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ContactUs"
        component={ContactUsScreen}
        options={{
          header: () => <ProfessionalHeader title="Contact Us" showBackButton={false} />,
          tabBarIcon: ({ color, size }) => (
            <Feather name="mail" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Help"
        component={HelpScreen}
        options={{
          header: () => <ProfessionalHeader title="Help" showBackButton={false} />,
          tabBarIcon: ({ color, size }) => (
            <Feather name="help-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="About"
        component={AboutUsScreen}
        options={{
          header: () => <ProfessionalHeader title="About" showBackButton={false} />,
          tabBarIcon: ({ color, size }) => (
            <Feather name="info" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
