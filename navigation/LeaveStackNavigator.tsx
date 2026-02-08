import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LeaveScreen from "@/screens/LeaveScreen";
import ApplyLeaveScreen from "@/screens/ApplyLeaveScreen";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
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
          header: () => <ProfessionalHeader title="Leave Management" showBackButton={true} />,
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
