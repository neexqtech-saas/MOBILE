import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, RefreshControl, Alert, Platform, Dimensions } from "react-native";
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
    }, [employee.siteId, employee.id])
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
            pressed && styles.createButtonPressed,
          ]}
        >
          <View style={styles.createButtonContent}>
            <View style={styles.createButtonIcon}>
              <Feather name="plus-circle" size={20} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.createButtonText}>
              Create Visit
            </ThemedText>
          </View>
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
                  borderColor: filter === 'all' ? Colors.dark.primary : "#E2E8F0",
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  {
                    color: filter === 'all' ? '#FFFFFF' : theme.text,
                    fontWeight: filter === 'all' ? '700' : '600',
                  },
                ]}
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
                  borderColor: filter === 'pending' ? Colors.dark.primary : "#E2E8F0",
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  {
                    color: filter === 'pending' ? '#FFFFFF' : theme.text,
                    fontWeight: filter === 'pending' ? '700' : '600',
                  },
                ]}
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
                  borderColor: filter === 'in_progress' ? Colors.dark.primary : "#E2E8F0",
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  {
                    color: filter === 'in_progress' ? '#FFFFFF' : theme.text,
                    fontWeight: filter === 'in_progress' ? '700' : '600',
                  },
                ]}
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
                  borderColor: filter === 'completed' ? Colors.dark.primary : "#E2E8F0",
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  {
                    color: filter === 'completed' ? '#FFFFFF' : theme.text,
                    fontWeight: filter === 'completed' ? '700' : '600',
                  },
                ]}
              >
                Completed
              </ThemedText>
            </Pressable>
          </View>
        )}

        <Spacer height={Spacing.lg} />

        {/* Visits Count */}
        {!isLoading && (
          <View style={styles.countCard}>
            <View style={styles.countCardHeader}>
              <View style={styles.countIconContainer}>
                <Feather 
                  name="map-pin" 
                  size={20} 
                  color={Colors.dark.primary} 
                />
              </View>
              <ThemedText type="small" style={styles.countLabel}>
                {filter === 'all' ? 'Total Visits' : filter === 'pending' ? 'Pending' : filter === 'scheduled' ? 'Scheduled' : filter === 'in_progress' ? 'In Progress' : 'Completed'}
              </ThemedText>
            </View>
            <ThemedText type="h1" style={styles.countValue}>
              {filteredVisits.length}
            </ThemedText>
          </View>
        )}

        <Spacer height={Spacing.lg} />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingIconContainer}>
              <ActivityIndicator size="large" color={Colors.dark.primary} />
            </View>
            <ThemedText style={styles.loadingText}>
              Loading visits...
            </ThemedText>
          </View>
        ) : error && visits.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Feather name="alert-circle" size={56} color={Colors.dark.error} />
            </View>
            <ThemedText style={styles.emptyTitle}>Error</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
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
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Feather name="map-pin" size={56} color={theme.textMuted} />
            </View>
            <ThemedText style={styles.emptyTitle}>
              {visits.length === 0
                ? "No Visits Yet"
                : `No ${filter === 'all' ? '' : filter.replace('_', ' ')} Visits`}
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
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
                  style={styles.visitCard}
                >
                  {/* Header */}
                  <View style={styles.visitHeader}>
                    <View style={styles.visitTitleContainer}>
                      <ThemedText type="h4" style={styles.visitTitle}>
                        {visit.title}
                      </ThemedText>
                      <View style={styles.dateTimeRow}>
                        <Feather name="calendar" size={12} color={theme.textMuted} />
                        <ThemedText type="small" style={styles.dateTimeText}>
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
                      <View style={styles.clientIconContainer}>
                        <Feather name="user" size={14} color={Colors.dark.primary} />
                      </View>
                      <ThemedText type="small" style={styles.clientName}>
                        {visit.client_name}
                      </ThemedText>
                    </View>
                    {visit.contact_person && (
                      <View style={styles.clientRow}>
                        <View style={styles.clientIconContainer}>
                          <Feather name="phone" size={14} color={theme.textMuted} />
                        </View>
                        <ThemedText type="small" style={styles.clientContact}>
                          {visit.contact_person} - {visit.contact_phone}
                        </ThemedText>
                      </View>
                    )}
                    <View style={styles.clientRow}>
                      <View style={styles.clientIconContainer}>
                        <Feather name="map-pin" size={14} color={theme.textMuted} />
                      </View>
                      <ThemedText type="small" style={styles.clientAddress}>
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
                          type="small"
                          style={[
                            styles.statusText,
                            {
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
                            opacity: pressed || checkingIn === visit.id ? 0.9 : 1,
                          },
                          pressed && styles.actionButtonPressed,
                        ]}
                      >
                        {checkingIn === visit.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Feather name="log-in" size={16} color="#FFFFFF" />
                            <ThemedText style={styles.checkInButtonText}>
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
                            opacity: pressed || checkingOut === visit.id ? 0.9 : 1,
                          },
                          pressed && styles.actionButtonPressed,
                        ]}
                      >
                        {checkingOut === visit.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Feather name="log-out" size={16} color="#FFFFFF" />
                            <ThemedText style={styles.checkOutButtonText}>
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
  filterText: {
    fontSize: 13,
    letterSpacing: 0.2,
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
  visitsList: {
    gap: Spacing.md,
  },
  visitCard: {
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
  visitHeader: {
    marginBottom: Spacing.md,
  },
  visitTitleContainer: {
    flex: 1,
  },
  visitTitle: {
    fontSize: Platform.select({
      web: Dimensions.get('window').width > 768 ? 20 : 18,
      default: 18,
    }),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  dateTimeText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
  },
  visitDescription: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  clientInfo: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: Spacing.sm,
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  clientIconContainer: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  clientName: {
    color: "#0F172A",
    fontWeight: "600",
    fontSize: 13,
  },
  clientContact: {
    color: "#64748B",
    fontSize: 12,
  },
  clientAddress: {
    color: "#64748B",
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
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
  actionButtons: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
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
    fontSize: 14,
    letterSpacing: 0.2,
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
    fontSize: 14,
    letterSpacing: 0.2,
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    gap: Spacing.xs,
  },
});

