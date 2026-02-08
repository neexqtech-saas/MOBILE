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
import { apiService, RawMaterialAPI } from "@/services/api";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";

type MaterialRequisitionFormScreenNavigationProp = NativeStackNavigationProp<
  ProductionStackParamList,
  "MaterialRequisitionForm"
>;

interface RequisitionItem {
  raw_material: string;
  rawMaterialName: string;
  quantity_requested: string;
  unit: string;
  purpose: string;
}

export default function MaterialRequisitionFormScreen() {
  const navigation = useNavigation<MaterialRequisitionFormScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialAPI[]>([]);

  const [requisitionNumber, setRequisitionNumber] = useState("");
  const [requisitionDate, setRequisitionDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState("");
  const [items, setItems] = useState<RequisitionItem[]>([
    { raw_material: "", rawMaterialName: "", quantity_requested: "", unit: "", purpose: "" },
  ]);
  const [remarks, setRemarks] = useState("");

  const [showMaterialPicker, setShowMaterialPicker] = useState<number | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    if (!employee.adminId) {
      Alert.alert("Error", "Employee information not found. Please login again.");
      return;
    }

    setIsLoadingData(true);
    try {
      const response = await apiService.getRawMaterials(employee.adminId);
      if (response.status === 200 && response.data) {
        setRawMaterials(response.data);
      }
    } catch (error: any) {
      console.error("Error loading raw materials:", error);
      Alert.alert("Error", error.message || "Failed to load raw materials");
    } finally {
      setIsLoadingData(false);
    }
  };

  const addItem = () => {
    setItems([...items, { raw_material: "", rawMaterialName: "", quantity_requested: "", unit: "", purpose: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof RequisitionItem, value: string) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleSelectMaterial = (index: number, materialId: string, materialName: string, unit: string) => {
    // Update all fields in a single state update to avoid race conditions
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      raw_material: materialId,
      rawMaterialName: materialName,
      unit: unit,
    };
    setItems(updatedItems);
    setShowMaterialPicker(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmit = async () => {
    console.log("🚀 ========== handleSubmit CALLED ==========");
    console.log("Requisition Number:", requisitionNumber);
    console.log("Department:", department);
    console.log("Requisition Date:", requisitionDate);
    console.log("Items:", JSON.stringify(items, null, 2));
    console.log("Employee:", { adminId: employee.adminId, id: employee.id });
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Validation checks
    if (!requisitionNumber.trim()) {
      console.log("❌ Validation failed: Requisition number missing");
      Alert.alert("Validation Error", "Please enter Requisition Number");
      return;
    }
    
    // Department is optional but recommended
    if (!department.trim()) {
      console.log("⚠️ Warning: Department is empty, proceeding without it");
      // Don't block submission, but log it
    }

    const validItems = items.filter((item) => {
      if (!item.raw_material || !item.quantity_requested) {
        console.log("❌ Item validation failed:", item);
        return false;
      }
      const qty = parseFloat(item.quantity_requested);
      const isValid = !isNaN(qty) && qty > 0;
      if (!isValid) {
        console.log("❌ Item quantity invalid:", item.quantity_requested);
      }
      return isValid;
    });
    
    console.log("✅ Valid items count:", validItems.length);
    
    if (validItems.length === 0) {
      console.log("❌ Validation failed: No valid items");
      Alert.alert("Validation Error", "Please add at least one item with valid material and quantity (greater than 0)");
      return;
    }

    if (!employee.adminId || !employee.id) {
      console.log("❌ Validation failed: Employee info missing");
      Alert.alert("Error", "Employee information not found. Please login again.");
      return;
    }

    console.log("✅ All validations passed, proceeding with API call...");
    setIsSubmitting(true);

    try {
      const data = {
        requisition_number: requisitionNumber.trim(),
        requisition_date: requisitionDate,
        department: department.trim() || undefined, // Make department optional
        status: "pending" as const,
        items: validItems.map((item) => {
          const qty = parseFloat(item.quantity_requested);
          if (isNaN(qty) || qty <= 0) {
            throw new Error(`Invalid quantity for item: ${item.rawMaterialName || 'Unknown'}`);
          }
          return {
            raw_material: item.raw_material,
            requested_qty: qty,
            unit: item.unit || undefined,
            remarks: item.purpose || undefined,
          };
        }),
        remarks: remarks || undefined,
      };

      console.log("📤 ========== PREPARING API CALL ==========");
      console.log("Full request data:", JSON.stringify(data, null, 2));
      console.log("Admin ID:", employee.adminId);
      console.log("User ID:", employee.id);
      console.log("API URL:", `/api/production/material-requisitions/${employee.adminId}/user/${employee.id}`);
      
      // Verify API service is available
      if (!apiService) {
        throw new Error("API service is not available");
      }
      
      console.log("📡 ========== CALLING API NOW ==========");
      console.log("About to call: apiService.createMaterialRequisition");
      
      const response = await apiService.createMaterialRequisition(
        employee.adminId,
        employee.id,
        data
      );
      
      console.log("✅ ========== API CALL COMPLETED ==========");
      console.log("Response received:", response);

      console.log("API Response:", response);

      if (response.status === 201 || response.status === 200) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.goBack();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", response.message || "Failed to create material requisition");
      }
    } catch (error: any) {
      console.error("Error creating material requisition:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      console.error("Error response data:", error.responseData);
      console.error("Error status:", error.status);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Show more detailed error message
      let errorMessage = "Failed to create material requisition";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.responseData?.message) {
        errorMessage = error.responseData.message;
      } else if (error.responseData?.error) {
        errorMessage = error.responseData.error;
      } else if (error.responseData?.detail) {
        errorMessage = error.responseData.detail;
      }
      
      Alert.alert("Error", errorMessage);
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
          {/* Requisition Number */}
          <View style={styles.section}>
            <ThemedText style={[styles.label, { color: theme.text }]}>
              Requisition Number <ThemedText style={{ color: Colors.dark.error }}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
              ]}
              value={requisitionNumber}
              onChangeText={setRequisitionNumber}
              placeholder="MR-001"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          {/* Date & Department */}
          <View style={styles.row}>
            <View style={[styles.section, { flex: 1 }]}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                Date <ThemedText style={{ color: Colors.dark.error }}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
                ]}
                value={requisitionDate}
                onChangeText={setRequisitionDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <Spacer width={Spacing.md} />
            <View style={[styles.section, { flex: 1 }]}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                Department <ThemedText style={{ color: Colors.dark.error }}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
                ]}
                value={department}
                onChangeText={(text) => {
                  console.log("Department field changed:", text);
                  setDepartment(text);
                }}
                placeholder="Production"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.label, { color: theme.text }]}>
                Items <ThemedText style={{ color: Colors.dark.error }}>*</ThemedText>
              </ThemedText>
              <Pressable onPress={addItem} style={styles.addButton}>
                <Feather name="plus" size={18} color={Colors.light.primary} />
                <ThemedText style={[styles.addButtonText, { color: Colors.light.primary }]}>
                  Add Item
                </ThemedText>
              </Pressable>
            </View>

            {items.map((item, index) => (
              <View key={index} style={[styles.itemCard, { backgroundColor: theme.backgroundDefault }]}>
                <View style={styles.itemHeader}>
                  <ThemedText style={[styles.itemNumber, { color: theme.textMuted }]}>
                    Item {index + 1}
                  </ThemedText>
                  {items.length > 1 && (
                    <Pressable onPress={() => removeItem(index)}>
                      <Feather name="trash-2" size={18} color={Colors.dark.error} />
                    </Pressable>
                  )}
                </View>

                <Pressable
                  onPress={() => setShowMaterialPicker(index)}
                  style={[
                    styles.selectInput,
                      { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
                  ]}
                >
                  <ThemedText style={[styles.selectText, { color: item.rawMaterialName ? theme.text : theme.textMuted }]}>
                    {item.rawMaterialName || "Select Material"}
                  </ThemedText>
                  <Feather name="chevron-down" size={20} color={theme.textMuted} />
                </Pressable>

                <View style={styles.row}>
                  <View style={[styles.section, { flex: 2 }]}>
                    <ThemedText style={[styles.itemLabel, { color: theme.textMuted }]}>Quantity</ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
                      ]}
                      value={item.quantity_requested}
                      onChangeText={(text) => updateItem(index, "quantity_requested", text)}
                      placeholder="0.00"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <Spacer width={Spacing.sm} />
                  <View style={[styles.section, { flex: 1 }]}>
                    <ThemedText style={[styles.itemLabel, { color: theme.textMuted }]}>Unit</ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
                      ]}
                      value={item.unit}
                      onChangeText={(text) => updateItem(index, "unit", text)}
                      placeholder="kg"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.section}>
                  <ThemedText style={[styles.itemLabel, { color: theme.textMuted }]}>Purpose</ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: theme.backgroundDefault, borderColor: theme.border, color: theme.text },
                    ]}
                    value={item.purpose}
                    onChangeText={(text) => updateItem(index, "purpose", text)}
                    placeholder="Optional"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>
            ))}
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
            onPress={async () => {
              console.log("🔘 ========== BUTTON PRESSED ==========");
              console.log("isSubmitting:", isSubmitting);
              console.log("Button state check passed");
              
              if (isSubmitting) {
                console.log("⚠️ Button is disabled, ignoring press");
                Alert.alert("Please wait", "Request is already being processed");
                return;
              }
              
              console.log("✅ Calling handleSubmit now...");
              try {
                await handleSubmit();
              } catch (error) {
                console.error("❌ Error in button handler:", error);
                // Error is already handled in handleSubmit
              }
            }}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.submitButtonContainer,
              { 
                opacity: isSubmitting ? 0.6 : pressed ? 0.8 : 1,
              },
            ]}
          >
            <LinearGradient
              colors={
                isSubmitting
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
                <ThemedText style={styles.submitButtonText}>Create Requisition</ThemedText>
              )}
            </LinearGradient>
          </Pressable>

          <Spacer height={Spacing.xl} />
        </View>
      </ScreenKeyboardAwareScrollView>

      {/* Material Picker Modal */}
      <Modal
        visible={showMaterialPicker !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMaterialPicker(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Select Raw Material</ThemedText>
              <Pressable onPress={() => setShowMaterialPicker(null)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              {rawMaterials.length === 0 ? (
                <ThemedText style={{ textAlign: "center", color: theme.textMuted, padding: Spacing.lg }}>
                  No raw materials available
                </ThemedText>
              ) : (
                rawMaterials.map((material) => {
                  const currentIndex = showMaterialPicker;
                  if (currentIndex === null) return null;
                  
                  return (
                    <Pressable
                      key={material.id}
                      onPress={() => {
                        handleSelectMaterial(currentIndex, material.id, material.name, material.unit || "kg");
                      }}
                      style={({ pressed }) => [
                        styles.modalOption,
                        {
                          opacity: pressed ? 0.7 : 1,
                          backgroundColor: items[currentIndex]?.raw_material === material.id
                            ? Colors.light.primary + "20"
                            : "transparent",
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <ThemedText style={{ fontWeight: "600", color: theme.text }}>{material.name}</ThemedText>
                        {material.code && (
                          <ThemedText style={[styles.optionSubtext, { color: theme.textMuted }]}>
                            Code: {material.code}
                          </ThemedText>
                        )}
                        {material.stock_level !== undefined && (
                          <ThemedText style={[styles.optionSubtext, { color: theme.textMuted }]}>
                            Stock: {material.stock_level} {material.unit || ""}
                          </ThemedText>
                        )}
                      </View>
                      {items[currentIndex]?.raw_material === material.id && (
                        <Feather name="check" size={20} color={Colors.light.primary} />
                      )}
                    </Pressable>
                  );
                })
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
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
    marginBottom: Spacing.md,
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: Spacing.md,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  itemNumber: {
    fontSize: 12,
    fontWeight: "600",
  },
  itemLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  submitButtonContainer: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginTop: Spacing.lg,
    minHeight: 48,
    width: "100%",
  },
  submitButton: {
    padding: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    width: "100%",
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

