import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator, ScrollView } from "react-native";
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

  // Set today's date and current time as default (uneditable for employees)
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
  }, []);

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
      const siteId = employee.siteId;
      const userId = employee.id;

      if (!siteId || !userId) {
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

      const response = await apiService.createVisit(siteId, userId, visitData);

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

        {/* Schedule Date - Uneditable (Today's Date) */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Schedule Date *
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: "#F5F5F5", color: theme.textMuted, borderColor: theme.border, opacity: 0.7 }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.textMuted}
            value={scheduleDate}
            editable={false}
            pointerEvents="none"
          />
        </View>

        <Spacer height={Spacing.lg} />

        {/* Schedule Time - Uneditable (Current Time) */}
        <View>
          <ThemedText type="small" style={{ color: theme.textMuted, marginBottom: Spacing.xs }}>
            Schedule Time *
          </ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: "#F5F5F5", color: theme.textMuted, borderColor: theme.border, opacity: 0.7 }]}
            placeholder="HH:MM:SS"
            placeholderTextColor={theme.textMuted}
            value={scheduleTime}
            editable={false}
            pointerEvents="none"
          />
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
});

