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
import { apiService, ProductAPI, MachineAPI } from "@/services/api";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";

type ScrapEntryFormScreenNavigationProp = NativeStackNavigationProp<
  ProductionStackParamList,
  "ScrapEntryForm"
>;

const SCRAP_REASONS = [
  { value: "defect", label: "Manufacturing Defect" },
  { value: "damage", label: "Damage" },
  { value: "quality_issue", label: "Quality Issue" },
  { value: "material_issue", label: "Material Issue" },
  { value: "machine_issue", label: "Machine Issue" },
  { value: "operator_error", label: "Operator Error" },
  { value: "other", label: "Other" },
] as const;

export default function ScrapEntryFormScreen() {
  const navigation = useNavigation<ScrapEntryFormScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [products, setProducts] = useState<ProductAPI[]>([]);
  const [machines, setMachines] = useState<MachineAPI[]>([]);

  const [productId, setProductId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductAPI | null>(null);
  const [machineId, setMachineId] = useState("");
  const [selectedMachine, setSelectedMachine] = useState<MachineAPI | null>(null);
  const [scrapDate, setScrapDate] = useState(new Date().toISOString().split('T')[0]);
  const [scrapTime, setScrapTime] = useState(new Date().toTimeString().slice(0, 5));
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState<typeof SCRAP_REASONS[number]["value"]>("defect");
  const [reasonDescription, setReasonDescription] = useState("");
  const [scrapCategory, setScrapCategory] = useState("");
  const [costImpact, setCostImpact] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");

  const [showProductPicker, setShowProductPicker] = useState(false);
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
      const [productsRes, machinesRes] = await Promise.all([
        apiService.getProducts(employee.adminId),
        apiService.getUserAssignedMachines(employee.adminId, employee.id),
      ]);

      if (productsRes.status === 200 && productsRes.data) {
        setProducts(productsRes.data);
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
    if (!productId || !machineId || !qty || !reason) {
      Alert.alert("Validation Error", "Please fill all required fields (Product, Machine, Quantity, Reason)");
      return;
    }

    if (parseFloat(qty) <= 0) {
      Alert.alert("Validation Error", "Quantity must be greater than 0");
      return;
    }

    if (!employee.adminId || !employee.id) {
      Alert.alert("Error", "Employee information not found. Please login again.");
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const scrapDateTime = `${scrapDate}T${scrapTime}:00Z`;

      const data = {
        product: productId,
        machine: machineId,
        scrap_date: scrapDateTime,
        qty: parseFloat(qty),
        reason: reason,
        reason_description: reasonDescription || undefined,
        scrap_category: scrapCategory || undefined,
        cost_impact: costImpact ? parseFloat(costImpact) : undefined,
        corrective_action: correctiveAction || undefined,
      };

      const response = await apiService.createScrapEntry(
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
        Alert.alert("Error", response.message || "Failed to create scrap entry");
      }
    } catch (error: any) {
      console.error("Error creating scrap entry:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to create scrap entry");
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
          {/* Product Selection */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: theme.text }]}>
              Product <ThemedText style={{ color: Colors.dark.error }}>*</ThemedText>
            </ThemedText>
            <Pressable
              onPress={() => setShowProductPicker(true)}
              style={[
                styles.selectInput,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
              ]}
            >
              <ThemedText style={[styles.selectText, { color: selectedProduct ? theme.text : theme.textMuted }]}>
                {selectedProduct ? `${selectedProduct.name} (${selectedProduct.code})` : "Select Product"}
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

          {/* Scrap Date & Time */}
          <View style={styles.row}>
            <View style={[styles.section, { flex: 1 }]}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                Scrap Date <ThemedText style={{ color: Colors.dark.error }}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
                ]}
                value={scrapDate}
                onChangeText={setScrapDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <Spacer width={Spacing.md} />
            <View style={[styles.section, { flex: 1 }]}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                Time <ThemedText style={{ color: Colors.dark.error }}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
                ]}
                value={scrapTime}
                onChangeText={setScrapTime}
                placeholder="HH:MM"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          {/* Quantity */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: theme.text }]}>
              Scrap Quantity <ThemedText style={{ color: Colors.dark.error }}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
              ]}
              value={qty}
              onChangeText={setQty}
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Reason */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: theme.text }]}>
              Reason <ThemedText style={{ color: Colors.dark.error }}>*</ThemedText>
            </ThemedText>
            <View style={styles.reasonContainer}>
              {SCRAP_REASONS.map((r) => (
                <Pressable
                  key={r.value}
                  onPress={() => setReason(r.value)}
                  style={[
                    styles.reasonButton,
                    {
                      backgroundColor: reason === r.value ? Colors.light.primary : theme.backgroundDefault,
                      borderColor: reason === r.value ? Colors.light.primary : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={{
                      color: reason === r.value ? "#FFFFFF" : theme.text,
                      fontWeight: reason === r.value ? "600" : "400",
                      fontSize: 12,
                    }}
                  >
                    {r.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Reason Description */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: theme.text }]}>Reason Description</ThemedText>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
              ]}
              value={reasonDescription}
              onChangeText={setReasonDescription}
              placeholder="Describe the reason for scrap..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Scrap Category */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: theme.text }]}>Scrap Category</ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
              ]}
              value={scrapCategory}
              onChangeText={setScrapCategory}
              placeholder="e.g., Minor Defect, Major Defect"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          {/* Cost Impact */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: theme.text }]}>Cost Impact (₹)</ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
              ]}
              value={costImpact}
              onChangeText={setCostImpact}
              placeholder="0.00"
              placeholderTextColor={theme.textMuted}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Corrective Action */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: theme.text }]}>Corrective Action</ThemedText>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
              ]}
              value={correctiveAction}
              onChangeText={setCorrectiveAction}
              placeholder="Describe corrective action taken..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
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
                    ? ["#CC6600", "#E67300", "#CC6600"]
                    : ["#FFB380", "#FFCC99", "#FFB380"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButton}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <ThemedText style={styles.submitButtonText}>Create Scrap Entry</ThemedText>
                )}
              </LinearGradient>
            )}
          </Pressable>

          <Spacer height={Spacing.xl} />
        </View>
      </ScreenKeyboardAwareScrollView>

      {/* Product Picker Modal */}
      <Modal
        visible={showProductPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProductPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Select Product</ThemedText>
              <Pressable onPress={() => setShowProductPicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              {products.length === 0 ? (
                <ThemedText style={{ textAlign: "center", color: theme.textMuted, padding: Spacing.lg }}>
                  No products available
                </ThemedText>
              ) : (
                products.map((product) => (
                  <Pressable
                    key={product.id}
                    onPress={() => {
                      setProductId(product.id);
                      setSelectedProduct(product);
                      setShowProductPicker(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[
                      styles.modalOption,
                      productId === product.id && {
                        backgroundColor: Colors.light.primary + "20",
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontWeight: "600" }}>{product.name}</ThemedText>
                      <ThemedText style={[styles.optionSubtext, { color: theme.textMuted }]}>
                        Code: {product.code}
                      </ThemedText>
                    </View>
                    {productId === product.id && (
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
    minHeight: 80,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
  },
  reasonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  reasonButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
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

