import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Platform, Dimensions } from "react-native";
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
        return timeStr;
      }
      
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeStr;
    }
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
            backgroundColor: isPending ? Colors.dark.primary + "08" : "#FFFFFF",
            borderWidth: isPending ? 2 : 1,
            borderColor: isPending ? Colors.dark.primary : "#E2E8F0",
            opacity: pressed ? 0.9 : 1,
            ...Platform.select({
              ios: {
                shadowColor: isPending ? Colors.dark.primary : "#000",
                shadowOffset: { width: 0, height: isPending ? 4 : 2 },
                shadowOpacity: isPending ? 0.2 : 0.08,
                shadowRadius: isPending ? 8 : 8,
              },
              android: {
                elevation: isPending ? 4 : 3,
              },
              web: {
                boxShadow: isPending 
                  ? `0 4px 12px ${Colors.dark.primary}30`
                  : "0 2px 8px rgba(0, 0, 0, 0.08)",
              },
            }),
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
              ellipsizeMode="tail"
            >
              {task.title}
            </ThemedText>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "15", borderColor: statusColor + "40" },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <ThemedText
              type="small"
              style={[styles.statusText, { color: statusColor }]}
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
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {formatDate(task.dueDate)}
                {overdue ? " (Overdue)" : ""}
              </ThemedText>
            </View>
            <View style={styles.taskMetaItem}>
              <Feather name="user" size={14} color={theme.textMuted} />
              <ThemedText 
                type="small" 
                style={{ color: theme.textMuted }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {task.assignedBy}
              </ThemedText>
            </View>
            {task.status === "completed" && task.startTime && task.endTime && (
              <>
                <View style={styles.taskMetaItem}>
                  <Feather name="play-circle" size={14} color={Colors.dark.success} />
                  <ThemedText 
                    type="small" 
                    style={{ color: Colors.dark.success }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Start: {formatTime(task.startTime)}
                  </ThemedText>
                </View>
                <View style={styles.taskMetaItem}>
                  <Feather name="stop-circle" size={14} color={Colors.dark.success} />
                  <ThemedText 
                    type="small" 
                    style={{ color: Colors.dark.success }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    End: {formatTime(task.endTime)}
                  </ThemedText>
                </View>
              </>
            )}
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
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleIconContainer}>
            <Feather name="check-square" size={22} color={Colors.dark.primary} />
          </View>
          <ThemedText type="h4" style={styles.title}>My Tasks</ThemedText>
        </View>
      </View>
      <Spacer height={Spacing.lg} />
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: Colors.dark.pending + "15", borderColor: Colors.dark.pending + "30" }]}>
          <View style={[styles.statIconContainer, { backgroundColor: Colors.dark.pending + "20" }]}>
            <Feather name="clock" size={20} color={Colors.dark.pending} />
          </View>
          <ThemedText type="h3" style={[styles.statValue, { color: Colors.dark.pending }]}>
            {taskCounts.pending}
          </ThemedText>
          <ThemedText type="small" style={[styles.statLabel, { color: Colors.dark.pending }]}>
            Pending
          </ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.dark.primary + "15", borderColor: Colors.dark.primary + "30" }]}>
          <View style={[styles.statIconContainer, { backgroundColor: Colors.dark.primary + "20" }]}>
            <Feather name="play-circle" size={20} color={Colors.dark.primary} />
          </View>
          <ThemedText type="h3" style={[styles.statValue, { color: Colors.dark.primary }]}>
            {taskCounts.inProgress}
          </ThemedText>
          <ThemedText type="small" style={[styles.statLabel, { color: Colors.dark.primary }]}>
            In Progress
          </ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.dark.success + "15", borderColor: Colors.dark.success + "30" }]}>
          <View style={[styles.statIconContainer, { backgroundColor: Colors.dark.success + "20" }]}>
            <Feather name="check-circle" size={20} color={Colors.dark.success} />
          </View>
          <ThemedText type="h3" style={[styles.statValue, { color: Colors.dark.success }]}>
            {taskCounts.completed}
          </ThemedText>
          <ThemedText type="small" style={[styles.statLabel, { color: Colors.dark.success }]}>
            Completed
          </ThemedText>
        </View>
      </View>

      <Spacer height={Spacing.xl} />

      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <Pressable
            key={filter}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveFilter(filter);
            }}
            style={({ pressed }) => [
              styles.filterChip,
              {
                backgroundColor:
                  activeFilter === filter
                    ? Colors.dark.primary
                    : theme.backgroundDefault,
                borderColor: activeFilter === filter ? Colors.dark.primary : "#E2E8F0",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <ThemedText
              type="small"
              style={[
                styles.filterText,
                {
                  color: activeFilter === filter ? "#FFFFFF" : theme.text,
                  fontWeight: activeFilter === filter ? "700" : "600",
                },
              ]}
            >
              {filter}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Spacer height={Spacing.xl} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
          </View>
          <ThemedText style={styles.loadingText}>
            Loading tasks...
          </ThemedText>
        </View>
      ) : filteredTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Feather name="check-square" size={56} color={theme.textMuted} />
          </View>
          <ThemedText style={styles.emptyTitle}>No Tasks Found</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            {activeFilter === "All" ? "No tasks available" : `No ${activeFilter.toLowerCase()} tasks`}
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
  header: {
    paddingHorizontal: Spacing["2xl"],
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  titleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 24 : 20,
      default: 20,
    }),
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing["2xl"],
    alignItems: "stretch",
  },
  statCard: {
    flex: 1,
    padding: Platform.select({
      web: Dimensions.get('window').width > 768 ? Spacing.xl : Spacing.lg,
      default: Spacing.lg,
    }),
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    minHeight: Platform.select({
      web: Dimensions.get('window').width > 768 ? 140 : 120,
      default: 120,
    }),
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
      },
    }),
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  statValue: {
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 32 : 28,
      default: 28,
    }),
    fontWeight: "800",
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  statLabel: {
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing["2xl"],
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    minHeight: 36,
  },
  filterText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  taskCard: {
    padding: Platform.select({
      web: Dimensions.get('window').width > 768 ? Spacing.xl : Spacing.lg,
      default: Spacing.lg,
    }),
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing["2xl"],
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
    borderWidth: 1,
    borderColor: Colors.dark.primary + "30",
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
    flexWrap: "wrap",
    width: "100%",
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm,
    minWidth: 0,
    maxWidth: "100%",
  },
  priorityIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    borderWidth: 1,
    flexShrink: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    flexWrap: "wrap",
    gap: Spacing.sm,
    width: "100%",
  },
  taskMeta: {
    flexDirection: "row",
    gap: Spacing.lg,
    flexWrap: "wrap",
    flex: 1,
    minWidth: 0,
  },
  taskMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flexShrink: 1,
    maxWidth: "100%",
  },
  taskIcons: {
    flexDirection: "row",
    gap: Spacing.md,
    flexShrink: 0,
  },
  iconBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  emptyState: {
    padding: Platform.select({
      web: Dimensions.get('window').width > 768 ? Spacing["3xl"] : Spacing["2xl"],
      default: Spacing["2xl"],
    }),
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    marginHorizontal: Spacing["2xl"],
    backgroundColor: "#F8FAFC",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  loadingContainer: {
    padding: Spacing["3xl"],
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  loadingIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.dark.primary + "10",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "500",
  },
});
