import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Platform, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { LeaveStackParamList } from "@/navigation/LeaveStackNavigator";
import { apiService, LeaveBalanceAPI, LeaveApplicationAPI } from "@/services/api";
import Spacer from "@/components/Spacer";
import { RefreshButton } from "@/components/RefreshButton";

type LeaveScreenNavigationProp = NativeStackNavigationProp<
  LeaveStackParamList,
  "Leave"
>;

const getLeaveIcon = (code: string): keyof typeof Feather.glyphMap => {
  const codeLower = code.toLowerCase();
  if (codeLower.includes('casual') || codeLower === 'cl') return 'sun';
  if (codeLower.includes('sick') || codeLower === 'sl') return 'activity';
  if (codeLower.includes('privilege') || codeLower.includes('earn') || codeLower === 'pl' || codeLower === 'el') return 'award';
  if (codeLower.includes('wfh') || codeLower.includes('work')) return 'home';
  return 'calendar';
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'approved':
      return '#22C55E'; // Green
    case 'rejected':
      return '#F44336'; // Red
    case 'pending':
      return '#2563EB'; // Blue
    case 'cancelled':
      return '#757575'; // Gray
    default:
      return '#757575';
  }
};

const getDayTypeText = (dayType?: string): string => {
  switch (dayType) {
    case 'full_day':
      return 'Full Day';
    case 'first_half':
      return 'First Half';
    case 'second_half':
      return 'Second Half';
    default:
      return 'Full Day';
  }
};

