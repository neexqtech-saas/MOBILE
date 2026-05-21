import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Pressable, Alert, Platform, ActivityIndicator, useWindowDimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CompositeNavigationProp, useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { MainTabParamList } from "@/navigation/MainTabNavigator";
import Spacer from "@/components/Spacer";
import { validateFaceImage } from "@/utils/faceDetection";
import { apiService, parseEmployeeTaskList, type PunchCountryMeta } from "@/services/api";
import { getCurrentMonthDates } from "@/utils/dateHelpers";
import { formatCountryLabel } from "@/utils/punchLocationTime";
import { resolvePunchLocation } from "@/utils/resolvePunchLocation";
import { ThreeSCheckInModal, type ThreeSCheckInPayload } from "@/components/ThreeSCheckInModal";
import { compressFromCameraAsset, compressImageForUpload } from "@/utils/compressImage";

type HomeScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, "Home">,
  BottomTabNavigationProp<MainTabParamList>
>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme } = useTheme();
  const {
    employee,
    todayAttendance,
    checkIn,
    checkOut,
    announcements,
    notificationHistory,
    unreadNotificationsCount,
    organizationSettings,
    fetchTodayAttendance,
    fetchAttendanceAfterPunch,
    fetchAttendanceHistory,
    fetchHolidays,
    fetchLeaveTypes,
    fetchNotificationHistory,
    markNotificationAsRead,
  } = useHRMSStore();

  const { width: screenWidth } = useWindowDimensions();

  // Responsive tweaks for Attendance UI
  const isTinyPhone = screenWidth < 360;
  const isNarrowLayout = screenWidth < 400;

  const sectionMarginX = isTinyPhone ? Spacing.lg : Spacing["2xl"];
  const attendanceCardPadding = isTinyPhone ? Spacing.sm + 4 : isNarrowLayout ? Spacing.md + 4 : Spacing.lg;
  const attendanceInfoGap = isNarrowLayout ? Spacing.sm + 2 : Spacing.sm + 4;
  const attendanceMetaIconSize = isTinyPhone ? 11 : 12;
  const attendanceLabelFontSize = isTinyPhone ? 10 : 11;
  const attendanceTimeFontSize = isTinyPhone ? 13 : isNarrowLayout ? 14 : 15;
  const attendanceTimeLineHeight = attendanceTimeFontSize + 4;
  const attendanceDateValueSize = isTinyPhone ? 14 : 15;
  const attendanceCardContentBottom = isTinyPhone ? Spacing.md : Spacing.lg;
  const attendanceDateBlockMarginB = isTinyPhone ? Spacing.sm : Spacing.md;
  const attendanceDateBlockPaddingB = isTinyPhone ? Spacing.sm : Spacing.md;
  const attendanceStatusBadgeMarginB = isTinyPhone ? Spacing.sm : Spacing.md;
  const durationRowFontSize = isTinyPhone ? 12 : 13;
  const durationIconSize = isTinyPhone ? 14 : 15;

  const greetingPaddingH = sectionMarginX;
  const greetingPaddingTop = isTinyPhone ? Spacing.md + 2 : Spacing.lg;
  const greetingPaddingBottom = isTinyPhone ? Spacing.md : Spacing.lg;
  const greetingLeadSize = isTinyPhone ? 11 : 12;
  const greetingNameSize = isTinyPhone ? 22 : isNarrowLayout ? 24 : 26;
  const greetingNameLineHeight = greetingNameSize + (isTinyPhone ? 6 : 8);
  const headerTimeIconSize = isTinyPhone ? 12 : 13;
  const headerTimeFontSize = isTinyPhone ? 12 : 13;
  const headerDateFontSize = isTinyPhone ? 11 : 12;
  const checkInButtonPaddingX = isTinyPhone ? Spacing.md + 4 : Spacing.lg;
  const checkInButtonPaddingY = isTinyPhone ? Spacing.sm + 4 : Spacing.md;
  const checkInButtonMinHeight = isTinyPhone ? 44 : 48;

  // Single row: 3 equal columns (Attendance + My Workspace)
  const shortcutsGridGap = isTinyPhone ? Spacing.xs : isNarrowLayout ? Spacing.sm : Spacing.md;
  const shortcutItemPadding = isTinyPhone ? Spacing.xs : isNarrowLayout ? Spacing.sm : Spacing.md;
  const shortcutIconSize = isTinyPhone ? 44 : isNarrowLayout ? 50 : 56;
  // Max starting size; shrinks with adjustsFontSizeToFit so full label fits in one line (native)
  const shortcutLabelFontSize = isTinyPhone ? 11 : isNarrowLayout ? 12 : 13;
  const shortcutLabelMinScale = isTinyPhone ? 0.48 : isNarrowLayout ? 0.55 : 0.62;
  const shortcutLabelLines = Platform.OS === "web" ? 2 : 1;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [punchLocationDisplay, setPunchLocationDisplay] = useState<{
    checkInPlace: string | null;
    checkOutPlace: string | null;
  }>({
    checkInPlace: null,
    checkOutPlace: null,
  });
  const [isPunching, setIsPunching] = useState(false);
  const [punchError, setPunchError] = useState<string | null>(null);
  const [isPunchPressed, setIsPunchPressed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [pendingVisitsCount, setPendingVisitsCount] = useState(0);
  const [materialsCount, setMaterialsCount] = useState(0);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<string | null>(null);
  const [showThreeSModal, setShowThreeSModal] = useState(false);

  const punchScale = useSharedValue(1);

  // Pre-check camera permission on mount for faster camera opening
  useEffect(() => {
    if (Platform.OS !== 'web') {
      ImagePicker.getCameraPermissionsAsync().then(({ status }) => {
        setCameraPermissionStatus(status);
      });
    }
  }, []);

  // Set current local time once when component mounts
  useEffect(() => {
    setCurrentTime(new Date());
  }, []);

  // Fetch today's attendance when screen loads
  useEffect(() => {
    fetchTodayAttendance();
    fetchPendingCounts();
    fetchNotificationHistory();
  }, [fetchTodayAttendance, fetchNotificationHistory]);

  useEffect(() => {
    let cancelled = false;
    const ta = todayAttendance;

    const empty = {
      checkInPlace: null as string | null,
      checkOutPlace: null as string | null,
    };

    if (!ta) {
      setPunchLocationDisplay(empty);
      return;
    }

    (async () => {
      const next = { ...empty };

      const resolvePlace = async (
        lat: number | null | undefined,
        lng: number | null | undefined,
        fallbackText: string | null | undefined
      ): Promise<string | null> => {
        if (lat != null && lng != null) {
          try {
            const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
            const g = results[0];
            if (g && !cancelled) {
              const place = [g.city, g.region, g.country].filter(Boolean).join(", ") || null;
              return place || fallbackText || null;
            }
          } catch {
            /* ignore */
          }
        }
        return fallbackText || null;
      };

      const checkInPlace = await resolvePlace(ta.checkInLatitude, ta.checkInLongitude, ta.checkInLocation);
      if (!cancelled) {
        next.checkInPlace = checkInPlace;
      }

      const checkOutPlace = await resolvePlace(ta.checkOutLatitude, ta.checkOutLongitude, ta.checkOutLocation);
      if (!cancelled) {
        next.checkOutPlace = checkOutPlace;
      }

      if (!cancelled) {
        setPunchLocationDisplay(next);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    todayAttendance?.checkInLatitude,
    todayAttendance?.checkInLongitude,
    todayAttendance?.checkOutLatitude,
    todayAttendance?.checkOutLongitude,
    todayAttendance?.checkInLocation,
    todayAttendance?.checkOutLocation,
    todayAttendance?.date,
  ]);

  /** One row: after checkout show last check-out country/place; otherwise last check-in (avoids duplicate IN · India + address). */
  const lastPunchDisplay = useMemo(() => {
    const ta = todayAttendance;
    if (!ta) {
      return { countryLabel: null as string | null, place: null as string | null };
    }
    const useCheckout = !!ta.checkOut;
    const countryLabel = formatCountryLabel(
      useCheckout ? ta.checkOutCountryCode : ta.checkInCountryCode,
      useCheckout ? ta.checkOutCountry : ta.checkInCountry
    );
    const place = useCheckout ? punchLocationDisplay.checkOutPlace : punchLocationDisplay.checkInPlace;
    return { countryLabel, place };
  }, [todayAttendance, punchLocationDisplay.checkInPlace, punchLocationDisplay.checkOutPlace]);

  // Fetch pending counts for tasks and visits
  const fetchPendingCounts = async () => {
    const adminId = employee.adminId;
    const userId = employee.id;

    if (!adminId || !userId) return;

    try {
      const tasksResponse = await apiService.getMyTasks(adminId, userId);
      if (tasksResponse.status === 200) {
        const taskList = parseEmployeeTaskList(tasksResponse.data);
        const pendingTasks = taskList.filter((task) => task.status === "pending");
        setPendingTasksCount(pendingTasks.length);
      }
    } catch (error) {
      console.error('❌ Error fetching pending tasks count:', error);
    }

    try {
      const { from, to } = getCurrentMonthDates();
      // Fetch pending visits count for current month
      const visitsResponse = await apiService.getVisits(adminId, userId, from, to);
      if (visitsResponse.status === 200 && visitsResponse.data?.results) {
        const pendingVisits = visitsResponse.data.results.filter(
          (visit: any) => visit.status === 'pending' || visit.status === 'scheduled'
        );
        setPendingVisitsCount(pendingVisits.length);
      }
    } catch (error) {
      console.error('❌ Error fetching pending visits count:', error);
    }

    try {
      const materialsRes = await apiService.getMyInventoryMaterials(adminId, userId);
      if (materialsRes.status === 200 && Array.isArray(materialsRes.data)) {
        const pending = materialsRes.data.filter((m: { isReceived?: boolean }) => !m.isReceived);
        setMaterialsCount(pending.length);
      }
    } catch (error) {
      console.error('❌ Error fetching materials count:', error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Convert decimal hours to "X hours Y minutes" format
  const formatTotalHours = (hours: number): string => {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h === 0 && m === 0) return "0 minutes";
    if (h === 0) return `${m} minute${m !== 1 ? 's' : ''}`;
    if (m === 0) return `${h} hour${h !== 1 ? 's' : ''}`;
    return `${h} hour${h !== 1 ? 's' : ''} ${m} minute${m !== 1 ? 's' : ''}`;
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Get current location
  const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      if (Platform.OS === 'web') {
        // Web: Use browser geolocation API
        if (!navigator.geolocation) {
          console.warn('Geolocation is not supported by this browser');
          return null;
        }

        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              // Round to 6 decimal places
              const lat = parseFloat(position.coords.latitude.toFixed(6));
              const lng = parseFloat(position.coords.longitude.toFixed(6));
              resolve({
                latitude: lat,
                longitude: lng,
              });
            },
            (error) => {
              console.error('Error getting location:', error);
              // Don't block attendance if location fails
              resolve(null);
            },
            {
              enableHighAccuracy: false,
              timeout: 2000, // Reduced timeout to 2 seconds for faster response
              maximumAge: 600000, // Accept 10 minute old cached location for faster response
            }
          );
        });
      } else {
        // Mobile: Location fetching - currently not implemented for mobile
        // Can be added later with expo-location package if needed
        console.warn('Location not available on mobile platform yet');
        return null;
      }
    } catch (error) {
      console.error('Error in getCurrentLocation:', error);
      return null;
    }
  };

  // Validate captured image - check if it's a real person, not a photo of screen/object
  const validateSelfieImage = async (base64Image: string): Promise<{ valid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      try {
        if (Platform.OS === 'web') {
          // Web validation
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve({ valid: false, error: 'Image validation failed' });
              return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Check 1: Image dimensions (should be reasonable size)
            if (img.width < 200 || img.height < 200) {
              resolve({ valid: false, error: 'Image is too small. Please capture a clear photo.' });
              return;
            }

            // Check overall image brightness to detect low light conditions
            let totalBrightness = 0;
            const stepX = Math.max(1, Math.floor(canvas.width / 20));
            const stepY = Math.max(1, Math.floor(canvas.height / 20));

            // Use grid sampling for better performance
            for (let y = 0; y < canvas.height; y += stepY) {
              for (let x = 0; x < canvas.width; x += stepX) {
                const idx = (y * canvas.width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
                totalBrightness += brightness;
              }
            }
            const sampleCount = Math.floor(canvas.width / stepX) * Math.floor(canvas.height / stepY);
            const avgBrightness = totalBrightness / sampleCount;
            const isLowLight = avgBrightness < 60;

            // Check 2: Check for screenshot patterns (skip in low light)
            if (!isLowLight) {
              const edgeSampleSize = 10;
              const topEdge = [];
              const bottomEdge = [];
              const leftEdge = [];
              const rightEdge = [];

              for (let i = 0; i < edgeSampleSize; i++) {
                const topIdx = (i * 4) + (0 * canvas.width * 4);
                topEdge.push(data[topIdx], data[topIdx + 1], data[topIdx + 2]);

                const bottomIdx = ((canvas.height - 1) * canvas.width * 4) + (i * 4);
                bottomEdge.push(data[bottomIdx], data[bottomIdx + 1], data[bottomIdx + 2]);

                const leftIdx = (i * canvas.width * 4) + (0 * 4);
                leftEdge.push(data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]);

                const rightIdx = (i * canvas.width * 4) + ((canvas.width - 1) * 4);
                rightEdge.push(data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]);
              }

              const checkUniformity = (edge: number[]) => {
                if (edge.length < 9) return false;
                const avg = edge.reduce((a, b) => a + b, 0) / edge.length;
                const variance = edge.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / edge.length;
                return variance < 50;
              };

              const edgesUniform =
                checkUniformity(topEdge) &&
                checkUniformity(bottomEdge) &&
                checkUniformity(leftEdge) &&
                checkUniformity(rightEdge);

              if (edgesUniform) {
                resolve({ valid: false, error: 'Please capture a live photo, not a screenshot or photo of a screen.' });
                return;
              }
            }

            // Check 3: Face detection - check for skin tone in center area
            const centerX = Math.floor(canvas.width / 2);
            const centerY = Math.floor(canvas.height / 2);
            const checkSize = Math.min(canvas.width, canvas.height) * 0.4;
            const startX = Math.max(0, centerX - checkSize / 2);
            const startY = Math.max(0, centerY - checkSize / 2);
            const endX = Math.min(canvas.width, centerX + checkSize / 2);
            const endY = Math.min(canvas.height, centerY + checkSize / 2);

            let skinTonePixels = 0;
            let totalPixels = 0;
            let centerBrightness = 0;

            for (let y = startY; y < endY; y += 5) {
              for (let x = startX; x < endX; x += 5) {
                const idx = (y * canvas.width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
                centerBrightness += brightness;

                let isSkinTone = false;
                if (isLowLight) {
                  isSkinTone =
                    r > 30 && r < 255 &&
                    g > 20 && g < 240 &&
                    b > 15 && b < 200 &&
                    brightness > 20;
                } else {
                  isSkinTone =
                    r > 95 && r < 255 &&
                    g > 40 && g < 240 &&
                    b > 20 && b < 200 &&
                    r > g && r > b &&
                    Math.abs(r - g) > 15;
                }

                if (isSkinTone) {
                  skinTonePixels++;
                }
                totalPixels++;
              }
            }

            const skinToneRatio = skinTonePixels / totalPixels;
            const avgCenterBrightness = centerBrightness / totalPixels;
            const minSkinToneRatio = isLowLight ? 0.05 : 0.1;

            if (skinToneRatio < minSkinToneRatio && avgCenterBrightness < 15) {
              resolve({ valid: false, error: 'Image is too dark. Please ensure your face is visible in the camera.' });
              return;
            } else if (skinToneRatio < minSkinToneRatio && !isLowLight) {
              resolve({ valid: false, error: 'No face detected. Please ensure your face is clearly visible in the camera.' });
              return;
            }

            // Check 4: Image quality - check for blur
            let blurScore = 0;
            const blurSampleCount = 100;
            for (let i = 0; i < blurSampleCount; i++) {
              const x = Math.floor(Math.random() * (canvas.width - 2));
              const y = Math.floor(Math.random() * (canvas.height - 2));
              const idx = (y * canvas.width + x) * 4;
              const nextIdx = (y * canvas.width + (x + 1)) * 4;

              const diff = Math.abs(data[idx] - data[nextIdx]) +
                Math.abs(data[idx + 1] - data[nextIdx + 1]) +
                Math.abs(data[idx + 2] - data[nextIdx + 2]);
              blurScore += diff;
            }

            const avgBlur = blurScore / blurSampleCount;
            const minBlurThreshold = isLowLight ? 5 : 10;
            if (avgBlur < minBlurThreshold && !isLowLight) {
              resolve({ valid: false, error: 'Image is too blurry. Please ensure good lighting and hold the camera steady.' });
              return;
            }

            resolve({ valid: true });
          };

          img.onerror = () => {
            resolve({ valid: false, error: 'Invalid image. Please try again.' });
          };

          img.src = base64Image;
        } else {
          // Mobile validation - basic checks
          resolve({ valid: true });
        }
      } catch (error) {
        console.error('Validation error:', error);
        resolve({ valid: false, error: 'Image validation failed. Please try again.' });
      }
    });
  };

  const captureCameraPhoto = async (
    useFrontCamera: boolean
  ): Promise<{ image: string | null; location?: { latitude: number; longitude: number } | null }> => {
    if (Platform.OS === "web") {
      return captureSelfieWeb();
    }

    let status = cameraPermissionStatus;
    if (status !== "granted") {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      status = permissionResult.status;
      setCameraPermissionStatus(status);
    }

    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera permission is required.");
      return { image: null };
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.2,
      base64: true,
      cameraType: useFrontCamera ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
      exif: false,
    });

    const location = await getCurrentLocation().catch(() => null);

    if (!result.canceled && result.assets?.[0]) {
      const image = await compressFromCameraAsset(result.assets[0]);
      if (image) {
        return { image, location: location || undefined };
      }
    }
    return { image: null };
  };

  const captureSelfie = async (): Promise<{ image: string | null; location?: { latitude: number; longitude: number } | null }> => {
    try {
      // For web platform, use HTML5 getUserMedia API
      if (Platform.OS === 'web') {
        return await captureSelfieWeb();
      }

      // Optimized: Check permission status first (pre-checked on mount)
      let status = cameraPermissionStatus;
      if (status !== 'granted') {
        // Only request if not already granted
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        status = permissionResult.status;
        setCameraPermissionStatus(status);
      }

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to capture selfie for attendance.',
          [{ text: 'OK' }]
        );
        return { image: null };
      }

      // Optimized: Launch camera immediately without waiting for location
      // Location will be fetched separately if needed
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.2,
        base64: true,
        cameraType: ImagePicker.CameraType.front,
        exif: false,
      });

      const location = await getCurrentLocation().catch(() => null);

      if (!result.canceled && result.assets?.[0]) {
        const image = await compressFromCameraAsset(result.assets[0]);
        if (image) {
          return { image, location: location || undefined };
        }
      }
      return { image: null };
    } catch (error) {
      console.error('Error capturing selfie:', error);
      Alert.alert('Error', 'Failed to capture selfie. Please try again.');
      return { image: null };
    }
  };

  const captureSelfieWeb = (): Promise<{ image: string | null; location?: { latitude: number; longitude: number } | null }> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || typeof document === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        Alert.alert('Camera Not Available', 'Camera access is not available.');
        resolve({ image: null });
        return;
      }

      // Location will be fetched separately, don't block camera
      let locationData: { latitude: number; longitude: number } | null = null;

      // Request camera access IMMEDIATELY
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' } })
        .then((stream) => {
          // Start location fetch AFTER camera is open (non-blocking)
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                // Round to 6 decimal places
                const lat = parseFloat(position.coords.latitude.toFixed(6));
                const lng = parseFloat(position.coords.longitude.toFixed(6));
                locationData = {
                  latitude: lat,
                  longitude: lng,
                };
              },
              () => { }, // Silent fail - location is optional
              {
                enableHighAccuracy: false,
                timeout: 3000,
                maximumAge: 300000,
              }
            );
          }

          // Create video element
          const video = document.createElement('video');
          video.srcObject = stream;
          video.autoplay = true;
          video.playsInline = true;
          video.style.position = 'fixed';
          video.style.top = '0';
          video.style.left = '0';
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.zIndex = '9999';
          video.style.objectFit = 'cover';
          document.body.appendChild(video);

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Create overlay for camera controls
          const overlay = document.createElement('div');
          overlay.style.position = 'fixed';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.width = '100%';
          overlay.style.height = '100%';
          overlay.style.zIndex = '10000';
          overlay.style.pointerEvents = 'none';

          // Close button (X) at top right
          const closeButton = document.createElement('button');
          closeButton.innerHTML = '✕';
          closeButton.style.position = 'fixed';
          closeButton.style.top = '20px';
          closeButton.style.right = '20px';
          closeButton.style.width = '44px';
          closeButton.style.height = '44px';
          closeButton.style.borderRadius = '50%';
          closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          closeButton.style.color = 'white';
          closeButton.style.border = 'none';
          closeButton.style.fontSize = '24px';
          closeButton.style.cursor = 'pointer';
          closeButton.style.display = 'flex';
          closeButton.style.alignItems = 'center';
          closeButton.style.justifyContent = 'center';
          closeButton.style.pointerEvents = 'auto';
          closeButton.style.zIndex = '10001';
          closeButton.style.transition = 'background-color 0.2s';
          closeButton.onmouseenter = () => {
            closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          };
          closeButton.onmouseleave = () => {
            closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          };

          // Bottom container for capture button
          const bottomContainer = document.createElement('div');
          bottomContainer.style.position = 'fixed';
          bottomContainer.style.bottom = '0';
          bottomContainer.style.left = '0';
          bottomContainer.style.width = '100%';
          bottomContainer.style.padding = '30px';
          bottomContainer.style.display = 'flex';
          bottomContainer.style.justifyContent = 'center';
          bottomContainer.style.alignItems = 'center';
          bottomContainer.style.pointerEvents = 'auto';
          bottomContainer.style.zIndex = '10001';
          bottomContainer.style.background = 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)';

          // Circular capture button (like phone camera)
          const captureButton = document.createElement('button');
          captureButton.style.width = '70px';
          captureButton.style.height = '70px';
          captureButton.style.borderRadius = '50%';
          captureButton.style.backgroundColor = 'white';
          captureButton.style.border = 'none';
          captureButton.style.cursor = 'pointer';
          captureButton.style.padding = '0';
          captureButton.style.outline = 'none';
          captureButton.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
          captureButton.style.transition = 'transform 0.1s, background-color 0.1s';
          captureButton.style.display = 'flex';
          captureButton.style.alignItems = 'center';
          captureButton.style.justifyContent = 'center';
          captureButton.style.position = 'relative';
          captureButton.onfocus = () => {
            captureButton.style.outline = 'none';
          };
          captureButton.onmousedown = () => {
            captureButton.style.transform = 'scale(0.9)';
            captureButton.style.backgroundColor = '#f0f0f0';
          };
          captureButton.onmouseup = () => {
            captureButton.style.transform = 'scale(1)';
            captureButton.style.backgroundColor = 'white';
          };
          captureButton.onmouseleave = () => {
            captureButton.style.transform = 'scale(1)';
            captureButton.style.backgroundColor = 'white';
          };

          // Inner circle
          const innerCircle = document.createElement('div');
          innerCircle.style.width = '60px';
          innerCircle.style.height = '60px';
          innerCircle.style.borderRadius = '50%';
          innerCircle.style.backgroundColor = 'white';
          innerCircle.style.border = 'none';
          innerCircle.style.boxShadow = 'inset 0 0 0 3px rgba(0, 0, 0, 0.1)';
          captureButton.appendChild(innerCircle);

          bottomContainer.appendChild(captureButton);
          overlay.appendChild(closeButton);
          overlay.appendChild(bottomContainer);
          document.body.appendChild(overlay);

          const cleanup = () => {
            stream.getTracks().forEach((track) => track.stop());
            if (video.parentNode) {
              video.parentNode.removeChild(video);
            }
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
          };

          const capturePhoto = () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
              const maxW = 1024;
              const scale = Math.min(1, maxW / video.videoWidth);
              canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
              canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const raw = canvas.toDataURL("image/jpeg", 0.65);
                cleanup();
                void compressImageForUpload(raw).then((base64Image) => {
                  resolve({ image: base64Image, location: locationData || undefined });
                });
              } else {
                cleanup();
                resolve({ image: null });
              }
            } else {
              setTimeout(capturePhoto, 100);
            }
          };

          captureButton.onclick = capturePhoto;
          closeButton.onclick = () => {
            cleanup();
            resolve({ image: null });
          };
        })
        .catch((error) => {
          console.error('Error accessing camera:', error);
          Alert.alert(
            'Camera Access Denied',
            'Please allow camera access to capture selfie for attendance.',
            [{ text: 'OK' }]
          );
          resolve({ image: null });
        });
    });
  };

  const is3sClient = organizationSettings?.is_3s_client === true;

  const resolvePunchCoords = async (
    captureResult: { image: string | null; location?: { latitude: number; longitude: number } | null }
  ) => {
    let latitude = captureResult.location?.latitude;
    let longitude = captureResult.location?.longitude;

    if (!latitude || !longitude) {
      try {
        const location = await Promise.race([
          getCurrentLocation(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 800)),
        ]);
        if (location) {
          latitude = location.latitude;
          longitude = location.longitude;
        }
      } catch {
        /* optional */
      }
    }

    const roundedLat = latitude ? parseFloat(latitude.toFixed(6)) : undefined;
    const roundedLng = longitude ? parseFloat(longitude.toFixed(6)) : undefined;

    let punchCountryMeta: PunchCountryMeta | undefined;
    if (roundedLat != null && roundedLng != null) {
      const resolved = await resolvePunchLocation(roundedLat, roundedLng);
      punchCountryMeta = {
        country: resolved.country,
        countryCode: resolved.countryCode,
        location: resolved.location,
      };
    }

    return { roundedLat, roundedLng, punchCountryMeta };
  };

  const submitCheckIn = async (
    selfieImage: string,
    threeSData?: ThreeSCheckInPayload | null,
    captureResult?: { location?: { latitude: number; longitude: number } | null }
  ) => {
    const validation = await validateFaceImage(selfieImage);
    if (!validation.valid) {
      setPunchError(validation.error || "Face detection failed. Please capture a clear photo of your face.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const { roundedLat, roundedLng, punchCountryMeta } = await resolvePunchCoords({
      image: selfieImage,
      location: captureResult?.location,
    });

    const result = await checkIn(
      threeSData ? [selfieImage] : undefined,
      roundedLat,
      roundedLng,
      punchCountryMeta,
      threeSData
        ? {
            workType: threeSData.workType,
            liftInstallationNumber: threeSData.liftInstallationNumber,
            liftImage: threeSData.liftImage,
            selfieImage: threeSData.selfieImage,
          }
        : null
    );

    if (!result.success) {
      setPunchError(result.error || "Check-in failed. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchAttendanceAfterPunch().catch(() => undefined);
    }
  };

  const handleThreeSSubmit = async (payload: ThreeSCheckInPayload) => {
    setIsPunching(true);
    setPunchError(null);
    try {
      await submitCheckIn(payload.selfieImage, payload);
    } finally {
      setIsPunching(false);
    }
  };

  const handlePunch = async () => {
    if (isPunching) return;

    const lastStatus = todayAttendance?.lastLoginStatus?.toLowerCase();
    const shouldCheckIn = !lastStatus || lastStatus === "checkout";

    if (shouldCheckIn && is3sClient) {
      setPunchError(null);
      setShowThreeSModal(true);
      return;
    }

    setPunchError(null); // Clear previous errors
    setIsPunching(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Capture selfie (location fetched in background for web)
      const captureResult = await captureSelfie();
      if (!captureResult.image) {
        setIsPunching(false);
        setPunchError("Selfie capture is required for attendance.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Validate the captured image (simplified - fast check)
      // Face detection - run in parallel with location if needed
      const validationPromise = validateFaceImage(captureResult.image);

      // If location not available, fetch it in parallel with face validation
      let locationPromise: Promise<any> | null = null;
      if (!captureResult.location?.latitude || !captureResult.location?.longitude) {
        locationPromise = Promise.race([
          getCurrentLocation(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 800))
        ]).catch(() => null);
      }

      // Wait for face validation (required)
      const validation = await validationPromise;
      if (!validation.valid) {
        setIsPunching(false);
        setPunchError(validation.error || "Face detection failed. Please capture a clear photo of your face.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Get location if we started fetching it
      let latitude = captureResult.location?.latitude;
      let longitude = captureResult.location?.longitude;

      if (locationPromise) {
        try {
          const location = await locationPromise;
          if (location) {
            latitude = location.latitude;
            longitude = location.longitude;
          }
        } catch (error) {
          console.log('Location fetch error, continuing without location');
        }
      }

      // Round to 6 decimal places before sending
      const roundedLat = latitude ? parseFloat(latitude.toFixed(6)) : undefined;
      const roundedLng = longitude ? parseFloat(longitude.toFixed(6)) : undefined;

      let punchCountryMeta: PunchCountryMeta | undefined;
      if (roundedLat != null && roundedLng != null) {
        const resolved = await resolvePunchLocation(roundedLat, roundedLng);
        punchCountryMeta = {
          country: resolved.country,
          countryCode: resolved.countryCode,
          location: resolved.location,
        };
      }

      // Use last_login_status (opposite logic)
      // If last_login_status is "checkin" → perform "Check Out"
      // If last_login_status is "checkout" → perform "Check In"
      const lastStatus = todayAttendance?.lastLoginStatus?.toLowerCase();
      const shouldCheckIn = !lastStatus || lastStatus === "checkout";

      if (shouldCheckIn) {
        await submitCheckIn(captureResult.image, null, captureResult);
      } else {
        // Check Out with selfie and location
        const result = await checkOut(undefined, roundedLat, roundedLng, punchCountryMeta);
        if (!result.success) {
          setPunchError(result.error || "Check-out failed. Please try again.");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          // Success - show immediately, fetch attendance in background (non-blocking)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Fetch attendance in background without blocking UI
          fetchAttendanceAfterPunch().catch(err => {
            console.log('Background attendance fetch error:', err);
            // Silently fail - user already got success feedback
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
      setPunchError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsPunching(false);
    }
  };

  const punchAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: punchScale.value }],
  }));

  // Refresh all APIs
  const handleRefreshAll = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Refresh all APIs in parallel
      await Promise.all([
        fetchTodayAttendance(),
        fetchAttendanceHistory(),
        fetchHolidays(),
        fetchLeaveTypes(),
        fetchNotificationHistory(),
      ]);

      Alert.alert(
        "✅ Data Refreshed",
        "All data has been refreshed successfully.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert(
        "Refresh Error",
        "Some data could not be refreshed. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatus = () => {
    if (!todayAttendance) return { text: "Not Checked In", color: theme.textMuted };
    if (todayAttendance.checkOut) return { text: "Checked Out", color: Colors.dark.success };
    if (todayAttendance.status === "late") return { text: "Present (Late)", color: Colors.dark.warning };
    return { text: "Present", color: Colors.dark.success };
  };

  const status = getStatus();
  const unreadAnnouncements = announcements.filter((a) => !a.isRead).length;

  // Filter shortcuts based on organization settings
  // Use enabled_menu_items from API response
  // Show shortcuts by default if settings not loaded, only hide if explicitly false
  const enabledMenuItems = organizationSettings?.enabled_menu_items || {};
  const hasSettings = !!organizationSettings;

  const allAttendanceShortcuts = [
    {
      icon: "calendar" as const, label: "Attendance", onPress: () => {
        console.log('🔗 Navigating to AttendanceTab');
        // Get parent tab navigator to navigate to tabs
        const parent = navigation.getParent();
        if (parent) {
          parent.navigate("AttendanceTab");
        } else {
          // Fallback: try direct navigation
          navigation.navigate("AttendanceTab");
        }
      }, menuKey: "attendance"
    },
    { icon: "sun" as const, label: "Holidays", onPress: () => navigation.navigate("Holidays"), menuKey: "holiday-calendar" },
    {
      icon: "briefcase" as const, label: "Leave", onPress: () => {
        console.log('🔗 Navigating to LeaveTab');
        // Get parent tab navigator to navigate to tabs
        const parent = navigation.getParent();
        if (parent) {
          parent.navigate("LeaveTab");
        } else {
          // Fallback: try direct navigation
          navigation.navigate("LeaveTab");
        }
      }, menuKey: "application"
    },
  ];

  const allWorkspaceShortcuts = [
    {
      icon: "check-square" as const, label: "Tasks", onPress: () => {
        console.log('🔗 Navigating to TaskTab');
        // Get parent tab navigator to navigate to tabs
        const parent = navigation.getParent();
        if (parent) {
          parent.navigate("TaskTab");
        } else {
          // Fallback: try direct navigation
          navigation.navigate("TaskTab");
        }
      }, menuKey: "tasks"
    },
    { icon: "dollar-sign" as const, label: "Expenses", onPress: () => navigation.navigate("Expenses"), menuKey: "expense" },
    { icon: "map-pin" as const, label: "Visits", onPress: () => navigation.navigate("Visits"), menuKey: "visit" },
  ];

  const allFieldShortcuts = [
    {
      icon: "package" as const,
      label: "My Materials",
      onPress: () => navigation.navigate("MyMaterials"),
      menuKey: "inventory-management",
    },
    {
      icon: "file-text" as const,
      label: "COC Certificates",
      onPress: () => navigation.navigate("COCCertificates"),
      menuKey: "complianceCertificates",
    },
  ];

  const allAttachmentShortcuts = [
    {
      icon: "folder" as const,
      label: "Files & Folders",
      onPress: () => navigation.navigate("Attachments"),
      menuKey: "attachment-management",
    },
  ];

  // Filter shortcuts - show by default, only hide if explicitly false
  const attendanceShortcuts = allAttendanceShortcuts.filter(shortcut => {
    // If settings not loaded, show all shortcuts
    if (!hasSettings) return true;
    const isEnabled = enabledMenuItems[shortcut.menuKey];
    // Show if true or undefined, hide only if explicitly false
    return isEnabled !== false;
  });

  const workspaceShortcuts = allWorkspaceShortcuts.filter(shortcut => {
    // If settings not loaded, show all shortcuts
    if (!hasSettings) return true;
    const isEnabled = enabledMenuItems[shortcut.menuKey];
    // Show if true or undefined, hide only if explicitly false
    return isEnabled !== false;
  });

  const fieldShortcuts = allFieldShortcuts.filter((shortcut) => {
    if (!hasSettings) return true;
    return enabledMenuItems[shortcut.menuKey] !== false;
  });

  const attachmentShortcuts = allAttachmentShortcuts.filter((shortcut) => {
    if (!hasSettings) return true;
    return enabledMenuItems[shortcut.menuKey] !== false;
  });

  // Debug: Log shortcuts for troubleshooting
  useEffect(() => {
    console.log('📋 HomeScreen Shortcuts Debug:', {
      hasSettings,
      enabledMenuItems,
      attendanceShortcutsCount: attendanceShortcuts.length,
      workspaceShortcutsCount: workspaceShortcuts.length,
      attendanceShortcuts: attendanceShortcuts.map(s => s.label),
      workspaceShortcuts: workspaceShortcuts.map(s => s.label),
    });
  }, [hasSettings, enabledMenuItems, attendanceShortcuts.length, workspaceShortcuts.length]);

  const formatShortDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    return `${day} ${month}`;
  };

  const lastStatus = todayAttendance?.lastLoginStatus?.toLowerCase();
  const shouldShowCheckIn = lastStatus ? lastStatus === "checkout" : !todayAttendance?.checkIn;
  const isDisabled = Boolean(isPunching);

  return (
    <View style={styles.container}>
      <ScreenScrollView>
        {/* Professional Header Section */}
        <View
          style={[
            styles.greetingSection,
            {
              paddingHorizontal: greetingPaddingH,
              paddingTop: greetingPaddingTop,
              paddingBottom: greetingPaddingBottom,
            },
          ]}
        >
          <View style={styles.greetingContent}>
            <View style={[styles.welcomeHeader, { marginBottom: isTinyPhone ? Spacing.sm : Spacing.md }]}>
              <View style={styles.welcomeTextContainer}>
                <ThemedText
                  type="small"
                  style={[
                    styles.greetingText,
                    {
                      fontSize: greetingLeadSize,
                      marginBottom: 3,
                      letterSpacing: 0.35,
                      fontWeight: "600",
                      color: "#CA8A04",
                      textTransform: "none",
                    },
                  ]}
                >
                  {getGreeting()}
                </ThemedText>
                <ThemedText
                  type="h2"
                  style={[
                    styles.welcomeText,
                    {
                      fontSize: greetingNameSize,
                      lineHeight: greetingNameLineHeight,
                      letterSpacing: -0.4,
                      fontWeight: "700",
                      color: "#0F172A",
                    },
                  ]}
                >
                  {employee.name.split(" ")[0]}
                </ThemedText>
              </View>
            </View>
            <View
              style={[
                styles.timeDateContainer,
                { gap: isTinyPhone ? Spacing.sm : Spacing.md, marginTop: 2 },
              ]}
            >
              <View
                style={[
                  styles.timeBadge,
                  {
                    paddingHorizontal: isTinyPhone ? Spacing.sm : Spacing.md,
                    paddingVertical: isTinyPhone ? 4 : Spacing.xs,
                  },
                ]}
              >
                <Feather name="clock" size={headerTimeIconSize} color="#2563EB" />
                <ThemedText type="small" style={[styles.timeText, { fontSize: headerTimeFontSize }]}>
                  {formatTime(currentTime)}
                </ThemedText>
              </View>
              <ThemedText
                type="small"
                style={[styles.dateText, { fontSize: headerDateFontSize, lineHeight: headerDateFontSize + 4 }]}
                numberOfLines={2}
              >
                {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </ThemedText>
            </View>
          </View>
          <Pressable
            onPress={() => {
              if (!isRefreshing) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleRefreshAll();
              }
            }}
            disabled={isRefreshing}
            style={({ pressed }) => [
              styles.refreshButton,
              {
                transform: [{ scale: pressed ? 0.95 : 1 }],
                opacity: isRefreshing ? 0.6 : 1,
              },
            ]}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Feather name="refresh-cw" size={isTinyPhone ? 17 : 18} color="#2563EB" />
            )}
          </Pressable>
        </View>

        <Spacer height={Spacing.xl} />

        {/* Professional Attendance Card */}
        <View
          style={[
            styles.attendanceCard,
            { marginHorizontal: sectionMarginX, padding: attendanceCardPadding },
          ]}
        >
          {/* Status Badge */}
          <View
            style={[
              styles.statusBadgeContainer,
              {
                marginBottom: attendanceStatusBadgeMarginB,
                paddingHorizontal: isTinyPhone ? Spacing.sm : Spacing.md,
                paddingVertical: Spacing.xs + 1,
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <ThemedText style={[styles.statusText, { color: status.color, fontSize: isTinyPhone ? 10 : 11 }]}>
              {status.text}
            </ThemedText>
          </View>

          <View style={[styles.attendanceCardContent, { marginBottom: attendanceCardContentBottom }]}>
            {/* Date Display */}
            <View
              style={[
                styles.dateContainer,
                {
                  marginBottom: attendanceDateBlockMarginB,
                  paddingBottom: attendanceDateBlockPaddingB,
                },
              ]}
            >
              <ThemedText
                style={[styles.dateLabel, { fontSize: attendanceLabelFontSize, marginBottom: 2 }]}
              >
                Today
              </ThemedText>
              <ThemedText
                style={[
                  styles.dateValue,
                  { fontSize: attendanceDateValueSize, lineHeight: attendanceDateValueSize + 4 },
                ]}
              >
                {formatShortDate(currentTime)}
              </ThemedText>
            </View>

            {/* First In / Last Out */}
            <View
              style={[
                styles.attendanceInfo,
                { flexDirection: isNarrowLayout ? "column" : "row", gap: attendanceInfoGap },
              ]}
            >
              <View style={styles.attendanceInfoItem}>
                <View style={[styles.infoLabelRow, { marginBottom: 1 }]}>
                  <Feather name="log-in" size={attendanceMetaIconSize} color="#64748B" />
                  <ThemedText style={[styles.attendanceInfoLabel, { fontSize: attendanceLabelFontSize }]}>
                    Check In
                  </ThemedText>
                </View>
                <ThemedText
                  style={[
                    styles.attendanceInfoValue,
                    { fontSize: attendanceTimeFontSize, lineHeight: attendanceTimeLineHeight },
                  ]}
                >
                  {todayAttendance?.checkIn || "-"}
                </ThemedText>
              </View>
              <View style={styles.attendanceInfoItem}>
                <View style={[styles.infoLabelRow, { marginBottom: 1 }]}>
                  <Feather name="log-out" size={attendanceMetaIconSize} color="#64748B" />
                  <ThemedText style={[styles.attendanceInfoLabel, { fontSize: attendanceLabelFontSize }]}>
                    Check Out
                  </ThemedText>
                </View>
                <ThemedText
                  style={[
                    styles.attendanceInfoValue,
                    { fontSize: attendanceTimeFontSize, lineHeight: attendanceTimeLineHeight },
                  ]}
                >
                  {todayAttendance?.checkOut || "-"}
                </ThemedText>
              </View>
            </View>

            {todayAttendance?.threeSWorkType ? (
              <View
                style={[
                  styles.threeSBadge,
                  {
                    backgroundColor:
                      todayAttendance.threeSWorkType === "subsidy" ? "#F5F3FF" : "#EFF6FF",
                    borderColor:
                      todayAttendance.threeSWorkType === "subsidy" ? "#7C3AED" : "#2563EB",
                  },
                ]}
              >
                <ThemedText
                  style={{
                    fontSize: attendanceLabelFontSize + 1,
                    fontWeight: "700",
                    color:
                      todayAttendance.threeSWorkType === "subsidy" ? "#6D28D9" : "#1D4ED8",
                  }}
                >
                  Today: {todayAttendance.threeSWorkTypeDisplay || todayAttendance.threeSWorkType}
                </ThemedText>
              </View>
            ) : null}

            {(lastPunchDisplay.countryLabel || lastPunchDisplay.place) && (
              <View style={styles.punchLocationBlock}>
                {lastPunchDisplay.countryLabel ? (
                  <ThemedText style={[styles.punchCountryHighlight, { fontSize: attendanceLabelFontSize + 1 }]}>
                    Country: {lastPunchDisplay.countryLabel}
                  </ThemedText>
                ) : null}
                {lastPunchDisplay.place ? (
                  <ThemedText style={[styles.punchLocationPlace, { fontSize: attendanceLabelFontSize + 1 }]}>
                    {lastPunchDisplay.place}
                  </ThemedText>
                ) : null}
              </View>
            )}
          </View>

          {/* Professional Check In Button */}
          <Pressable
            onPress={() => {
              if (!isDisabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handlePunch();
              }
            }}
            disabled={isDisabled}
            onPressIn={() => {
              if (!isDisabled) {
                punchScale.value = withSpring(0.96);
                setIsPunchPressed(true);
              }
            }}
            onPressOut={() => {
              punchScale.value = withSpring(1);
              setIsPunchPressed(false);
            }}
            style={styles.checkInButtonContainer}
          >
            <Animated.View style={punchAnimStyle}>
              <View style={[
                styles.checkInButton,
                isDisabled && styles.checkInButtonDisabled,
                isPunchPressed && !isDisabled && styles.checkInButtonPressed,
                {
                  paddingHorizontal: checkInButtonPaddingX,
                  paddingVertical: checkInButtonPaddingY,
                  minHeight: checkInButtonMinHeight,
                  gap: isTinyPhone ? Spacing.sm : Spacing.md,
                },
              ]}>
                <Feather name="camera" size={isTinyPhone ? 18 : 20} color={isDisabled ? "#94A3B8" : "#FFFFFF"} />
                <ThemedText
                  style={[
                    styles.checkInButtonText,
                    {
                      color: isDisabled ? "#94A3B8" : "#FFFFFF",
                      fontSize: isTinyPhone ? 14 : 15,
                    },
                  ]}
                >
                  {isPunching ? "Processing..." : shouldShowCheckIn ? "Check In" : "Check Out"}
                </ThemedText>
              </View>
            </Animated.View>
          </Pressable>

          {/* Duration Row */}
          <View style={[styles.durationRow, { paddingTop: isTinyPhone ? Spacing.sm : Spacing.md }]}>
            <Feather name="clock" size={durationIconSize} color="#2563EB" />
            <ThemedText style={[styles.durationText, { fontSize: durationRowFontSize }]}>
              Duration: {todayAttendance?.totalHours ? formatTotalHours(todayAttendance.totalHours) : "-"}
            </ThemedText>
          </View>
        </View>

        <Spacer height={Spacing.xl} />

        {/* Recent Notifications Section */}
        {notificationHistory.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={[styles.sectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <View style={styles.sectionTitleRow}>
                <Feather name="bell" size={20} color="#1E293B" />
                <ThemedText type="h4" style={styles.sectionTitle}>
                  Notifications
                </ThemedText>
              </View>
              {unreadNotificationsCount > 0 && (
                <View style={styles.notificationCountBadge}>
                  <ThemedText style={styles.notificationCountText}>{unreadNotificationsCount}</ThemedText>
                </View>
              )}
            </View>

            <View style={styles.notificationBriefList}>
              {notificationHistory.slice(0, 2).map((notification) => (
                <Pressable
                  key={notification.id}
                  onPress={() => {
                    if (!notification.is_read) markNotificationAsRead(notification.id);
                    navigation.navigate("Notifications");
                  }}
                  style={styles.notificationBriefItem}
                >
                  <View style={[styles.statusIndicator, { backgroundColor: notification.is_read ? "#E2E8F0" : "#2563EB" }]} />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.notificationTitleBrief, !notification.is_read && { fontWeight: '700', color: '#0F172A' }]} numberOfLines={1}>
                      {notification.title}
                    </ThemedText>
                    <ThemedText style={styles.notificationBodyBrief} numberOfLines={1}>
                      {notification.body}
                    </ThemedText>
                  </View>
                  <Feather name="chevron-right" size={16} color="#94A3B8" />
                </Pressable>
              ))}

              <Pressable
                onPress={() => navigation.navigate("Notifications")}
                style={styles.viewAllNotifications}
              >
                <ThemedText style={styles.viewAllText}>View all notifications</ThemedText>
                <Feather name="arrow-right" size={14} color="#2563EB" />
              </Pressable>
            </View>
          </View>
        )}

        <Spacer height={Spacing.xl} />

        {/* Error Message */}
        {punchError ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={18} color="#F44336" />
            <ThemedText style={styles.errorText}>{punchError}</ThemedText>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPunchError(null);
              }}
              style={({ pressed }) => [
                styles.errorCloseButton,
                { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] }
              ]}
            >
              <Feather name="x" size={16} color="#F44336" />
            </Pressable>
          </View>
        ) : null}

        {punchError ? <Spacer height={Spacing.lg} /> : null}

        {/* Professional Attendance Section */}
        <View
          style={[
            styles.sectionCard,
            { marginHorizontal: sectionMarginX, padding: isTinyPhone ? Spacing.lg : Spacing.xl },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Feather name="calendar" size={20} color="#1E293B" />
              <ThemedText type="h4" style={styles.sectionTitle}>
                Attendance
              </ThemedText>
            </View>
          </View>
          <View style={[styles.shortcutsGrid, { gap: shortcutsGridGap }]}>
            {attendanceShortcuts.map((shortcut, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  shortcut.onPress();
                }}
                style={({ pressed }) => [
                  styles.shortcutItem,
                  pressed && styles.shortcutItemPressed,
                  {
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  },
                  { flex: 1, minWidth: 0, padding: shortcutItemPadding },
                ]}
              >
                <View
                  style={[
                    styles.shortcutIconContainer,
                    { width: shortcutIconSize, height: shortcutIconSize },
                  ]}
                >
                  <Feather name={shortcut.icon} size={isTinyPhone ? 20 : 24} color="#2563EB" />
                </View>
                <ThemedText
                  type="small"
                  style={[
                    styles.shortcutLabel,
                    {
                      fontSize: shortcutLabelFontSize,
                      width: "100%",
                      flexShrink: 1,
                      letterSpacing: isTinyPhone ? -0.25 : isNarrowLayout ? -0.15 : 0,
                    },
                  ]}
                  numberOfLines={shortcutLabelLines}
                  ellipsizeMode="tail"
                  {...(Platform.OS !== "web"
                    ? { adjustsFontSizeToFit: true, minimumFontScale: shortcutLabelMinScale }
                    : {})}
                  {...(Platform.OS === "android" ? { includeFontPadding: false } : {})}
                >
                  {shortcut.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <Spacer height={Spacing.xl} />

        {/* Professional Workspace Section */}
        <View
          style={[
            styles.sectionCard,
            { marginHorizontal: sectionMarginX, padding: isTinyPhone ? Spacing.lg : Spacing.xl },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Feather name="briefcase" size={20} color="#1E293B" />
              <ThemedText type="h4" style={styles.sectionTitle}>
                My Workspace
              </ThemedText>
            </View>
          </View>
          <View style={[styles.shortcutsGrid, { gap: shortcutsGridGap }]}>
            {workspaceShortcuts.map((shortcut, index) => {
              // Get pending count for this shortcut
              let badgeCount = 0;
              if (shortcut.menuKey === "tasks") {
                badgeCount = pendingTasksCount;
              } else if (shortcut.menuKey === "visit") {
                badgeCount = pendingVisitsCount;
              }

              return (
                <Pressable
                  key={index}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    shortcut.onPress();
                  }}
                  style={({ pressed }) => [
                    styles.shortcutItem,
                    pressed && styles.shortcutItemPressed,
                    {
                      opacity: pressed ? 0.8 : 1,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    },
                    { flex: 1, minWidth: 0, padding: shortcutItemPadding },
                  ]}
                >
                  <View
                    style={[
                      styles.shortcutIconContainer,
                      { width: shortcutIconSize, height: shortcutIconSize },
                    ]}
                  >
                    <Feather name={shortcut.icon} size={isTinyPhone ? 20 : 24} color="#2563EB" />
                    {badgeCount > 0 && (
                      <View style={styles.badge}>
                        <ThemedText style={styles.badgeText}>
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText
                    type="small"
                    style={[
                      styles.shortcutLabel,
                      {
                        fontSize: shortcutLabelFontSize,
                        width: "100%",
                        flexShrink: 1,
                        letterSpacing: isTinyPhone ? -0.25 : isNarrowLayout ? -0.15 : 0,
                      },
                    ]}
                    numberOfLines={shortcutLabelLines}
                    ellipsizeMode="tail"
                    {...(Platform.OS !== "web"
                      ? { adjustsFontSizeToFit: true, minimumFontScale: shortcutLabelMinScale }
                      : {})}
                    {...(Platform.OS === "android" ? { includeFontPadding: false } : {})}
                  >
                    {shortcut.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {fieldShortcuts.length > 0 ? (
          <>
            <Spacer height={Spacing.xl} />
            <View
              style={[
                styles.sectionCard,
                { marginHorizontal: sectionMarginX, padding: isTinyPhone ? Spacing.lg : Spacing.xl },
              ]}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Feather name="package" size={20} color="#1E293B" />
                  <ThemedText type="h4" style={styles.sectionTitle}>
                    Materials & Certificates
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.shortcutsGrid, { gap: shortcutsGridGap }]}>
                {fieldShortcuts.map((shortcut, index) => {
                  let badgeCount = 0;
                  if (shortcut.menuKey === "inventory-management") {
                    badgeCount = materialsCount;
                  }

                  return (
                    <Pressable
                      key={index}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        shortcut.onPress();
                      }}
                      style={({ pressed }) => [
                        styles.shortcutItem,
                        pressed && styles.shortcutItemPressed,
                        {
                          opacity: pressed ? 0.8 : 1,
                          transform: [{ scale: pressed ? 0.95 : 1 }],
                        },
                        { flex: 1, minWidth: 0, padding: shortcutItemPadding },
                      ]}
                    >
                      <View
                        style={[
                          styles.shortcutIconContainer,
                          { width: shortcutIconSize, height: shortcutIconSize },
                        ]}
                      >
                        <Feather name={shortcut.icon} size={isTinyPhone ? 20 : 24} color="#2563EB" />
                        {badgeCount > 0 && (
                          <View style={styles.badge}>
                            <ThemedText style={styles.badgeText}>
                              {badgeCount > 99 ? "99+" : badgeCount}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                      <ThemedText
                        type="small"
                        style={[
                          styles.shortcutLabel,
                          {
                            fontSize: shortcutLabelFontSize,
                            width: "100%",
                            flexShrink: 1,
                            letterSpacing: isTinyPhone ? -0.25 : isNarrowLayout ? -0.15 : 0,
                          },
                        ]}
                        numberOfLines={shortcutLabelLines}
                        ellipsizeMode="tail"
                        {...(Platform.OS !== "web"
                          ? { adjustsFontSizeToFit: true, minimumFontScale: shortcutLabelMinScale }
                          : {})}
                        {...(Platform.OS === "android" ? { includeFontPadding: false } : {})}
                      >
                        {shortcut.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        ) : null}

        {attachmentShortcuts.length > 0 ? (
          <>
            <Spacer height={Spacing.xl} />
            <View
              style={[
                styles.sectionCard,
                { marginHorizontal: sectionMarginX, padding: isTinyPhone ? Spacing.lg : Spacing.xl },
              ]}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Feather name="paperclip" size={20} color="#1E293B" />
                  <ThemedText type="h4" style={styles.sectionTitle}>
                    Attachments
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.shortcutsGrid, { gap: shortcutsGridGap }]}>
                {attachmentShortcuts.map((shortcut, index) => (
                  <Pressable
                    key={index}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      shortcut.onPress();
                    }}
                    style={({ pressed }) => [
                      styles.shortcutItem,
                      pressed && styles.shortcutItemPressed,
                      {
                        opacity: pressed ? 0.8 : 1,
                        transform: [{ scale: pressed ? 0.95 : 1 }],
                      },
                      { flex: 1, minWidth: 0, padding: shortcutItemPadding },
                    ]}
                  >
                    <View
                      style={[
                        styles.shortcutIconContainer,
                        { width: shortcutIconSize, height: shortcutIconSize },
                      ]}
                    >
                      <Feather name={shortcut.icon} size={isTinyPhone ? 20 : 24} color="#2563EB" />
                    </View>
                    <ThemedText
                      type="small"
                      style={[
                        styles.shortcutLabel,
                        {
                          fontSize: shortcutLabelFontSize,
                          width: "100%",
                          flexShrink: 1,
                          letterSpacing: isTinyPhone ? -0.25 : isNarrowLayout ? -0.15 : 0,
                        },
                      ]}
                      numberOfLines={shortcutLabelLines}
                      ellipsizeMode="tail"
                      {...(Platform.OS !== "web"
                        ? { adjustsFontSizeToFit: true, minimumFontScale: shortcutLabelMinScale }
                        : {})}
                      {...(Platform.OS === "android" ? { includeFontPadding: false } : {})}
                    >
                      {shortcut.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        ) : null}

        <Spacer height={Spacing["3xl"]} />
      </ScreenScrollView>

      <ThreeSCheckInModal
        visible={showThreeSModal}
        onClose={() => setShowThreeSModal(false)}
        onCaptureLiftPhoto={async () => {
          const result = await captureCameraPhoto(false);
          return result.image;
        }}
        onCaptureSelfie={async () => {
          const result = await captureCameraPhoto(true);
          if (!result.image) return null;
          const validation = await validateFaceImage(result.image);
          if (!validation.valid) {
            setPunchError(validation.error || "Face detection failed. Please try again.");
            return null;
          }
          return result.image;
        }}
        onSubmit={handleThreeSSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  greetingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E2E8F0",
  },
  greetingContent: {
    flex: 1,
  },
  welcomeHeader: {
    marginBottom: Spacing.md,
  },
  welcomeTextContainer: {
    marginBottom: Spacing.xs,
  },
  greetingText: {
    color: "#CA8A04",
  },
  welcomeText: {
    /* fontSize / lineHeight set per screen in JSX */
  },
  timeDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  timeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
    letterSpacing: 0.2,
  },
  dateText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  attendanceCard: {
    marginHorizontal: Spacing["2xl"],
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: Spacing.xl,
  },
  statusBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: BorderRadius.md,
    backgroundColor: "#F1F5F9",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  attendanceCardContent: {
    marginBottom: Spacing.lg,
  },
  dateContainer: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  attendanceInfo: {
    flexDirection: "row",
    gap: Spacing.xl,
  },
  attendanceInfoItem: {
    flex: 1,
  },
  infoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  attendanceInfoLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  attendanceInfoValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  checkInButtonContainer: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  checkInButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    minHeight: 48,
    backgroundColor: "#2563EB",
  },
  checkInButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  checkInButtonPressed: {
    backgroundColor: "#1D4ED8",
  },
  checkInButtonText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  punchCountryHighlight: {
    color: "#0F172A",
    fontWeight: "700",
    marginBottom: 4,
    marginTop: 2,
  },
  threeSBadge: {
    marginTop: Spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  punchLocationBlock: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
  },
  punchLocationPlace: {
    color: "#0F172A",
    fontWeight: "600",
    marginBottom: 2,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  durationText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  sectionCard: {
    marginHorizontal: Spacing["2xl"],
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  sectionTitle: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: -0.3,
  },
  shortcutsGrid: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "stretch",
    gap: Spacing.md,
  },
  shortcutItem: {
    flex: 1,
    minWidth: 0,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: Spacing.md,
    backgroundColor: "transparent",
  },
  shortcutItemPressed: {
    backgroundColor: "transparent",
    opacity: 0.7,
  },
  shortcutIconContainer: {
    position: "relative",
    marginBottom: Spacing.sm,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#DBEAFE",
    ...Platform.select({
      ios: {
        shadowColor: "#2563EB",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 2px 4px rgba(37, 99, 235, 0.1)",
      },
    }),
  },
  shortcutLabel: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    alignSelf: "stretch",
  },
  standaloneBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  standaloneBoxPressed: {
    opacity: 0.85,
  },
  standaloneBoxLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    marginRight: Spacing.md,
  },
  standaloneBoxIcon: {
    marginBottom: 0,
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  standaloneBoxTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  standaloneBoxTitle: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  standaloneBoxSubtitle: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 12,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    backgroundColor: "#FFEBEE",
    marginHorizontal: Spacing["2xl"],
    gap: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  errorCloseButton: {
    padding: Spacing.xs,
  },
  refreshButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xs,
  },
  notificationCountBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  notificationCountText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  notificationBriefList: {
    marginTop: Spacing.sm,
  },
  notificationBriefItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: Spacing.md,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationTitleBrief: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 2,
  },
  notificationBodyBrief: {
    fontSize: 12,
    color: '#64748B',
  },
  viewAllNotifications: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.md,
    gap: Spacing.xs,
  },
  viewAllText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
  },
});
