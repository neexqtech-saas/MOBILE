import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Modal, TextInput, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useHRMSStore, Task } from "@/store/hrmsStore";
import { apiService } from "@/services/api";
import { TaskStackParamList } from "@/navigation/TaskStackNavigator";
import Spacer from "@/components/Spacer";

type TaskDetailScreenNavigationProp = NativeStackNavigationProp<
  TaskStackParamList,
  "TaskDetail"
>;

type TaskDetailScreenRouteProp = RouteProp<TaskStackParamList, "TaskDetail">;

const STATUS_OPTIONS: { value: Task["status"]; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export default function TaskDetailScreen() {
  const navigation = useNavigation<TaskDetailScreenNavigationProp>();
  const route = useRoute<TaskDetailScreenRouteProp>();
  const { theme } = useTheme();
  const { tasks, updateTaskStatus, fetchTasks, employee } = useHRMSStore();

  const task = tasks.find((t) => t.id === route.params.taskId);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showEndTaskModal, setShowEndTaskModal] = useState(false);
  const [endTaskComment, setEndTaskComment] = useState("");

  if (!task) {
    return (
      <ScreenKeyboardAwareScrollView>
        <View style={styles.notFound}>
          <Feather name="alert-circle" size={48} color={theme.textMuted} />
          <ThemedText style={{ color: theme.textMuted, marginTop: Spacing.md }}>
            Task not found
          </ThemedText>
        </View>
      </ScreenKeyboardAwareScrollView>
    );
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return Colors.dark.error;
      case "medium":
        return Colors.dark.warning;
      case "low":
        return Colors.dark.success;
      default:
        return theme.textMuted;
    }
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return Colors.dark.success;
      case "in-progress":
        return Colors.dark.primary;
      case "pending":
        return Colors.dark.pending;
      default:
        return theme.textMuted;
    }
  };

  const handleStatusChange = async (status: Task["status"]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await updateTaskStatus(task.id, status);
    if (!result.success) {
      // You can show an error alert here if needed
      console.error('Failed to update task status:', result.error);
    }
  };

  const handleStartTask = async () => {
    if (task.status !== "pending" || isStarting) return;
    
    setIsStarting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Call PUT API to update task status to "in-progress"
    const updateResult = await updateTaskStatus(task.id, "in-progress");
    
    if (updateResult.success) {
      // Task status is already updated in store from PUT API response
      // Now call GET API with status="in-progress" to verify and refresh
      if (employee.siteId && employee.id) {
        try {
          // Call GET API with status="in-progress" to fetch and verify the task
          const response = await apiService.getMyTasks(employee.siteId, employee.id, "in-progress");
          
          if (response.data && response.data.length > 0) {
            // Find the updated task in the response
            const updatedTask = response.data.find((t: any) => t.id.toString() === task.id);
            
            // Check for both formats: API returns "in_progress" (underscore) or "in-progress" (hyphen)
            if (updatedTask && (updatedTask.status === "in_progress" || updatedTask.status === "in-progress")) {
              // Task successfully started and verified
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              // Refresh all tasks to get updated data
              await fetchTasks();
            } else {
              // Task not found in in-progress list, refresh all tasks anyway
              await fetchTasks();
            }
          } else {
            // No in-progress tasks found, refresh all tasks as fallback
            await fetchTasks();
          }
        } catch (error) {
          console.error('Error fetching in-progress tasks:', error);
          // Still refresh all tasks as fallback
          await fetchTasks();
        }
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Failed to start task:', updateResult.error);
      setIsStarting(false);
      return;
    }
    
    setIsStarting(false);
  };

  const handleEndTaskClick = () => {
    if (task.status !== "in-progress") return;
    setShowEndTaskModal(true);
  };

  const handleEndTask = async () => {
    if (!endTaskComment.trim()) {
      Alert.alert("Comment Required", "Please add a comment before completing the task.");
      return;
    }
    
    setIsEnding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Call PUT API to update task status to "completed" with comment
    const updateResult = await updateTaskStatus(task.id, "completed", endTaskComment.trim());
    
    if (updateResult.success) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowEndTaskModal(false);
      setEndTaskComment("");
      
      // Refresh all tasks to get updated data
      if (employee.adminId && employee.id) {
        try {
          await fetchTasks();
        } catch (error) {
          console.error('Error refreshing tasks:', error);
        }
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", updateResult.error || "Failed to complete task. Please try again.");
    }
    
    setIsEnding(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return "Not set";
    try {
      // Check if it's already a full datetime string (contains 'T' and has date part)
      let date: Date;
      if (timeStr.includes('T') && timeStr.length > 10) {
        // It's a full datetime string, parse directly
        date = new Date(timeStr);
      } else {
        // It's just a time string, add a date
        date = new Date(`2000-01-01T${timeStr}`);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid time";
      }
      
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error('Error formatting time:', timeStr, error);
      return "Invalid time";
    }
  };

  const priorityColor = getPriorityColor(task.priority);

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={[styles.header, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.titleRow}>
          <View
            style={[styles.priorityIndicator, { backgroundColor: priorityColor }]}
          />
          <ThemedText type="h3" style={styles.title}>
            {task.title}
          </ThemedText>
        </View>
        <View style={styles.priorityBadge}>
          <ThemedText
            type="small"
            style={{ color: priorityColor, fontWeight: "600" }}
          >
            {task.priority.toUpperCase()} PRIORITY
          </ThemedText>
        </View>
      </View>

      <Spacer height={Spacing.xl} />

      <View style={[styles.detailCard, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText type="small" style={[styles.label, { color: theme.textMuted }]}>
          Description
        </ThemedText>
        <ThemedText style={{ lineHeight: 24 }}>{task.description}</ThemedText>
      </View>

      <Spacer height={Spacing.lg} />

      {/* Start Button for Pending Tasks */}
      {task.status === "pending" && (
        <>
          <Pressable
            onPress={handleStartTask}
            disabled={isStarting}
            style={({ pressed }) => [
              styles.startButton,
              {
                backgroundColor: isStarting ? theme.backgroundSecondary : Colors.dark.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {isStarting ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <Feather name="play-circle" size={20} color="#000000" />
                <ThemedText style={styles.startButtonText}>Start Task</ThemedText>
              </>
            )}
          </Pressable>
          <Spacer height={Spacing.lg} />
        </>
      )}

      {/* End Task Button for In-Progress Tasks */}
      {task.status === "in-progress" && (
        <>
          <Pressable
            onPress={handleEndTaskClick}
            disabled={isEnding}
            style={({ pressed }) => [
              styles.startButton,
              {
                backgroundColor: isEnding ? theme.backgroundSecondary : Colors.dark.success,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {isEnding ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <Feather name="check-circle" size={20} color="#000000" />
                <ThemedText style={styles.startButtonText}>End Task</ThemedText>
              </>
            )}
          </Pressable>
          <Spacer height={Spacing.lg} />
        </>
      )}

      <View style={[styles.detailCard, { backgroundColor: theme.backgroundDefault }]}>
        {task.taskTypeName && (
        <View style={styles.detailRow}>
            <Feather name="tag" size={18} color={Colors.dark.primary} />
            <View>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                Task Type
              </ThemedText>
              <ThemedText>{task.taskTypeName}</ThemedText>
            </View>
          </View>
        )}
        <View style={[styles.detailRow, task.taskTypeName ? { marginTop: Spacing.lg } : {}]}>
          <Feather name="calendar" size={18} color={Colors.dark.primary} />
          <View>
            <ThemedText type="small" style={{ color: theme.textMuted }}>
              Due Date
            </ThemedText>
            <ThemedText>{formatDate(task.dueDate)}</ThemedText>
          </View>
        </View>
        {task.startTime && (
          <View style={[styles.detailRow, { marginTop: Spacing.lg }]}>
            <Feather name="play-circle" size={18} color={Colors.dark.primary} />
            <View>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                Start Time
              </ThemedText>
              <ThemedText>{formatTime(task.startTime)}</ThemedText>
            </View>
          </View>
        )}
        {task.endTime && (
          <View style={[styles.detailRow, { marginTop: Spacing.lg }]}>
            <Feather name="stop-circle" size={18} color={Colors.dark.primary} />
            <View>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                End Time
              </ThemedText>
              <ThemedText>{formatTime(task.endTime)}</ThemedText>
            </View>
          </View>
        )}
        <View style={[styles.detailRow, { marginTop: Spacing.lg }]}>
          <Feather name="user" size={18} color={Colors.dark.primary} />
          <View>
            <ThemedText type="small" style={{ color: theme.textMuted }}>
              Assigned By
            </ThemedText>
            <ThemedText>{task.assignedBy}</ThemedText>
          </View>
        </View>
        {task.attachments > 0 ? (
          <View style={[styles.detailRow, { marginTop: Spacing.lg }]}>
            <Feather name="paperclip" size={18} color={Colors.dark.primary} />
            <View>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                Attachments
              </ThemedText>
              <ThemedText>{task.attachments} files</ThemedText>
            </View>
          </View>
        ) : null}
      </View>

      <Spacer height={Spacing["3xl"]} />

      {/* End Task Modal */}
      <Modal
        visible={showEndTaskModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowEndTaskModal(false);
          setEndTaskComment("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
            <ThemedText type="h3" style={styles.modalTitle}>
              Complete Task
            </ThemedText>
            
            <ThemedText type="small" style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              Please add a comment before completing this task.
      </ThemedText>

      <Spacer height={Spacing.lg} />

        <TextInput
          style={[
                styles.modalCommentInput,
            {
              backgroundColor: theme.backgroundDefault,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
              value={endTaskComment}
              onChangeText={setEndTaskComment}
              placeholder="Enter your comment..."
          placeholderTextColor={theme.textMuted}
          multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Spacer height={Spacing.xl} />

            <View style={styles.modalButtonRow}>
              <Pressable
                onPress={() => {
                  setShowEndTaskModal(false);
                  setEndTaskComment("");
                }}
                style={({ pressed }) => [
                  styles.modalCancelButton,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <ThemedText>Cancel</ThemedText>
              </Pressable>

        <Pressable
                onPress={handleEndTask}
                disabled={!endTaskComment.trim() || isEnding}
          style={({ pressed }) => [
                  styles.modalSubmitButton,
            {
                    backgroundColor: !endTaskComment.trim() || isEnding
                      ? theme.backgroundSecondary
                      : Colors.dark.success,
                    opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
                {isEnding ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <ThemedText style={styles.modalSubmitButtonText}>Complete Task</ThemedText>
                )}
        </Pressable>
      </View>
          </View>
        </View>
      </Modal>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing["5xl"],
  },
  header: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  priorityIndicator: {
    width: 4,
    height: 28,
    borderRadius: 2,
    marginTop: 2,
  },
  title: {
    flex: 1,
  },
  priorityBadge: {
    marginTop: Spacing.md,
    marginLeft: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  statusRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  detailCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    gap: Spacing.md,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    marginTop: Spacing.xs,
  },
  modalCommentInput: {
    minHeight: 100,
    maxHeight: 150,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.body.fontSize,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
});
