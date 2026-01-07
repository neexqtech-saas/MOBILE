import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TaskScreen from "@/screens/TaskScreen";
import TaskDetailScreen from "@/screens/TaskDetailScreen";
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
          title: "My Tasks",
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
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{
          title: "Task Details",
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
