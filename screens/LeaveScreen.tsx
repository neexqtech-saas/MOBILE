import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

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
      return '#FFB380'; // Orange
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

  if (isLoading) {
    return (
      <ScreenScrollView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFB380" />
          <ThemedText style={{ color: theme.textMuted, marginTop: Spacing.md }}>
            Loading leave balances...
          </ThemedText>
        </View>
      </ScreenScrollView>
    );
    }

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
        <ThemedText type="h4" style={styles.title}>Leave Balance</ThemedText>
      </View>

      <Spacer height={Spacing.xl} />

      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: "#FFEBEE", borderColor: "#FFCDD2" }]}>
          <Feather name="alert-circle" size={18} color="#F44336" />
          <ThemedText style={[styles.errorText, { color: "#F44336" }]}>
            {error}
      </ThemedText>
        </View>
      ) : leaveBalances.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: "#FFFFFF", borderColor: "#FFE0CC" }]}>
          <Feather name="calendar" size={48} color={theme.textMuted} />
          <ThemedText style={{ color: theme.textMuted, marginTop: Spacing.md }}>
            No leave balances found
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
                borderColor: "#FFE0CC",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
      >
            <View style={styles.balanceCardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: "#FFE8CC" }]}>
              <Feather
                  name={getLeaveIcon(balance.leave_type_code || '')}
                  size={24}
                  color="#FFB380"
              />
            </View>
              <View style={styles.balanceInfo}>
                <ThemedText style={styles.leaveTypeName}>
                  {balance.leave_type_name || 'Leave'}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textMuted }}>
                  Year: {balance.year}
              </ThemedText>
            </View>
          </View>
            <View style={styles.balanceDetails}>
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <ThemedText type="small" style={{ color: theme.textMuted }}>
                    Assigned
                  </ThemedText>
                  <ThemedText type="h3" style={styles.balanceValue}>
                    {balance.assigned}
            </ThemedText>
          </View>
                <View style={styles.balanceItem}>
          <ThemedText type="small" style={{ color: theme.textMuted }}>
                    Used
                  </ThemedText>
                  <ThemedText type="h3" style={[styles.balanceValue, { color: "#F44336" }]}>
                    {balance.used}
          </ThemedText>
        </View>
                <View style={styles.balanceItem}>
          <ThemedText type="small" style={{ color: theme.textMuted }}>
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
        <ThemedText type="h4" style={styles.title}>Leave Applications</ThemedText>
      </View>

      <Spacer height={Spacing.xl} />

      {isLoadingApplications ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFB380" />
          <ThemedText style={{ color: theme.textMuted, marginTop: Spacing.md }}>
            Loading applications...
      </ThemedText>
        </View>
      ) : leaveApplications.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: "#FFFFFF", borderColor: "#FFE0CC" }]}>
          <Feather name="file-text" size={48} color={theme.textMuted} />
          <ThemedText style={{ color: theme.textMuted, marginTop: Spacing.md }}>
            No leave applications found
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
                borderColor: "#FFE0CC",
              },
            ]}
          >
            <View style={styles.applicationHeader}>
              <View style={styles.applicationHeaderLeft}>
                <View style={[styles.iconContainer, { backgroundColor: "#FFE8CC" }]}>
                  <Feather
                    name={getLeaveIcon(application.leave_type_code || '')}
                    size={20}
                    color="#FFB380"
                  />
                </View>
                <View style={styles.applicationInfo}>
                  <ThemedText style={styles.applicationLeaveType}>
                    {application.leave_type_name || 'Leave'}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textMuted }}>
                    {formatDate(application.from_date)} - {formatDate(application.to_date)}
                  </ThemedText>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(application.status) + "20" },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{
                    color: getStatusColor(application.status),
                    fontWeight: "600",
                    textTransform: "capitalize",
                  }}
                >
                  {application.status}
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
                  <ThemedText type="small" style={{ color: theme.textMuted }}>
                    Reason:
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.text, marginTop: Spacing.xs }}>
                    {application.reason}
                  </ThemedText>
                </View>
              )}
              <View style={styles.applicationFooter}>
                <ThemedText type="small" style={{ color: theme.textMuted }}>
                  Applied: {formatDate(application.applied_at)}
                </ThemedText>
                {application.reviewed_at && (
                  <ThemedText type="small" style={{ color: theme.textMuted }}>
                    Reviewed: {formatDate(application.reviewed_at)}
                  </ThemedText>
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
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#424242",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["3xl"],
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginHorizontal: Spacing["2xl"],
    gap: Spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  balanceCard: {
    marginHorizontal: Spacing["2xl"],
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing.lg,
    shadowColor: "#FFE0CC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceInfo: {
    flex: 1,
  },
  leaveTypeName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 4,
  },
  balanceDetails: {
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#FFE0CC",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: Spacing.md,
  },
  balanceItem: {
    flex: 1,
    alignItems: "center",
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#424242",
    marginTop: Spacing.xs,
  },
  emptyState: {
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    borderWidth: 1.5,
    marginHorizontal: Spacing["2xl"],
  },
  applicationCard: {
    marginHorizontal: Spacing["2xl"],
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
    shadowColor: "#FFE0CC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  applicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  applicationHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  applicationInfo: {
    flex: 1,
  },
  applicationLeaveType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  applicationDetails: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#FFE0CC",
  },
  applicationDetailRow: {
    marginBottom: Spacing.sm,
  },
  applicationDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  reasonContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: "#FFE8CC20",
    borderRadius: BorderRadius.sm,
  },
  applicationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#FFE0CC",
  },
});
