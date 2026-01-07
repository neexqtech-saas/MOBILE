import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, Platform, ActivityIndicator, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { LeaveStackParamList } from "@/navigation/LeaveStackNavigator";
import { apiService } from "@/services/api";
import Spacer from "@/components/Spacer";

type ApplyLeaveScreenNavigationProp = NativeStackNavigationProp<
  LeaveStackParamList,
  "ApplyLeave"
>;

type ApplyLeaveScreenRouteProp = RouteProp<LeaveStackParamList, "ApplyLeave">;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ApplyLeaveScreen() {
  const navigation = useNavigation<ApplyLeaveScreenNavigationProp>();
  const route = useRoute<ApplyLeaveScreenRouteProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();

  const leaveTypeId = route.params?.leaveTypeId;
  const leaveTypeName = route.params?.leaveTypeName || "Leave";

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [leaveDayType, setLeaveDayType] = useState<"full_day" | "first_half" | "second_half">("full_day");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  
  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Format date to YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(calendarMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCalendarMonth(newDate);
  };

  const handleDateSelect = (day: number, isFromDate: boolean) => {
    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    if (isFromDate) {
      setFromDate(dateStr);
      setShowFromDatePicker(false);
    } else {
      setToDate(dateStr);
      setShowToDatePicker(false);
    }
    setError("");
  };

  // Handle date picker for web
  const handleWebDateChange = (dateStr: string, isFromDate: boolean) => {
    if (isFromDate) {
      setFromDate(dateStr);
    } else {
      setToDate(dateStr);
    }
    setError("");
  };

  const handleSubmit = async () => {
    if (!leaveTypeId) {
      setError("Leave type not selected. Please go back and select a leave type.");
      return;
    }

    if (!fromDate.trim()) {
      setError("Please enter from date");
      return;
    }
    if (!toDate.trim()) {
      setError("Please enter to date");
      return;
    }
    if (!reason.trim()) {
      setError("Please enter reason for leave");
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fromDate)) {
      setError("From date must be in YYYY-MM-DD format");
      return;
    }
    if (!dateRegex.test(toDate)) {
      setError("To date must be in YYYY-MM-DD format");
      return;
    }

    // Validate to date is after or equal to from date
    if (new Date(toDate) < new Date(fromDate)) {
      setError("To date must be after or equal to from date");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const siteId = employee.siteId;
      const userId = employee.id;

      if (!siteId || !userId) {
        setError("User ID or Site ID not found. Please login again.");
        setIsSubmitting(false);
        return;
      }

      const response = await apiService.applyLeave(
        siteId,
        userId,
        leaveTypeId,
        fromDate,
        toDate,
      reason,
        leaveDayType
      );

      setIsSubmitting(false);

      if (response.status === 201) {
    Alert.alert(
          "✅ Leave Applied Successfully!",
          "Your leave request has been submitted successfully and is pending approval.",
      [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]
    );
      } else {
        setError(response.message || "Failed to submit leave request. Please try again.");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      
      console.log('Error caught:', err);
      console.log('Error responseData:', err?.responseData);
      
      // Handle API error response
      let errorMessage = 'Failed to apply leave. Please try again.';
      
      if (err?.responseData) {
        const errorData = err.responseData;
        
        // Field name mapping for better readability
        const fieldNameMap: Record<string, string> = {
          'leave_type': 'Leave Type',
          'from_date': 'From Date',
          'to_date': 'To Date',
          'reason': 'Reason',
          'leave_day_type': 'Leave Day Type',
          'check_in_latitude': 'Check-in Latitude',
          'check_in_longitude': 'Check-in Longitude',
          'check_out_latitude': 'Check-out Latitude',
          'check_out_longitude': 'Check-out Longitude',
        };
        
        // Handle validation errors from backend
        if (errorData.data && typeof errorData.data === 'object') {
          const validationErrors: string[] = [];
          
          // Extract field-specific errors
          Object.keys(errorData.data).forEach((field) => {
            const fieldErrors = errorData.data[field];
            const displayFieldName = fieldNameMap[field] || field
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (l: string) => l.toUpperCase());
            
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach((error: string) => {
                validationErrors.push(`• ${displayFieldName}: ${error}`);
              });
            } else if (typeof fieldErrors === 'string') {
              validationErrors.push(`• ${displayFieldName}: ${fieldErrors}`);
            } else if (typeof fieldErrors === 'object') {
              // Handle nested errors
              Object.values(fieldErrors).forEach((error: any) => {
                if (typeof error === 'string') {
                  validationErrors.push(`• ${displayFieldName}: ${error}`);
                }
              });
            }
          });
          
          if (validationErrors.length > 0) {
            errorMessage = validationErrors.join('\n');
          } else {
            // Fallback to message if no field-specific errors
            errorMessage = errorData.message || errorMessage;
          }
        } else {
          // Use the message from error response
          errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage;
        }
      } else if (err?.message) {
        // Network or other errors
        if (err.message.includes('Network request failed') || 
            err.message.includes('Failed to fetch') ||
            err.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (err.message.includes('Unauthorized') || err.message.includes('401')) {
          errorMessage = 'Session expired. Please login again.';
        } else if (err.message.includes('Forbidden') || err.message.includes('403')) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (err.message.includes('Not Found') || err.message.includes('404')) {
          errorMessage = 'Requested resource not found. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      console.log('Final error message:', errorMessage);
      setError(errorMessage);
    }
  };

  // Render calendar day
  const renderCalendarDay = (day: number | null, index: number, isFromDate: boolean) => {
    if (!day) {
      return <View key={`empty-${index}`} style={styles.calendarDay} />;
    }

    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isSelected = isFromDate ? fromDate === dateStr : toDate === dateStr;
    const isToday = 
      new Date().getDate() === day &&
      new Date().getMonth() === calendarMonth.getMonth() &&
      new Date().getFullYear() === calendarMonth.getFullYear();

    return (
      <Pressable
        key={day}
        onPress={() => handleDateSelect(day, isFromDate)}
        style={({ pressed }) => [
          styles.calendarDay,
          {
            backgroundColor: isSelected ? "#FFB380" : "transparent",
            borderColor: isSelected ? "#FFB380" : "transparent",
            borderWidth: isSelected ? 2 : 0,
          },
          isToday && !isSelected && styles.todayBorder,
          pressed && styles.calendarDayPressed,
        ]}
      >
        <ThemedText
          style={[
            styles.calendarDayText,
            {
              color: isSelected ? "#FFFFFF" : theme.text,
              fontWeight: isSelected || isToday ? "600" : "400",
            }
          ]}
        >
          {day}
      </ThemedText>
      </Pressable>
    );
  };

  // Render calendar
  const renderCalendar = (isFromDate: boolean) => {
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
      <View style={styles.calendarContainer}>
        {/* Month Navigation */}
        <View style={styles.calendarHeader}>
          <Pressable
            onPress={() => navigateMonth(-1)}
            style={styles.monthNavButton}
          >
            <Feather name="chevron-left" size={24} color="#FFB380" />
          </Pressable>
          <View style={styles.monthTitle}>
            <ThemedText style={styles.monthTitleText}>
              {MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => navigateMonth(1)}
            style={styles.monthNavButton}
          >
            <Feather name="chevron-right" size={24} color="#FFB380" />
          </Pressable>
        </View>

        {/* Weekday Headers */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((day) => (
            <View key={day} style={styles.weekdayHeader}>
              <ThemedText style={styles.weekdayText}>{day}</ThemedText>
            </View>
        ))}
      </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {days.map((day, index) => renderCalendarDay(day, index, isFromDate))}
        </View>
      </View>
    );
  };

  return (
    <>
      <ScreenScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Leave Type Display */}
        <View style={[styles.leaveTypeCard, { backgroundColor: "#FFE8CC", borderColor: "#FFB380", borderWidth: 1.5 }]}>
          <Feather name="calendar" size={24} color="#FFB380" />
          <View style={styles.leaveTypeInfo}>
            <ThemedText style={styles.leaveTypeLabel}>Leave Type</ThemedText>
            <ThemedText style={styles.leaveTypeValue}>{leaveTypeName}</ThemedText>
          </View>
        </View>

      <Spacer height={Spacing.xl} />

      {error ? (
          <View style={[styles.errorContainer, { backgroundColor: "#FFEBEE", borderColor: "#FFCDD2", borderWidth: 1 }]}>
            <Feather name="alert-circle" size={16} color="#F44336" style={styles.errorIcon} />
            <View style={styles.errorTextContainer}>
              {error.split('\n').map((line, index) => (
                <ThemedText key={index} style={[styles.errorText, { color: "#F44336" }]}>
                  {line}
          </ThemedText>
              ))}
            </View>
        </View>
      ) : null}

      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <ThemedText type="small" style={styles.label}>
              From Date
          </ThemedText>
            <Pressable
              onPress={() => {
                setCalendarMonth(fromDate ? new Date(fromDate) : new Date());
                setShowFromDatePicker(true);
              }}
              style={styles.dateInputWrapper}
            >
            <Feather
              name="calendar"
              size={20}
                color="#FFB380"
              style={styles.inputIcon}
            />
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => handleWebDateChange(e.target.value, true)}
                  style={{
                    flex: 1,
                    height: "100%",
                    fontSize: Typography.body.fontSize,
                    border: "none",
                    outline: "none",
                    backgroundColor: "transparent",
                    color: theme.text,
                  } as any}
                />
              ) : (
            <TextInput
              style={[
                    styles.dateInput,
                {
                      backgroundColor: "#FFFFFF",
                  color: theme.text,
                      borderColor: "#FFE0CC",
                    },
                  ]}
                  value={fromDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textMuted}
                  editable={false}
                />
              )}
            </Pressable>
          </View>
          <View style={styles.dateField}>
            <ThemedText type="small" style={styles.label}>
              To Date
            </ThemedText>
            <Pressable
              onPress={() => {
                setCalendarMonth(toDate ? new Date(toDate) : new Date());
                setShowToDatePicker(true);
              }}
              style={styles.dateInputWrapper}
            >
              <Feather
                name="calendar"
                size={20}
                color="#FFB380"
                style={styles.inputIcon}
              />
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => handleWebDateChange(e.target.value, false)}
                  style={{
                    flex: 1,
                    height: "100%",
                    fontSize: Typography.body.fontSize,
                    border: "none",
                    outline: "none",
                    backgroundColor: "transparent",
                    color: theme.text,
                  } as any}
                />
              ) : (
                <TextInput
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: "#FFFFFF",
                      color: theme.text,
                      borderColor: "#FFE0CC",
                    },
                  ]}
                  value={toDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.textMuted}
                  editable={false}
            />
              )}
            </Pressable>
          </View>
        </View>

        <Spacer height={Spacing.lg} />

        {/* Leave Day Type Selection */}
        <View style={styles.inputContainer}>
          <ThemedText type="small" style={styles.label}>
            Leave Day Type
          </ThemedText>
          <View style={styles.dayTypeContainer}>
            <Pressable
              onPress={() => {
                setLeaveDayType("full_day");
                setError("");
              }}
              style={[
                styles.dayTypeOption,
                {
                  backgroundColor: leaveDayType === "full_day" ? "#FFE8CC" : "#FFFFFF",
                  borderColor: leaveDayType === "full_day" ? "#FFB380" : "#FFE0CC",
                  borderWidth: leaveDayType === "full_day" ? 2 : 1.5,
                },
              ]}
            >
            <Feather
                name={leaveDayType === "full_day" ? "check-circle" : "circle"}
              size={20}
                color={leaveDayType === "full_day" ? "#FFB380" : "#CCCCCC"}
              />
              <ThemedText
                style={[
                  styles.dayTypeText,
                  {
                    color: leaveDayType === "full_day" ? "#424242" : "#757575",
                    fontWeight: leaveDayType === "full_day" ? "600" : "400",
                  },
                ]}
              >
                Full Day
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => {
                setLeaveDayType("first_half");
                setError("");
              }}
              style={[
                styles.dayTypeOption,
                {
                  backgroundColor: leaveDayType === "first_half" ? "#FFE8CC" : "#FFFFFF",
                  borderColor: leaveDayType === "first_half" ? "#FFB380" : "#FFE0CC",
                  borderWidth: leaveDayType === "first_half" ? 2 : 1.5,
                },
              ]}
            >
              <Feather
                name={leaveDayType === "first_half" ? "check-circle" : "circle"}
                size={20}
                color={leaveDayType === "first_half" ? "#FFB380" : "#CCCCCC"}
              />
              <ThemedText
                style={[
                  styles.dayTypeText,
                  {
                    color: leaveDayType === "first_half" ? "#424242" : "#757575",
                    fontWeight: leaveDayType === "first_half" ? "600" : "400",
                  },
                ]}
              >
                First Half Day
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => {
                setLeaveDayType("second_half");
                setError("");
              }}
              style={[
                styles.dayTypeOption,
                {
                  backgroundColor: leaveDayType === "second_half" ? "#FFE8CC" : "#FFFFFF",
                  borderColor: leaveDayType === "second_half" ? "#FFB380" : "#FFE0CC",
                  borderWidth: leaveDayType === "second_half" ? 2 : 1.5,
                },
              ]}
            >
              <Feather
                name={leaveDayType === "second_half" ? "check-circle" : "circle"}
                size={20}
                color={leaveDayType === "second_half" ? "#FFB380" : "#CCCCCC"}
              />
              <ThemedText
                style={[
                  styles.dayTypeText,
                  {
                    color: leaveDayType === "second_half" ? "#424242" : "#757575",
                    fontWeight: leaveDayType === "second_half" ? "600" : "400",
                  },
                ]}
              >
                Second Half Day
              </ThemedText>
            </Pressable>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <View style={styles.inputContainer}>
        <ThemedText type="small" style={styles.label}>
          Reason
        </ThemedText>
        <TextInput
          style={[
            styles.textArea,
            {
                backgroundColor: "#FFFFFF",
              color: theme.text,
                borderColor: "#FFE0CC",
            },
          ]}
          value={reason}
          onChangeText={(text) => {
            setReason(text);
            setError("");
          }}
          placeholder="Enter reason for leave..."
          placeholderTextColor={theme.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <Spacer height={Spacing.xl} />

      <Pressable
        onPress={handleSubmit}
          disabled={isSubmitting}
        style={({ pressed }) => [
            styles.submitButtonContainer,
            { opacity: isSubmitting ? 0.6 : 1 },
        ]}
      >
          {({ pressed }) => (
            <LinearGradient
              colors={
                pressed || isSubmitting
                  ? ["#CC6600", "#E67300", "#CC6600"]
                  : ["#FFB380", "#FFCC99", "#FFB380"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
        <ThemedText style={styles.submitButtonText}>Submit Application</ThemedText>
              )}
            </LinearGradient>
          )}
      </Pressable>

        <Spacer height={Spacing["4xl"]} />
      </ScreenScrollView>

      {/* Calendar Picker Modal - From Date */}
      <Modal
        visible={showFromDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFromDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: "#FFFFFF" }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4" style={{ color: "#424242" }}>Select From Date</ThemedText>
              <Pressable onPress={() => setShowFromDatePicker(false)}>
                <Feather name="x" size={24} color="#424242" />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {renderCalendar(true)}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Calendar Picker Modal - To Date */}
      <Modal
        visible={showToDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowToDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: "#FFFFFF" }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="h4" style={{ color: "#424242" }}>Select To Date</ThemedText>
              <Pressable onPress={() => setShowToDatePicker(false)}>
                <Feather name="x" size={24} color="#424242" />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {renderCalendar(false)}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing["5xl"] * 1.5,
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  leaveTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  leaveTypeInfo: {
    flex: 1,
  },
  leaveTypeLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  leaveTypeValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#424242",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorIcon: {
    marginTop: 2,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  dateField: {
    flex: 1,
  },
  inputContainer: {
    width: "100%",
  },
  dateInputWrapper: {
    position: "relative",
    height: Spacing.inputHeight,
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    borderColor: "#FFE0CC",
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
  textArea: {
    height: 120,
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.body.fontSize,
  },
  dayTypeContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  dayTypeOption: {
    flex: 1,
    minWidth: "30%",
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  dayTypeText: {
    fontSize: 14,
  },
  submitButtonContainer: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#FFB380",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
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
    borderBottomColor: "#FFE0CC",
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
    paddingHorizontal: Spacing.md,
  },
  monthNavButton: {
    padding: Spacing.sm,
  },
  monthTitle: {
    flex: 1,
    alignItems: "center",
  },
  monthTitleText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#424242",
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  weekdayHeader: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#757575",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  calendarDay: {
    width: "13%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  calendarDayText: {
    fontSize: 14,
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: "#FFB380",
  },
  calendarDayPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});
