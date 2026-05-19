import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useHRMSStore } from "@/store/hrmsStore";
import { Colors, BorderRadius } from "@/constants/theme";
import HomeScreen from "@/screens/HomeScreen";
import PayrollScreen from "@/screens/PayrollScreen";
import HolidayScreen from "@/screens/HolidayScreen";
import AnnouncementScreen from "@/screens/AnnouncementScreen";
import NotificationScreen from "@/screens/NotificationScreen";
import ExpenseScreen from "@/screens/ExpenseScreen";
import CreateExpenseScreen from "@/screens/CreateExpenseScreen";
import VisitScreen from "@/screens/VisitScreen";
import CreateVisitScreen from "@/screens/CreateVisitScreen";
import COCComplianceFormScreen from "@/screens/COCComplianceFormScreen";
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
  Notifications: undefined;
  COCComplianceForm: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

/** Eye = mark all read; only on full Notifications screen (after View all). */
function NotificationsHeaderReadAll() {
  const { unreadNotificationsCount, markAllNotificationsAsRead } = useHRMSStore();

  if (unreadNotificationsCount === 0) {
    return null;
  }

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        void markAllNotificationsAsRead();
      }}
      style={({ pressed }) => [styles.readAllBtn, { opacity: pressed ? 0.75 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel="Read all notifications"
      hitSlop={8}
    >
      <Feather name="eye" size={20} color={Colors.dark.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  readAllBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.dark.primary + "14",
    borderWidth: 1,
    borderColor: Colors.dark.primary + "28",
  },
});

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
      <Stack.Screen
        name="COCComplianceForm"
        component={COCComplianceFormScreen}
        options={{
          header: () => <ProfessionalHeader title="Compliance Certificate (COC)" />,
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{
          /** Must be false: global screenOptions use transparent header — otherwise list draws under custom header. */
          headerTransparent: false,
          header: () => (
            <ProfessionalHeader
              title="Notifications"
              rightComponent={<NotificationsHeaderReadAll />}
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
}
