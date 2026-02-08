import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProfessionalHeader } from "@/components/ProfessionalHeader";
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
          header: () => <ProfessionalHeader title="Production" showBackButton={false} />,
        }}
      />
      <Stack.Screen
        name="WorkOrders"
        component={WorkOrdersScreen}
        options={{
          header: () => <ProfessionalHeader title="Work Orders" />,
        }}
      />
      <Stack.Screen
        name="WorkOrderDetail"
        component={WorkOrderDetailScreen}
        options={{
          header: () => <ProfessionalHeader title="Work Order Details" />,
        }}
      />
      <Stack.Screen
        name="ProductionEntries"
        component={ProductionEntriesScreen}
        options={{
          header: () => <ProfessionalHeader title="Production Entries" />,
        }}
      />
      <Stack.Screen
        name="ProductionEntryForm"
        component={ProductionEntryFormScreen}
        options={{
          header: () => <ProfessionalHeader title="Production Entry" />,
        }}
      />
      <Stack.Screen
        name="MaterialRequisitions"
        component={MaterialRequisitionsScreen}
        options={{
          header: () => <ProfessionalHeader title="Material Requisitions" />,
        }}
      />
      <Stack.Screen
        name="MaterialReturns"
        component={MaterialReturnsScreen}
        options={{
          header: () => <ProfessionalHeader title="Material Returns" />,
        }}
      />
      <Stack.Screen
        name="ScrapEntries"
        component={ScrapEntriesScreen}
        options={{
          header: () => <ProfessionalHeader title="Scrap Entries" />,
        }}
      />
      <Stack.Screen
        name="MachineDowntime"
        component={MachineDowntimeScreen}
        options={{
          header: () => <ProfessionalHeader title="Machine Downtime" />,
        }}
      />
      <Stack.Screen
        name="MaterialRequisitionForm"
        component={MaterialRequisitionFormScreen}
        options={{
          header: () => <ProfessionalHeader title="Create Material Requisition" />,
        }}
      />
      <Stack.Screen
        name="MaterialReturnForm"
        component={MaterialReturnFormScreen}
        options={{
          header: () => <ProfessionalHeader title="Create Material Return" />,
        }}
      />
      <Stack.Screen
        name="ScrapEntryForm"
        component={ScrapEntryFormScreen}
        options={{
          header: () => <ProfessionalHeader title="Create Scrap Entry" />,
        }}
      />
      <Stack.Screen
        name="MachineDowntimeForm"
        component={MachineDowntimeFormScreen}
        options={{
          header: () => <ProfessionalHeader title="Report Downtime" />,
        }}
      />
      <Stack.Screen
        name="AssignedMachines"
        component={AssignedMachinesScreen}
        options={{
          header: () => <ProfessionalHeader title="Assigned Machines" />,
        }}
      />
      <Stack.Screen
        name="MachineDetail"
        component={MachineDetailScreen}
        options={{
          header: () => <ProfessionalHeader title="Machine Details" />,
        }}
      />
    </Stack.Navigator>
  );
}

