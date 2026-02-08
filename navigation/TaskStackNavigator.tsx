import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TaskScreen from "@/screens/TaskScreen";
import TaskDetailScreen from "@/screens/TaskDetailScreen";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type TaskStackParamList = {
  Tasks: undefined;
  TaskDetail: { taskId: string };
};

const Stack = createNativeStackNavigator<TaskStackParamList>();

export default function TaskStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Tasks"
        component={TaskScreen}
        options={{
          header: () => <ProfessionalHeader title="My Tasks" showBackButton={true} />,
        }}
      />
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{
          header: () => <ProfessionalHeader title="Task Details" />,
        }}
      />
    </Stack.Navigator>
  );
}
