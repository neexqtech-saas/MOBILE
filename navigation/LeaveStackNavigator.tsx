import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LeaveScreen from "@/screens/LeaveScreen";
import ApplyLeaveScreen from "@/screens/ApplyLeaveScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type LeaveStackParamList = {
  Leave: undefined;
  ApplyLeave: { leaveTypeId?: number; leaveTypeName?: string };
};

const Stack = createNativeStackNavigator<LeaveStackParamList>();

export default function LeaveStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Leave"
        component={LeaveScreen}
        options={{
          title: "Leave Management",
        }}
      />
      <Stack.Screen
        name="ApplyLeave"
        component={ApplyLeaveScreen}
        options={{
          title: "Apply Leave",
          headerTransparent: false,
          headerStyle: {
            backgroundColor: "#FFE8CC",
          },
          headerTintColor: "#5D4037",
          headerTitleStyle: {
            color: "#5D4037",
            fontWeight: "600",
          },
        }}
      />
    </Stack.Navigator>
  );
}
