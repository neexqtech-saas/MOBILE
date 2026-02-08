import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ActivityIndicator, Pressable, TextInput, Modal, ScrollView } from "react-native";
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
import { apiService, MachineAPI } from "@/services/api";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";

type MachineDowntimeFormScreenNavigationProp = NativeStackNavigationProp<
  ProductionStackParamList,
  "MachineDowntimeForm"
>;

export default function MachineDowntimeFormScreen() {
  const navigation = useNavigation<MachineDowntimeFormScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [machines, setMachines] = useState<MachineAPI[]>([]);

  const [machineId, setMachineId] = useState("");
  const [selectedMachine, setSelectedMachine] = useState<MachineAPI | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(new Date().toTimeString().slice(0, 5));
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState(new Date().toTimeString().slice(0, 5));
  const [downtimeReason, setDowntimeReason] = useState("");
  const [impactOnProduction, setImpactOnProduction] = useState("");

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
      const machinesRes = await apiService.getUserAssignedMachines(employee.adminId, employee.id);
      
      if (machinesRes.status === 200 && machinesRes.data) {
        // API already returns only assigned machines, no filtering needed
        setMachines(machinesRes.data);
      }
    } catch (error: any) {
      console.error("Error loading machines:", error);
      Alert.alert("Error", error.message || "Failed to load machines");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!machineId || !downtimeReason.trim()) {
      Alert.alert("Validation Error", "Please fill all required fields (Machine and Downtime Reason)");
      return;
    }

    if (!employee.adminId || !employee.id) {
      Alert.alert("Error", "Employee information not found. Please login again.");
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const startDateTime = `${startDate}T${startTime}:00Z`;
      const endDateTime = `${endDate}T${endTime}:00Z`;

      const data = {
        machine: machineId,
        start_time: startDateTime,
        end_time: endDateTime,
        downtime_reason: downtimeReason.trim(),
        impact_on_production: impactOnProduction || undefined,
      };

      const response = await apiService.createMachineDowntime(
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
        Alert.alert("Error", response.message || "Failed to report downtime");
      }
    } catch (error: any) {
      console.error("Error reporting downtime:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to report downtime");
    } finally {
      setIsSubmitting(false);
    }
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

          {/* Downtime Reason */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: theme.text }]}>
              Downtime Reason <ThemedText style={{ color: Colors.dark.error }}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
              ]}
              value={downtimeReason}
              onChangeText={setDowntimeReason}
              placeholder="Describe the reason for downtime..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Impact on Production */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: theme.text }]}>Impact on Production</ThemedText>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
              ]}
              value={impactOnProduction}
              onChangeText={setImpactOnProduction}
              placeholder="Describe the impact on production..."
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
                  <ThemedText style={styles.submitButtonText}>Report Downtime</ThemedText>
                )}
              </LinearGradient>
            )}
          </Pressable>

          <Spacer height={Spacing.xl} />
        </View>
      </ScreenKeyboardAwareScrollView>

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

