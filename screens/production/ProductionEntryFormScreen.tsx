import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ActivityIndicator, Pressable, TextInput, Modal, ScrollView } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { ProductionStackParamList } from "@/navigation/ProductionStackNavigator";
import Spacer from "@/components/Spacer";
import { apiService, MachineAPI, WorkOrderAPI } from "@/services/api";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";

type ProductionEntryFormScreenRouteProp = RouteProp<
  ProductionStackParamList,
  "ProductionEntryForm"
>;

type ProductionEntryFormScreenNavigationProp = NativeStackNavigationProp<
  ProductionStackParamList,
  "ProductionEntryForm"
>;

export default function ProductionEntryFormScreen() {
  const route = useRoute<ProductionEntryFormScreenRouteProp>();
  const navigation = useNavigation<ProductionEntryFormScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();
  const { entryId } = route.params || {};

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [workOrders, setWorkOrders] = useState<WorkOrderAPI[]>([]);
  const [machines, setMachines] = useState<MachineAPI[]>([]);

  const [workOrderId, setWorkOrderId] = useState("");
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderAPI | null>(null);
  const [machineId, setMachineId] = useState("");
  const [selectedMachine, setSelectedMachine] = useState<MachineAPI | null>(null);
  
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState("17:00");
  
  const [goodQty, setGoodQty] = useState("");
  const [scrapQty, setScrapQty] = useState("0");
  const [shift, setShift] = useState<"Morning" | "Evening" | "Night">("Morning");
  const [downtimeMinutes, setDowntimeMinutes] = useState("0");
  const [remarks, setRemarks] = useState("");

  const [showWorkOrderPicker, setShowWorkOrderPicker] = useState(false);
  const [showMachinePicker, setShowMachinePicker] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    if (!employee.adminId || !employee.id) {
      Alert.alert("Error", "Employee information not found. Please login again.");
      return;
    }

    setIsLoadingData(true);
    try {
      const [workOrdersRes, machinesRes] = await Promise.all([
        apiService.getMyWorkOrders(employee.adminId, employee.id),
        apiService.getUserAssignedMachines(employee.adminId, employee.id),
      ]);

      if (workOrdersRes.status === 200 && workOrdersRes.data) {
        setWorkOrders(workOrdersRes.data);
      }
      
      if (machinesRes.status === 200 && machinesRes.data) {
        // API already returns only assigned machines, no filtering needed
        setMachines(machinesRes.data);
      }
    } catch (error: any) {
      console.error("Error loading initial data:", error);
      Alert.alert("Error", error.message || "Failed to load data");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!workOrderId || !machineId || !goodQty) {
      Alert.alert("Validation Error", "Please fill all required fields (Work Order, Machine, Good Quantity)");
      return;
    }

    if (parseFloat(goodQty) <= 0) {
      Alert.alert("Validation Error", "Good quantity must be greater than 0");
      return;
    }

    if (!employee.adminId || !employee.id) {
      Alert.alert("Error", "Employee information not found. Please login again.");
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Validate date/time format
      const startDateTime = `${startDate}T${startTime}:00.000Z`;
      const endDateTime = `${endDate}T${endTime}:00.000Z`;
      
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);
      
      if (end <= start) {
        Alert.alert("Validation Error", "End date/time must be after start date/time");
        setIsSubmitting(false);
        return;
      }

      const data = {
        work_order: workOrderId,
        machine: machineId,
        start_time: startDateTime,
        end_time: endDateTime,
        good_qty: parseFloat(goodQty),
        scrap_qty: parseFloat(scrapQty || "0"),
        status: "draft" as const,
        shift,
        downtime_minutes: parseInt(downtimeMinutes || "0"),
        remarks: remarks || undefined,
      };

      const response = await apiService.createProductionEntry(
        employee.adminId,
        employee.id,
        data
      );

      if (response.status === 201 || response.status === 200) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Navigate back immediately, list will auto-refresh
        navigation.goBack();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", response.message || "Failed to create production entry");
      }
    } catch (error: any) {
      console.error("Error creating production entry:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to create production entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateForInput = (dateStr: string) => {
    return dateStr;
  };

  if (isLoadingData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Spacer height={Spacing.md} />
        <ThemedText style={{ textAlign: "center", color: theme.textMuted }}>
          Loading data...
        </ThemedText>
      </View>
    );
  }

  return (
    <>
      <ScreenKeyboardAwareScrollView>
        <View style={styles.form}>
          {/* Work Order Selection */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: theme.text }]}>
              Work Order <ThemedText style={{ color: Colors.dark.error }}>*</ThemedText>
            </ThemedText>
            <Pressable
              onPress={() => setShowWorkOrderPicker(true)}
              style={[
                styles.selectInput,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              ]}
            >
              <ThemedText style={[styles.selectText, { color: selectedWorkOrder ? theme.text : theme.textMuted }]}>
                {selectedWorkOrder ? `${selectedWorkOrder.code} - ${selectedWorkOrder.product_name}` : "Select Work Order"}
              </ThemedText>
              <Feather name="chevron-down" size={20} color={theme.textMuted} />
            </Pressable>
          </View>

          {/* Machine Selection */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: theme.text }]}>
              Machine <ThemedText style={{ color: Colors.dark.error }}>*</ThemedText>
            </ThemedText>
            <Pressable
              onPress={() => setShowMachinePicker(true)}
              style={[
                styles.selectInput,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              ]}
            >
              <ThemedText style={[styles.selectText, { color: selectedMachine ? theme.text : theme.textMuted }]}>
                {selectedMachine ? `${selectedMachine.name} (${selectedMachine.code})` : "Select Machine"}
              </ThemedText>
              <Feather name="chevron-down" size={20} color={theme.textMuted} />
            </Pressable>
          </View>

          {/* Start Date & Time */}
          <View style={styles.row}>
            <View style={[styles.section, { flex: 1 }]}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                Start Date <ThemedText style={{ color: Colors.dark.error }}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
                ]}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <Spacer width={Spacing.md} />
            <View style={[styles.section, { flex: 1 }]}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                Start Time <ThemedText style={{ color: Colors.dark.error }}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
                ]}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="HH:MM"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          {/* End Date & Time */}
          <View style={styles.row}>
            <View style={[styles.section, { flex: 1 }]}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                End Date <ThemedText style={{ color: Colors.dark.error }}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
                ]}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <Spacer width={Spacing.md} />
            <View style={[styles.section, { flex: 1 }]}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                End Time <ThemedText style={{ color: Colors.dark.error }}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
                ]}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="HH:MM"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          {/* Quantities */}
          <View style={styles.row}>
            <View style={[styles.section, { flex: 1 }]}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                Good Quantity <ThemedText style={{ color: Colors.dark.error }}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
                ]}
                value={goodQty}
                onChangeText={setGoodQty}
                placeholder="0.00"
                placeholderTextColor={theme.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
            <Spacer width={Spacing.md} />
            <View style={[styles.section, { flex: 1 }]}>
              <ThemedText style={[styles.label, { color: theme.text }]}>Scrap Quantity</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
                ]}
                value={scrapQty}
                onChangeText={setScrapQty}
                placeholder="0.00"
                placeholderTextColor={theme.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Shift Selection */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: theme.text }]}>Shift</ThemedText>
            <View style={styles.shiftContainer}>
              {(["Morning", "Evening", "Night"] as const).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setShift(s)}
                  style={[
                    styles.shiftButton,
                    {
                      backgroundColor:
                        shift === s ? Colors.light.primary : theme.backgroundDefault,
                      borderColor: shift === s ? Colors.light.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={{
                      color: shift === s ? "#FFFFFF" : theme.text,
                      fontWeight: shift === s ? "600" : "400",
                    }}
                  >
                    {s}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Downtime */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: theme.text }]}>Downtime (minutes)</ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
              ]}
              value={downtimeMinutes}
              onChangeText={setDowntimeMinutes}
              placeholder="0"
              placeholderTextColor={theme.textMuted}
              keyboardType="number-pad"
            />
          </View>

          {/* Remarks */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: theme.text }]}>Remarks</ThemedText>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
              ]}
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Enter any remarks..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.submitButtonContainer,
              { opacity: isSubmitting ? 0.6 : 1 },
            ]}
          >
            {({ pressed }) => (
              <LinearGradient
                colors={
                  pressed || isSubmitting
                    ? ["#1D4ED8", "#2563EB", "#1D4ED8"]
                    : ["#2563EB", "#93C5FD", "#2563EB"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButton}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <ThemedText style={styles.submitButtonText}>Create Production Entry</ThemedText>
                )}
              </LinearGradient>
            )}
          </Pressable>

          <Spacer height={Spacing.xl} />
        </View>
      </ScreenKeyboardAwareScrollView>

      {/* Work Order Picker Modal */}
      <Modal
        visible={showWorkOrderPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkOrderPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Select Work Order</ThemedText>
              <Pressable onPress={() => setShowWorkOrderPicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              {workOrders.length === 0 ? (
                <ThemedText style={{ textAlign: "center", color: theme.textMuted, padding: Spacing.lg }}>
                  No work orders available
                </ThemedText>
              ) : (
                workOrders.map((wo) => (
                  <Pressable
                    key={wo.id}
                    onPress={() => {
                      setWorkOrderId(wo.id);
                      setSelectedWorkOrder(wo);
                      setShowWorkOrderPicker(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[
                      styles.modalOption,
                      workOrderId === wo.id && {
                        backgroundColor: Colors.light.primary + "20",
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontWeight: "600" }}>{wo.code}</ThemedText>
                      <ThemedText style={[styles.optionSubtext, { color: theme.textMuted }]}>
                        {wo.product_name}
                      </ThemedText>
                      <ThemedText style={[styles.optionSubtext, { color: theme.textMuted }]}>
                        Target: {wo.target_qty} | Completed: {wo.completed_qty}
                      </ThemedText>
                    </View>
                    {workOrderId === wo.id && (
                      <Feather name="check" size={20} color={Colors.light.primary} />
                    )}
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Machine Picker Modal */}
      <Modal
        visible={showMachinePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMachinePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Select Machine</ThemedText>
              <Pressable onPress={() => setShowMachinePicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              {machines.length === 0 ? (
                <ThemedText style={{ textAlign: "center", color: theme.textMuted, padding: Spacing.lg }}>
                  No machines available
                </ThemedText>
              ) : (
                machines.map((machine) => (
                  <Pressable
                    key={machine.id}
                    onPress={() => {
                      setMachineId(machine.id);
                      setSelectedMachine(machine);
                      setShowMachinePicker(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[
                      styles.modalOption,
                      machineId === machine.id && {
                        backgroundColor: Colors.light.primary + "20",
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontWeight: "600" }}>{machine.name}</ThemedText>
                      <ThemedText style={[styles.optionSubtext, { color: theme.textMuted }]}>
                        Code: {machine.code}
                      </ThemedText>
                      <ThemedText style={[styles.optionSubtext, { color: theme.textMuted }]}>
                        Status: {machine.status}
                      </ThemedText>
                    </View>
                    {machineId === machine.id && (
                      <Feather name="check" size={20} color={Colors.light.primary} />
                    )}
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  form: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  selectInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  selectText: {
    fontSize: 16,
    flex: 1,
  },
  textArea: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: 100,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
  },
  shiftContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  shiftButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    borderWidth: 1,
  },
  submitButtonContainer: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginTop: Spacing.lg,
  },
  submitButton: {
    padding: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalBody: {
    padding: Spacing.md,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  optionSubtext: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
});
