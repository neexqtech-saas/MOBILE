import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import ProfileScreen from "@/screens/ProfileScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import ChangePasswordScreen from "@/screens/ChangePasswordScreen";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import type { MainTabParamList } from "@/navigation/MainTabNavigator";

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
  ChangePassword: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

function MyProfileHeader() {
  const navigation = useNavigation();
  return (
    <ProfessionalHeader
      title="My Profile"
      showBackButton
      onBackPress={() => {
        const tab = navigation.getParent() as BottomTabNavigationProp<MainTabParamList> | undefined;
        tab?.navigate("HomeTab");
      }}
    />
  );
}

export default function ProfileStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          header: () => <MyProfileHeader />,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          header: () => <ProfessionalHeader title="Settings" />,
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          header: () => <ProfessionalHeader title="Change Password" />,
        }}
      />
    </Stack.Navigator>
  );
}
