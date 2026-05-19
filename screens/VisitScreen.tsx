import React, { useState, useCallback, useMemo } from "react";
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
import * as Location from "expo-location";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { apiService, VisitAPI } from "@/services/api";
import Spacer from "@/components/Spacer";
import * as Haptics from "expo-haptics";
import { getCurrentMonthDates } from "@/utils/dateHelpers";

type VisitScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "Visits"
>;

export default function VisitScreen() {
  const navigation = useNavigation<VisitScreenNavigationProp>();
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
      countFs: compact ? 22 : 28,
      metaFs: compact ? 11 : 12,
      filterFs: compact ? 10 : 11,
      filterPadV: compact ? 5 : 7,
      filterMinH: compact ? 30 : 34,
      createMinH: compact ? 42 : 46,
      iconSm: compact ? 11 : 12,
      iconMd: compact ? 14 : 15,
      actionPadV: compact ? 8 : 10,
      actionFs: compact ? 12 : 13,
    };
  }, [width]);

  const [visits, setVisits] = useState<VisitAPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [error, setError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [checkingOut, setCheckingOut] = useState<number | null>(null);

  const fetchVisits = async () => {
    const adminId = employee.adminId;
    const userId = employee.id;

    if (!adminId || !userId) {
      const errorMsg = "Unable to load visits. Please login again.";
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
      const response = await apiService.getVisits(adminId, userId, from, to);
      if (response.status === 200 && response.data) {
        // Handle both paginated response (with results) and direct array response
        const visitsList = Array.isArray(response.data) 
          ? response.data 
          : (response.data.results || []);
        setVisits(visitsList);
        setError(null);
      } else {
        let errorMsg = response.message || "Failed to load visits. Please try again.";
        
        if (response.status === 401) {
          errorMsg = "Session expired. Please login again.";
        } else if (response.status === 403) {
          errorMsg = "You don't have permission to view visits.";
        } else if (response.status === 404) {
          errorMsg = "Visits not found.";
        } else if (response.status === 500) {
          errorMsg = "Server error. Please try again later.";
        }
        
        setError(errorMsg);
        if (!isRefreshing) {
          Alert.alert("Error", errorMsg, [{ text: "OK" }]);
        }
      }
    } catch (error: any) {
      console.error('❌ Error fetching visits:', error);
      let errorMessage = "Failed to load visits. Please check your internet connection and try again.";
      
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

  // Fetch visits when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchVisits();
    }, [employee.adminId, employee.id])
  );

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

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchVisits();
  };

  // Filter visits based on selected filter
  const filteredVisits = visits.filter((visit) => {
    if (filter === 'all') return true;
    // Map 'pending' to 'scheduled' for display purposes
    if (filter === 'scheduled' && visit.status === 'pending') return true;
    return visit.status === filter;
  });

  const handleCheckIn = async (visitId: number) => {
    const adminId = employee.adminId;
    const userId = employee.id;

    if (!adminId || !userId) {
      Alert.alert("Error", "User information not found. Please login again.");
      return;
    }

    // Request location permission
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "Permission Denied",
          "Location permission is required for check-in. Please enable it in settings.",
          [{ text: "OK" }]
        );
        return;
      }

      setCheckingIn(visitId);
      const location = await Location.getCurrentPositionAsync({});
      
      // Round to 6 decimal places as required by backend
      const latitude = parseFloat(location.coords.latitude.toFixed(6));
      const longitude = parseFloat(location.coords.longitude.toFixed(6));
      
      const response = await apiService.visitCheckIn(adminId, userId, visitId, {
        latitude: latitude,
        longitude: longitude,
        note: "Visit check-in",
      });

      if (response.status === 200 || response.status === 201) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Visit check-in successful!", [{ text: "OK" }]);
        fetchVisits(); // Refresh list
      } else {
        const errorMsg = response.message || "Failed to check-in. Please try again.";
        Alert.alert("Error", errorMsg, [{ text: "OK" }]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error: any) {
      console.error("❌ Error checking in:", error);
      let errorMessage = "Failed to check-in. Please try again.";
      
      if (error?.message) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your internet connection.";
        } else if (error.message.includes('location')) {
          errorMessage = "Unable to get your location. Please enable location services.";
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setCheckingIn(null);
    }
  };

  const handleCheckOut = async (visitId: number) => {
    const adminId = employee.adminId;
    const userId = employee.id;

    if (!adminId || !userId) {
      Alert.alert("Error", "User information not found. Please login again.");
      return;
    }

    // Request location permission
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "Permission Denied",
          "Location permission is required for check-out. Please enable it in settings.",
          [{ text: "OK" }]
        );
        return;
      }

      setCheckingOut(visitId);
      const location = await Location.getCurrentPositionAsync({});
      
      // Round to 6 decimal places as required by backend
      const latitude = parseFloat(location.coords.latitude.toFixed(6));
      const longitude = parseFloat(location.coords.longitude.toFixed(6));
      
      const response = await apiService.visitCheckOut(adminId, userId, visitId, {
        latitude: latitude,
        longitude: longitude,
        note: "Visit check-out",
      });

      if (response.status === 200 || response.status === 201) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Visit check-out successful!", [{ text: "OK" }]);
        fetchVisits(); // Refresh list
      } else {
        // Handle validation errors from backend
        let errorMsg = response.message || "Failed to check-out. Please try again.";
        
        if (response.status === 400 && response.data) {
          // Extract validation error messages
          const validationErrors: string[] = [];
          Object.keys(response.data).forEach((key) => {
            if (Array.isArray(response.data[key])) {
              validationErrors.push(...response.data[key]);
            } else {
              validationErrors.push(response.data[key]);
            }
          });
          if (validationErrors.length > 0) {
            errorMsg = validationErrors.join('\n');
          }
        }
        
        Alert.alert("Error", errorMsg, [{ text: "OK" }]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error: any) {
      console.error("❌ Error checking out:", error);
      let errorMessage = "Failed to check-out. Please try again.";
      
      if (error?.message) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your internet connection.";
        } else if (error.message.includes('location')) {
          errorMessage = "Unable to get your location. Please enable location services.";
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setCheckingOut(null);
    }
  };

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
          onPress={() => navigation.navigate("CreateVisit")}
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
              Create Visit
            </ThemedText>
          </View>
        </Pressable>

        <Spacer height={layout.sectionGap} />

        {/* Filter Buttons */}
        {!isLoading && visits.length > 0 && (
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
                  color: filter === 'all' ? '#FFFFFF' : theme.text,
                  fontWeight: filter === 'all' ? '700' : '600',
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
                  color: filter === 'pending' ? '#FFFFFF' : theme.text,
                  fontWeight: filter === 'pending' ? '700' : '600',
                  fontSize: layout.filterFs,
                }}
              >
                Pending
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setFilter('in_progress')}
              style={({ pressed }) => [
                styles.filterButton,
                {
                  minHeight: layout.filterMinH,
                  paddingVertical: layout.filterPadV,
                  backgroundColor: filter === 'in_progress' ? Colors.dark.primary : theme.backgroundDefault,
                  borderColor: filter === 'in_progress' ? Colors.dark.primary : theme.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <ThemedText
                style={{
                  color: filter === 'in_progress' ? '#FFFFFF' : theme.text,
                  fontWeight: filter === 'in_progress' ? '700' : '600',
                  fontSize: layout.filterFs,
                }}
              >
                {layout.compact ? "Active" : "In Progress"}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setFilter('completed')}
              style={({ pressed }) => [
                styles.filterButton,
                {
                  minHeight: layout.filterMinH,
                  paddingVertical: layout.filterPadV,
                  backgroundColor: filter === 'completed' ? Colors.dark.primary : theme.backgroundDefault,
                  borderColor: filter === 'completed' ? Colors.dark.primary : theme.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <ThemedText
                style={{
                  color: filter === 'completed' ? '#FFFFFF' : theme.text,
                  fontWeight: filter === 'completed' ? '700' : '600',
                  fontSize: layout.filterFs,
                }}
              >
                {layout.compact ? "Done" : "Completed"}
              </ThemedText>
            </Pressable>
          </View>
        )}

        {/* Date Range Label */}
        <View style={{ marginBottom: Spacing.xs, marginTop: Spacing.xs }}>
          <ThemedText type="small" style={{ color: theme.textMuted, fontSize: layout.metaFs, fontWeight: "500" }}>
            Showing visits for this month
          </ThemedText>
        </View>

        <Spacer height={layout.sectionGap} />

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
                  <Feather name="map-pin" size={layout.iconMd} color={Colors.dark.primary} />
                </View>
                <ThemedText type="small" style={[styles.countLabel, { fontSize: layout.metaFs, color: theme.textMuted }]}>
                  {filter === "all"
                    ? "Total"
                    : filter === "pending"
                      ? "Pending"
                      : filter === "scheduled"
                        ? "Sched."
                        : filter === "in_progress"
                          ? layout.compact
                            ? "Active"
                            : "In progress"
                          : layout.compact
                            ? "Done"
                            : "Completed"}
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
                {filteredVisits.length}
              </ThemedText>
            </View>
          </View>
        )}

        <Spacer height={layout.sectionGap} />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingIconContainer}>
              <ActivityIndicator size="large" color={Colors.dark.primary} />
            </View>
            <ThemedText style={[styles.loadingText, { fontSize: layout.metaFs, color: theme.textMuted }]}>
              Loading visits...
            </ThemedText>
          </View>
        ) : error && visits.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: theme.border, backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="alert-circle" size={layout.compact ? 40 : 48} color={Colors.dark.error} />
            </View>
            <ThemedText style={[styles.emptyTitle, { fontSize: layout.compact ? 15 : 16, color: theme.text }]}>Error</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { fontSize: layout.metaFs, color: theme.textMuted }]}>
              {error}
            </ThemedText>
            <Pressable
              onPress={fetchVisits}
              style={styles.retryButtonLarge}
            >
              <ThemedText style={styles.retryButtonText}>
                Retry
              </ThemedText>
            </Pressable>
          </View>
        ) : filteredVisits.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: theme.border, backgroundColor: theme.backgroundDefault }]}>
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="map-pin" size={layout.compact ? 40 : 48} color={theme.textMuted} />
            </View>
            <ThemedText style={[styles.emptyTitle, { fontSize: layout.compact ? 15 : 16, color: theme.text }]}>
              {visits.length === 0
                ? "No Visits Yet"
                : `No ${filter === 'all' ? '' : filter.replace('_', ' ')} Visits`}
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { fontSize: layout.metaFs, color: theme.textMuted }]}>
              {visits.length === 0
                ? "Create your first visit to get started"
                : "Try selecting a different filter"}
            </ThemedText>
          </View>
        ) : (
          <View style={[styles.visitsList, { gap: layout.sectionGap }]}>
            {filteredVisits.map((visit) => {
              const canCheckIn = (visit.status === 'scheduled' || visit.status === 'pending') && !visit.check_in_timestamp;
              const canCheckOut = visit.status === 'in_progress' && visit.check_in_timestamp && !visit.check_out_timestamp;
              
              return (
                <View
                  key={visit.id}
                  style={[
                    styles.visitCard,
                    {
                      padding: layout.cardPad,
                      borderRadius: layout.cardRadius,
                      borderColor: theme.border,
                      backgroundColor: theme.cardBackground,
                    },
                  ]}
                >
                  <View style={styles.visitHeader}>
                    <View style={styles.visitTitleContainer}>
                      <ThemedText
                        numberOfLines={2}
                        style={[styles.visitTitle, { fontSize: layout.titleFs, color: theme.text }]}
                      >
                        {visit.title}
                      </ThemedText>
                      <View style={[styles.dateTimeRow, { marginTop: 2 }]}>
                        <Feather name="calendar" size={layout.iconSm} color={theme.textMuted} />
                        <ThemedText style={[styles.dateTimeText, { fontSize: layout.metaFs, color: theme.textMuted }]}>
                          {formatDate(visit.schedule_date)} · {formatTime(visit.schedule_time)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {visit.description && (
                    <View style={[styles.visitDescription, { borderTopColor: theme.border }]}>
                      <ThemedText
                        numberOfLines={3}
                        style={{ color: theme.textMuted, lineHeight: layout.metaFs + 4, fontSize: layout.metaFs }}
                      >
                        {visit.description}
                      </ThemedText>
                    </View>
                  )}

                  <View style={[styles.clientInfo, { borderTopColor: theme.border }]}>
                    <View style={styles.clientRow}>
                      <View style={[styles.clientIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
                        <Feather name="user" size={layout.iconMd} color={Colors.dark.primary} />
                      </View>
                      <ThemedText style={[styles.clientName, { fontSize: layout.metaFs + 0.5, color: theme.text }]}>
                        {visit.client_name}
                      </ThemedText>
                    </View>
                    {visit.contact_person && (
                      <View style={styles.clientRow}>
                        <View style={[styles.clientIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
                          <Feather name="phone" size={layout.iconMd} color={theme.textMuted} />
                        </View>
                        <ThemedText style={[styles.clientContact, { fontSize: layout.metaFs, color: theme.textMuted }]}>
                          {visit.contact_person} - {visit.contact_phone}
                        </ThemedText>
                      </View>
                    )}
                    <View style={styles.clientRow}>
                      <View style={[styles.clientIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
                        <Feather name="map-pin" size={layout.iconMd} color={theme.textMuted} />
                      </View>
                      <ThemedText style={[styles.clientAddress, { fontSize: layout.metaFs, color: theme.textMuted }]}>
                        {visit.address}, {visit.city}, {visit.state} - {visit.pincode}
                      </ThemedText>
                    </View>
                  </View>

                  {visit.status && (
                    <View style={[styles.statusRow, { borderTopColor: theme.border }]}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                            visit.status === "completed"
                              ? Colors.dark.success + "15"
                              : visit.status === "in_progress"
                              ? Colors.dark.primary + "15"
                              : visit.status === "cancelled"
                              ? Colors.dark.error + "15"
                              : visit.status === "pending"
                              ? Colors.dark.warning + "15"
                              : Colors.dark.warning + "15",
                            borderColor:
                              visit.status === "completed"
                                ? Colors.dark.success + "40"
                                : visit.status === "in_progress"
                                ? Colors.dark.primary + "40"
                                : visit.status === "cancelled"
                                ? Colors.dark.error + "40"
                                : visit.status === "pending"
                                ? Colors.dark.warning + "40"
                                : Colors.dark.warning + "40",
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                visit.status === "completed"
                                  ? Colors.dark.success
                                  : visit.status === "in_progress"
                                  ? Colors.dark.primary
                                  : visit.status === "cancelled"
                                  ? Colors.dark.error
                                  : visit.status === "pending"
                                  ? Colors.dark.warning
                                  : Colors.dark.warning,
                            },
                          ]}
                        />
                        <ThemedText
                          style={[
                            styles.statusText,
                            {
                              fontSize: layout.metaFs,
                              color:
                              visit.status === "completed"
                                ? Colors.dark.success
                                : visit.status === "in_progress"
                                ? Colors.dark.primary
                                : visit.status === "cancelled"
                                ? Colors.dark.error
                                : visit.status === "pending"
                                ? Colors.dark.warning
                                : Colors.dark.warning,
                            },
                          ]}
                        >
                          {visit.status.replace('_', ' ').charAt(0).toUpperCase() + visit.status.replace('_', ' ').slice(1)}
                        </ThemedText>
                      </View>
                    </View>
                  )}

                  <View style={[styles.actionButtons, { borderTopColor: theme.border }]}>
                    {canCheckIn && (
                      <Pressable
                        onPress={() => handleCheckIn(visit.id)}
                        disabled={checkingIn === visit.id}
                        style={({ pressed }) => [
                          styles.actionButton,
                          styles.checkInButton,
                          { paddingVertical: layout.actionPadV, opacity: pressed || checkingIn === visit.id ? 0.9 : 1 },
                          pressed && styles.actionButtonPressed,
                        ]}
                      >
                        {checkingIn === visit.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Feather name="log-in" size={layout.iconMd} color="#FFFFFF" />
                            <ThemedText style={[styles.checkInButtonText, { fontSize: layout.actionFs }]}>
                              Check In
                            </ThemedText>
                          </>
                        )}
                      </Pressable>
                    )}
                    {canCheckOut && (
                      <Pressable
                        onPress={() => handleCheckOut(visit.id)}
                        disabled={checkingOut === visit.id}
                        style={({ pressed }) => [
                          styles.actionButton,
                          styles.checkOutButton,
                          { paddingVertical: layout.actionPadV, opacity: pressed || checkingOut === visit.id ? 0.9 : 1 },
                          pressed && styles.actionButtonPressed,
                        ]}
                      >
                        {checkingOut === visit.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Feather name="log-out" size={layout.iconMd} color="#FFFFFF" />
                            <ThemedText style={[styles.checkOutButtonText, { fontSize: layout.actionFs }]}>
                              Check Out
                            </ThemedText>
                          </>
                        )}
                      </Pressable>
                    )}
                    {visit.check_in_timestamp && (
                      <View style={styles.timeInfo}>
                        <Feather name="clock" size={layout.iconSm} color={theme.textMuted} />
                        <ThemedText style={{ color: theme.textMuted, marginLeft: 4, fontSize: layout.metaFs }}>
                          In {new Date(visit.check_in_timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </ThemedText>
                      </View>
                    )}
                    {visit.check_out_timestamp && (
                      <View style={styles.timeInfo}>
                        <Feather name="check" size={layout.iconSm} color={Colors.dark.success} />
                        <ThemedText style={{ color: Colors.dark.success, marginLeft: 4, fontSize: layout.metaFs }}>
                          Out {new Date(visit.check_out_timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </ThemedText>
                      </View>
                    )}
                  </View>
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
  visitsList: {},
  visitCard: {
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
  visitHeader: {
    marginBottom: 4,
  },
  visitTitleContainer: {
    flex: 1,
  },
  visitTitle: {
    fontWeight: "600",
    letterSpacing: -0.15,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateTimeText: {
    fontWeight: "500",
  },
  visitDescription: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  clientInfo: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  clientIconContainer: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  clientName: {
    fontWeight: "600",
    flex: 1,
  },
  clientContact: {
    flex: 1,
  },
  clientAddress: {
    flex: 1,
    lineHeight: 16,
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
  actionButtons: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  actionButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  checkInButton: {
    backgroundColor: Colors.dark.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.dark.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  checkInButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.15,
  },
  checkOutButton: {
    backgroundColor: Colors.dark.success,
    ...Platform.select({
      ios: {
        shadowColor: Colors.dark.success,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  checkOutButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.15,
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    paddingTop: 2,
    gap: 4,
  },
});

