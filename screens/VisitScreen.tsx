import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Alert } from "react-native";
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

type VisitScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  "Visits"
>;

export default function VisitScreen() {
  const navigation = useNavigation<VisitScreenNavigationProp>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();

  const [visits, setVisits] = useState<VisitAPI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [error, setError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [checkingOut, setCheckingOut] = useState<number | null>(null);

  const fetchVisits = async () => {
    const siteId = employee.siteId;
    const userId = employee.id;

    if (!siteId || !userId) {
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
      const response = await apiService.getVisits(siteId, userId);
      if (response.status === 200 && response.data) {
        // Handle paginated response with results array
        const visitsList = response.data.results || [];
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
    const siteId = employee.siteId;
    const userId = employee.id;

    if (!siteId || !userId) {
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
      
      const response = await apiService.visitCheckIn(siteId, userId, visitId, {
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
    const siteId = employee.siteId;
    const userId = employee.id;

    if (!siteId || !userId) {
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
      
      const response = await apiService.visitCheckOut(siteId, userId, visitId, {
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
      <View style={styles.container}>
        <Pressable
          onPress={() => navigation.navigate("CreateVisit")}
          style={({ pressed }) => [
            styles.createButton,
            { 
              backgroundColor: Colors.dark.primary,
              opacity: pressed ? 0.9 : 1,
              shadowColor: Colors.dark.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }
          ]}
        >
          <View style={styles.createButtonIcon}>
            <Feather name="plus" size={20} color="#000000" />
          </View>
          <ThemedText style={{ color: "#000000", fontWeight: "700", fontSize: 16, letterSpacing: 0.5 }}>
            Create Visit
          </ThemedText>
        </Pressable>

        <Spacer height={Spacing.lg} />

        {/* Filter Buttons */}
        {!isLoading && visits.length > 0 && (
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
              onPress={() => setFilter('in_progress')}
              style={({ pressed }) => [
                styles.filterButton,
                {
                  backgroundColor: filter === 'in_progress' ? Colors.dark.primary : theme.backgroundDefault,
                  borderColor: filter === 'in_progress' ? Colors.dark.primary : theme.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <ThemedText
                style={{
                  color: filter === 'in_progress' ? '#000000' : theme.text,
                  fontWeight: filter === 'in_progress' ? '700' : '500',
                  fontSize: 13,
                }}
              >
                In Progress
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setFilter('completed')}
              style={({ pressed }) => [
                styles.filterButton,
                {
                  backgroundColor: filter === 'completed' ? Colors.dark.primary : theme.backgroundDefault,
                  borderColor: filter === 'completed' ? Colors.dark.primary : theme.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <ThemedText
                style={{
                  color: filter === 'completed' ? '#000000' : theme.text,
                  fontWeight: filter === 'completed' ? '700' : '500',
                  fontSize: 13,
                }}
              >
                Completed
              </ThemedText>
            </Pressable>
          </View>
        )}

        <Spacer height={Spacing.lg} />

        {/* Visits Count */}
        {!isLoading && (
          <View style={[
            styles.countCard, 
            { 
              backgroundColor: theme.backgroundDefault,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }
          ]}>
            <View style={styles.countCardHeader}>
              <Feather 
                name="map-pin" 
                size={20} 
                color={theme.textMuted} 
              />
              <ThemedText type="small" style={{ color: theme.textMuted, marginLeft: Spacing.xs }}>
                {filter === 'all' ? 'Total Visits' : filter === 'pending' ? 'Pending' : filter === 'scheduled' ? 'Scheduled' : filter === 'in_progress' ? 'In Progress' : 'Completed'}
              </ThemedText>
            </View>
            <ThemedText type="h1" style={{ color: Colors.dark.primary, marginTop: Spacing.sm, fontWeight: '700' }}>
              {filteredVisits.length}
            </ThemedText>
          </View>
        )}

        <Spacer height={Spacing.lg} />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
            <ThemedText style={{ color: theme.textMuted, marginTop: Spacing.md }}>
              Loading visits...
            </ThemedText>
          </View>
        ) : error && visits.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="alert-circle" size={48} color={Colors.dark.error} />
            <ThemedText style={{ color: theme.textMuted, marginTop: Spacing.md, textAlign: "center" }}>
              {error}
            </ThemedText>
            <Pressable
              onPress={fetchVisits}
              style={[styles.retryButtonLarge, { marginTop: Spacing.lg }]}
            >
              <ThemedText style={{ color: Colors.dark.primary, fontWeight: '600' }}>
                Retry
              </ThemedText>
            </Pressable>
          </View>
        ) : filteredVisits.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="map-pin" size={48} color={theme.textMuted} />
            <ThemedText style={{ color: theme.textMuted, marginTop: Spacing.md, textAlign: "center" }}>
              {visits.length === 0
                ? "No visits yet"
                : `No ${filter === 'all' ? '' : filter.replace('_', ' ')} visits`}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textMuted, marginTop: Spacing.xs, textAlign: "center" }}>
              {visits.length === 0
                ? "Create your first visit to get started"
                : "Try selecting a different filter"}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.visitsList}>
            {filteredVisits.map((visit) => {
              const canCheckIn = (visit.status === 'scheduled' || visit.status === 'pending') && !visit.check_in_timestamp;
              const canCheckOut = visit.status === 'in_progress' && visit.check_in_timestamp && !visit.check_out_timestamp;
              
              return (
                <View
                  key={visit.id}
                  style={[
                    styles.visitCard, 
                    { 
                      backgroundColor: theme.backgroundDefault,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 3,
                    }
                  ]}
                >
                  {/* Header */}
                  <View style={styles.visitHeader}>
                    <View style={styles.visitTitleContainer}>
                      <ThemedText type="h4" style={{ flex: 1, fontWeight: '600', lineHeight: 22 }}>
                        {visit.title}
                      </ThemedText>
                      <View style={styles.dateTimeRow}>
                        <Feather name="calendar" size={12} color={theme.textMuted} />
                        <ThemedText type="small" style={{ color: theme.textMuted, marginLeft: Spacing.xs }}>
                          {formatDate(visit.schedule_date)} at {formatTime(visit.schedule_time)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Description */}
                  {visit.description && (
                    <View style={styles.visitDescription}>
                      <ThemedText type="small" style={{ color: theme.textMuted, lineHeight: 18 }}>
                        {visit.description}
                      </ThemedText>
                    </View>
                  )}

                  {/* Client Info */}
                  <View style={styles.clientInfo}>
                    <View style={styles.clientRow}>
                      <Feather name="user" size={14} color={theme.textMuted} />
                      <ThemedText type="small" style={{ color: theme.text, marginLeft: Spacing.xs, fontWeight: '500' }}>
                        {visit.client_name}
                      </ThemedText>
                    </View>
                    {visit.contact_person && (
                      <View style={styles.clientRow}>
                        <Feather name="phone" size={14} color={theme.textMuted} />
                        <ThemedText type="small" style={{ color: theme.textMuted, marginLeft: Spacing.xs }}>
                          {visit.contact_person} - {visit.contact_phone}
                        </ThemedText>
                      </View>
                    )}
                    <View style={styles.clientRow}>
                      <Feather name="map-pin" size={14} color={theme.textMuted} />
                      <ThemedText type="small" style={{ color: theme.textMuted, marginLeft: Spacing.xs, flex: 1 }}>
                        {visit.address}, {visit.city}, {visit.state} - {visit.pincode}
                      </ThemedText>
                    </View>
                  </View>

                  {/* Status Badge */}
                  {visit.status && (
                    <View style={styles.statusRow}>
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
                            borderWidth: 1,
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
                        <Feather
                          name={
                            visit.status === "completed"
                              ? "check-circle"
                              : visit.status === "in_progress"
                              ? "clock"
                              : visit.status === "cancelled"
                              ? "x-circle"
                              : visit.status === "pending"
                              ? "calendar"
                              : "calendar"
                          }
                          size={12}
                          color={
                            visit.status === "completed"
                              ? Colors.dark.success
                              : visit.status === "in_progress"
                              ? Colors.dark.primary
                              : visit.status === "cancelled"
                              ? Colors.dark.error
                              : visit.status === "pending"
                              ? Colors.dark.warning
                              : Colors.dark.warning
                          }
                        />
                        <ThemedText
                          type="small"
                          style={{
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
                            textTransform: "capitalize",
                            marginLeft: Spacing.xs,
                            fontWeight: '600',
                          }}
                        >
                          {visit.status.replace('_', ' ')}
                        </ThemedText>
                      </View>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    {canCheckIn && (
                      <Pressable
                        onPress={() => handleCheckIn(visit.id)}
                        disabled={checkingIn === visit.id}
                        style={({ pressed }) => [
                          styles.actionButton,
                          styles.checkInButton,
                          {
                            backgroundColor: Colors.dark.primary,
                            opacity: pressed || checkingIn === visit.id ? 0.8 : 1,
                          },
                        ]}
                      >
                        {checkingIn === visit.id ? (
                          <ActivityIndicator size="small" color="#000000" />
                        ) : (
                          <>
                            <Feather name="log-in" size={16} color="#000000" />
                            <ThemedText style={{ color: "#000000", fontWeight: '600', marginLeft: Spacing.xs }}>
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
                          {
                            backgroundColor: Colors.dark.success,
                            opacity: pressed || checkingOut === visit.id ? 0.8 : 1,
                          },
                        ]}
                      >
                        {checkingOut === visit.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Feather name="log-out" size={16} color="#FFFFFF" />
                            <ThemedText style={{ color: "#FFFFFF", fontWeight: '600', marginLeft: Spacing.xs }}>
                              Check Out
                            </ThemedText>
                          </>
                        )}
                      </Pressable>
                    )}
                    {visit.check_in_timestamp && (
                      <View style={styles.timeInfo}>
                        <Feather name="clock" size={12} color={theme.textMuted} />
                        <ThemedText type="small" style={{ color: theme.textMuted, marginLeft: Spacing.xs }}>
                          Checked in: {new Date(visit.check_in_timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </ThemedText>
                      </View>
                    )}
                    {visit.check_out_timestamp && (
                      <View style={styles.timeInfo}>
                        <Feather name="check" size={12} color={Colors.dark.success} />
                        <ThemedText type="small" style={{ color: Colors.dark.success, marginLeft: Spacing.xs }}>
                          Checked out: {new Date(visit.check_out_timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
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
    padding: Spacing.lg,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    minHeight: 56,
  },
  createButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
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
  },
  countCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.1)",
  },
  countCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["2xl"],
    minHeight: 200,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    minHeight: 300,
  },
  retryButtonLarge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.primary + "20",
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  visitsList: {
    gap: Spacing.md,
  },
  visitCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.08)",
    marginBottom: Spacing.md,
  },
  visitHeader: {
    marginBottom: Spacing.sm,
  },
  visitTitleContainer: {
    flex: 1,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  visitDescription: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.1)",
  },
  clientInfo: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.1)",
    gap: Spacing.xs,
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.1)",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  actionButtons: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.1)",
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  checkInButton: {
    backgroundColor: Colors.dark.primary,
  },
  checkOutButton: {
    backgroundColor: Colors.dark.success,
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
});

