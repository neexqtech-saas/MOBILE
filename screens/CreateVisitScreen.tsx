import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator, ScrollView, Modal, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { apiService } from "@/services/api";
import Spacer from "@/components/Spacer";
import * as Haptics from "expo-haptics";

type CreateVisitScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "CreateVisit"
>;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

export default function CreateVisitScreen() {
  const navigation = useNavigation<CreateVisitScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [pickerHour, setPickerHour] = useState("09");
  const [pickerMinute, setPickerMinute] = useState("00");

  // Set today's date and current time as default
  React.useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setScheduleDate(`${year}-${month}-${day}`);
    
    // Set current time
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    setScheduleTime(`${hours}:${minutes}:${seconds}`);
    setPickerHour(hours);
    setPickerMinute(minutes);
  }, []);

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return "";
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const formatDisplayTime = (timeStr: string): string => {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
  };

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const navigateMonth = (direction: number) => {
    const newDate = new Date(calendarMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCalendarMonth(newDate);
  };

  const openDatePicker = () => {
    setShowTimePicker(false);
    setCalendarMonth(scheduleDate ? new Date(scheduleDate) : new Date());
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    setShowDatePicker(false);
    const parts = scheduleTime.split(":");
    if (parts.length >= 2) {
      setPickerHour(parts[0].padStart(2, "0"));
      setPickerMinute(parts[1].padStart(2, "0"));
    }
    setShowTimePicker(true);
  };

  const handleDateSelect = (day: number) => {
    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setScheduleDate(dateStr);
    setShowDatePicker(false);
    setError("");
  };

  const confirmTimeSelection = () => {
    setScheduleTime(`${pickerHour}:${pickerMinute}:00`);
    setShowTimePicker(false);
    setError("");
  };

  const renderCalendarDay = (day: number | null, index: number) => {
    if (!day) {
      return <View key={`empty-${index}`} style={styles.calendarDay} />;
    }

    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const isSelected = scheduleDate === dateStr;
    const isToday =
      new Date().getDate() === day &&
      new Date().getMonth() === calendarMonth.getMonth() &&
      new Date().getFullYear() === calendarMonth.getFullYear();

    return (
      <Pressable
        key={day}
        onPress={() => handleDateSelect(day)}
        style={({ pressed }) => [
          styles.calendarDay,
          {
            backgroundColor: isSelected ? Colors.dark.primary : "transparent",
            borderColor: isSelected || isToday ? Colors.dark.primary : "transparent",
            borderWidth: isSelected || isToday ? 2 : 0,
          },
          pressed && styles.calendarDayPressed,
        ]}
      >
        <ThemedText
          style={[
            styles.calendarDayText,
            {
              color: isSelected ? "#FFFFFF" : theme.text,
              fontWeight: isSelected || isToday ? "600" : "400",
            },
          ]}
        >
          {day}
        </ThemedText>
      </Pressable>
    );
  };

  const renderCalendar = () => {
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
        <View style={styles.calendarHeader}>
          <Pressable onPress={() => navigateMonth(-1)} style={styles.monthNavButton}>
            <Feather name="chevron-left" size={24} color={Colors.dark.primary} />
          </Pressable>
          <ThemedText style={styles.monthTitleText}>
            {MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
          </ThemedText>
          <Pressable onPress={() => navigateMonth(1)} style={styles.monthNavButton}>
            <Feather name="chevron-right" size={24} color={Colors.dark.primary} />
          </Pressable>
        </View>
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((day) => (
            <View key={day} style={styles.weekdayHeader}>
              <ThemedText style={styles.weekdayText}>{day}</ThemedText>
            </View>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {days.map((day, index) => renderCalendarDay(day, index))}
        </View>
      </View>
    );
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setError("");

    // Validation with specific error messages
    if (!title.trim()) {
      const errorMsg = "Please enter visit title";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (title.trim().length < 3) {
      const errorMsg = "Visit title must be at least 3 characters";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!scheduleDate.trim()) {
      const errorMsg = "Please select schedule date";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    // Schedule time is optional - removed validation
    if (!clientName.trim()) {
      const errorMsg = "Please enter client name";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!address.trim()) {
      const errorMsg = "Please enter address";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!city.trim()) {
      const errorMsg = "Please enter city";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!state.trim()) {
      const errorMsg = "Please enter state";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!pincode.trim()) {
      const errorMsg = "Please enter pincode";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      const errorMsg = "Pincode must be 6 digits";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!contactPerson.trim()) {
      const errorMsg = "Please enter contact person name";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!contactPhone.trim()) {
      const errorMsg = "Please enter contact phone number";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!/^\d{10}$/.test(contactPhone.trim())) {
      const errorMsg = "Phone number must be 10 digits";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(scheduleDate)) {
      const errorMsg = "Date must be in YYYY-MM-DD format (e.g., 2025-12-20)";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Validate time format only if provided (schedule_time is optional)
    if (scheduleTime.trim()) {
      const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
      if (!timeRegex.test(scheduleTime)) {
        const errorMsg = "Time must be in HH:MM:SS format (e.g., 14:00:00)";
        setError(errorMsg);
        Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    }

    // Validate email if provided
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      const errorMsg = "Please enter a valid email address";
      setError(errorMsg);
      Alert.alert("Validation Error", errorMsg, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const adminId = employee.adminId;
      const userId = employee.id;

      if (!adminId || !userId) {
        setError("User ID or Site ID not found. Please login again.");
        setIsSubmitting(false);
        Alert.alert("Error", "User ID or Site ID not found. Please login again.", [{ text: "OK" }]);
        return;
      }

      // Get GPS location for auto check-in
      let latitude: number | undefined = undefined;
      let longitude: number | undefined = undefined;
      
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          latitude = parseFloat(location.coords.latitude.toFixed(6));
          longitude = parseFloat(location.coords.longitude.toFixed(6));
        }
      } catch (locationError) {
        console.log('Location permission denied or error:', locationError);
        // Continue without location - backend will handle it
      }

      const visitData: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        schedule_date: scheduleDate,
        client_name: clientName.trim(),
        location_name: locationName.trim() || undefined,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        country: country.trim() || "India",
        contact_person: contactPerson.trim(),
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim() || undefined,
      };

      // Schedule time is always set (current time)
      visitData.schedule_time = scheduleTime;

      // Add GPS coordinates for auto check-in
      if (latitude !== undefined && longitude !== undefined) {
        visitData.latitude = latitude;
        visitData.longitude = longitude;
        visitData.check_in_note = "Auto check-in on visit creation";
      }

      const response = await apiService.createVisit(adminId, userId, visitData);

      if (response.status === 200 || response.status === 201) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Navigate back immediately after success
        navigation.goBack();
      } else {
        // Handle different error status codes
        let errorMessage = "Failed to create visit. Please try again.";
        
        if (response.status === 400) {
          errorMessage = response.message || "Invalid data. Please check all fields and try again.";
        } else if (response.status === 401) {
          errorMessage = "Session expired. Please login again.";
        } else if (response.status === 403) {
          errorMessage = "You don't have permission to create visits.";
        } else if (response.status === 404) {
          errorMessage = "Resource not found. Please contact support.";
        } else if (response.status === 422) {
          errorMessage = response.message || "Validation error. Please check your input.";
        } else if (response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (response.message) {
          errorMessage = response.message;
        }
        
        setError(errorMessage);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", errorMessage, [{ text: "OK" }]);
      }
    } catch (error: any) {
      console.error("❌ Error creating visit:", error);
      let errorMessage = "Failed to create visit. Please try again.";
      
      // Handle network errors
      if (error?.message) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Cannot connect to server. Please check your internet connection.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <ScreenScrollView>
      <View style={styles.container}>
        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: Colors.dark.error + "20" }]}>
            <ThemedText style={{ color: Colors.dark.error }}>{error}</ThemedText>
          </View>
        ) : null}

        <Spacer height={Spacing.md} />

        {/* Title */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Visit Title *
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            placeholder="Enter visit title"
            placeholderTextColor={theme.textMuted}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setError("");
            }}
          />
        </View>

        <Spacer height={Spacing.lg} />

        {/* Description */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Description
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }
            ]}
            placeholder="Enter description (optional)"
            placeholderTextColor={theme.textMuted}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              setError("");
            }}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <Spacer height={Spacing.lg} />

        {/* Schedule Date */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Schedule Date *
          </ThemedText>
          <Pressable
            onPress={openDatePicker}
            style={({ pressed }) => [
              styles.pickerInputWrapper,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Feather name="calendar" size={20} color={Colors.dark.primary} />
            <ThemedText style={{ flex: 1, color: scheduleDate ? theme.text : theme.textMuted }}>
              {scheduleDate ? formatDisplayDate(scheduleDate) : "Select date"}
            </ThemedText>
            <Feather name="chevron-down" size={20} color={theme.textMuted} />
          </Pressable>
        </View>

        <Spacer height={Spacing.lg} />

        {/* Schedule Time */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Schedule Time *
          </ThemedText>
          <Pressable
            onPress={openTimePicker}
            style={({ pressed }) => [
              styles.pickerInputWrapper,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.border,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Feather name="clock" size={20} color={Colors.dark.primary} />
            <ThemedText style={{ flex: 1, color: scheduleTime ? theme.text : theme.textMuted }}>
              {scheduleTime ? formatDisplayTime(scheduleTime) : "Select time"}
            </ThemedText>
            <Feather name="chevron-down" size={20} color={theme.textMuted} />
          </Pressable>
        </View>

        <Spacer height={Spacing.lg} />

        {/* Client Name */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Client Name *
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            placeholder="Enter client name"
            placeholderTextColor={theme.textMuted}
            value={clientName}
            onChangeText={(text) => {
              setClientName(text);
              setError("");
            }}
          />
        </View>

        <Spacer height={Spacing.lg} />

        {/* Location Name */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Location Name
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            placeholder="Enter location name (optional)"
            placeholderTextColor={theme.textMuted}
            value={locationName}
            onChangeText={(text) => {
              setLocationName(text);
              setError("");
            }}
          />
        </View>

        <Spacer height={Spacing.lg} />

        {/* Address */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Address *
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }
            ]}
            placeholder="Enter full address"
            placeholderTextColor={theme.textMuted}
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              setError("");
            }}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>

        <Spacer height={Spacing.lg} />

        {/* City, State, Pincode Row */}
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
              City *
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
              placeholder="City"
              placeholderTextColor={theme.textMuted}
              value={city}
              onChangeText={(text) => {
                setCity(text);
                setError("");
              }}
            />
          </View>
          <View style={styles.halfWidth}>
            <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
              State *
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
              placeholder="State"
              placeholderTextColor={theme.textMuted}
              value={state}
              onChangeText={(text) => {
                setState(text);
                setError("");
              }}
            />
          </View>
        </View>

        <Spacer height={Spacing.lg} />

        {/* Pincode and Country */}
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
              Pincode *
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
              placeholder="110001"
              placeholderTextColor={theme.textMuted}
              value={pincode}
              onChangeText={(text) => {
                setPincode(text.replace(/[^0-9]/g, "").slice(0, 6));
                setError("");
              }}
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
          <View style={styles.halfWidth}>
            <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
              Country *
            </ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
              placeholder="India"
              placeholderTextColor={theme.textMuted}
              value={country}
              onChangeText={(text) => {
                setCountry(text);
                setError("");
              }}
            />
          </View>
        </View>

        <Spacer height={Spacing.lg} />

        {/* Contact Person */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Contact Person *
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            placeholder="Enter contact person name"
            placeholderTextColor={theme.textMuted}
            value={contactPerson}
            onChangeText={(text) => {
              setContactPerson(text);
              setError("");
            }}
          />
        </View>

        <Spacer height={Spacing.lg} />

        {/* Contact Phone */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Contact Phone * (10 digits)
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            placeholder="9876543210"
            placeholderTextColor={theme.textMuted}
            value={contactPhone}
            onChangeText={(text) => {
              setContactPhone(text.replace(/[^0-9]/g, "").slice(0, 10));
              setError("");
            }}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        <Spacer height={Spacing.lg} />

        {/* Contact Email */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Contact Email
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
            placeholder="email@example.com (optional)"
            placeholderTextColor={theme.textMuted}
            value={contactEmail}
            onChangeText={(text) => {
              setContactEmail(text);
              setError("");
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Spacer height={Spacing["2xl"]} />

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.submitButton,
            { 
              backgroundColor: Colors.dark.primary,
              opacity: pressed || isSubmitting ? 0.9 : 1 
            }
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <>
              <Feather name="check" size={20} color="#000000" />
              <ThemedText style={{ color: "#000000", fontWeight: "600", marginLeft: Spacing.sm }}>
                Create Visit
              </ThemedText>
            </>
          )}
        </Pressable>

        <Spacer height={Spacing["2xl"]} />
      </View>
    </ScreenScrollView>

      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Select Schedule Date</ThemedText>
              <Pressable onPress={() => setShowDatePicker(false)}>
                <Feather name="x" size={24} color={theme.textMuted} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalBodyContent}>
              {renderCalendar()}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTimePicker(false)}>
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <ThemedText type="h4">Select Schedule Time</ThemedText>
              <Pressable onPress={() => setShowTimePicker(false)}>
                <Feather name="x" size={24} color={theme.textMuted} />
              </Pressable>
            </View>
            <View style={styles.timePickerRow}>
              <View style={styles.timeColumn}>
                <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.sm }}>
                  Hour
                </ThemedText>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {HOUR_OPTIONS.map((hour) => (
                    <Pressable
                      key={hour}
                      onPress={() => setPickerHour(hour)}
                      style={[
                        styles.timeOption,
                        pickerHour === hour && { backgroundColor: Colors.dark.primary },
                      ]}
                    >
                      <ThemedText style={{ color: pickerHour === hour ? "#FFFFFF" : theme.text }}>
                        {hour}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <ThemedText style={styles.timeColon}>:</ThemedText>
              <View style={styles.timeColumn}>
                <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.sm }}>
                  Minute
                </ThemedText>
                <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={false}>
                  {MINUTE_OPTIONS.map((minute) => (
                    <Pressable
                      key={minute}
                      onPress={() => setPickerMinute(minute)}
                      style={[
                        styles.timeOption,
                        pickerMinute === minute && { backgroundColor: Colors.dark.primary },
                      ]}
                    >
                      <ThemedText style={{ color: pickerMinute === minute ? "#FFFFFF" : theme.text }}>
                        {minute}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
            <Pressable
              onPress={confirmTimeSelection}
              style={[styles.timeConfirmButton, { backgroundColor: Colors.dark.primary }]}
            >
              <ThemedText style={{ color: "#000000", fontWeight: "600" }}>Done</ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  errorContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  pickerInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    maxHeight: "85%",
    paddingBottom: Spacing.xl,
    ...Platform.select({
      android: { elevation: 8 },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  modalBodyContent: {
    padding: Spacing.lg,
  },
  calendarContainer: {
    width: "100%",
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  monthNavButton: {
    padding: Spacing.sm,
  },
  monthTitleText: {
    fontSize: 18,
    fontWeight: "600",
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  weekdayHeader: {
    flex: 1,
    alignItems: "center",
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.7,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.285714%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
  },
  calendarDayPressed: {
    opacity: 0.8,
  },
  calendarDayText: {
    fontSize: 16,
  },
  timePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  timeColumn: {
    flex: 1,
    maxHeight: 220,
  },
  timeScroll: {
    maxHeight: 180,
  },
  timeOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  timeColon: {
    fontSize: 28,
    fontWeight: "700",
    marginTop: Spacing.xl,
  },
  timeConfirmButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: "center",
  },
});

