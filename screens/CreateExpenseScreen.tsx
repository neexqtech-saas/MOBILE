import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { apiService, ExpenseCategoryAPI, ExpenseProjectAPI } from "@/services/api";
import Spacer from "@/components/Spacer";
import * as Haptics from "expo-haptics";

type CreateExpenseScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "CreateExpense"
>;

export default function CreateExpenseScreen() {
  const navigation = useNavigation<CreateExpenseScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();

  const [category, setCategory] = useState<number | null>(null);
  const [project, setProject] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Categories and Projects
  const [categories, setCategories] = useState<ExpenseCategoryAPI[]>([]);
  const [projects, setProjects] = useState<ExpenseProjectAPI[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Set today's date as default
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setExpenseDate(`${year}-${month}-${day}`);
  }, []);

  // Fetch categories and projects on mount
  useEffect(() => {
    fetchCategories();
    fetchProjects();
  }, []);

  const fetchCategories = async () => {
    const siteId = employee.siteId;
    if (!siteId) {
      Alert.alert(
        "Error",
        "Unable to load categories. Please try again later.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsLoadingCategories(true);
    try {
      const response = await apiService.getExpenseCategories(siteId);
      if (response.status === 200 && response.data) {
        setCategories(response.data);
        if (response.data.length === 0) {
          Alert.alert(
            "No Categories",
            "No expense categories available. Please contact your administrator.",
            [{ text: "OK" }]
          );
        }
      } else {
        const errorMsg = response.message || "Failed to load categories";
        Alert.alert("Error", errorMsg, [{ text: "OK" }]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching categories:', error);
      let errorMessage = "Failed to load categories. Please check your internet connection and try again.";
      
      if (error?.message) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your internet connection.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchProjects = async () => {
    const siteId = employee.siteId;
    if (!siteId) {
      Alert.alert(
        "Error",
        "Unable to load projects. Please try again later.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsLoadingProjects(true);
    try {
      const response = await apiService.getExpenseProjects(siteId);
      if (response.status === 200 && response.data) {
        setProjects(response.data);
        if (response.data.length === 0) {
          Alert.alert(
            "No Projects",
            "No expense projects available. Please contact your administrator.",
            [{ text: "OK" }]
          );
        }
      } else {
        const errorMsg = response.message || "Failed to load projects";
        Alert.alert("Error", errorMsg, [{ text: "OK" }]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching projects:', error);
      let errorMessage = "Failed to load projects. Please check your internet connection and try again.";
      
      if (error?.message) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your internet connection.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === category);
  const selectedProject = projects.find(p => p.id === project);

  const handleSubmit = async () => {
    // Clear previous errors
    setError("");

    // Validation with specific error messages
    if (!category) {
      const errorMsg = "Please select a category";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!project) {
      const errorMsg = "Please select a project";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!title.trim()) {
      const errorMsg = "Please enter expense title";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (title.trim().length < 3) {
      const errorMsg = "Expense title must be at least 3 characters";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!expenseDate.trim()) {
      const errorMsg = "Please select expense date";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!amount.trim()) {
      const errorMsg = "Please enter amount";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      const errorMsg = "Please enter a valid numeric amount";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (amountNum <= 0) {
      const errorMsg = "Amount must be greater than 0";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (amountNum > 99999999) {
      const errorMsg = "Amount is too large. Maximum allowed is ₹99,999,999";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(expenseDate)) {
      const errorMsg = "Date must be in YYYY-MM-DD format (e.g., 2025-12-20)";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Validate date is not in the future
    const selectedDate = new Date(expenseDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (selectedDate > today) {
      const errorMsg = "Expense date cannot be in the future";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const siteId = employee.siteId;
      const userId = employee.id;

      if (!siteId || !userId) {
        setError("User ID or Site ID not found. Please login again.");
        setIsSubmitting(false);
        return;
      }

      const expenseData = {
        category: category,
        project: project,
        title: title.trim(),
        expense_date: expenseDate,
        amount: amountNum,
        description: description.trim() || undefined,
      };

      const response = await apiService.createExpense(siteId, userId, expenseData);

      if (response.status === 200 || response.status === 201) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Navigate back immediately after success
        navigation.goBack();
      } else {
        // Handle different error status codes
        let errorMessage = "Failed to create expense. Please try again.";
        
        if (response.status === 400) {
          errorMessage = response.message || "Invalid data. Please check all fields and try again.";
        } else if (response.status === 401) {
          errorMessage = "Session expired. Please login again.";
        } else if (response.status === 403) {
          errorMessage = "You don't have permission to create expenses.";
        } else if (response.status === 404) {
          errorMessage = "Resource not found. Please contact support.";
        } else if (response.status === 422) {
          errorMessage = response.message || "Validation error. Please check your input.";
        } else if (response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (response.message) {
          errorMessage = response.message;
        }
        
        setError(errorMessage);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", errorMessage, [{ text: "OK" }]);
      }
    } catch (error: any) {
      console.error("❌ Error creating expense:", error);
      let errorMessage = "Failed to create expense. Please try again.";
      
      // Handle network errors
      if (error?.message) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Cannot connect to server. Please check your internet connection.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: Colors.dark.error + "20" }]}>
            <ThemedText style={{ color: Colors.dark.error }}>{error}</ThemedText>
          </View>
        ) : null}

        <Spacer height={Spacing.md} />

        {/* Category Selection */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Category *
          </ThemedText>
          <Pressable
            onPress={() => setShowCategoryModal(true)}
            style={({ pressed }) => [
              styles.selectButton,
              { 
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
                opacity: pressed ? 0.9 : 1 
              }
            ]}
          >
            <ThemedText style={{ flex: 1 }}>
              {selectedCategory ? selectedCategory.name : "Select Category"}
            </ThemedText>
            {isLoadingCategories ? (
              <ActivityIndicator size="small" color={theme.textMuted} />
            ) : (
              <Feather name="chevron-down" size={20} color={theme.textMuted} />
            )}
          </Pressable>
        </View>

        <Spacer height={Spacing.lg} />

        {/* Project Selection */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Project *
          </ThemedText>
          <Pressable
            onPress={() => setShowProjectModal(true)}
            style={({ pressed }) => [
              styles.selectButton,
              { 
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
                opacity: pressed ? 0.9 : 1 
              }
            ]}
          >
            <ThemedText style={{ flex: 1 }}>
              {selectedProject ? selectedProject.name : "Select Project"}
            </ThemedText>
            {isLoadingProjects ? (
              <ActivityIndicator size="small" color={theme.textMuted} />
            ) : (
              <Feather name="chevron-down" size={20} color={theme.textMuted} />
            )}
          </Pressable>
        </View>

        <Spacer height={Spacing.lg} />

        {/* Title */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Title *
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            placeholder="Enter expense title"
            placeholderTextColor={theme.textMuted}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setError("");
            }}
          />
        </View>

        <Spacer height={Spacing.lg} />

        {/* Expense Date */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Expense Date *
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.textMuted}
            value={expenseDate}
            onChangeText={(text) => {
              setExpenseDate(text);
              setError("");
            }}
          />
        </View>

        <Spacer height={Spacing.lg} />

        {/* Amount */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Amount *
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            placeholder="Enter amount"
            placeholderTextColor={theme.textMuted}
            value={amount}
            onChangeText={(text) => {
              setAmount(text.replace(/[^0-9.]/g, ""));
              setError("");
            }}
            keyboardType="numeric"
          />
        </View>

        <Spacer height={Spacing.lg} />

        {/* Description */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Description
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }
            ]}
            placeholder="Enter description (optional)"
            placeholderTextColor={theme.textMuted}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              setError("");
            }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <Spacer height={Spacing["2xl"]} />

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.submitButton,
            { 
              backgroundColor: Colors.dark.primary,
              opacity: pressed || isSubmitting ? 0.9 : 1 
            }
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <Feather name="check" size={20} color="#000000" />
              <ThemedText style={{ color: "#000000", fontWeight: "600", marginLeft: Spacing.sm }}>
                Create Expense
              </ThemedText>
            </>
          )}
        </Pressable>

        <Spacer height={Spacing["2xl"]} />
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Select Category</ThemedText>
              <Pressable onPress={() => setShowCategoryModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {categories.length === 0 ? (
                <View style={styles.emptyModalState}>
                  <ThemedText style={{ color: theme.textMuted }}>No categories available</ThemedText>
                </View>
              ) : (
                categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      setCategory(cat.id);
                      setShowCategoryModal(false);
                      setError("");
                    }}
                    style={({ pressed }) => [
                      styles.modalItem,
                      { 
                        backgroundColor: theme.backgroundDefault,
                        opacity: pressed ? 0.9 : 1 
                      }
                    ]}
                  >
                    <ThemedText>{cat.name}</ThemedText>
                    {category === cat.id && (
                      <Feather name="check" size={20} color={Colors.dark.primary} />
                    )}
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Project Selection Modal */}
      <Modal
        visible={showProjectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Select Project</ThemedText>
              <Pressable onPress={() => setShowProjectModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {projects.length === 0 ? (
                <View style={styles.emptyModalState}>
                  <ThemedText style={{ color: theme.textMuted }}>No projects available</ThemedText>
                </View>
              ) : (
                projects.map((proj) => (
                  <Pressable
                    key={proj.id}
                    onPress={() => {
                      setProject(proj.id);
                      setShowProjectModal(false);
                      setError("");
                    }}
                    style={({ pressed }) => [
                      styles.modalItem,
                      { 
                        backgroundColor: theme.backgroundDefault,
                        opacity: pressed ? 0.9 : 1 
                      }
                    ]}
                  >
                    <ThemedText>{proj.name}</ThemedText>
                    {project === proj.id && (
                      <Feather name="check" size={20} color={Colors.dark.primary} />
                    )}
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  errorContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    maxHeight: "70%",
    paddingBottom: Spacing["2xl"],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  modalList: {
    flex: 1,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.1)",
  },
  emptyModalState: {
    padding: Spacing["2xl"],
    alignItems: "center",
  },
});

