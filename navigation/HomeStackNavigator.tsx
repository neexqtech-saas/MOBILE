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
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
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
          header: () => <ProfessionalHeader title="" rightComponent={<HeaderRight />} showBackButton={false} />,
        }}
      />
      <Stack.Screen
        name="Payroll"
        component={PayrollScreen}
        options={{
          header: () => <ProfessionalHeader title="Payroll" />,
        }}
      />
      <Stack.Screen
        name="Holidays"
        component={HolidayScreen}
        options={{
          header: () => <ProfessionalHeader title="Holidays" />,
        }}
      />
      <Stack.Screen
        name="Announcements"
        component={AnnouncementScreen}
        options={{
          header: () => <ProfessionalHeader title="Announcements" />,
        }}
      />
      <Stack.Screen
        name="Expenses"
        component={ExpenseScreen}
        options={{
          header: () => <ProfessionalHeader title="Expenses" />,
        }}
      />
      <Stack.Screen
        name="CreateExpense"
        component={CreateExpenseScreen}
        options={{
          header: () => <ProfessionalHeader title="Create Expense" />,
        }}
      />
      <Stack.Screen
        name="Visits"
        component={VisitScreen}
        options={{
          header: () => <ProfessionalHeader title="Visits" />,
        }}
      />
      <Stack.Screen
        name="CreateVisit"
        component={CreateVisitScreen}
        options={{
          header: () => <ProfessionalHeader title="Create Visit" />,
        }}
      />
    </Stack.Navigator>
  );
}
