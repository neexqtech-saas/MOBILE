import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
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
import { getCurrentMonthDates } from "@/utils/dateHelpers";

type TaskScreenNavigationProp = NativeStackNavigationProp<
  TaskStackParamList,
  "Tasks"
>;

const FILTERS = ["All", "Pending", "In Progress", "Completed"] as const;
type Filter = (typeof FILTERS)[number];

export default function TaskScreen() {
  const navigation = useNavigation<TaskScreenNavigationProp>();
  const { theme, isDark } = useTheme();
  const { tasks, fetchTasks } = useHRMSStore();
  const { width } = useWindowDimensions();

  const layout = useMemo(() => {
    const compact = width < 392;
    const wide = width >= 560;
    return {
      compact,
      wide,
      screenHPad: wide ? Spacing.xl : compact ? Spacing.sm + 2 : Spacing.md,
      sectionGap: compact ? Spacing.sm : Spacing.md,
      cardPad: compact ? 10 : 12,
      cardRadius: BorderRadius.lg,
      titleFs: compact ? 13.5 : 14.5,
      metaFs: compact ? 11 : 12,
      iconSm: compact ? 11 : 12,
      iconMd: compact ? 13 : 14,
      statMinH: compact ? 72 : 84,
      statValueFs: compact ? 18 : wide ? 24 : 21,
      statLabelFs: compact ? 9 : 10,
      statIconBox: compact ? 30 : 34,
      statCardPad: compact ? 8 : 10,
      filterFs: compact ? 10 : 11,
      filterPadV: compact ? 5 : 7,
      filterMinH: compact ? 30 : 34,
    };
  }, [width]);

  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch tasks when screen loads
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      const { from, to } = getCurrentMonthDates();
      const result = await fetchTasks(from, to);
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
            backgroundColor: isPending ? Colors.dark.primary + "08" : theme.cardBackground,
            borderWidth: isPending ? 2 : 1,
            borderColor: isPending ? Colors.dark.primary : theme.border,
            borderRadius: layout.cardRadius,
            padding: layout.cardPad,
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
          <View style={[styles.pendingBadge, { paddingVertical: 3, paddingHorizontal: Spacing.sm }]}>
            <Feather name="clock" size={layout.iconSm} color={Colors.dark.primary} />
            <ThemedText style={{ color: Colors.dark.primary, fontWeight: "700", marginLeft: 4, fontSize: layout.metaFs }}>
              PENDING
            </ThemedText>
          </View>
        )}
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleRow}>
            <View
              style={[
                styles.priorityIndicator,
                { backgroundColor: priorityColor, height: layout.compact ? 18 : 22 },
              ]}
            />
            <ThemedText
              style={{
                fontWeight: isPending ? "700" : "600",
                flex: 1,
                fontSize: layout.titleFs,
                color: isPending ? Colors.dark.primary : theme.text,
              }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {task.title}
            </ThemedText>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusColor + "15",
                borderColor: statusColor + "40",
                paddingVertical: 3,
                paddingHorizontal: 8,
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <ThemedText style={[styles.statusText, { color: statusColor, fontSize: layout.metaFs }]}>
              {getStatusLabel(task.status)}
            </ThemedText>
          </View>
        </View>

        <ThemedText
          style={{ color: theme.textMuted, marginTop: Spacing.xs, fontSize: layout.metaFs, lineHeight: layout.metaFs + 4 }}
          numberOfLines={2}
        >
          {task.description}
        </ThemedText>

        <View style={[styles.taskFooter, { borderTopColor: theme.border, marginTop: Spacing.sm, paddingTop: Spacing.sm }]}>
          <View style={styles.taskMeta}>
            <View style={styles.taskMetaItem}>
              <Feather
                name="calendar"
                size={layout.iconMd}
                color={overdue ? Colors.dark.error : theme.textMuted}
              />
              <ThemedText
                style={{ fontSize: layout.metaFs, color: overdue ? Colors.dark.error : theme.textMuted }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {formatDate(task.dueDate)}
                {overdue ? " (Overdue)" : ""}
              </ThemedText>
            </View>
            <View style={styles.taskMetaItem}>
              <Feather name="user" size={layout.iconMd} color={theme.textMuted} />
              <ThemedText
                style={{ fontSize: layout.metaFs, color: theme.textMuted }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {task.assignedBy}
              </ThemedText>
            </View>
            {task.status === "completed" && task.startTime && task.endTime && (
              <>
                <View style={styles.taskMetaItem}>
                  <Feather name="play-circle" size={layout.iconMd} color={Colors.dark.success} />
                  <ThemedText
                    style={{ fontSize: layout.metaFs, color: Colors.dark.success }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formatTime(task.startTime)}
                  </ThemedText>
                </View>
                <View style={styles.taskMetaItem}>
                  <Feather name="stop-circle" size={layout.iconMd} color={Colors.dark.success} />
                  <ThemedText
                    style={{ fontSize: layout.metaFs, color: Colors.dark.success }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {formatTime(task.endTime)}
                  </ThemedText>
                </View>
              </>
            )}
          </View>
          <View style={styles.taskIcons}>
            {task.attachments > 0 ? (
              <View style={styles.iconBadge}>
                <Feather name="paperclip" size={layout.iconMd} color={theme.textMuted} />
                <ThemedText style={{ color: theme.textMuted, fontSize: layout.metaFs }}>{task.attachments}</ThemedText>
              </View>
            ) : null}
            {task.comments.length > 0 ? (
              <View style={styles.iconBadge}>
                <Feather name="message-square" size={layout.iconMd} color={theme.textMuted} />
                <ThemedText style={{ color: theme.textMuted, fontSize: layout.metaFs }}>{task.comments.length}</ThemedText>
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
    const { from, to } = getCurrentMonthDates();
    const result = await fetchTasks(from, to);
    setIsLoading(false);
    if (!result.success) {
      console.error('Failed to fetch tasks:', result.error);
    }
  };

  return (
    <ScreenScrollView contentContainerStyle={{ paddingBottom: Spacing["2xl"] }}>
      <View style={[styles.refreshHeader, { paddingHorizontal: layout.screenHPad }]}>
        <View style={{ flex: 1, minWidth: 0, paddingRight: Spacing.sm }}>
          <ThemedText
            style={[styles.pageSubtitle, { color: theme.textMuted, fontSize: layout.metaFs + 1.5 }]}
            numberOfLines={2}
          >
            Track and complete assignments for the current month.
          </ThemedText>
        </View>
        <RefreshButton
          onPress={handleRefresh}
          isLoading={isLoading}
          label="Refresh"
        />
      </View>
      <Spacer height={layout.sectionGap} />
      <View style={[styles.statsRow, { paddingHorizontal: layout.screenHPad, gap: layout.compact ? 6 : Spacing.sm }]}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: Colors.dark.pending + (isDark ? "22" : "15"),
              borderColor: Colors.dark.pending + (isDark ? "45" : "30"),
              padding: layout.statCardPad,
              minHeight: layout.statMinH,
              borderRadius: layout.cardRadius,
            },
          ]}
        >
          <View
            style={[
              styles.statIconContainer,
              {
                backgroundColor: Colors.dark.pending + "20",
                width: layout.statIconBox,
                height: layout.statIconBox,
                marginBottom: Spacing.xs,
              },
            ]}
          >
            <Feather name="clock" size={layout.compact ? 16 : 18} color={Colors.dark.pending} />
          </View>
          <ThemedText style={[styles.statValue, { color: Colors.dark.pending, fontSize: layout.statValueFs }]}>
            {taskCounts.pending}
          </ThemedText>
          <ThemedText
            style={[styles.statLabel, { color: Colors.dark.pending, fontSize: layout.statLabelFs }]}
            numberOfLines={2}
          >
            Pending
          </ThemedText>
        </View>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: Colors.dark.primary + (isDark ? "22" : "15"),
              borderColor: Colors.dark.primary + (isDark ? "45" : "30"),
              padding: layout.statCardPad,
              minHeight: layout.statMinH,
              borderRadius: layout.cardRadius,
            },
          ]}
        >
          <View
            style={[
              styles.statIconContainer,
              {
                backgroundColor: Colors.dark.primary + "20",
                width: layout.statIconBox,
                height: layout.statIconBox,
                marginBottom: Spacing.xs,
              },
            ]}
          >
            <Feather name="play-circle" size={layout.compact ? 16 : 18} color={Colors.dark.primary} />
          </View>
          <ThemedText style={[styles.statValue, { color: Colors.dark.primary, fontSize: layout.statValueFs }]}>
            {taskCounts.inProgress}
          </ThemedText>
          <ThemedText
            style={[styles.statLabel, { color: Colors.dark.primary, fontSize: layout.statLabelFs }]}
            numberOfLines={2}
          >
            {layout.compact ? "Active" : "In Progress"}
          </ThemedText>
        </View>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: Colors.dark.success + (isDark ? "22" : "15"),
              borderColor: Colors.dark.success + (isDark ? "45" : "30"),
              padding: layout.statCardPad,
              minHeight: layout.statMinH,
              borderRadius: layout.cardRadius,
            },
          ]}
        >
          <View
            style={[
              styles.statIconContainer,
              {
                backgroundColor: Colors.dark.success + "20",
                width: layout.statIconBox,
                height: layout.statIconBox,
                marginBottom: Spacing.xs,
              },
            ]}
          >
            <Feather name="check-circle" size={layout.compact ? 16 : 18} color={Colors.dark.success} />
          </View>
          <ThemedText style={[styles.statValue, { color: Colors.dark.success, fontSize: layout.statValueFs }]}>
            {taskCounts.completed}
          </ThemedText>
          <ThemedText
            style={[styles.statLabel, { color: Colors.dark.success, fontSize: layout.statLabelFs }]}
            numberOfLines={2}
          >
            {layout.compact ? "Done" : "Completed"}
          </ThemedText>
        </View>
      </View>

      <Spacer height={layout.sectionGap} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterScrollInner, { paddingHorizontal: layout.screenHPad }]}
      >
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
                minHeight: layout.filterMinH,
                paddingVertical: layout.filterPadV,
                paddingHorizontal: layout.compact ? Spacing.sm : Spacing.md,
                backgroundColor:
                  activeFilter === filter ? Colors.dark.primary : theme.cardBackground,
                borderColor: activeFilter === filter ? Colors.dark.primary : theme.border,
                opacity: pressed ? 0.85 : 1,
                borderWidth: 1,
              },
            ]}
          >
            <ThemedText
              style={{
                color: activeFilter === filter ? "#FFFFFF" : theme.text,
                fontWeight: activeFilter === filter ? "700" : "600",
                fontSize: layout.filterFs,
              }}
            >
              {filter}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: layout.screenHPad, marginTop: Spacing.sm }}>
        <ThemedText style={[styles.rangeHint, { color: theme.textMuted, fontSize: layout.metaFs }]}>
          Showing tasks for this month
        </ThemedText>
      </View>

      <Spacer height={layout.sectionGap} />

      {isLoading ? (
        <View style={[styles.loadingContainer, { paddingHorizontal: layout.screenHPad }]}>
          <View style={[styles.loadingIconContainer, { width: 48, height: 48, marginBottom: Spacing.md }]}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
          </View>
          <ThemedText style={[styles.loadingText, { color: theme.textMuted, fontSize: layout.metaFs }]}>
            Loading tasks...
          </ThemedText>
        </View>
      ) : filteredTasks.length === 0 ? (
        <View
          style={[
            styles.emptyState,
            {
              marginHorizontal: layout.screenHPad,
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="check-square" size={layout.compact ? 40 : 48} color={theme.textMuted} />
          </View>
          <ThemedText style={[styles.emptyTitle, { color: theme.text, fontSize: layout.compact ? 15 : 16 }]}>
            No tasks found
          </ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: theme.textMuted, fontSize: layout.metaFs }]}>
            {activeFilter === "All" ? "No tasks available" : `No ${activeFilter.toLowerCase()} tasks`}
          </ThemedText>
        </View>
      ) : (
        <View style={{ paddingHorizontal: layout.screenHPad, gap: layout.sectionGap }}>
          {filteredTasks.map((task) => (
            <View key={task.id}>{renderTaskCard(task)}</View>
          ))}
        </View>
      )}

      <Spacer height={Spacing["2xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  refreshHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  pageSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "stretch",
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
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
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontWeight: "800",
    marginBottom: Spacing.xs,
    letterSpacing: -0.45,
    textAlign: "center",
  },
  statLabel: {
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.45,
    textAlign: "center",
    lineHeight: 16,
  },
  filterScrollInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  rangeHint: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.15,
  },
  filterChip: {
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  filterText: {
    letterSpacing: 0.15,
  },
  taskCard: {},
  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.primary + "15",
    marginBottom: Spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
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
    borderRadius: BorderRadius.sm,
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    flexWrap: "wrap",
    gap: Spacing.sm,
    width: "100%",
  },
  taskMeta: {
    flexDirection: "row",
    gap: Spacing.sm,
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
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    minHeight: 200,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
    paddingHorizontal: Spacing.sm,
  },
  loadingContainer: {
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
  },
  loadingIconContainer: {
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.primary + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontWeight: "500",
  },
});