export default function LeaveScreen() {
  const navigation = useNavigation<LeaveScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();
  
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceAPI[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplicationAPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch leave balances on screen load
  useEffect(() => {
    const fetchLeaveBalances = async () => {
      const siteId = employee.siteId;
      const userId = employee.id;
      
      if (!siteId || !userId) {
        setError("User ID or Site ID not found. Please login again.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const currentYear = new Date().getFullYear();
        const response = await apiService.getLeaveBalances(siteId, userId, currentYear);
        
        if (response.data) {
          setLeaveBalances(response.data);
        } else {
          setError("No leave balances found.");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leave balances. Please try again.';
        setError(errorMessage);
        console.error('Error fetching leave balances:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaveBalances();
  }, [employee.siteId, employee.id]);

  // Fetch leave applications on screen load
  useEffect(() => {
    const fetchLeaveApplications = async () => {
      const siteId = employee.siteId;
      const userId = employee.id;
      
      if (!siteId || !userId) {
        return;
      }

      setIsLoadingApplications(true);

      try {
        const currentYear = new Date().getFullYear();
        const response = await apiService.getLeaveApplications(siteId, userId, currentYear);
        
        if (response.data) {
          setLeaveApplications(response.data);
        }
      } catch (err) {
        console.error('Error fetching leave applications:', err);
      } finally {
        setIsLoadingApplications(false);
      }
    };

    fetchLeaveApplications();
  }, [employee.siteId, employee.id]);

  const handleRefresh = async () => {
    const siteId = employee.siteId;
    const userId = employee.id;
    
    if (!siteId || !userId) {
      return;
    }

    setIsLoading(true);
    setIsLoadingApplications(true);
    setError(null);

    try {
      const currentYear = new Date().getFullYear();
      const [balancesResponse, applicationsResponse] = await Promise.all([
        apiService.getLeaveBalances(siteId, userId, currentYear),
        apiService.getLeaveApplications(siteId, userId, currentYear),
      ]);

      if (balancesResponse.data) {
        setLeaveBalances(balancesResponse.data);
      }
      if (applicationsResponse.data) {
        setLeaveApplications(applicationsResponse.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data. Please try again.';
      setError(errorMessage);
      console.error('Error refreshing leave data:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingApplications(false);
    }
  };

  // Refresh data when screen comes into focus (e.g., after navigating back from ApplyLeave)
  useFocusEffect(
    React.useCallback(() => {
      handleRefresh();
    }, [employee.siteId, employee.id])
  );

  if (isLoading) {
    return (
      <ScreenScrollView>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
          </View>
          <ThemedText style={styles.loadingText}>
            Loading leave balances...
          </ThemedText>
        </View>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      <View style={styles.refreshHeader}>
        <View style={{ flex: 1 }} />
        <RefreshButton
          onPress={handleRefresh}
          isLoading={isLoading || isLoadingApplications}
          label="Refresh"
        />
      </View>
      <Spacer height={Spacing.md} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleContainer}>
            <View style={styles.titleIconContainer}>
              <Feather name="calendar" size={22} color={Colors.dark.primary} />
            </View>
            <ThemedText type="h4" style={styles.title}>Leave Balance</ThemedText>
          </View>
        </View>
        {leaveBalances.length > 0 && (
          <Pressable
            onPress={() => {
              // Navigate to ApplyLeave with first available leave type
              const firstLeaveType = leaveBalances[0];
              navigation.navigate("ApplyLeave", {
                leaveTypeId: firstLeaveType.leave_type,
                leaveTypeName: firstLeaveType.leave_type_name || 'Leave',
              });
            }}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
          >
            <View style={styles.addButtonContent}>
              <Feather name="plus-circle" size={18} color="#FFFFFF" />
              <ThemedText style={styles.addButtonText}>Apply Leave</ThemedText>
            </View>
          </Pressable>
        )}
      </View>

      <Spacer height={Spacing.xl} />

      {error ? (
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
        </View>
      ) : leaveBalances.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Feather name="calendar" size={56} color={theme.textMuted} />
          </View>
          <ThemedText style={styles.emptyTitle}>No Leave Balances</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Your leave balances will appear here once assigned
          </ThemedText>
        </View>
      ) : (
        leaveBalances.map((balance) => (
          <Pressable
            key={balance.id}
            onPress={() => navigation.navigate("ApplyLeave", {
              leaveTypeId: balance.leave_type,
              leaveTypeName: balance.leave_type_name || 'Leave',
            })}
            style={({ pressed }) => [
              styles.balanceCard,
              {
                backgroundColor: "#FFFFFF",
                borderColor: "#DBEAFE",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
      >
            <View style={styles.balanceCardHeader}>
              <View style={styles.iconContainer}>
                <View style={styles.iconBackground}>
                  <Feather
                    name={getLeaveIcon(balance.leave_type_code || '')}
                    size={22}
                    color={Colors.dark.primary}
                  />
                </View>
              </View>
              <View style={styles.balanceInfo}>
                <ThemedText style={styles.leaveTypeName}>
                  {balance.leave_type_name || 'Leave'}
                </ThemedText>
                <View style={styles.yearBadge}>
                  <Feather name="calendar" size={12} color={theme.textMuted} />
                  <ThemedText type="small" style={styles.yearText}>
                    {balance.year}
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.balanceDetails}>
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <ThemedText type="small" style={styles.balanceLabel}>
                    Assigned
                  </ThemedText>
                  <ThemedText type="h3" style={styles.balanceValue}>
                    {balance.assigned}
                  </ThemedText>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceItem}>
                  <ThemedText type="small" style={styles.balanceLabel}>
                    Used
                  </ThemedText>
                  <ThemedText type="h3" style={[styles.balanceValue, { color: "#F44336" }]}>
                    {balance.used}
                  </ThemedText>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceItem}>
                  <ThemedText type="small" style={styles.balanceLabel}>
                    Balance
                  </ThemedText>
                  <ThemedText type="h3" style={[styles.balanceValue, { color: "#22C55E" }]}>
                    {balance.balance}
                  </ThemedText>
                </View>
              </View>
            </View>
          </Pressable>
        ))
      )}

      <Spacer height={Spacing["3xl"]} />

      {/* Leave Applications Section */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleIconContainer}>
            <Feather name="file-text" size={22} color={Colors.dark.primary} />
          </View>
          <ThemedText type="h4" style={styles.title}>Leave Applications</ThemedText>
        </View>
      </View>

      <Spacer height={Spacing.xl} />

      {isLoadingApplications ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="small" color={Colors.dark.primary} />
          </View>
          <ThemedText style={styles.loadingText}>
            Loading applications...
          </ThemedText>
        </View>
      ) : leaveApplications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Feather name="file-text" size={56} color={theme.textMuted} />
          </View>
          <ThemedText style={styles.emptyTitle}>No Applications</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Your leave applications will appear here
          </ThemedText>
        </View>
      ) : (
        leaveApplications.map((application) => (
          <View
            key={application.id}
            style={[
              styles.applicationCard,
              {
                backgroundColor: "#FFFFFF",
                borderColor: "#DBEAFE",
              },
            ]}
          >
            <View style={styles.applicationHeader}>
              <View style={styles.applicationHeaderLeft}>
                <View style={styles.iconContainer}>
                  <View style={styles.iconBackground}>
                    <Feather
                      name={getLeaveIcon(application.leave_type_code || '')}
                      size={18}
                      color={Colors.dark.primary}
                    />
                  </View>
                </View>
                <View style={styles.applicationInfo}>
                  <ThemedText style={styles.applicationLeaveType}>
                    {application.leave_type_name || 'Leave'}
                  </ThemedText>
                  <View style={styles.dateRangeContainer}>
                    <Feather name="calendar" size={12} color={theme.textMuted} />
                    <ThemedText type="small" style={styles.dateRangeText}>
                      {formatDate(application.from_date)} - {formatDate(application.to_date)}
                    </ThemedText>
                  </View>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(application.status) + "15" },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(application.status) },
                  ]}
                />
                <ThemedText
                  type="small"
                  style={[
                    styles.statusText,
                    { color: getStatusColor(application.status) },
                  ]}
                >
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.applicationDetails}>
              <View style={styles.applicationDetailRow}>
                <View style={styles.applicationDetailItem}>
                  <Feather name="calendar" size={14} color={theme.textMuted} />
                  <ThemedText type="small" style={{ color: theme.textMuted, marginLeft: Spacing.xs }}>
                    {application.total_days} {application.total_days === 1 ? 'Day' : 'Days'} • {getDayTypeText(application.leave_day_type)}
                  </ThemedText>
                </View>
              </View>
              {application.reason && (
                <View style={styles.reasonContainer}>
                  <View style={styles.reasonHeader}>
                    <Feather name="message-circle" size={14} color={theme.textMuted} />
                    <ThemedText type="small" style={styles.reasonLabel}>
                      Reason
                    </ThemedText>
                  </View>
                  <ThemedText type="small" style={styles.reasonText}>
                    {application.reason}
                  </ThemedText>
                </View>
              )}
              <View style={styles.applicationFooter}>
                <View style={styles.applicationFooterItem}>
                  <ThemedText type="small" style={styles.applicationFooterLabel}>
                    Applied:
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textMuted }}>
                    {formatDate(application.applied_at)}
                  </ThemedText>
                </View>
                {application.reviewed_at && (
                  <View style={styles.applicationFooterItem}>
                    <ThemedText type="small" style={styles.applicationFooterLabel}>
                      Reviewed:
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textMuted }}>
                      {formatDate(application.reviewed_at)}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))
      )}

      <Spacer height={Spacing["3xl"]} />
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing.lg,
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  headerLeft: {
    flex: 1,
    minWidth: 150,
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
  addButton: {
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
  addButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  addButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 14 : 13,
      default: 13,
    }),
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["3xl"],
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
  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FEE2E2",
    marginHorizontal: Spacing["2xl"],
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
  balanceCard: {
    marginHorizontal: Spacing["2xl"],
    padding: Platform.select({
      web: Dimensions.get('window').width > 768 ? Spacing.xl : Spacing.lg,
      default: Spacing.lg,
    }),
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.lg,
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
  balanceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconBackground: {
    width: Platform.select({
      web: Dimensions.get('window').width > 768 ? 52 : 48,
      default: 48,
    }),
    height: Platform.select({
      web: Dimensions.get('window').width > 768 ? 52 : 48,
      default: 48,
    }),
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.primary + "10",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.primary + "20",
  },
  balanceInfo: {
    flex: 1,
    minWidth: 0,
  },
  leaveTypeName: {
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 18 : 17,
      default: 17,
    }),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  yearBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#F1F5F9",
  },
  yearText: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 11,
  },
  balanceDetails: {
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    gap: Spacing.xs,
  },
  balanceItem: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },
  balanceLabel: {
    color: "#64748B",
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 12 : 11,
      default: 11,
    }),
    marginBottom: Spacing.xs,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceDivider: {
    width: 1,
    height: 48,
    backgroundColor: "#E2E8F0",
  },
  balanceValue: {
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 32 : 28,
      default: 28,
    }),
    fontWeight: "800",
    color: "#0F172A",
    marginTop: Spacing.xs,
    letterSpacing: -0.5,
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
  applicationCard: {
    marginHorizontal: Spacing["2xl"],
    padding: Platform.select({
      web: Dimensions.get('window').width > 768 ? Spacing.lg : Spacing.md,
      default: Spacing.md,
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
  applicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  applicationHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
    minWidth: 0,
  },
  applicationInfo: {
    flex: 1,
    minWidth: 0,
  },
  applicationLeaveType: {
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 17 : 16,
      default: 16,
    }),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  dateRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  dateRangeText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: "transparent",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 12,
    textTransform: "capitalize",
    letterSpacing: 0.3,
  },
  applicationDetails: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  applicationDetailRow: {
    marginBottom: Spacing.sm,
  },
  applicationDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  reasonContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: "#F8FAFC",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  reasonLabel: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reasonText: {
    color: "#0F172A",
    fontSize: 13,
    lineHeight: 20,
  },
  applicationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#DBEAFE",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  applicationFooterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flexWrap: "wrap",
  },
  applicationFooterLabel: {
    color: "#757575",
    fontWeight: "600",
  },
});
