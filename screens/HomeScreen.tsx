import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Alert, Platform, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CompositeNavigationProp, useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
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
import { apiService } from "@/services/api";

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
    organizationSettings,
    fetchTodayAttendance,
    fetchAttendanceAfterPunch,
    fetchAttendanceHistory,
    fetchHolidays,
    fetchLeaveTypes
  } = useHRMSStore();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPunching, setIsPunching] = useState(false);
  const [punchError, setPunchError] = useState<string | null>(null);
  const [isPunchPressed, setIsPunchPressed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [pendingVisitsCount, setPendingVisitsCount] = useState(0);
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState<string | null>(null);

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
  }, [fetchTodayAttendance]);

  // Fetch pending counts for tasks and visits
  const fetchPendingCounts = async () => {
    const siteId = employee.siteId;
    const userId = employee.id;

    if (!siteId || !userId) return;

    try {
      // Fetch pending tasks count
      const tasksResponse = await apiService.getMyTasks(siteId, userId);
      if (tasksResponse.status === 200 && tasksResponse.data) {
        const pendingTasks = tasksResponse.data.filter(
          (task: any) => task.status === 'pending' || task.status === 'in-progress' || task.status === 'in_progress'
        );
        setPendingTasksCount(pendingTasks.length);
      }
    } catch (error) {
      console.error('❌ Error fetching pending tasks count:', error);
    }

    try {
      // Fetch pending visits count
      const visitsResponse = await apiService.getVisits(siteId, userId);
      if (visitsResponse.status === 200 && visitsResponse.data?.results) {
        const pendingVisits = visitsResponse.data.results.filter(
          (visit: any) => visit.status === 'pending' || visit.status === 'scheduled'
        );
        setPendingVisitsCount(pendingVisits.length);
      }
    } catch (error) {
      console.error('❌ Error fetching pending visits count:', error);
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
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
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
        allowsEditing: false, // Removed editing for faster capture
        aspect: [1, 1], // Square aspect for faster processing
        quality: 0.6, // Further reduced quality for faster processing (was 0.7)
        base64: true,
        cameraType: ImagePicker.CameraType.front, // Directly use front camera
        exif: false, // Disable EXIF data for faster processing
      });

      // Fetch location after camera opens (non-blocking)
      const location = await getCurrentLocation().catch(() => null);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          return { 
            image: `data:image/png;base64,${asset.base64}`,
            location: location || undefined
          };
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
              () => {}, // Silent fail - location is optional
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
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;

              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const base64Image = canvas.toDataURL('image/png', 0.8);
                cleanup();
                resolve({ image: base64Image, location: locationData || undefined });
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

  const handlePunch = async () => {
    if (isPunching) return;
    
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

      // Validate the captured image
      // Use comprehensive face detection
      const validation = await validateFaceImage(captureResult.image);
      if (!validation.valid) {
        setIsPunching(false);
        setPunchError(validation.error || "Face detection failed. Please capture a clear photo of your face.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      // Use location from capture (if not available, try to fetch quickly)
      let latitude = captureResult.location?.latitude;
      let longitude = captureResult.location?.longitude;
      
      // If location not available, try to fetch it with timeout
      if (!latitude || !longitude) {
        try {
          const location = await Promise.race([
            getCurrentLocation(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)) // 2 second timeout
          ]);
          if (location) {
            latitude = location.latitude;
            longitude = location.longitude;
          }
        } catch (error) {
          console.log('Location fetch timeout or error, continuing without location');
        }
      }

      // Round to 6 decimal places before sending
      const roundedLat = latitude ? parseFloat(latitude.toFixed(6)) : undefined;
      const roundedLng = longitude ? parseFloat(longitude.toFixed(6)) : undefined;

      // Use last_login_status (opposite logic)
      // If last_login_status is "checkin" → perform "Check Out"
      // If last_login_status is "checkout" → perform "Check In"
      const lastStatus = todayAttendance?.lastLoginStatus?.toLowerCase();
      const shouldCheckIn = !lastStatus || lastStatus === "checkout";
      
      if (shouldCheckIn) {
        // Check In with selfie and location
        const result = await checkIn([captureResult.image], roundedLat, roundedLng);
        if (!result.success) {
          setPunchError(result.error || "Check-in failed. Please try again.");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          // Immediately call GET API after successful check-in
          console.log('Calling GET API after check-in...');
          await fetchAttendanceAfterPunch();
          console.log('Attendance data fetched after check-in');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        // Check Out with selfie and location
        const result = await checkOut([captureResult.image], roundedLat, roundedLng);
        if (!result.success) {
          setPunchError(result.error || "Check-out failed. Please try again.");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          // Immediately call GET API after successful check-out
          console.log('Calling GET API after check-out...');
          await fetchAttendanceAfterPunch();
          console.log('Attendance data fetched after check-out');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
  const enabledMenuItems = organizationSettings?.enabled_menu_items || {};
  
  const allAttendanceShortcuts = [
    { icon: "calendar" as const, label: "Attendance", onPress: () => navigation.navigate("AttendanceTab"), menuKey: "attendance" },
    { icon: "sun" as const, label: "Holidays", onPress: () => navigation.navigate("Holidays"), menuKey: "holiday-calendar" },
    { icon: "briefcase" as const, label: "Leave", onPress: () => navigation.navigate("LeaveTab"), menuKey: "application" },
  ];

  const allWorkspaceShortcuts = [
    { icon: "check-square" as const, label: "Tasks", onPress: () => navigation.navigate("TaskTab"), menuKey: "tasks" },
    { icon: "package" as const, label: "Production", onPress: () => navigation.navigate("ProductionTab"), menuKey: "production-management" },
    { icon: "users" as const, label: "Meetings", onPress: () => {}, menuKey: "meeting_module_enabled" }, // Using module flag
    { icon: "dollar-sign" as const, label: "Expenses", onPress: () => navigation.navigate("Expenses"), menuKey: "expense" },
    { icon: "map-pin" as const, label: "Visits", onPress: () => navigation.navigate("Visits"), menuKey: "visit" },
  ];

  // Filter shortcuts - only show if enabled_menu_items[key] is true
  const attendanceShortcuts = allAttendanceShortcuts.filter(shortcut => {
    const isEnabled = enabledMenuItems[shortcut.menuKey];
    // Only show if explicitly true, hide if false or undefined
    return isEnabled === true;
  });

  const workspaceShortcuts = allWorkspaceShortcuts.filter(shortcut => {
    // For meetings, check meeting_module_enabled from root level
    if (shortcut.menuKey === "meeting_module_enabled") {
      return organizationSettings?.meeting_module_enabled === true;
    }
    const isEnabled = enabledMenuItems[shortcut.menuKey];
    // Only show if explicitly true, hide if false or undefined
    return isEnabled === true;
  });

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
        {/* Welcome Section with Gradient Background */}
      <LinearGradient
        colors={["#FFFFFF", "#FFFBF8", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.greetingSection}
      >
          <View style={styles.greetingContent}>
            <View style={styles.welcomeHeader}>
              <ThemedText type="h2" style={styles.welcomeText}>
                Hello, {employee.name.split(" ")[0]}
              </ThemedText>
              <View style={styles.emojiContainer}>
                <ThemedText style={styles.emojiText}>👋</ThemedText>
              </View>
            </View>
            <View style={styles.timeDateContainer}>
              <View style={styles.timeBadge}>
                <Feather name="clock" size={13} color="#FF9800" />
                <ThemedText type="small" style={styles.timeText}>
                  {formatTime(currentTime)}
                </ThemedText>
              </View>
              <ThemedText type="small" style={styles.dateText}>
                {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </ThemedText>
            </View>
          </View>
          <Pressable
            onPress={handleRefreshAll}
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
              <ActivityIndicator size="small" color="#FF9800" />
            ) : (
              <Feather name="refresh-cw" size={16} color="#FF9800" />
            )}
          </Pressable>
      </LinearGradient>

      <Spacer height={Spacing.xl} />

        {/* Attendance Card with Premium Design */}
        <View style={styles.attendanceCard}>
          {/* Decorative Top Accent */}
          <LinearGradient
            colors={["#FF9800", "#FFB74D", "#FFCC80"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardAccent}
          />
          
          {/* Status Badge */}
          <View style={styles.statusBadgeContainer}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <ThemedText style={[styles.statusText, { color: status.color }]}>
              {status.text}
            </ThemedText>
          </View>

          <View style={styles.attendanceCardContent}>
            {/* Date Oval */}
            <View style={styles.dateOval}>
              <ThemedText style={styles.dateOvalText}>{formatShortDate(currentTime)}</ThemedText>
            </View>

            {/* First In / Last Out */}
            <View style={styles.attendanceInfo}>
              <View style={styles.attendanceInfoItem}>
                <View style={styles.infoLabelRow}>
                  <Feather name="log-in" size={12} color="#5D4037" />
                  <ThemedText style={styles.attendanceInfoLabel}>First In</ThemedText>
                </View>
                <ThemedText style={styles.attendanceInfoValue}>
                  {todayAttendance?.checkIn || "-"}
                </ThemedText>
              </View>
              <View style={styles.attendanceInfoItem}>
                <View style={styles.infoLabelRow}>
                  <Feather name="log-out" size={12} color="#5D4037" />
                  <ThemedText style={styles.attendanceInfoLabel}>Last Out</ThemedText>
                </View>
                <ThemedText style={styles.attendanceInfoValue}>
                  {todayAttendance?.checkOut || "-"}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Premium Check In Button */}
          <Pressable
            onPress={handlePunch}
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
              <LinearGradient
                colors={
                  isDisabled
                    ? ["#E0E0E0", "#F5F5F5"]
                    : isPunchPressed
                    ? ["#F57C00", "#FF9800", "#FFB74D"]
                    : ["#FF9800", "#FFB74D", "#FFCC80"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.checkInButton}
              >
                <View style={styles.buttonIconContainer}>
                  <Feather name="camera" size={22} color={isDisabled ? "#9E9E9E" : "#FFFFFF"} />
                </View>
                <ThemedText style={[styles.checkInButtonText, { color: isDisabled ? "#9E9E9E" : "#FFFFFF" }]}>
                  {isPunching ? "Processing..." : shouldShowCheckIn ? "Check In" : "Check Out"}
                </ThemedText>
              </LinearGradient>
            </Animated.View>
          </Pressable>
            
          {/* Duration with Icon Background */}
          <View style={styles.durationRow}>
            <View style={styles.durationIconContainer}>
              <Feather name="clock" size={14} color="#FF9800" />
            </View>
            <ThemedText style={styles.durationText}>
              Duration: {todayAttendance?.totalHours ? formatTotalHours(todayAttendance.totalHours) : "-"}
            </ThemedText>
          </View>
        </View>
            
        <Spacer height={Spacing["2xl"]} />

        {/* Error Message */}
        {punchError ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={18} color="#F44336" />
            <ThemedText style={styles.errorText}>{punchError}</ThemedText>
            <Pressable onPress={() => setPunchError(null)} style={styles.errorCloseButton}>
              <Feather name="x" size={16} color="#F44336" />
            </Pressable>
              </View>
        ) : null}

        {punchError ? <Spacer height={Spacing.lg} /> : null}

        {/* Attendance Section with Premium Header */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIconContainer}>
                <Feather name="calendar" size={18} color="#FF9800" />
              </View>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Attendance
              </ThemedText>
            </View>
            <View style={styles.sectionDivider} />
          </View>
          <View style={styles.shortcutsGrid}>
            {attendanceShortcuts.map((shortcut, index) => (
              <Pressable
                key={index}
                onPress={shortcut.onPress}
                style={({ pressed }) => [
                  styles.shortcutItem,
                  { 
                    opacity: pressed ? 0.8 : 1,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  },
                ]}
              >
                <View style={styles.shortcutIconContainer}>
                  <LinearGradient
                    colors={["#FFF8F0", "#FFE8CC", "#FFF8F0"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.shortcutIconBackground}
                  >
                    <Feather name={shortcut.icon} size={20} color="#FF9800" />
                  </LinearGradient>
                </View>
                <ThemedText type="small" style={styles.shortcutLabel}>
                  {shortcut.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <Spacer height={Spacing.xl} />

        {/* My Workspace Section with Premium Header */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIconContainer}>
                <Feather name="briefcase" size={18} color="#FF9800" />
              </View>
              <ThemedText type="h4" style={styles.sectionTitle}>
                My Workspace
              </ThemedText>
            </View>
            <View style={styles.sectionDivider} />
          </View>
          <View style={styles.shortcutsGrid}>
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
                  onPress={shortcut.onPress}
                  style={({ pressed }) => [
                    styles.shortcutItem,
                    { 
                      opacity: pressed ? 0.8 : 1,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                      elevation: 2,
                    },
                  ]}
                >
                  <View style={styles.shortcutIconContainer}>
                    <LinearGradient
                      colors={["#FFF8F0", "#FFE8CC", "#FFF8F0"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.shortcutIconBackground}
                    >
                      <Feather name={shortcut.icon} size={20} color="#FF9800" />
                    </LinearGradient>
                    {badgeCount > 0 && (
                      <View style={[
                        styles.badge,
                        { 
                          backgroundColor: Colors.dark.error,
                          borderWidth: 2,
                          borderColor: "#FFFFFF",
                        }
                      ]}>
                        <ThemedText style={styles.badgeText}>
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText type="small" style={styles.shortcutLabel}>
                    {shortcut.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

      <Spacer height={Spacing["3xl"]} />
    </ScreenScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  greetingSection: {
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing.xl + 12,
    paddingBottom: Spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  greetingContent: {
    flex: 1,
  },
  welcomeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.8,
    lineHeight: 40,
    marginRight: Spacing.sm,
  },
  emojiContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF8F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFE8CC",
  },
  emojiText: {
    fontSize: 20,
  },
  timeDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs - 2,
    borderRadius: BorderRadius.md,
    backgroundColor: "#FFF8F0",
    borderWidth: 1,
    borderColor: "#FFE8CC",
  },
  timeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FF9800",
    letterSpacing: 0.3,
  },
  dateText: {
    fontSize: 13,
    color: "#757575",
    fontWeight: "500",
  },
  attendanceCard: {
    marginHorizontal: Spacing["2xl"],
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius["2xl"] + 8,
    padding: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
    marginTop: Spacing.xl,
  },
  cardAccent: {
    height: 4,
    width: "100%",
  },
  statusBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: Spacing.lg + 4,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.xl + 4,
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.xs + 4,
    borderRadius: BorderRadius.full,
    backgroundColor: "#F8F9FA",
    borderWidth: 1.5,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  attendanceCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl + 4,
  },
  dateOval: {
    backgroundColor: "#FFF8F0",
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg + 6,
    paddingVertical: Spacing.md + 4,
    minWidth: 90,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFE8CC",
    shadowColor: "#FF9800",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  dateOvalText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF9800",
  },
  attendanceInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  attendanceInfoItem: {
    marginBottom: Spacing.sm,
  },
  infoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: 2,
  },
  attendanceInfoLabel: {
    fontSize: 12,
    color: "#5D4037",
    opacity: 0.8,
    fontWeight: "500",
  },
  attendanceInfoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E65100",
  },
  checkInButtonContainer: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginHorizontal: Spacing.xl + 4,
    marginBottom: Spacing.lg,
    shadowColor: "#FF9800",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  checkInButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    minHeight: 56,
  },
  buttonIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkInButtonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg + 4,
    paddingHorizontal: Spacing.xl + 4,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#FAFAFA",
  },
  durationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF8F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFE8CC",
  },
  durationText: {
    fontSize: 14,
    color: "#424242",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  sectionCard: {
    marginHorizontal: Spacing["2xl"],
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius["2xl"] + 8,
    padding: Spacing.xl + 6,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  sectionHeader: {
    marginBottom: Spacing.xl,
    marginTop: -Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF8F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFE8CC",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    color: "#1A1A1A",
    fontWeight: "800",
    fontSize: 22,
    letterSpacing: -0.3,
  },
  shortcutsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: 0,
  },
  shortcutItem: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: BorderRadius.lg + 4,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    paddingTop: Spacing.lg,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#F5F5F5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  shortcutIconContainer: {
    position: "relative",
    marginBottom: Spacing.md + 2,
    marginTop: Spacing.lg + 12,
  },
  shortcutIconBackground: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg + 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFE8CC",
    shadowColor: "#FF9800",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
    padding: Spacing.md,
    paddingTop: Spacing["2xl"],
  },
  shortcutLabel: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: "#424242",
    letterSpacing: 0.2,
  },
  badge: {
    position: "absolute",
    top: -10,
    right: -12,
    backgroundColor: Colors.dark.error,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: Colors.dark.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FFE8CC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
