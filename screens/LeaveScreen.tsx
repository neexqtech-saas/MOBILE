import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Platform, useWindowDimensions } from "react-native";
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
      titleFs: compact ? 15 : 17,
      metaFs: compact ? 11 : 12,
      iconBox: compact ? 36 : 40,
      iconInner: compact ? 17 : 19,
      balanceNumFs: compact ? 18 : 22,
      appTitleFs: compact ? 14 : 15,
      headerIcon: compact ? 30 : 34,
      iconSm: compact ? 11 : 12,
      iconMd: compact ? 13 : 14,
    };
  }, [width]);
  
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceAPI[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplicationAPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch leave balances on screen load
  useEffect(() => {
    const fetchLeaveBalances = async () => {
      const adminId = employee.adminId;
      const userId = employee.id;
      
      if (!adminId || !userId) {
        setError("User ID or admin context not found. Please login again.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const currentYear = new Date().getFullYear();
        const response = await apiService.getLeaveBalances(adminId, userId, currentYear);
        
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
  }, [employee.adminId, employee.id]);

  // Fetch leave applications on screen load
  useEffect(() => {
    const fetchLeaveApplications = async () => {
      const adminId = employee.adminId;
      const userId = employee.id;
      
      if (!adminId || !userId) {
        return;
      }

      setIsLoadingApplications(true);

      try {
        const currentYear = new Date().getFullYear();
        const response = await apiService.getLeaveApplications(adminId, userId, currentYear);
        
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
  }, [employee.adminId, employee.id]);

  const handleRefresh = async () => {
    const adminId = employee.adminId;
    const userId = employee.id;
    
    if (!adminId || !userId) {
      return;
    }

    setIsLoading(true);
    setIsLoadingApplications(true);
    setError(null);

    try {
      const currentYear = new Date().getFullYear();
      const [balancesResponse, applicationsResponse] = await Promise.all([
        apiService.getLeaveBalances(adminId, userId, currentYear),
        apiService.getLeaveApplications(adminId, userId, currentYear),
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
    }, [employee.adminId, employee.id])
  );

  if (isLoading) {
    return (
      <ScreenScrollView>
        <View style={[styles.loadingContainer, { paddingHorizontal: layout.screenHPad }]}>
          <View style={[styles.loadingIconContainer, { width: 48, height: 48, marginBottom: Spacing.md }]}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
          </View>
          <ThemedText style={[styles.loadingText, { fontSize: layout.metaFs, color: theme.textMuted }]}>
            Loading leave balances...
          </ThemedText>
        </View>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      <View style={{ paddingHorizontal: layout.screenHPad, paddingTop: layout.screenVPad }}>
      <View style={styles.refreshHeader}>
        <View style={{ flex: 1 }} />
        <RefreshButton
          onPress={handleRefresh}
          isLoading={isLoading || isLoadingApplications}
          label="Refresh"
        />
      </View>
      <Spacer height={layout.sectionGap} />
      <View style={[styles.header, { paddingHorizontal: 0 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.titleContainer}>
            <View style={[styles.titleIconContainer, { width: layout.headerIcon, height: layout.headerIcon }]}>
              <Feather name="calendar" size={layout.iconInner} color={Colors.dark.primary} />
            </View>
            <ThemedText style={[styles.title, { fontSize: layout.titleFs, color: theme.text }]}>Leave Balance</ThemedText>
          </View>
        </View>
        {leaveBalances.length > 0 && (
          <Pressable
            onPress={() => {
              const firstLeaveType = leaveBalances[0];
              navigation.navigate("ApplyLeave", {
                leaveTypeId: firstLeaveType.leave_type,
                leaveTypeName: firstLeaveType.leave_type_name || 'Leave',
              });
            }}
            style={({ pressed }) => [
              styles.addButton,
              { borderRadius: layout.cardRadius, minHeight: layout.compact ? 38 : 42 },
              pressed && styles.addButtonPressed,
            ]}
          >
            <View style={[styles.addButtonContent, { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md }]}>
              <Feather name="plus-circle" size={layout.iconInner} color="#FFFFFF" />
              <ThemedText style={[styles.addButtonText, { fontSize: layout.metaFs + 1.5 }]}>Apply Leave</ThemedText>
            </View>
          </Pressable>
        )}
      </View>

      <Spacer height={layout.sectionGap} />

      {error ? (
        <View style={[styles.errorContainer, { borderColor: theme.border, marginHorizontal: 0 }]}>
          <View style={styles.errorIconContainer}>
            <Feather name="alert-circle" size={20} color="#F44336" />
          </View>
          <View style={styles.errorTextContainer}>
            <ThemedText style={styles.errorTitle}>Error</ThemedText>
            <ThemedText style={[styles.errorText, { fontSize: layout.metaFs }]}>
              {error}
            </ThemedText>
          </View>
        </View>
      ) : leaveBalances.length === 0 ? (
        <View style={[styles.emptyState, { borderColor: theme.border, backgroundColor: theme.backgroundDefault, marginHorizontal: 0 }]}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="calendar" size={layout.compact ? 40 : 48} color={theme.textMuted} />
          </View>
          <ThemedText style={[styles.emptyTitle, { color: theme.text, fontSize: layout.compact ? 15 : 16 }]}>No Leave Balances</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: theme.textMuted, fontSize: layout.metaFs }]}>
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
                padding: layout.cardPad,
                borderRadius: layout.cardRadius,
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
                marginHorizontal: 0,
                marginBottom: layout.sectionGap,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <View style={[styles.balanceCardHeader, { marginBottom: Spacing.sm, gap: Spacing.sm }]}>
              <View style={styles.iconContainer}>
                <View
                  style={[
                    styles.iconBackground,
                    {
                      width: layout.iconBox,
                      height: layout.iconBox,
                      backgroundColor: Colors.dark.primary + "10",
                      borderColor: Colors.dark.primary + "22",
                    },
                  ]}
                >
                  <Feather
                    name={getLeaveIcon(balance.leave_type_code || '')}
                    size={layout.iconInner}
                    color={Colors.dark.primary}
                  />
                </View>
              </View>
              <View style={styles.balanceInfo}>
                <ThemedText style={[styles.leaveTypeName, { fontSize: layout.appTitleFs, color: theme.text }]}>
                  {balance.leave_type_name || 'Leave'}
                </ThemedText>
                <View style={[styles.yearBadge, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name="calendar" size={layout.iconSm} color={theme.textMuted} />
                  <ThemedText style={[styles.yearText, { color: theme.textMuted }]}>
                    {balance.year}
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={[styles.balanceDetails, { borderTopColor: theme.border, paddingTop: Spacing.sm }]}>
              <View style={styles.balanceRow}>
                <View style={styles.balanceItem}>
                  <ThemedText style={[styles.balanceLabel, { fontSize: layout.metaFs, color: theme.textMuted }]}>
                    Assigned
                  </ThemedText>
                  <ThemedText style={[styles.balanceValue, { fontSize: layout.balanceNumFs, color: theme.text }]}>
                    {balance.assigned}
                  </ThemedText>
                </View>
                <View style={[styles.balanceDivider, { backgroundColor: theme.border, height: 36 }]} />
                <View style={styles.balanceItem}>
                  <ThemedText style={[styles.balanceLabel, { fontSize: layout.metaFs, color: theme.textMuted }]}>
                    Used
                  </ThemedText>
                  <ThemedText style={[styles.balanceValue, { fontSize: layout.balanceNumFs, color: Colors.dark.error }]}>
                    {balance.used}
                  </ThemedText>
                </View>
                <View style={[styles.balanceDivider, { backgroundColor: theme.border, height: 36 }]} />
                <View style={styles.balanceItem}>
                  <ThemedText style={[styles.balanceLabel, { fontSize: layout.metaFs, color: theme.textMuted }]}>
                    Balance
                  </ThemedText>
                  <ThemedText style={[styles.balanceValue, { fontSize: layout.balanceNumFs, color: Colors.dark.success }]}>
                    {balance.balance}
                  </ThemedText>
                </View>
              </View>
            </View>
          </Pressable>
        ))
      )}

      <Spacer height={Spacing["2xl"]} />

      <View style={[styles.header, { paddingHorizontal: 0 }]}>
        <View style={styles.titleContainer}>
          <View style={[styles.titleIconContainer, { width: layout.headerIcon, height: layout.headerIcon }]}>
            <Feather name="file-text" size={layout.iconInner} color={Colors.dark.primary} />
          </View>
          <ThemedText style={[styles.title, { fontSize: layout.titleFs, color: theme.text }]}>Leave Applications</ThemedText>
        </View>
      </View>

      <Spacer height={layout.sectionGap} />

      {isLoadingApplications ? (
        <View style={[styles.loadingContainer, { minHeight: 100, paddingVertical: Spacing.md }]}>
          <ActivityIndicator size="small" color={Colors.dark.primary} />
          <ThemedText style={[styles.loadingText, { marginTop: Spacing.sm, fontSize: layout.metaFs, color: theme.textMuted }]}>
            Loading applications...
          </ThemedText>
        </View>
      ) : leaveApplications.length === 0 ? (
        <View style={[styles.emptyState, { borderColor: theme.border, backgroundColor: theme.backgroundDefault, marginHorizontal: 0 }]}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="file-text" size={layout.compact ? 40 : 48} color={theme.textMuted} />
          </View>
          <ThemedText style={[styles.emptyTitle, { color: theme.text, fontSize: layout.compact ? 15 : 16 }]}>No Applications</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: theme.textMuted, fontSize: layout.metaFs }]}>
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
                padding: layout.cardPad,
                borderRadius: layout.cardRadius,
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
                marginHorizontal: 0,
                marginBottom: layout.sectionGap,
              },
            ]}
          >
            <View style={[styles.applicationHeader, { marginBottom: Spacing.sm }]}>
              <View style={styles.applicationHeaderLeft}>
                <View style={styles.iconContainer}>
                  <View
                    style={[
                      styles.iconBackground,
                      {
                        width: layout.iconBox - 4,
                        height: layout.iconBox - 4,
                        backgroundColor: Colors.dark.primary + "10",
                        borderColor: Colors.dark.primary + "22",
                      },
                    ]}
                  >
                    <Feather
                      name={getLeaveIcon(application.leave_type_code || '')}
                      size={layout.iconInner - 1}
                      color={Colors.dark.primary}
                    />
                  </View>
                </View>
                <View style={styles.applicationInfo}>
                  <ThemedText style={[styles.applicationLeaveType, { fontSize: layout.appTitleFs, color: theme.text }]}>
                    {application.leave_type_name || 'Leave'}
                  </ThemedText>
                  <View style={styles.dateRangeContainer}>
                    <Feather name="calendar" size={layout.iconSm} color={theme.textMuted} />
                    <ThemedText style={[styles.dateRangeText, { fontSize: layout.metaFs, color: theme.textMuted }]}>
                      {formatDate(application.from_date)} - {formatDate(application.to_date)}
                    </ThemedText>
                  </View>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getStatusColor(application.status) + "15",
                    paddingVertical: 3,
                    paddingHorizontal: 8,
                  },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(application.status) },
                  ]}
                />
                <ThemedText
                  style={[
                    styles.statusText,
                    { color: getStatusColor(application.status), fontSize: layout.metaFs },
                  ]}
                >
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.applicationDetails, { borderTopColor: theme.border, paddingTop: Spacing.sm }]}>
              <View style={[styles.applicationDetailRow, { marginBottom: Spacing.xs }]}>
                <View style={styles.applicationDetailItem}>
                  <Feather name="calendar" size={layout.iconMd} color={theme.textMuted} />
                  <ThemedText style={{ color: theme.textMuted, marginLeft: 4, fontSize: layout.metaFs }}>
                    {application.total_days} {application.total_days === 1 ? 'Day' : 'Days'} · {getDayTypeText(application.leave_day_type)}
                  </ThemedText>
                </View>
              </View>
              {application.reason && (
                <View style={[styles.reasonContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                  <View style={styles.reasonHeader}>
                    <Feather name="message-circle" size={layout.iconMd} color={theme.textMuted} />
                    <ThemedText style={[styles.reasonLabel, { fontSize: layout.metaFs, color: theme.textMuted }]}>
                      Reason
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.reasonText, { fontSize: layout.metaFs, color: theme.text }]} numberOfLines={4}>
                    {application.reason}
                  </ThemedText>
                </View>
              )}
              <View style={[styles.applicationFooter, { borderTopColor: theme.border, marginTop: Spacing.sm, paddingTop: Spacing.xs }]}>
                <View style={styles.applicationFooterItem}>
                  <ThemedText style={[styles.applicationFooterLabel, { fontSize: layout.metaFs }]}>
                    Applied
                  </ThemedText>
                  <ThemedText style={{ color: theme.textMuted, fontSize: layout.metaFs }}>
                    {formatDate(application.applied_at)}
                  </ThemedText>
                </View>
                {application.reviewed_at && (
                  <View style={styles.applicationFooterItem}>
                    <ThemedText style={[styles.applicationFooterLabel, { fontSize: layout.metaFs }]}>
                      Reviewed
                    </ThemedText>
                    <ThemedText style={{ color: theme.textMuted, fontSize: layout.metaFs }}>
                      {formatDate(application.reviewed_at)}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          </View>
        ))
      )}

      <Spacer height={Spacing["2xl"]} />
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  refreshHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 0,
    paddingTop: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 0,
    paddingTop: 0,
    flexWrap: "wrap",
    gap: Spacing.sm,
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
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "700",
    letterSpacing: -0.25,
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
    gap: Spacing.xs,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
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
    color: "#991B1B",
    lineHeight: 18,
  },
  balanceCard: {
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
  balanceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconBackground: {
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  balanceInfo: {
    flex: 1,
    minWidth: 0,
  },
  leaveTypeName: {
    fontWeight: "700",
    marginBottom: 2,
    letterSpacing: -0.15,
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
    borderTopWidth: StyleSheet.hairlineWidth,
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
    marginBottom: 2,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  balanceDivider: {
    width: 1,
  },
  balanceValue: {
    fontWeight: "800",
    marginTop: 2,
    letterSpacing: -0.35,
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
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: Spacing.sm,
  },
  applicationCard: {
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
  applicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  applicationHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm,
    minWidth: 0,
  },
  applicationInfo: {
    flex: 1,
    minWidth: 0,
  },
  applicationLeaveType: {
    fontWeight: "700",
    marginBottom: 2,
    letterSpacing: -0.15,
  },
  dateRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  dateRangeText: {
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.sm,
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontWeight: "700",
    textTransform: "capitalize",
    letterSpacing: 0.2,
  },
  applicationDetails: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applicationDetailRow: {},
  applicationDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  reasonContainer: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  reasonLabel: {
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.35,
  },
  reasonText: {
    lineHeight: 18,
  },
  applicationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
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
    fontWeight: "600",
    marginRight: 4,
  },
});
