import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AttendanceScreen from "@/screens/AttendanceScreen";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type AttendanceStackParamList = {
  Attendance: undefined;
};

const Stack = createNativeStackNavigator<AttendanceStackParamList>();

export default function AttendanceStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          header: () => <ProfessionalHeader title="Attendance" showBackButton={true} />,
        }}
      />
    </Stack.Navigator>
  );
}
