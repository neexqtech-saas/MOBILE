import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { ProductionStackParamList } from "@/navigation/ProductionStackNavigator";
import Spacer from "@/components/Spacer";
import AssignedMachinesScreen from "./AssignedMachinesScreen";
import WorkOrdersScreen from "./WorkOrdersScreen";
import ProductionEntriesScreen from "./ProductionEntriesScreen";
import MaterialRequisitionsScreen from "./MaterialRequisitionsScreen";
import MaterialReturnsScreen from "./MaterialReturnsScreen";
import ScrapEntriesScreen from "./ScrapEntriesScreen";
import MachineDowntimeScreen from "./MachineDowntimeScreen";

type ProductionDashboardScreenNavigationProp = NativeStackNavigationProp<
  ProductionStackParamList,
  "ProductionDashboard"
>;

type Tab = "machines" | "workOrders" | "productionEntries" | "materialRequisitions" | "materialReturns" | "scrapEntries" | "machineDowntime";

const tabs: { id: Tab; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: "machines", label: "Machines", icon: "cpu" },
  { id: "workOrders", label: "Work Orders", icon: "package" },
  { id: "productionEntries", label: "Entries", icon: "clipboard" },
  { id: "materialRequisitions", label: "Requisitions", icon: "shopping-cart" },
  { id: "materialReturns", label: "Returns", icon: "rotate-ccw" },
  { id: "scrapEntries", label: "Scrap", icon: "trash-2" },
  { id: "machineDowntime", label: "Downtime", icon: "alert-circle" },
];

export default function ProductionDashboardScreen() {
  const navigation = useNavigation<ProductionDashboardScreenNavigationProp>();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("machines");

  const handleTabPress = (tab: Tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "machines":
        return <AssignedMachinesScreen />;
      case "workOrders":
        return <WorkOrdersScreen />;
      case "productionEntries":
        return <ProductionEntriesScreen />;
      case "materialRequisitions":
        return <MaterialRequisitionsScreen />;
      case "materialReturns":
        return <MaterialReturnsScreen />;
      case "scrapEntries":
        return <ScrapEntriesScreen />;
      case "machineDowntime":
        return <MachineDowntimeScreen />;
      default:
        return <AssignedMachinesScreen />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {/* Tabs Header */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.backgroundDefault, borderBottomColor: theme.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => handleTabPress(tab.id)}
              style={({ pressed }) => [
                styles.tab,
                {
                  backgroundColor: activeTab === tab.id ? Colors.light.primary : "transparent",
                  opacity: pressed ? 0.7 : 1,
                  borderBottomColor: activeTab === tab.id ? Colors.light.primary : "transparent",
                },
              ]}
            >
              <Feather
                name={tab.icon}
                size={18}
                color={activeTab === tab.id ? "#FFFFFF" : theme.textMuted}
              />
              <ThemedText
                style={[
                  styles.tabLabel,
                  {
                    color: activeTab === tab.id ? "#FFFFFF" : theme.textMuted,
                    fontWeight: activeTab === tab.id ? "600" : "400",
                  },
                ]}
              >
                {tab.label}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabsScrollContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.xs,
    borderBottomWidth: 2,
    minWidth: 100,
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
  },
});
