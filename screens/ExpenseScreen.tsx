import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Alert, Platform, Dimensions } from "react-native";
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

type ExpenseScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "Expenses"
>;

export default function ExpenseScreen() {
  const navigation = useNavigation<ExpenseScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();

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
      const response = await apiService.getExpenses(siteId, userId);
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
      <View style={styles.container}>
        <Pressable
          onPress={() => navigation.navigate("CreateExpense")}
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.createButtonPressed,
          ]}
        >
          <View style={styles.createButtonContent}>
            <View style={styles.createButtonIcon}>
              <Feather name="plus-circle" size={20} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.createButtonText}>
              Create Expense
            </ThemedText>
          </View>
        </Pressable>

        <Spacer height={Spacing.lg} />

        {/* Filter Buttons */}
        {!isLoading && expenses.length > 0 && (
          <View style={styles.filterContainer}>
            <Pressable
              onPress={() => setFilter('all')}
              style={({ pressed }) => [
                styles.filterButton,
                {
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
                  fontSize: 13,
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
                  fontSize: 13,
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
                  fontSize: 13,
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
                  fontSize: 13,
                }}
              >
                Rejected
              </ThemedText>
            </Pressable>
          </View>
        )}

        <Spacer height={Spacing.lg} />

        {/* Expenses Count */}
        {!isLoading && (
          <View style={styles.countCard}>
            <View style={styles.countCardHeader}>
              <View style={styles.countIconContainer}>
                <Feather 
                  name="file-text" 
                  size={20} 
                  color={Colors.dark.primary} 
                />
              </View>
              <ThemedText type="small" style={styles.countLabel}>
                {filter === 'all' ? 'Total Expenses' : filter === 'pending' ? 'Pending' : filter === 'approved' ? 'Approved' : 'Rejected'}
              </ThemedText>
            </View>
            <ThemedText type="h1" style={styles.countValue}>
              {filteredExpenses.length}
            </ThemedText>
          </View>
        )}

        <Spacer height={Spacing.lg} />

        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconContainer}>
              <Feather name="alert-circle" size={20} color="#F44336" />
            </View>
            <View style={styles.errorTextContainer}>
              <ThemedText style={styles.errorTitle}>Error</ThemedText>
              <ThemedText style={styles.errorText}>
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
            <ThemedText style={styles.loadingText}>
              Loading expenses...
            </ThemedText>
          </View>
        ) : error && expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Feather name="alert-circle" size={56} color={Colors.dark.error} />
            </View>
            <ThemedText style={styles.emptyTitle}>Error</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
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
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Feather name="dollar-sign" size={56} color={theme.textMuted} />
            </View>
            <ThemedText style={styles.emptyTitle}>
              {expenses.length === 0
                ? "No Expenses Yet"
                : `No ${filter === 'all' ? '' : filter} Expenses`}
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {expenses.length === 0
                ? "Create your first expense to get started"
                : "Try selecting a different filter"}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.expensesList}>
            {filteredExpenses.map((expense) => {
              // Use reimbursement_amount as the approved amount to display
              const displayAmount = expense.reimbursement_amount || expense.amount;
              const isPartialApproval = expense.status === "approved" && 
                expense.reimbursement_amount && 
                parseFloat(expense.reimbursement_amount) !== parseFloat(expense.amount);
              
              return (
                <View
                  key={expense.id}
                  style={styles.expenseCard}
                >
                  {/* Header with Title and Amount */}
                  <View style={styles.expenseHeader}>
                    <View style={styles.expenseTitleRow}>
                      <View style={styles.expenseTitleContainer}>
                        <ThemedText type="h4" style={{ flex: 1, fontWeight: '600', lineHeight: 22 }}>
                          {expense.title}
                        </ThemedText>
                        <View style={styles.dateRow}>
                          <Feather name="calendar" size={12} color={theme.textMuted} />
                          <ThemedText type="small" style={{ color: theme.textMuted, marginLeft: Spacing.xs }}>
                            {formatDate(expense.expense_date)}
                          </ThemedText>
                        </View>
                      </View>
                      <View style={styles.amountColumn}>
                        <ThemedText type="h3" style={{ color: Colors.dark.primary, fontWeight: '700' }}>
                          {formatCurrency(displayAmount)}
                        </ThemedText>
                        {isPartialApproval && (
                          <View style={styles.originalAmountRow}>
                            <ThemedText type="small" style={{ color: theme.textMuted, textDecorationLine: 'line-through' }}>
                              {formatCurrency(expense.amount)}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Description */}
                  {expense.description && (
                    <View style={styles.expenseDescription}>
                      <ThemedText type="small" style={{ color: theme.textMuted, lineHeight: 18 }}>
                        {expense.description}
                      </ThemedText>
                    </View>
                  )}

                  {/* Category and Project Tags */}
                  {(expense.category_name || expense.project_name) && (
                    <View style={styles.expenseTags}>
                      {expense.category_name && (
                        <View style={[styles.tag, { backgroundColor: theme.background }]}>
                          <Feather name="tag" size={12} color={theme.textMuted} />
                          <ThemedText type="small" style={{ color: theme.textMuted, marginLeft: Spacing.xs }}>
                            {expense.category_name}
                          </ThemedText>
                        </View>
                      )}
                      {expense.project_name && (
                        <View style={[styles.tag, { backgroundColor: theme.background }]}>
                          <Feather name="briefcase" size={12} color={theme.textMuted} />
                          <ThemedText type="small" style={{ color: theme.textMuted, marginLeft: Spacing.xs }}>
                            {expense.project_name}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Status and Approval Details */}
                  <View style={styles.statusRow}>
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
                        type="small"
                        style={[
                          styles.statusText,
                          {
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
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Feather name="check" size={12} color={Colors.dark.success} />
                        <ThemedText type="small" style={{ color: theme.textMuted, marginLeft: Spacing.xs }}>
                          Approved on {formatDateTime(expense.approved_at)}
                        </ThemedText>
                      </View>
                      {expense.approved_by_name && (
                        <View style={styles.detailItem}>
                          <Feather name="user" size={12} color={theme.textMuted} />
                          <ThemedText type="small" style={{ color: theme.textMuted, marginLeft: Spacing.xs }}>
                            by {expense.approved_by_name}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  )}

                  {expense.status === "rejected" && expense.rejected_at && (
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Feather name="x" size={12} color={Colors.dark.error} />
                        <ThemedText type="small" style={{ color: theme.textMuted, marginLeft: Spacing.xs }}>
                          Rejected on {formatDateTime(expense.rejected_at)}
                        </ThemedText>
                      </View>
                      {expense.rejection_reason && (
                        <View style={styles.detailItem}>
                          <ThemedText type="small" style={{ color: Colors.dark.error, marginTop: Spacing.xs }}>
                            Reason: {expense.rejection_reason}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Reimbursement Details */}
                  {expense.status === "approved" && expense.reimbursement_amount && (
                    <View style={styles.reimbursementRow}>
                      <View style={styles.reimbursementHeader}>
                        <Feather name="dollar-sign" size={14} color={Colors.dark.success} />
                        <ThemedText type="small" style={{ color: Colors.dark.success, marginLeft: Spacing.xs, fontWeight: '600' }}>
                          Reimbursement Amount
                        </ThemedText>
                      </View>
                      <ThemedText type="h4" style={{ color: Colors.dark.success, marginTop: Spacing.xs, fontWeight: '700' }}>
                        {formatCurrency(expense.reimbursement_amount)}
                      </ThemedText>
                      {expense.reimbursement_date && (
                        <ThemedText type="small" style={{ color: theme.textMuted, marginTop: Spacing.xs }}>
                          Scheduled: {formatDate(expense.reimbursement_date)}
                        </ThemedText>
                      )}
                      {expense.reimbursement_mode && (
                        <ThemedText type="small" style={{ color: theme.textMuted, marginTop: Spacing.xs }}>
                          Mode: {expense.reimbursement_mode}
                        </ThemedText>
                      )}
                      {expense.reimbursement_reference && (
                        <ThemedText type="small" style={{ color: theme.textMuted, marginTop: Spacing.xs }}>
                          Reference: {expense.reimbursement_reference}
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
    padding: Spacing["2xl"],
  },
  createButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.lg,
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
    padding: Spacing.lg,
    gap: Spacing.md,
    minHeight: 56,
  },
  createButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 16 : 15,
      default: 15,
    }),
    letterSpacing: 0.5,
  },
  filterContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexWrap: "wrap",
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    minHeight: 36,
    minWidth: 80,
  },
  countCard: {
    padding: Platform.select({
      web: Dimensions.get('window').width > 768 ? Spacing.xl : Spacing.lg,
      default: Spacing.lg,
    }),
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
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
  countCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  countIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  countLabel: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  countValue: {
    color: Colors.dark.primary,
    marginTop: Spacing.sm,
    fontWeight: "800",
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 48 : 40,
      default: 40,
    }),
    letterSpacing: -1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["2xl"],
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Platform.select({
      web: Dimensions.get('window').width > 768 ? Spacing["3xl"] : Spacing["2xl"],
      default: Spacing["2xl"],
    }),
    borderRadius: BorderRadius.xl,
    minHeight: 300,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    backgroundColor: "#F8FAFC",
    marginHorizontal: Spacing["2xl"],
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
    marginBottom: Spacing.lg,
  },
  expensesList: {
    gap: Spacing.md,
  },
  expenseCard: {
    padding: Platform.select({
      web: Dimensions.get('window').width > 768 ? Spacing.xl : Spacing.lg,
      default: Spacing.lg,
    }),
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.md,
    backgroundColor: "#FFFFFF",
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
  expenseHeader: {
    marginBottom: Spacing.sm,
  },
  expenseTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.lg,
  },
  expenseTitleContainer: {
    flex: 1,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  amountColumn: {
    alignItems: "flex-end",
    minWidth: 120,
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
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.1)",
  },
  expenseTags: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    flexWrap: "wrap",
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  originalAmountRow: {
    marginTop: Spacing.xs,
  },
  detailRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.1)",
    gap: Spacing.xs,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  reimbursementRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.success + "08",
    borderWidth: 1,
    borderColor: Colors.dark.success + "20",
  },
  reimbursementHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    textTransform: "capitalize",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.3,
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
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 14 : 13,
      default: 13,
    }),
    color: "#991B1B",
    lineHeight: 20,
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

