import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import TaskScreen from "@/screens/TaskScreen";
import TaskDetailScreen from "@/screens/TaskDetailScreen";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import type { MainTabParamList } from "@/navigation/MainTabNavigator";

export type TaskStackParamList = {
  Tasks: undefined;
  TaskDetail: { taskId: string };
};

const Stack = createNativeStackNavigator<TaskStackParamList>();

function MyTasksHeader() {
  const navigation = useNavigation();
  return (
    <ProfessionalHeader
      title="My Tasks"
      showBackButton
      onBackPress={() => {
        const tab = navigation.getParent() as BottomTabNavigationProp<MainTabParamList> | undefined;
        tab?.navigate("HomeTab");
      }}
    />
  );
}

export default function TaskStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Tasks"
        component={TaskScreen}
        options={{
          header: () => <MyTasksHeader />,
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
