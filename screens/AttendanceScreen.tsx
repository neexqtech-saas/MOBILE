import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, ScrollView, Platform, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { AttendanceStackParamList } from "@/navigation/AttendanceStackNavigator";
import { apiService } from "@/services/api";
import Spacer from "@/components/Spacer";
import { RefreshButton } from "@/components/RefreshButton";

type AttendanceScreenNavigationProp = NativeStackNavigationProp<
  AttendanceStackParamList,
  "Attendance"
>;

// Format time - but check if it's already formatted (from store)
const formatTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return "—";
  
  // If it's already formatted (contains AM/PM or is a simple time string), return as is
  if (timeStr.includes("AM") || timeStr.includes("PM") || /^\d{1,2}:\d{2}/.test(timeStr)) {
    return timeStr;
  }
  
  // Otherwise, try to parse as ISO date string
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) {
      // Invalid date, return original string
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

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'present':
      return '#22C55E';
    case 'absent':
      return '#F44336';
    case 'late':
      return '#2563EB';
    case 'half-day':
      return '#2563EB';
    default:
      return '#757575';
  }
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function AttendanceScreen() {
  const navigation = useNavigation<AttendanceScreenNavigationProp>();
  const { theme } = useTheme();
  const { 
    employee, 
    attendanceHistory, 
    todayAttendance,
    fetchAttendanceHistory,
    fetchTodayAttendance
  } = useHRMSStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(""); // YYYY-MM-DD format
  const [monthlyAttendance, setMonthlyAttendance] = useState<{
    present: string[];
    absent: string[];
  }>({ present: [], absent: [] });
  const [selectedDateDetails, setSelectedDateDetails] = useState<any>(null);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch monthly attendance for calendar color coding
  const fetchMonthlyAttendance = async () => {
    // Use siteId for monthly attendance API (backend expects site_id)
    const siteId = employee?.siteId;
    if (!siteId || !employee?.id) {
      console.log('⚠️ Cannot fetch monthly attendance: missing siteId or userId');
      return;
    }
    
    try {
      const month = calendarMonth.getMonth() + 1;
      const year = calendarMonth.getFullYear();
      console.log('📅 Fetching monthly attendance:', { siteId, userId: employee.id, month, year });
      const response = await apiService.getMonthlyAttendance(siteId, employee.id, month, year);
      
      console.log('📅 Monthly attendance response:', {
        hasData: !!response.data,
        presentDates: response.data?.present?.dates?.length || 0,
        absentDates: response.data?.absent?.dates?.length || 0,
        presentDatesSample: response.data?.present?.dates?.slice(0, 3),
        absentDatesSample: response.data?.absent?.dates?.slice(0, 3),
      });
      
      if (response.data) {
        setMonthlyAttendance({
          present: response.data.present?.dates || [],
          absent: response.data.absent?.dates || [],
        });
      }
    } catch (error: any) {
      console.error('❌ Error fetching monthly attendance:', error);
      // If 403 error, silently fail and use attendanceHistory as fallback
      if (error?.responseData?.status === 403) {
        console.log('⚠️ Monthly attendance API returned 403, using attendanceHistory as fallback');
      }
      // Don't set error state, just use fallback from attendanceHistory
    }
  };

  // Fetch selected date details
  const fetchDateDetails = async (date: string) => {
    if (!employee?.siteId || !employee?.id) return;
    
    try {
      const response = await apiService.getUserAttendanceByDate(employee.siteId, employee.id, date);
      if (response.data && response.data.length > 0) {
        setSelectedDateDetails(response.data[0]);
      } else {
        setSelectedDateDetails(null);
      }
    } catch (error) {
      console.error('Error fetching date details:', error);
      setSelectedDateDetails(null);
    }
  };

  useEffect(() => {
    // Don't set today as default selected date since it's not clickable
    // setSelectedDate(""); // Start with no date selected
    
    if (employee?.organizationId && employee?.id) {
      fetchAttendanceHistory(employee.organizationId);
      fetchTodayAttendance();
    }
  }, [employee?.organizationId, employee?.id, fetchAttendanceHistory, fetchTodayAttendance]);

  useEffect(() => {
    const siteId = employee?.siteId;
    if (siteId && employee?.id) {
      fetchMonthlyAttendance();
    }
  }, [calendarMonth, employee?.siteId, employee?.id]);

  useEffect(() => {
    if (selectedDate) {
      fetchDateDetails(selectedDate);
    }
  }, [selectedDate, employee?.siteId, employee?.id]);

  const handleRefresh = async () => {
    if (!employee?.organizationId || !employee?.id) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchAttendanceHistory(employee.organizationId),
        fetchTodayAttendance(),
        fetchMonthlyAttendance()
      ]);
      if (selectedDate) {
        await fetchDateDetails(selectedDate);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh attendance. Please try again.';
      setError(errorMessage);
      console.error('Error refreshing attendance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: number) => {
    // Haptic feedback on month navigation
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newDate = new Date(calendarMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCalendarMonth(newDate);
  };

  const handleDateSelect = (day: number) => {
    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    // Haptic feedback on date selection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(dateStr);
  };

  // Get date status for color coding - check for present, absent, or none
  const getDateStatus = (dateStr: string): 'present' | 'absent' | 'none' => {
    // First check monthly attendance API data
    if (monthlyAttendance.present.includes(dateStr)) return 'present';
    if (monthlyAttendance.absent.includes(dateStr)) return 'absent';
    
    // Fallback: check attendanceHistory
    const record = attendanceHistory.find(r => r.date === dateStr);
    if (record) {
      if (record.status === 'present' || record.status === 'late') {
        return 'present';
      }
      if (record.status === 'absent') {
        return 'absent';
      }
    }
    
    // Also check todayAttendance
    if (todayAttendance && todayAttendance.date === dateStr) {
      if (todayAttendance.status === 'present' || todayAttendance.status === 'late') {
        return 'present';
      }
      if (todayAttendance.status === 'absent') {
        return 'absent';
      }
    }
    
    return 'none';
  };

  // Render calendar day with color coding
  const renderCalendarDay = (day: number | null, index: number) => {
    if (!day) {
      return <View key={`empty-${index}`} style={styles.calendarDay} />;
    }

    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isSelected = selectedDate === dateStr;
    const isToday = dateStr === getTodayDate();
    const dateStatus = getDateStatus(dateStr);
    const isPast = new Date(dateStr) < new Date(getTodayDate());
    const isFuture = new Date(dateStr) > new Date(getTodayDate());
    
    let backgroundColor = "#FFFFFF";
    let borderColor = "#F1F5F9";
    let textColor = theme.text;
    let borderWidth = 1;
    
    if (isSelected) {
      backgroundColor = Colors.dark.primary;
      borderColor = Colors.dark.primary;
      textColor = "#FFFFFF";
      borderWidth = 1.5;
    } else if (dateStatus === 'present') {
      backgroundColor = "#ECFDF5"; // Very light green
      borderColor = "#86EFAC";
      textColor = "#166534";
      borderWidth = 1;
    } else if (dateStatus === 'absent') {
      backgroundColor = "#FEF2F2"; // Very light red
      borderColor = "#FCA5A5";
      textColor = "#991B1B";
      borderWidth = 1;
    } else if (isToday) {
      backgroundColor = "#FFFFFF"; // Normal white background
      borderColor = "#F1F5F9"; // Normal border
      textColor = theme.text; // Normal text color
      borderWidth = 1;
    } else if (isFuture) {
      backgroundColor = "#F8FAFC"; // Light gray/silver background
      borderColor = "#CBD5E1"; // Silver/gray border
      textColor = "#94A3B8"; // Silver/gray text
      borderWidth = 1;
    } else if (isPast) {
      backgroundColor = "#FAFAFA";
      borderColor = "#F1F5F9";
      textColor = "#CBD5E1";
      borderWidth = 1;
    }

    return (
      <Pressable
        key={day}
        onPress={() => !isFuture && handleDateSelect(day)}
        disabled={isFuture}
        style={({ pressed }) => [
          styles.calendarDay,
          {
            backgroundColor: pressed && !isFuture ? (
              isSelected ? Colors.dark.primary : 
              dateStatus === 'present' ? "#D1FAE5" : 
              dateStatus === 'absent' ? "#FEE2E2" : 
              "#F8FAFC"
            ) : backgroundColor,
            borderColor,
            borderWidth,
            opacity: isFuture ? 0.5 : (pressed ? 0.8 : 1),
            transform: [{ scale: pressed && !isFuture ? 0.96 : 1 }],
          },
        ]}
      >
        <ThemedText
          style={[
            styles.calendarDayText,
            {
              color: textColor,
              fontWeight: isSelected ? "600" : isToday || dateStatus !== 'none' ? "500" : "400",
            }
          ]}
        >
          {day}
        </ThemedText>
        {(dateStatus === 'present' || dateStatus === 'absent') && !isSelected && !isFuture && (
          <View style={[
            styles.statusIndicator,
            { backgroundColor: dateStatus === 'present' ? "#10B981" : "#EF4444" }
          ]} />
        )}
      </Pressable>
    );
  };

  // Render main calendar
  const renderMainCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarMonth);
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return (
      <View style={styles.mainCalendarContainer}>
        {/* Month Navigation */}
        <View style={styles.calendarHeader}>
          <Pressable
            onPress={() => navigateMonth(-1)}
            style={({ pressed }) => [
              styles.monthNavButton,
              pressed && styles.monthNavButtonPressed,
            ]}
          >
            <Feather name="chevron-left" size={24} color={Colors.dark.primary} />
          </Pressable>
          <View style={styles.monthTitleContainer}>
            <ThemedText style={styles.monthTitleText}>
              {MONTHS[calendarMonth.getMonth()]}
            </ThemedText>
            <ThemedText style={styles.monthYearText}>
              {calendarMonth.getFullYear()}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => navigateMonth(1)}
            style={({ pressed }) => [
              styles.monthNavButton,
              pressed && styles.monthNavButtonPressed,
            ]}
          >
            <Feather name="chevron-right" size={24} color={Colors.dark.primary} />
          </Pressable>
        </View>

        {/* Weekday Headers */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((day, index) => (
            <View key={day} style={[
              styles.weekdayHeader,
              (index === 0 || index === 6) && styles.weekendHeader
            ]}>
              <ThemedText style={[
                styles.weekdayText,
                (index === 0 || index === 6) && styles.weekendText
              ]}>
                {day}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {days.map((day, index) => renderCalendarDay(day, index))}
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#D1FAE5", borderColor: "#22C55E" }]} />
            <ThemedText type="small" style={styles.legendText}>Present</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: "#FEE2E2", borderColor: "#F44336" }]} />
            <ThemedText type="small" style={styles.legendText}>Absent</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: Colors.dark.primary, borderColor: Colors.dark.primary }]} />
            <ThemedText type="small" style={styles.legendText}>Selected</ThemedText>
          </View>
        </View>
      </View>
    );
  };

  // Format time helper
  const formatTimeDisplay = (timeStr: string | null | undefined): string => {
    if (!timeStr) return "—";
    if (timeStr.includes("AM") || timeStr.includes("PM") || /^\d{1,2}:\d{2}/.test(timeStr)) {
      return timeStr;
    }
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr;
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeStr;
    }
  };

  if (isLoading && !selectedDateDetails) {
    return (
      <ScreenScrollView>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
          </View>
          <ThemedText style={styles.loadingText}>
            Loading attendance...
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
          isLoading={isLoading}
          label="Refresh"
        />
      </View>
      <Spacer height={Spacing.md} />
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleIconContainer}>
            <Feather name="calendar" size={22} color={Colors.dark.primary} />
          </View>
          <ThemedText type="h4" style={styles.title}>Attendance Calendar</ThemedText>
        </View>
      </View>

      <Spacer height={Spacing.xl} />

      {/* Main Calendar */}
      <View style={styles.calendarWrapper}>
        {renderMainCalendar()}
      </View>

      <Spacer height={Spacing["2xl"]} />

      {/* Selected Date Details */}
      {selectedDate && (
        <View style={styles.selectedDateSection}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <View style={styles.titleIconContainer}>
                <Feather name="clock" size={22} color={Colors.dark.primary} />
              </View>
              <ThemedText type="h4" style={styles.title}>
                {formatDate(selectedDate)} Details
              </ThemedText>
            </View>
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
          ) : !selectedDateDetails ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Feather name="calendar" size={56} color={theme.textMuted} />
              </View>
              <ThemedText style={styles.emptyTitle}>No Record Found</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                No attendance record for this date
              </ThemedText>
            </View>
          ) : (
            <>
              {/* Main Attendance Record */}
              <View style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.iconContainer}>
                    <View style={styles.iconBackground}>
                      <Feather name="calendar" size={20} color={Colors.dark.primary} />
                    </View>
                  </View>
                  <View style={styles.recordInfo}>
                    <ThemedText style={styles.recordDate}>
                      {formatDate(selectedDate)}
                    </ThemedText>
                    <View style={styles.shiftBadge}>
                      <Feather name="clock" size={12} color={theme.textMuted} />
                      <ThemedText type="small" style={styles.shiftText}>
                        {selectedDateDetails.shift_name || 'No shift'}
                      </ThemedText>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(selectedDateDetails.attendance_status || '') + "15" },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(selectedDateDetails.attendance_status || '') },
                      ]}
                    />
                    <ThemedText
                      type="small"
                      style={[
                        styles.statusText,
                        { color: getStatusColor(selectedDateDetails.attendance_status || '') },
                      ]}
                    >
                      {selectedDateDetails.attendance_status?.charAt(0).toUpperCase() + selectedDateDetails.attendance_status?.slice(1) || "Unknown"}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.recordDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <View style={styles.detailLabelContainer}>
                        <Feather name="log-in" size={12} color={theme.textMuted} />
                        <ThemedText type="small" style={styles.detailLabel}>
                          Check In
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.detailValue}>
                        {formatTimeDisplay(selectedDateDetails.check_in)}
                      </ThemedText>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailItem}>
                      <View style={styles.detailLabelContainer}>
                        <Feather name="log-out" size={12} color={theme.textMuted} />
                        <ThemedText type="small" style={styles.detailLabel}>
                          Check Out
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.detailValue}>
                        {formatTimeDisplay(selectedDateDetails.check_out)}
                      </ThemedText>
                    </View>
                  </View>
                  {selectedDateDetails.production_hours && (
                    <>
                      <Spacer height={Spacing.md} />
                      <View style={styles.hoursContainer}>
                        <View style={styles.hoursIconContainer}>
                          <Feather name="clock" size={16} color={Colors.dark.primary} />
                        </View>
                        <ThemedText style={styles.hoursText}>
                          Total: {selectedDateDetails.production_hours}
                        </ThemedText>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* Multiple Entries */}
              {selectedDateDetails.multiple_entries && selectedDateDetails.multiple_entries.length > 0 && (
                <>
                  <Spacer height={Spacing.lg} />
                  <View style={styles.header}>
                    <View style={styles.titleContainer}>
                      <View style={styles.titleIconContainer}>
                        <Feather name="list" size={22} color={Colors.dark.primary} />
                      </View>
                      <ThemedText type="h4" style={styles.title}>Multiple Entries</ThemedText>
                    </View>
                  </View>
                  <Spacer height={Spacing.md} />
                  {[...selectedDateDetails.multiple_entries]
                    .sort((a: any, b: any) => {
                      // Sort by check_in_time (oldest first) for correct chronological order
                      const timeA = a.check_in_time || a.check_in || '';
                      const timeB = b.check_in_time || b.check_in || '';
                      if (!timeA) return 1;
                      if (!timeB) return -1;
                      return new Date(timeA).getTime() - new Date(timeB).getTime();
                    })
                    .map((entry: any, index: number) => (
                    <View
                      key={entry.id || index}
                      style={styles.multipleEntryCard}
                    >
                      <View style={styles.multipleEntryHeader}>
                        <View style={styles.entryNumberBadge}>
                          <ThemedText style={styles.entryNumberText}>
                            #{index + 1}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.multipleEntryTitle}>
                          Entry {index + 1}
                        </ThemedText>
                      </View>
                      <View style={styles.recordDetails}>
                        <View style={styles.detailRow}>
                          <View style={styles.detailItem}>
                            <View style={styles.detailLabelContainer}>
                              <Feather name="log-in" size={12} color={theme.textMuted} />
                              <ThemedText type="small" style={styles.detailLabel}>
                                Check In
                              </ThemedText>
                            </View>
                            <ThemedText style={styles.detailValue}>
                              {formatTimeDisplay(entry.check_in_time || entry.check_in)}
                            </ThemedText>
                          </View>
                          <View style={styles.detailDivider} />
                          <View style={styles.detailItem}>
                            <View style={styles.detailLabelContainer}>
                              <Feather name="log-out" size={12} color={theme.textMuted} />
                              <ThemedText type="small" style={styles.detailLabel}>
                                Check Out
                              </ThemedText>
                            </View>
                            <ThemedText style={styles.detailValue}>
                              {formatTimeDisplay(entry.check_out_time || entry.check_out)}
                            </ThemedText>
                          </View>
                        </View>
                        {entry.total_working_minutes && (
                          <>
                            <Spacer height={Spacing.md} />
                            <View style={styles.hoursContainer}>
                              <View style={styles.hoursIconContainer}>
                                <Feather name="clock" size={16} color={Colors.dark.primary} />
                              </View>
                              <ThemedText style={styles.hoursText}>
                                Duration: {Math.floor(entry.total_working_minutes / 60)}h {entry.total_working_minutes % 60}m
                              </ThemedText>
                            </View>
                          </>
                        )}
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
          )}
        </View>
      )}

      <Spacer height={Spacing["4xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  refreshHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing.md,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Platform.select({
      web: Dimensions.get('window').width > 768 ? Spacing["3xl"] : Spacing["2xl"],
      default: Spacing["2xl"],
    }),
    borderRadius: BorderRadius.xl,
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
  recordCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: Platform.select({
      web: Dimensions.get('window').width > 768 ? Spacing.xl : Spacing.lg,
      default: Spacing.lg,
    }),
    marginHorizontal: Spacing["2xl"],
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
  recordHeader: {
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
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.primary + "10",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.primary + "20",
  },
  recordInfo: {
    flex: 1,
    minWidth: 0,
  },
  recordDate: {
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 18 : 17,
      default: 17,
    }),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  shiftBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#F1F5F9",
  },
  shiftText: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 11,
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
  recordDetails: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  detailRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    alignItems: "center",
  },
  detailItem: {
    flex: 1,
    minWidth: 0,
  },
  detailLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  detailLabel: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E2E8F0",
  },
  detailValue: {
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 18 : 16,
      default: 16,
    }),
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 2,
    letterSpacing: -0.2,
  },
  dateRow: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  dateField: {
    flex: 1,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  dateInputWrapper: {
    position: "relative",
    height: Spacing.inputHeight,
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    borderColor: "#DBEAFE",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: Spacing["4xl"] + Spacing.sm,
    paddingRight: Spacing.lg,
  },
  inputIcon: {
    position: "absolute",
    left: Spacing.lg,
    zIndex: 1,
  },
  dateInput: {
    flex: 1,
    height: "100%",
    fontSize: Typography.body.fontSize,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "80%",
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#DBEAFE",
  },
  modalBody: {
    padding: Spacing.lg,
  },
  calendarContainer: {
    paddingVertical: Spacing.md,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: "#FAFAFA",
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  monthNavButtonPressed: {
    opacity: 0.7,
    backgroundColor: "#F8FAFC",
    borderColor: Colors.dark.primary + "40",
  },
  monthTitleContainer: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  monthTitleText: {
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 20 : 18,
      default: 18,
    }),
    fontWeight: "600",
    color: "#1E293B",
    letterSpacing: -0.3,
  },
  monthYearText: {
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 14 : 13,
      default: 13,
    }),
    fontWeight: "500",
    color: "#64748B",
    letterSpacing: 0.1,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: "transparent",
    marginHorizontal: Spacing.xs,
    justifyContent: "flex-start",
  },
  weekdayHeader: {
    width: "14.28%", // Exactly 100% / 7 days
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xs,
  },
  weekendHeader: {
    backgroundColor: "#FEF2F2",
    borderRadius: BorderRadius.xs,
  },
  weekdayText: {
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 12 : 11,
      default: 11,
    }),
    fontWeight: "500",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  weekendText: {
    color: "#EF4444",
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.xs,
    justifyContent: "flex-start",
  },
  calendarDay: {
    width: "14.28%", // Exactly 100% / 7 days
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    position: "relative",
  },
  calendarDayText: {
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 15 : 14,
      default: 14,
    }),
    fontWeight: "400",
    zIndex: 1,
  },
  statusIndicator: {
    position: "absolute",
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  mainCalendarContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: Platform.select({
      web: Dimensions.get('window').width > 768 ? Spacing.xl : Spacing.lg,
      default: Spacing.lg,
    }),
    paddingBottom: Platform.select({
      web: Dimensions.get('window').width > 768 ? Spacing.xl : Spacing.lg,
      default: Spacing.lg,
    }),
    marginHorizontal: Spacing["2xl"],
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  calendarWrapper: {
    marginBottom: Spacing.xl,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xl,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  legendText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
  },
  selectedDateSection: {
    paddingHorizontal: Spacing["2xl"],
    paddingBottom: Spacing.xl,
  },
  hoursContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.dark.primary + "08",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.primary + "20",
  },
  hoursIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  hoursText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.dark.primary,
    letterSpacing: 0.2,
  },
  multipleEntryCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: Platform.select({
      web: Dimensions.get('window').width > 768 ? Spacing.lg : Spacing.md,
      default: Spacing.md,
    }),
    marginBottom: Spacing.md,
    marginHorizontal: Spacing["2xl"],
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
  multipleEntryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  entryNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.dark.primary + "30",
  },
  entryNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.dark.primary,
  },
  multipleEntryTitle: {
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 17 : 16,
      default: 16,
    }),
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
});
