import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  Animated,
  Keyboard,
  Platform,
  ActivityIndicator,
  Text,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const login = useHRMSStore((state) => state.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    setError("");
    Keyboard.dismiss();

    if (!username.trim()) {
      setError("Please enter your username");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(username.trim(), password);
      if (!result.success) {
        setError(result.error || "Invalid credentials");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenKeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Logo Section with Decorative Circle */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <View style={styles.decorativeCircle1} />
              <View style={styles.decorativeCircle2} />
              <View style={styles.decorativeCircle3} />
              <View style={styles.logoInner}>
                <Image
                  source={require("../assets/images/logo4.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={16} color="#F44336" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Feather name="user" size={20} color="#FFB380" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setError("");
                }}
                placeholder="Username"
                placeholderTextColor="#BDBDBD"
                autoCapitalize="none"
                autoComplete="username"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="next"
                keyboardType="default"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={20} color="#FFB380" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError("");
                }}
                placeholder="Password"
                placeholderTextColor="#BDBDBD"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#FFB380"
                />
              </Pressable>
            </View>
          <Pressable
            onPress={() => navigation.navigate("ForgotPassword")}
            style={styles.forgotButton}
            disabled={isLoading}
          >
              <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>
          </View>

          {/* Login Button */}
          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.loginButtonContainer,
              pressed && styles.loginButtonPressed,
            ]}
          >
            {({ pressed }) => (
            <LinearGradient
                colors={
                  pressed || isLoading
                    ? ["#CC6600", "#E67300", "#CC6600"]
                    : ["#FFB380", "#FFCC99", "#FFB380"]
                }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
                style={styles.loginButton}
            >
              {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                  <Text style={styles.loginButtonText}>LOG IN</Text>
              )}
            </LinearGradient>
            )}
          </Pressable>

          {/* Sign Up Link */}
          <View style={styles.signupSection}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Pressable disabled={isLoading}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScreenKeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing["2xl"],
    paddingTop: Spacing["3xl"],
    paddingBottom: Spacing["3xl"],
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logoWrapper: {
    position: "relative",
    marginBottom: Spacing.lg,
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  decorativeCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#FFCC99",
    opacity: 0.12,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FFD9B3",
    opacity: 0.18,
  },
  decorativeCircle3: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#FFE6CC",
    opacity: 0.25,
  },
  logoInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFE0CC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
    borderWidth: 2,
    borderColor: "#FFE8CC",
    padding: Spacing.md,
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  logoTextContainer: {
    alignItems: "center",
  },
  logoMainText: {
    fontSize: 30,
    fontWeight: "600",
    color: "#D2691E",
    letterSpacing: 0.5,
    fontFamily: Platform.select({ ios: "System", android: "sans-serif-medium" }),
  },
  logoSubText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#FFB380",
    marginTop: 6,
    letterSpacing: 0.3,
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
  },
  welcomeSection: {
    marginBottom: Spacing["2xl"],
  },
  welcomeText: {
    fontSize: 30,
    fontWeight: "600",
    color: "#5D4037",
    letterSpacing: 0.3,
    fontFamily: Platform.select({ ios: "System", android: "sans-serif-medium" }),
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorText: {
    fontSize: 13,
    color: "#F44336",
    flex: 1,
    fontWeight: "400",
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    height: 56,
    borderWidth: 1.5,
    borderColor: "#FFE0CC",
    shadowColor: "#FFE0CC",
        shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#424242",
    padding: 0,
    fontWeight: "400",
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
  },
  passwordInput: {
    paddingRight: Spacing.md,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  forgotText: {
    fontSize: 13,
    color: "#FFB380",
    fontWeight: "500",
    fontFamily: Platform.select({ ios: "System", android: "sans-serif-medium" }),
  },
  loginButtonContainer: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#FFB380",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
      },
  loginButtonPressed: {
    opacity: 0.95,
  },
  loginButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    fontFamily: Platform.select({ ios: "System", android: "sans-serif-medium" }),
  },
  signupSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  signupText: {
    fontSize: 13,
    color: "#757575",
    fontWeight: "400",
    fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
  },
  signupLink: {
    fontSize: 13,
    color: "#FFB380",
    fontWeight: "500",
    fontFamily: Platform.select({ ios: "System", android: "sans-serif-medium" }),
  },
});
