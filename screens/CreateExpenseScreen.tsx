import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator, Modal, ScrollView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
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

type ExpenseReceiptAttachment = {
  dataUrl: string;
  previewUri: string;
  fileName: string;
  mimeType: string;
};

async function fileUriToDataUrl(uri: string, mimeType: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64",
  });
  return `data:${mimeType};base64,${base64}`;
}

/** Web: pick image or PDF from device files (no extra native module). */
function pickReceiptFileWeb(): Promise<{
  dataUrl: string;
  fileName: string;
  mimeType: string;
} | null> {
  if (typeof document === "undefined") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";
    input.style.display = "none";

    const cleanup = () => {
      input.remove();
    };

    input.onchange = () => {
      const file = input.files?.[0];
      cleanup();
      if (!file) {
        resolve(null);
        return;
      }

      const mime = file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/jpeg");
      if (!mime.startsWith("image/") && mime !== "application/pdf") {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = typeof reader.result === "string" ? reader.result : null;
        if (!dataUrl) {
          resolve(null);
          return;
        }
        resolve({ dataUrl, fileName: file.name, mimeType: mime });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };

    document.body.appendChild(input);
    input.click();
  });
}

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
  const [attachments, setAttachments] = useState<(ExpenseReceiptAttachment | null)[]>([
    null,
    null,
    null,
  ]);
  const [pickingAttachmentIndex, setPickingAttachmentIndex] = useState<number | null>(null);

  const ATTACHMENT_LABELS = [
    { label: "Attachment 1", required: false },
    { label: "Attachment 2", required: false },
    { label: "Attachment 3", required: false },
  ] as const;

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
    const adminId = employee.adminId;
    if (!adminId) {
      Alert.alert(
        "Error",
        "Unable to load categories. Please try again later.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsLoadingCategories(true);
    try {
      const response = await apiService.getExpenseCategories(adminId);
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
    const adminId = employee.adminId;
    if (!adminId) {
      Alert.alert(
        "Error",
        "Unable to load projects. Please try again later.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsLoadingProjects(true);
    try {
      const response = await apiService.getExpenseProjects(adminId);
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

  const setAttachmentAt = (index: number, value: ExpenseReceiptAttachment | null) => {
    setAttachments((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setError("");
  };

  const applyAttachment = async (
    index: number,
    uri: string,
    mimeType: string,
    fileName: string,
    existingDataUrl?: string
  ) => {
    try {
      const dataUrl = existingDataUrl ?? (await fileUriToDataUrl(uri, mimeType));
      setAttachmentAt(index, {
        dataUrl,
        previewUri: uri,
        fileName,
        mimeType,
      });
    } catch (err) {
      console.error("Error reading receipt file:", err);
      Alert.alert("Error", "Could not read the selected file. Please try another file.");
    }
  };

  const pickImageFromSource = async (index: number, useCamera: boolean) => {
    setPickingAttachmentIndex(index);
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "Permission required",
          useCamera
            ? "Camera permission is required to capture a receipt."
            : "Gallery permission is required to select a receipt."
        );
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.7,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.7,
            base64: true,
          });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const mime = asset.mimeType || "image/jpeg";
        const fileName = asset.fileName || `receipt_${index + 1}.jpg`;
        if (asset.base64) {
          const dataUrl = `data:${mime};base64,${asset.base64}`;
          setAttachmentAt(index, {
            dataUrl,
            previewUri: asset.uri,
            fileName,
            mimeType: mime,
          });
        } else if (asset.uri) {
          await applyAttachment(index, asset.uri, mime, fileName);
        }
      }
    } catch (err) {
      console.error("Error picking expense attachment:", err);
      Alert.alert("Error", "Failed to add image. Please try again.");
    } finally {
      setPickingAttachmentIndex(null);
    }
  };

  const pickFileFromDevice = async (index: number) => {
    setPickingAttachmentIndex(index);
    try {
      if (Platform.OS === "web") {
        const picked = await pickReceiptFileWeb();
        if (!picked) {
          return;
        }
        setAttachmentAt(index, {
          dataUrl: picked.dataUrl,
          previewUri: picked.dataUrl,
          fileName: picked.fileName,
          mimeType: picked.mimeType,
        });
        return;
      }

      // Native: gallery / file manager for images (no expo-document-picker required)
      await pickImageFromSource(index, false);
    } catch (err) {
      console.error("Error picking document:", err);
      Alert.alert("Error", "Failed to pick file. Please try again.");
    } finally {
      setPickingAttachmentIndex(null);
    }
  };

  const handlePickAttachment = (index: number) => {
    const fileLabel = Platform.OS === "web" ? "Choose file" : "Photos / files";
    Alert.alert(
      ATTACHMENT_LABELS[index].label,
      Platform.OS === "web"
        ? "Add a receipt (photo or PDF)"
        : "Add a receipt photo (camera or gallery)",
      [
        { text: "Camera", onPress: () => pickImageFromSource(index, true) },
        { text: "Gallery", onPress: () => pickImageFromSource(index, false) },
        { text: fileLabel, onPress: () => pickFileFromDevice(index) },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      const adminId = employee.adminId;
      const userId = employee.id;

      if (!adminId || !userId) {
        setError("User ID or Site ID not found. Please login again.");
        setIsSubmitting(false);
        return;
      }

      const today = new Date();
      const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const parsedAmount = amount.trim() ? parseFloat(amount) : NaN;

      const expenseData: {
        category?: number;
        project?: number | null;
        title?: string;
        expense_date?: string;
        amount?: number;
        description?: string;
        receipt_images?: string[];
      } = {
        title: title.trim() || undefined,
        expense_date: expenseDate.trim() || defaultDate,
        description: description.trim() || undefined,
      };

      const receiptImages = attachments
        .filter((item): item is ExpenseReceiptAttachment => Boolean(item))
        .map((item) => item.dataUrl);
      if (receiptImages.length > 0) {
        expenseData.receipt_images = receiptImages;
      }

      if (category) {
        expenseData.category = category;
      }
      if (project) {
        expenseData.project = project;
      } else {
        expenseData.project = null;
      }
      if (!Number.isNaN(parsedAmount)) {
        expenseData.amount = parsedAmount;
      }

      const response = await apiService.createExpense(adminId, userId, expenseData);

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
            Category
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
            Project (optional)
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
            Title (optional)
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
            Expense Date (optional)
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
            Amount
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

        <Spacer height={Spacing.lg} />

        {/* Receipt attachments */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Receipt attachments
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.md }}>
            Optional — up to 3 files (image or PDF). Camera, gallery, or choose from files.
          </ThemedText>
          {ATTACHMENT_LABELS.map((slot, index) => {
            const attachment = attachments[index];
            const isPicking = pickingAttachmentIndex === index;
            const isImage = attachment?.mimeType?.startsWith("image/");
            return (
              <View key={slot.label} style={{ marginBottom: Spacing.md }}>
                <ThemedText type="small" style={{ color: theme.text, marginBottom: Spacing.xs }}>
                  {slot.label}
                  {slot.required ? " *" : " (optional)"}
                </ThemedText>
                {attachment ? (
                  <View style={[styles.attachmentPreviewWrap, { borderColor: theme.border }]}>
                    {isImage ? (
                      <Image
                        source={{ uri: attachment.previewUri }}
                        style={styles.attachmentPreview}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={[styles.filePreview, { backgroundColor: theme.backgroundDefault }]}>
                        <Feather name="file-text" size={40} color={Colors.dark.primary} />
                        <ThemedText
                          type="small"
                          style={{ marginTop: Spacing.sm, textAlign: "center", color: theme.text }}
                          numberOfLines={2}
                        >
                          {attachment.fileName}
                        </ThemedText>
                      </View>
                    )}
                    <View style={styles.attachmentActions}>
                      <Pressable
                        onPress={() => handlePickAttachment(index)}
                        disabled={isPicking}
                        style={[styles.attachmentActionBtn, { backgroundColor: theme.backgroundDefault }]}
                      >
                        <Feather name="edit-2" size={16} color={theme.text} />
                        <ThemedText type="small" style={{ marginLeft: Spacing.xs }}>Change</ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => setAttachmentAt(index, null)}
                        disabled={isPicking}
                        style={[styles.attachmentActionBtn, { backgroundColor: Colors.dark.error + "20" }]}
                      >
                        <Feather name="trash-2" size={16} color={Colors.dark.error} />
                        <ThemedText type="small" style={{ marginLeft: Spacing.xs, color: Colors.dark.error }}>
                          Remove
                        </ThemedText>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => handlePickAttachment(index)}
                    disabled={isPicking}
                    style={({ pressed }) => [
                      styles.attachmentAddButton,
                      {
                        backgroundColor: theme.backgroundDefault,
                        borderColor: slot.required ? Colors.dark.primary : theme.border,
                        opacity: pressed || isPicking ? 0.9 : 1,
                      },
                    ]}
                  >
                    {isPicking ? (
                      <ActivityIndicator size="small" color={theme.textMuted} />
                    ) : (
                      <>
                        <Feather
                          name="paperclip"
                          size={22}
                          color={slot.required ? Colors.dark.primary : theme.textMuted}
                        />
                        <ThemedText
                          style={{
                            marginLeft: Spacing.sm,
                            color: slot.required ? Colors.dark.primary : theme.textMuted,
                          }}
                        >
                          Add receipt (optional)
                        </ThemedText>
                      </>
                    )}
                  </Pressable>
                )}
              </View>
            );
          })}
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
  attachmentAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  attachmentPreviewWrap: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  attachmentPreview: {
    width: "100%",
    height: 180,
  },
  filePreview: {
    width: "100%",
    minHeight: 120,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentActions: {
    flexDirection: "row",
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  attachmentActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
});

