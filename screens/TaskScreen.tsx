import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
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

type TaskScreenNavigationProp = NativeStackNavigationProp<
  TaskStackParamList,
  "Tasks"
>;

const FILTERS = ["All", "Pending", "In Progress", "Completed"] as const;
type Filter = (typeof FILTERS)[number];

const STATUS_COLORS = {
  pending: { light: "#F59E0B", bg: "#FEF3C7" },
  "in-progress": { light: "#2563EB", bg: "#DBEAFE" },
  completed: { light: "#16A34A", bg: "#DCFCE7" },
} as const;

const PRIORITY_LABELS: Record<Task["priority"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function TaskScreen() {
  const navigation = useNavigation<TaskScreenNavigationProp>();
  const { theme, isDark } = useTheme();
  const { tasks, fetchTasks } = useHRMSStore();

  const [activeFilter, setActiveFilter] = useState<Filter>("Pending");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      await fetchTasks();
      setIsLoading(false);
    };
    loadTasks();
  }, [fetchTasks]);

  const taskCounts = useMemo(
    () => ({
      pending: tasks.filter((t) => t.status === "pending").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      all: tasks.length,
    }),
    [tasks]
  );

  const statusRank = (s: Task["status"]) =>
    s === "pending" ? 0 : s === "in-progress" ? 1 : 2;

  const filteredTasks = useMemo(
    () =>
      tasks
        .filter((task) => {
          if (activeFilter === "All") return true;
          if (activeFilter === "Pending") return task.status === "pending";
          if (activeFilter === "In Progress") return task.status === "in-progress";
          if (activeFilter === "Completed") return task.status === "completed";
          return true;
        })
        .sort((a, b) => statusRank(a.status) - statusRank(b.status)),
    [tasks, activeFilter]
  );

  const getStatusStyle = (status: Task["status"]) => {
    const palette = STATUS_COLORS[status];
    return {
      color: palette.light,
      backgroundColor: isDark ? palette.light + "22" : palette.bg,
    };
  };

  const getStatusLabel = (status: Task["status"]) => {
    if (status === "in-progress") return "In Progress";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isOverdue = (dateStr: string, status: Task["status"]) =>
    status !== "completed" && new Date(dateStr) < new Date();

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchTasks();
    setIsLoading(false);
  };

  const handleTaskPress = (task: Task) => {
    navigation.navigate("TaskDetail", { taskId: task.id });
  };

  const renderStat = (
    label: string,
    value: number,
    accent: string
  ) => (
    <View style={styles.statItem}>
      <ThemedText style={[styles.statValue, { color: theme.text }]}>{value}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>{label}</ThemedText>
      <View style={[styles.statAccent, { backgroundColor: accent }]} />
    </View>
  );

  const renderTaskCard = (task: Task) => {
    const statusStyle = getStatusStyle(task.status);
    const overdue = isOverdue(task.dueDate, task.status);

    return (
      <Pressable
        key={task.id}
        onPress={() => handleTaskPress(task)}
        style={({ pressed }) => [
          styles.taskCard,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <View style={styles.taskCardTop}>
          <View style={styles.taskTitleBlock}>
            <ThemedText style={[styles.taskTitle, { color: theme.text }]} numberOfLines={2}>
              {task.title}
            </ThemedText>
            {task.taskTypeName ? (
              <ThemedText style={[styles.taskType, { color: theme.textMuted }]} numberOfLines={1}>
                {task.taskTypeName}
              </ThemedText>
            ) : null}
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusStyle.backgroundColor }]}>
            <ThemedText style={[styles.statusPillText, { color: statusStyle.color }]}>
              {getStatusLabel(task.status)}
            </ThemedText>
          </View>
        </View>

        {task.description ? (
          <ThemedText
            style={[styles.taskDescription, { color: theme.textMuted }]}
            numberOfLines={2}
          >
            {task.description}
          </ThemedText>
        ) : null}

        <View style={[styles.taskCardBottom, { borderTopColor: theme.border }]}>
          <View style={styles.metaRow}>
            <Feather
              name="calendar"
              size={14}
              color={overdue ? Colors.dark.error : theme.textMuted}
            />
            <ThemedText
              style={[
                styles.metaText,
                { color: overdue ? Colors.dark.error : theme.textMuted },
              ]}
            >
              Due {formatDate(task.dueDate)}
              {overdue ? " · Overdue" : ""}
            </ThemedText>
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.priorityPill, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={[styles.priorityText, { color: theme.textSecondary }]}>
                {PRIORITY_LABELS[task.priority]}
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textMuted} />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenScrollView contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText style={[styles.pageTitle, { color: theme.text }]}>My Tasks</ThemedText>
          <ThemedText style={[styles.pageSubtitle, { color: theme.textMuted }]}>
            {taskCounts.all} assignment{taskCounts.all === 1 ? "" : "s"} total
          </ThemedText>
        </View>
        <RefreshButton onPress={handleRefresh} isLoading={isLoading} label="Refresh" />
      </View>

      {/* Summary */}
      <View
        style={[
          styles.summaryCard,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
        ]}
      >
        {renderStat("Pending", taskCounts.pending, STATUS_COLORS.pending.light)}
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        {renderStat("Active", taskCounts.inProgress, STATUS_COLORS["in-progress"].light)}
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        {renderStat("Done", taskCounts.completed, STATUS_COLORS.completed.light)}
      </View>

      {/* Filters */}
      <View
        style={[
          styles.filterBar,
          { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
        ]}
      >
        {FILTERS.map((filter) => {
          const active = activeFilter === filter;
          return (
            <Pressable
              key={filter}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveFilter(filter);
              }}
              style={[
                styles.filterTab,
                active && {
                  backgroundColor: theme.cardBackground,
                  ...Platform.select({
                    ios: {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.06,
                      shadowRadius: 3,
                    },
                    android: { elevation: 2 },
                  }),
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.filterTabText,
                  { color: active ? theme.text : theme.textMuted },
                  active && styles.filterTabTextActive,
                ]}
              >
                {filter}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <Spacer height={Spacing.md} />

      {/* List */}
      {isLoading ? (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <ThemedText style={[styles.centerText, { color: theme.textMuted }]}>
            Loading tasks…
          </ThemedText>
        </View>
      ) : filteredTasks.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.border },
          ]}
        >
          <Feather name="inbox" size={40} color={theme.textMuted} />
          <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
            No tasks here
          </ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            {activeFilter === "All"
              ? "You have no assigned tasks yet."
              : `No ${activeFilter.toLowerCase()} tasks at the moment.`}
          </ThemedText>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredTasks.map((task) => renderTaskCard(task))}
        </View>
      )}

      <Spacer height={Spacing["2xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing["2xl"],
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statAccent: {
    width: 24,
    height: 3,
    borderRadius: 2,
    marginTop: Spacing.sm,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginVertical: Spacing.sm,
  },
  filterBar: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    padding: 4,
    marginTop: Spacing.lg,
    borderWidth: 1,
  },
  filterTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: BorderRadius.xs,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: "500",
  },
  filterTabTextActive: {
    fontWeight: "600",
  },
  list: {
    gap: Spacing.md,
  },
  taskCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  taskCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  taskTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  taskType: {
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  taskDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
  taskCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: 12,
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.xs,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "500",
  },
  centerBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.md,
  },
  centerText: {
    fontSize: 14,
  },
  emptyCard: {
    alignItems: "center",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
