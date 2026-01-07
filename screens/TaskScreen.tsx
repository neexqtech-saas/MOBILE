import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore, Task } from "@/store/hrmsStore";
import { TaskStackParamList } from "@/navigation/TaskStackNavigator";
import Spacer from "@/components/Spacer";
import { RefreshButton } from "@/components/RefreshButton";

type TaskScreenNavigationProp = NativeStackNavigationProp<
  TaskStackParamList,
  "Tasks"
>;

const FILTERS = ["All", "Pending", "In Progress", "Completed"] as const;
type Filter = (typeof FILTERS)[number];

export default function TaskScreen() {
  const navigation = useNavigation<TaskScreenNavigationProp>();
  const { theme } = useTheme();
  const { tasks, fetchTasks } = useHRMSStore();

  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch tasks when screen loads
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      const result = await fetchTasks();
      setIsLoading(false);
      if (!result.success) {
        console.error('Failed to fetch tasks:', result.error);
      }
    };
    loadTasks();
  }, [fetchTasks]);

  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Pending") return task.status === "pending";
    if (activeFilter === "In Progress") return task.status === "in-progress";
    if (activeFilter === "Completed") return task.status === "completed";
    return true;
  });

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

  const getStatusLabel = (status: Task["status"]) => {
    switch (status) {
      case "in-progress":
        return "In Progress";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = (dateStr: string) => {
    return new Date(dateStr) < new Date();
  };

  const handleTaskPress = (task: Task) => {
    // Navigate to detail screen
    navigation.navigate("TaskDetail", { taskId: task.id });
  };

  const renderTaskCard = (task: Task) => {
    const priorityColor = getPriorityColor(task.priority);
    const statusColor = getStatusColor(task.status);
    const overdue = isOverdue(task.dueDate) && task.status !== "completed";
    const isPending = task.status === "pending";

    return (
      <Pressable
        key={task.id}
        onPress={() => handleTaskPress(task)}
        style={({ pressed }) => [
          styles.taskCard,
          { 
            backgroundColor: isPending ? Colors.dark.primary + "08" : theme.backgroundDefault,
            borderWidth: isPending ? 2 : 1,
            borderColor: isPending ? Colors.dark.primary : theme.border,
            opacity: pressed ? 0.7 : 1,
            shadowColor: isPending ? Colors.dark.primary : "#000",
            shadowOffset: { width: 0, height: isPending ? 3 : 1 },
            shadowOpacity: isPending ? 0.15 : 0.05,
            shadowRadius: isPending ? 6 : 2,
            elevation: isPending ? 4 : 1,
          },
        ]}
      >
        {isPending && (
          <View style={styles.pendingBadge}>
            <Feather name="clock" size={12} color={Colors.dark.primary} />
            <ThemedText type="small" style={{ color: Colors.dark.primary, fontWeight: "700", marginLeft: Spacing.xs }}>
              PENDING
            </ThemedText>
          </View>
        )}
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleRow}>
            <View
              style={[
                styles.priorityIndicator,
                { backgroundColor: priorityColor },
              ]}
            />
            <ThemedText
              type="body"
              style={{ fontWeight: isPending ? "700" : "600", flex: 1, color: isPending ? Colors.dark.primary : theme.text }}
              numberOfLines={1}
            >
              {task.title}
            </ThemedText>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "20" },
            ]}
          >
            <ThemedText
              type="small"
              style={{ color: statusColor, fontWeight: "600" }}
            >
              {getStatusLabel(task.status)}
            </ThemedText>
          </View>
        </View>

        <ThemedText
          type="small"
          style={{ color: theme.textMuted, marginTop: Spacing.sm }}
          numberOfLines={2}
        >
          {task.description}
        </ThemedText>

        <View style={styles.taskFooter}>
          <View style={styles.taskMeta}>
            <View style={styles.taskMetaItem}>
              <Feather
                name="calendar"
                size={14}
                color={overdue ? Colors.dark.error : theme.textMuted}
              />
              <ThemedText
                type="small"
                style={{ color: overdue ? Colors.dark.error : theme.textMuted }}
              >
                {formatDate(task.dueDate)}
                {overdue ? " (Overdue)" : ""}
              </ThemedText>
            </View>
            <View style={styles.taskMetaItem}>
              <Feather name="user" size={14} color={theme.textMuted} />
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                {task.assignedBy}
              </ThemedText>
            </View>
          </View>
          <View style={styles.taskIcons}>
            {task.attachments > 0 ? (
              <View style={styles.iconBadge}>
                <Feather name="paperclip" size={14} color={theme.textMuted} />
                <ThemedText type="small" style={{ color: theme.textMuted }}>
                  {task.attachments}
                </ThemedText>
              </View>
            ) : null}
            {task.comments.length > 0 ? (
              <View style={styles.iconBadge}>
                <Feather name="message-square" size={14} color={theme.textMuted} />
                <ThemedText type="small" style={{ color: theme.textMuted }}>
                  {task.comments.length}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };

  const taskCounts = {
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    const result = await fetchTasks();
    setIsLoading(false);
    if (!result.success) {
      console.error('Failed to fetch tasks:', result.error);
    }
  };

  return (
    <ScreenScrollView>
      <View style={styles.refreshHeader}>
        <View style={{ flex: 1 }} />
        <RefreshButton
          onPress={handleRefresh}
          isLoading={isLoading}
          label="Refresh"
        />
      </View>
      <Spacer height={Spacing.lg} />
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: Colors.dark.pending + "20" }]}>
          <ThemedText type="h3" style={{ color: Colors.dark.pending }}>
            {taskCounts.pending}
          </ThemedText>
          <ThemedText type="small" style={{ color: Colors.dark.pending }}>
            Pending
          </ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.dark.primary + "20" }]}>
          <ThemedText type="h3" style={{ color: Colors.dark.primary }}>
            {taskCounts.inProgress}
          </ThemedText>
          <ThemedText type="small" style={{ color: Colors.dark.primary }}>
            In Progress
          </ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.dark.success + "20" }]}>
          <ThemedText type="h3" style={{ color: Colors.dark.success }}>
            {taskCounts.completed}
          </ThemedText>
          <ThemedText type="small" style={{ color: Colors.dark.success }}>
            Completed
          </ThemedText>
        </View>
      </View>

      <Spacer height={Spacing.xl} />

      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setActiveFilter(filter)}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  activeFilter === filter
                    ? Colors.dark.primary
                    : theme.backgroundDefault,
              },
            ]}
          >
            <ThemedText
              type="small"
              style={{
                color: activeFilter === filter ? "#000000" : theme.text,
                fontWeight: activeFilter === filter ? "600" : "400",
              }}
            >
              {filter}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Spacer height={Spacing.xl} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <ThemedText style={{ color: theme.textMuted, marginTop: Spacing.md }}>
            Loading tasks...
          </ThemedText>
        </View>
      ) : filteredTasks.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="check-square" size={48} color={theme.textMuted} />
          <ThemedText style={{ color: theme.textMuted, marginTop: Spacing.md }}>
            No tasks found
          </ThemedText>
        </View>
      ) : (
        filteredTasks.map((task) => (
          <View key={task.id} style={{ marginBottom: Spacing.md }}>
            {renderTaskCard(task)}
          </View>
        ))
      )}

      <Spacer height={Spacing["2xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  refreshHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  taskCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.primary + "15",
    marginBottom: Spacing.sm,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm,
  },
  priorityIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  taskMeta: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  taskMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  taskIcons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  iconBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  emptyState: {
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  loadingContainer: {
    padding: Spacing["3xl"],
    alignItems: "center",
    justifyContent: "center",
  },
});
