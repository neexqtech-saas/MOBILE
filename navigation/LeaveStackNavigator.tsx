import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import LeaveScreen from "@/screens/LeaveScreen";
import ApplyLeaveScreen from "@/screens/ApplyLeaveScreen";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import type { MainTabParamList } from "@/navigation/MainTabNavigator";

export type LeaveStackParamList = {
  Leave: undefined;
  ApplyLeave: { leaveTypeId?: number; leaveTypeName?: string };
};

const Stack = createNativeStackNavigator<LeaveStackParamList>();

function LeaveManagementHeader() {
  const navigation = useNavigation();
  return (
    <ProfessionalHeader
      title="Leave Management"
      showBackButton
      onBackPress={() => {
        const tab = navigation.getParent() as BottomTabNavigationProp<MainTabParamList> | undefined;
        tab?.navigate("HomeTab");
      }}
    />
  );
}

export default function LeaveStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Leave"
        component={LeaveScreen}
        options={{
          header: () => <LeaveManagementHeader />,
        }}
      />
      <Stack.Screen
        name="ApplyLeave"
        component={ApplyLeaveScreen}
        options={{
          header: () => <ProfessionalHeader title="Apply Leave" />,
        }}
      />
    </Stack.Navigator>
  );
}
