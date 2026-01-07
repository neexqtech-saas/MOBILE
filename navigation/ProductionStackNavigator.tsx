import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import ProductionDashboardScreen from "@/screens/production/ProductionDashboardScreen";
import WorkOrdersScreen from "@/screens/production/WorkOrdersScreen";
import WorkOrderDetailScreen from "@/screens/production/WorkOrderDetailScreen";
import ProductionEntriesScreen from "@/screens/production/ProductionEntriesScreen";
import ProductionEntryFormScreen from "@/screens/production/ProductionEntryFormScreen";
import MaterialRequisitionsScreen from "@/screens/production/MaterialRequisitionsScreen";
import MaterialRequisitionFormScreen from "@/screens/production/MaterialRequisitionFormScreen";
import MaterialReturnsScreen from "@/screens/production/MaterialReturnsScreen";
import MaterialReturnFormScreen from "@/screens/production/MaterialReturnFormScreen";
import ScrapEntriesScreen from "@/screens/production/ScrapEntriesScreen";
import ScrapEntryFormScreen from "@/screens/production/ScrapEntryFormScreen";
import MachineDowntimeScreen from "@/screens/production/MachineDowntimeScreen";
import MachineDowntimeFormScreen from "@/screens/production/MachineDowntimeFormScreen";
import AssignedMachinesScreen from "@/screens/production/AssignedMachinesScreen";
import MachineDetailScreen from "@/screens/production/MachineDetailScreen";

export type ProductionStackParamList = {
  ProductionDashboard: undefined;
  WorkOrders: undefined;
  WorkOrderDetail: { workOrderId: string };
  ProductionEntries: undefined;
  ProductionEntryForm: { entryId?: string };
  MaterialRequisitions: undefined;
  MaterialRequisitionForm: undefined;
  MaterialReturns: undefined;
  MaterialReturnForm: undefined;
  ScrapEntries: undefined;
  ScrapEntryForm: undefined;
  MachineDowntime: undefined;
  MachineDowntimeForm: undefined;
  AssignedMachines: undefined;
  MachineDetail: { machineId: string };
};

const Stack = createNativeStackNavigator<ProductionStackParamList>();

export default function ProductionStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="ProductionDashboard"
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark, transparent: false }),
      }}
    >
      <Stack.Screen
        name="ProductionDashboard"
        component={ProductionDashboardScreen}
        options={{
          headerTitle: "Production",
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
        name="WorkOrders"
        component={WorkOrdersScreen}
        options={{
          headerTitle: "Work Orders",
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
        name="WorkOrderDetail"
        component={WorkOrderDetailScreen}
        options={{
          headerTitle: "Work Order Details",
          headerTransparent: false,
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
        name="ProductionEntries"
        component={ProductionEntriesScreen}
        options={{
          headerTitle: "Production Entries",
          headerTransparent: false,
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
        name="ProductionEntryForm"
        component={ProductionEntryFormScreen}
        options={{
          headerTitle: "Production Entry",
          headerTransparent: false,
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
        name="MaterialRequisitions"
        component={MaterialRequisitionsScreen}
        options={{
          headerTitle: "Material Requisitions",
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
        name="MaterialReturns"
        component={MaterialReturnsScreen}
        options={{
          headerTitle: "Material Returns",
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
        name="ScrapEntries"
        component={ScrapEntriesScreen}
        options={{
          headerTitle: "Scrap Entries",
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
        name="MachineDowntime"
        component={MachineDowntimeScreen}
        options={{
          headerTitle: "Machine Downtime",
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
        name="MaterialRequisitionForm"
        component={MaterialRequisitionFormScreen}
        options={{
          headerTitle: "Create Material Requisition",
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
        name="MaterialReturnForm"
        component={MaterialReturnFormScreen}
        options={{
          headerTitle: "Create Material Return",
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
        name="ScrapEntryForm"
        component={ScrapEntryFormScreen}
        options={{
          headerTitle: "Create Scrap Entry",
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
        name="MachineDowntimeForm"
        component={MachineDowntimeFormScreen}
        options={{
          headerTitle: "Report Downtime",
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
        name="AssignedMachines"
        component={AssignedMachinesScreen}
        options={{
          headerTitle: "Assigned Machines",
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
        name="MachineDetail"
        component={MachineDetailScreen}
        options={{
          headerTitle: "Machine Details",
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

