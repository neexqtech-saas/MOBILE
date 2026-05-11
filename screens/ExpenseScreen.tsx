import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { apiService, ExpenseAPI } from "@/services/api";
import Spacer from "@/components/Spacer";
import { getCurrentMonthDates } from "@/utils/dateHelpers";

type ExpenseScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "Expenses"
>;

export default function ExpenseScreen() {
  const navigation = useNavigation<ExpenseScreenNavigationProp>();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const { employee } = useHRMSStore();

  const layout = useMemo(() => {
    const compact = width < 392;
    const wide = width >= 560;
    return {
      compact,
      wide,
      screenHPad: wide ? Spacing.xl : compact ? Spacing.sm + 2 : Spacing.md,
      screenVPad: compact ? Spacing.md : Spacing.lg,
      cardPad: compact ? 10 : 12,
      cardRadius: BorderRadius.lg,
      sectionGap: compact ? Spacing.sm : Spacing.md,
      titleFs: compact ? 13.5 : 14.5,
      amountFs: compact ? 15 : 16,
      countFs: compact ? 22 : 28,
      metaFs: compact ? 11 : 12,
      filterFs: compact ? 10 : 11,
      filterPadV: compact ? 5 : 7,
      filterMinH: compact ? 30 : 34,
      createMinH: compact ? 42 : 46,
      iconSm: compact ? 11 : 12,
      iconMd: compact ? 14 : 15,
    };
  }, [width]);

  const [expenses, setExpenses] = useState<ExpenseAPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = async () => {
    const siteId = employee.siteId;
    const userId = employee.id;

    if (!siteId || !userId) {
      const errorMsg = "Unable to load expenses. Please login again.";
      setError(errorMsg);
      Alert.alert("Error", errorMsg, [{ text: "OK" }]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { from, to } = getCurrentMonthDates();
      const response = await apiService.getExpenses(siteId, userId, from, to);
      if (response.status === 200 && response.data) {
        setExpenses(response.data);
        setError(null);
      } else {
        let errorMsg = response.message || "Failed to load expenses. Please try again.";
        
        if (response.status === 401) {
          errorMsg = "Session expired. Please login again.";
        } else if (response.status === 403) {
          errorMsg = "You don't have permission to view expenses.";
        } else if (response.status === 404) {
          errorMsg = "Expenses not found.";
        } else if (response.status === 500) {
          errorMsg = "Server error. Please try again later.";
        }
        
        setError(errorMsg);
        if (!isRefreshing) {
          Alert.alert("Error", errorMsg, [{ text: "OK" }]);
        }
      }
    } catch (error: any) {
      console.error('❌ Error fetching expenses:', error);
      let errorMessage = "Failed to load expenses. Please check your internet connection and try again.";
      
      if (error?.message) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your internet connection.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Cannot connect to server. Please check your internet connection.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      if (!isRefreshing) {
        Alert.alert("Error", errorMessage, [{ text: "OK" }]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch expenses when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [employee.siteId, employee.id])
  );

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateTimeStr: string | null | undefined) => {
    if (!dateTimeStr) return '';
    try {
      const date = new Date(dateTimeStr);
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${day} ${month} ${year}, ${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
    } catch {
      return dateTimeStr;
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchExpenses();
  };

  // Filter expenses based on selected filter
  const filteredExpenses = expenses.filter((expense) => {
    if (filter === 'all') return true;
    return expense.status === filter;
  });


  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <View
        style={[
          styles.container,
          { paddingHorizontal: layout.screenHPad, paddingTop: layout.screenVPad, paddingBottom: layout.screenVPad },
        ]}
      >
        <Pressable
          onPress={() => navigation.navigate("CreateExpense")}
          style={({ pressed }) => [
            styles.createButton,
            { minHeight: layout.createMinH, borderRadius: layout.cardRadius },
            pressed && styles.createButtonPressed,
          ]}
        >
          <View style={[styles.createButtonContent, { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, minHeight: layout.createMinH }]}>
            <View style={[styles.createButtonIcon, { width: 28, height: 28, borderRadius: 14 }]}>
              <Feather name="plus-circle" size={layout.iconMd} color="#FFFFFF" />
            </View>
            <ThemedText style={[styles.createButtonText, { fontSize: layout.compact ? 13.5 : 14.5 }]}>
              Create Expense
            </ThemedText>
          </View>
        </Pressable>

        <Spacer height={layout.sectionGap} />

        {/* Filter Buttons */}
        {!isLoading && expenses.length > 0 && (
          <View style={styles.filterContainer}>
            <Pressable
              onPress={() => setFilter('all')}
              style={({ pressed }) => [
                styles.filterButton,
                {
                  minHeight: layout.filterMinH,
                  paddingVertical: layout.filterPadV,
                  backgroundColor: filter === 'all' ? Colors.dark.primary : theme.backgroundDefault,
                  borderColor: filter === 'all' ? Colors.dark.primary : theme.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <ThemedText
                style={{
                  color: filter === 'all' ? '#000000' : theme.text,
                  fontWeight: filter === 'all' ? '700' : '500',
                  fontSize: layout.filterFs,
                }}
              >
                All
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setFilter('pending')}
              style={({ pressed }) => [
                styles.filterButton,
                {
                  minHeight: layout.filterMinH,
                  paddingVertical: layout.filterPadV,
                  backgroundColor: filter === 'pending' ? Colors.dark.primary : theme.backgroundDefault,
                  borderColor: filter === 'pending' ? Colors.dark.primary : theme.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <ThemedText
                style={{
                  color: filter === 'pending' ? '#000000' : theme.text,
                  fontWeight: filter === 'pending' ? '700' : '500',
                  fontSize: layout.filterFs,
                }}
              >
                Pending
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setFilter('approved')}
              style={({ pressed }) => [
                styles.filterButton,
                {
                  minHeight: layout.filterMinH,
                  paddingVertical: layout.filterPadV,
                  backgroundColor: filter === 'approved' ? Colors.dark.primary : theme.backgroundDefault,
                  borderColor: filter === 'approved' ? Colors.dark.primary : theme.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <ThemedText
                style={{
                  color: filter === 'approved' ? '#000000' : theme.text,
                  fontWeight: filter === 'approved' ? '700' : '500',
                  fontSize: layout.filterFs,
                }}
              >
                Approved
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setFilter('rejected')}
              style={({ pressed }) => [
                styles.filterButton,
                {
                  minHeight: layout.filterMinH,
                  paddingVertical: layout.filterPadV,
                  backgroundColor: filter === 'rejected' ? Colors.dark.primary : theme.backgroundDefault,
                  borderColor: filter === 'rejected' ? Colors.dark.primary : theme.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <ThemedText
                style={{
                  color: filter === 'rejected' ? '#000000' : theme.text,
                  fontWeight: filter === 'rejected' ? '700' : '500',
                  fontSize: layout.filterFs,
                }}
              >
                Rejected
              </ThemedText>
            </Pressable>
          </View>
        )}

        {/* Date Range Label */}
        <View style={{ marginBottom: Spacing.xs, marginTop: Spacing.xs }}>
          <ThemedText type="small" style={{ color: theme.textMuted, fontSize: layout.metaFs, fontWeight: "500" }}>
            Showing expenses for this month
          </ThemedText>
        </View>

        <Spacer height={layout.sectionGap} />

        {/* Expenses Count — single compact row */}
        {!isLoading && (
          <View
            style={[
              styles.countCard,
              {
                paddingVertical: layout.compact ? 8 : 10,
                paddingHorizontal: layout.cardPad + 2,
                borderRadius: layout.cardRadius,
                borderColor: theme.border,
                backgroundColor: theme.cardBackground,
              },
            ]}
          >
            <View style={styles.countCardRow}>
              <View style={styles.countCardLeft}>
                <View style={[styles.countIconContainer, { width: 28, height: 28, borderRadius: BorderRadius.sm }]}>
                  <Feather name="file-text" size={layout.iconMd} color={Colors.dark.primary} />
                </View>
                <ThemedText
                  type="small"
                  style={[styles.countLabel, { fontSize: layout.metaFs, color: theme.textMuted }]}
                >
                  {filter === "all"
                    ? "Total"
                    : filter === "pending"
                      ? "Pending"
                      : filter === "approved"
                        ? "Approved"
                        : "Rejected"}
                </ThemedText>
              </View>
              <ThemedText
                style={{
                  fontSize: layout.countFs,
                  fontWeight: "800",
                  color: Colors.dark.primary,
                  letterSpacing: -0.4,
                }}
              >
                {filteredExpenses.length}
              </ThemedText>
            </View>
          </View>
        )}

        <Spacer height={layout.sectionGap} />

        {error && !isLoading && (
          <View style={[styles.errorContainer, { borderColor: theme.border }]}>
            <View style={styles.errorIconContainer}>
              <Feather name="alert-circle" size={20} color="#F44336" />
            </View>
            <View style={styles.errorTextContainer}>
              <ThemedText style={styles.errorTitle}>Error</ThemedText>
              <ThemedText style={[styles.errorText, { fontSize: layout.metaFs }]}>
                {error}
              </ThemedText>
            </View>
            <Pressable
              onPress={fetchExpenses}
              style={styles.retryButton}
            >
              <ThemedText style={styles.retryButtonSmallText}>
                Retry
              </ThemedText>
            </Pressable>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingIconContainer}>
              <ActivityIndicator size="large" color={Colors.dark.primary} />
            </View>
            <ThemedText style={[styles.loadingText, { fontSize: layout.metaFs, color: theme.textMuted }]}>
              Loading expenses...
            </ThemedText>
          </View>
        ) : error && expenses.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: theme.border, backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="alert-circle" size={layout.compact ? 40 : 48} color={Colors.dark.error} />
            </View>
            <ThemedText style={[styles.emptyTitle, { fontSize: layout.compact ? 15 : 16, color: theme.text }]}>Error</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { fontSize: layout.metaFs, color: theme.textMuted }]}>
              {error}
            </ThemedText>
            <Pressable
              onPress={fetchExpenses}
              style={styles.retryButtonLarge}
            >
              <ThemedText style={styles.retryButtonText}>
                Retry
              </ThemedText>
            </Pressable>
          </View>
        ) : filteredExpenses.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: theme.border, backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="dollar-sign" size={layout.compact ? 40 : 48} color={theme.textMuted} />
            </View>
            <ThemedText style={[styles.emptyTitle, { fontSize: layout.compact ? 15 : 16, color: theme.text }]}>
              {expenses.length === 0
                ? "No Expenses Yet"
                : `No ${filter === 'all' ? '' : filter} Expenses`}
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { fontSize: layout.metaFs, color: theme.textMuted }]}>
              {expenses.length === 0
                ? "Create your first expense to get started"
                : "Try selecting a different filter"}
            </ThemedText>
          </View>
        ) : (
          <View style={[styles.expensesList, { gap: layout.sectionGap }]}>
            {filteredExpenses.map((expense) => {
              // Use reimbursement_amount as the approved amount to display
              const displayAmount = expense.reimbursement_amount || expense.amount;
              const isPartialApproval = expense.status === "approved" && 
                expense.reimbursement_amount && 
                parseFloat(expense.reimbursement_amount) !== parseFloat(expense.amount);
              
              return (
                <View
                  key={expense.id}
                  style={[
                    styles.expenseCard,
                    {
                      padding: layout.cardPad,
                      borderRadius: layout.cardRadius,
                      borderColor: theme.border,
                      backgroundColor: theme.cardBackground,
                    },
                  ]}
                >
                  {/* Header with Title and Amount */}
                  <View style={styles.expenseHeader}>
                    <View style={styles.expenseTitleRow}>
                      <View style={styles.expenseTitleContainer}>
                        <ThemedText
                          numberOfLines={2}
                          style={{
                            flex: 1,
                            fontWeight: "600",
                            fontSize: layout.titleFs,
                            lineHeight: layout.titleFs + 5,
                            color: theme.text,
                          }}
                        >
                          {expense.title}
                        </ThemedText>
                        <View style={[styles.dateRow, { marginTop: 2 }]}>
                          <Feather name="calendar" size={layout.iconSm} color={theme.textMuted} />
                          <ThemedText
                            style={{
                              color: theme.textMuted,
                              marginLeft: 4,
                              fontSize: layout.metaFs,
                            }}
                          >
                            {formatDate(expense.expense_date)}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={[styles.amountColumn, { minWidth: layout.compact ? 86 : 100 }]}>
                        <ThemedText
                          style={{
                            color: Colors.dark.primary,
                            fontWeight: "700",
                            fontSize: layout.amountFs,
                            letterSpacing: -0.2,
                          }}
                        >
                          {formatCurrency(displayAmount)}
                        </ThemedText>
                        {isPartialApproval && (
                          <View style={styles.originalAmountRow}>
                            <ThemedText
                              style={{
                                color: theme.textMuted,
                                textDecorationLine: "line-through",
                                fontSize: layout.metaFs,
                              }}
                            >
                              {formatCurrency(expense.amount)}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Description */}
                  {expense.description && (
                    <View style={[styles.expenseDescription, { borderTopColor: theme.border }]}>
                      <ThemedText
                        numberOfLines={3}
                        style={{ color: theme.textMuted, lineHeight: layout.metaFs + 4, fontSize: layout.metaFs }}
                      >
                        {expense.description}
                      </ThemedText>
                    </View>
                  )}

                  {/* Category and Project Tags */}
                  {(expense.category_name || expense.project_name) && (
                    <View style={styles.expenseTags}>
                      {expense.category_name && (
                        <View style={[styles.tag, { backgroundColor: theme.backgroundDefault, borderWidth: 1, borderColor: theme.border }]}>
                          <Feather name="tag" size={layout.iconSm} color={theme.textMuted} />
                          <ThemedText style={{ color: theme.textMuted, marginLeft: 4, fontSize: layout.metaFs }}>
                            {expense.category_name}
                          </ThemedText>
                        </View>
                      )}
                      {expense.project_name && (
                        <View style={[styles.tag, { backgroundColor: theme.backgroundDefault, borderWidth: 1, borderColor: theme.border }]}>
                          <Feather name="briefcase" size={layout.iconSm} color={theme.textMuted} />
                          <ThemedText style={{ color: theme.textMuted, marginLeft: 4, fontSize: layout.metaFs }}>
                            {expense.project_name}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Status and Approval Details */}
                  <View style={[styles.statusRow, { borderTopColor: theme.border }]}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            expense.status === "approved"
                              ? Colors.dark.success + "15"
                              : expense.status === "rejected"
                              ? Colors.dark.error + "15"
                              : Colors.dark.primary + "15",
                          borderColor:
                            expense.status === "approved"
                              ? Colors.dark.success + "40"
                              : expense.status === "rejected"
                              ? Colors.dark.error + "40"
                              : Colors.dark.primary + "40",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              expense.status === "approved"
                                ? Colors.dark.success
                                : expense.status === "rejected"
                                ? Colors.dark.error
                                : Colors.dark.primary,
                          },
                        ]}
                      />
                      <ThemedText
                        style={[
                          styles.statusText,
                          {
                            fontSize: layout.metaFs,
                            color:
                              expense.status === "approved"
                                ? Colors.dark.success
                                : expense.status === "rejected"
                                ? Colors.dark.error
                                : Colors.dark.primary,
                          },
                        ]}
                      >
                        {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Approval/Rejection Details */}
                      {expense.status === "approved" && expense.approved_at && (
                    <View style={[styles.detailRow, { borderTopColor: theme.border }]}>
                      <View style={styles.detailItem}>
                        <Feather name="check" size={layout.iconSm} color={Colors.dark.success} />
                        <ThemedText style={{ color: theme.textMuted, marginLeft: 4, fontSize: layout.metaFs, flex: 1 }}>
                          Approved {formatDateTime(expense.approved_at)}
                        </ThemedText>
                      </View>
                      {expense.approved_by_name && (
                        <View style={styles.detailItem}>
                          <Feather name="user" size={layout.iconSm} color={theme.textMuted} />
                          <ThemedText style={{ color: theme.textMuted, marginLeft: 4, fontSize: layout.metaFs, flex: 1 }}>
                            {expense.approved_by_name}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  )}

                  {expense.status === "rejected" && expense.rejected_at && (
                    <View style={[styles.detailRow, { borderTopColor: theme.border }]}>
                      <View style={styles.detailItem}>
                        <Feather name="x" size={layout.iconSm} color={Colors.dark.error} />
                        <ThemedText style={{ color: theme.textMuted, marginLeft: 4, fontSize: layout.metaFs, flex: 1 }}>
                          Rejected {formatDateTime(expense.rejected_at)}
                        </ThemedText>
                      </View>
                      {expense.rejection_reason && (
                        <View style={styles.detailItem}>
                          <ThemedText style={{ color: Colors.dark.error, marginTop: 2, fontSize: layout.metaFs }}>
                            {expense.rejection_reason}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Reimbursement Details */}
                  {expense.status === "approved" && expense.reimbursement_amount && (
                    <View style={[styles.reimbursementRow, { borderColor: Colors.dark.success + "28" }]}>
                      <View style={styles.reimbursementHeader}>
                        <Feather name="dollar-sign" size={layout.iconMd} color={Colors.dark.success} />
                        <ThemedText style={{ color: Colors.dark.success, marginLeft: 4, fontWeight: "600", fontSize: layout.metaFs }}>
                          Reimbursement
                        </ThemedText>
                      </View>
                      <ThemedText style={{ color: Colors.dark.success, marginTop: 4, fontWeight: "700", fontSize: layout.amountFs }}>
                        {formatCurrency(expense.reimbursement_amount)}
                      </ThemedText>
                      {expense.reimbursement_date && (
                        <ThemedText style={{ color: theme.textMuted, marginTop: 2, fontSize: layout.metaFs }}>
                          {formatDate(expense.reimbursement_date)}
                        </ThemedText>
                      )}
                      {expense.reimbursement_mode && (
                        <ThemedText style={{ color: theme.textMuted, marginTop: 2, fontSize: layout.metaFs }}>
                          {expense.reimbursement_mode}
                        </ThemedText>
                      )}
                      {expense.reimbursement_reference && (
                        <ThemedText style={{ color: theme.textMuted, marginTop: 2, fontSize: layout.metaFs }} numberOfLines={1}>
                          Ref: {expense.reimbursement_reference}
                        </ThemedText>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <Spacer height={Spacing["2xl"]} />
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  createButton: {
    backgroundColor: Colors.dark.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0 4px 12px ${Colors.dark.primary}40`,
      },
    }),
  },
  createButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  createButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  createButtonIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  filterContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexWrap: "wrap",
  },
  filterButton: {
    flex: 1,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    minWidth: 64,
  },
  countCard: {
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.06)",
      },
    }),
  },
  countCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  countCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  countIconContainer: {
    backgroundColor: Colors.dark.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  countLabel: {
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    minHeight: 140,
  },
  loadingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.primary + "10",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  loadingText: {
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minHeight: 220,
    borderWidth: 1,
    borderStyle: "dashed",
    marginHorizontal: 0,
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
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    textAlign: "center",
    lineHeight: 18,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  expensesList: {},
  expenseCard: {
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.06)",
      },
    }),
  },
  expenseHeader: {
    marginBottom: 4,
  },
  expenseTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  expenseTitleContainer: {
    flex: 1,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountColumn: {
    alignItems: "flex-end",
  },
  approvedAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  expenseDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.1)",
  },
  expenseDescription: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  expenseTags: {
    flexDirection: "row",
    gap: 6,
    marginTop: Spacing.xs,
    flexWrap: "wrap",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  originalAmountRow: {
    marginTop: Spacing.xs,
  },
  detailRow: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  reimbursementRow: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.success + "08",
    borderWidth: StyleSheet.hairlineWidth,
  },
  reimbursementHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusRow: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    textTransform: "capitalize",
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FEE2E2",
    gap: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: "#F44336",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  errorIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  errorTextContainer: {
    flex: 1,
    minWidth: 200,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#DC2626",
    marginBottom: Spacing.xs,
  },
  errorText: {
    color: "#991B1B",
    lineHeight: 18,
  },
  retryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "#F44336",
    backgroundColor: "#FEE2E2",
  },
  retryButtonSmallText: {
    color: "#F44336",
    fontWeight: "700",
    fontSize: 12,
  },
  retryButtonLarge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.primary,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    marginTop: Spacing.lg,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});

