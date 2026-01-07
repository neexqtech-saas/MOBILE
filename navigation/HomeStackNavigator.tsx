import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "@/screens/HomeScreen";
import PayrollScreen from "@/screens/PayrollScreen";
import HolidayScreen from "@/screens/HolidayScreen";
import AnnouncementScreen from "@/screens/AnnouncementScreen";
import ExpenseScreen from "@/screens/ExpenseScreen";
import CreateExpenseScreen from "@/screens/CreateExpenseScreen";
import VisitScreen from "@/screens/VisitScreen";
import CreateVisitScreen from "@/screens/CreateVisitScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { HeaderRight } from "@/components/HeaderRight";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type HomeStackParamList = {
  Home: undefined;
  Payroll: undefined;
  Holidays: undefined;
  Announcements: undefined;
  Expenses: undefined;
  CreateExpense: undefined;
  Visits: undefined;
  CreateVisit: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => <HeaderTitle title="" />,
          headerRight: () => <HeaderRight />,
          headerTitleAlign: "left",
          headerStyle: {
            backgroundColor: "#FFE8CC",
          },
          headerTintColor: "#5D4037",
          headerTitleStyle: {
            color: "#5D4037",
          },
        }}
      />
      <Stack.Screen
        name="Payroll"
        component={PayrollScreen}
        options={{ headerTitle: "Payroll" }}
      />
      <Stack.Screen
        name="Holidays"
        component={HolidayScreen}
        options={{ headerTitle: "Holidays" }}
      />
      <Stack.Screen
        name="Announcements"
        component={AnnouncementScreen}
        options={{ headerTitle: "Announcements" }}
      />
      <Stack.Screen
        name="Expenses"
        component={ExpenseScreen}
        options={{ headerTitle: "Expenses" }}
      />
      <Stack.Screen
        name="CreateExpense"
        component={CreateExpenseScreen}
        options={{ headerTitle: "Create Expense" }}
      />
      <Stack.Screen
        name="Visits"
        component={VisitScreen}
        options={{ headerTitle: "Visits" }}
      />
      <Stack.Screen
        name="CreateVisit"
        component={CreateVisitScreen}
        options={{ headerTitle: "Create Visit" }}
      />
    </Stack.Navigator>
  );
}
