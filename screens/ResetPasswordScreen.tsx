import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";
import Spacer from "@/components/Spacer";

type ResetPasswordScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "ResetPassword">;
  route: RouteProp<AuthStackParamList, "ResetPassword">;
};

export default function ResetPasswordScreen({
  navigation,
}: ResetPasswordScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const handleReset = () => {
    if (!password.trim()) {
      setError("Please enter a new password");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    Alert.alert(
      "Password Reset",
      "Your password has been reset successfully. Please login with your new password.",
      [
        {
          text: "OK",
          onPress: () => navigation.navigate("Login"),
        },
      ]
    );
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.backgroundDefault,
      color: theme.text,
      borderColor: theme.border,
    },
  ];

  return (
    <ScreenKeyboardAwareScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + Spacing["3xl"] },
      ]}
    >
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Feather name="arrow-left" size={24} color={theme.text} />
      </Pressable>

      <Spacer height={Spacing["2xl"]} />

      <View style={[styles.iconContainer, { backgroundColor: Colors.dark.primary }]}>
        <Feather name="lock" size={40} color="#000000" />
      </View>

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h2" style={styles.title}>
        Reset Password
      </ThemedText>
      <ThemedText style={[styles.description, { color: theme.textMuted }]}>
        Create a new password for your account. Make sure it's strong and secure.
      </ThemedText>

      <Spacer height={Spacing["3xl"]} />

      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: Colors.dark.error + "20" }]}>
          <Feather name="alert-circle" size={16} color={Colors.dark.error} />
          <ThemedText style={[styles.errorText, { color: Colors.dark.error }]}>
            {error}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.inputContainer}>
        <ThemedText type="small" style={styles.label}>
          New Password
        </ThemedText>
        <View style={styles.inputWrapper}>
          <Feather
            name="lock"
            size={20}
            color={theme.textMuted}
            style={styles.inputIcon}
          />
          <TextInput
            style={[inputStyle, styles.inputWithIcon, styles.passwordInput]}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError("");
            }}
            placeholder="Enter new password"
            placeholderTextColor={theme.textMuted}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Feather
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color={theme.textMuted}
            />
          </Pressable>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <View style={styles.inputContainer}>
        <ThemedText type="small" style={styles.label}>
          Confirm Password
        </ThemedText>
        <View style={styles.inputWrapper}>
          <Feather
            name="lock"
            size={20}
            color={theme.textMuted}
            style={styles.inputIcon}
          />
          <TextInput
            style={[inputStyle, styles.inputWithIcon, styles.passwordInput]}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setError("");
            }}
            placeholder="Confirm new password"
            placeholderTextColor={theme.textMuted}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
          />
          <Pressable
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeButton}
          >
            <Feather
              name={showConfirmPassword ? "eye-off" : "eye"}
              size={20}
              color={theme.textMuted}
            />
          </Pressable>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <View style={styles.requirements}>
        <ThemedText type="small" style={{ color: theme.textMuted }}>
          Password requirements:
        </ThemedText>
        <View style={styles.requirementItem}>
          <Feather
            name={password.length >= 8 ? "check-circle" : "circle"}
            size={14}
            color={password.length >= 8 ? Colors.dark.success : theme.textMuted}
          />
          <ThemedText
            type="small"
            style={{
              color: password.length >= 8 ? Colors.dark.success : theme.textMuted,
            }}
          >
            At least 8 characters
          </ThemedText>
        </View>
      </View>

      <Spacer height={Spacing["2xl"]} />

      <Pressable
        onPress={handleReset}
        style={({ pressed }) => [
          styles.resetButton,
          { backgroundColor: Colors.dark.primary, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <ThemedText style={styles.resetButtonText}>Reset Password</ThemedText>
      </Pressable>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius["2xl"],
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  description: {
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: 14,
  },
  inputContainer: {
    width: "100%",
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.body.fontSize,
  },
  inputWithIcon: {
    paddingLeft: Spacing["4xl"] + Spacing.sm,
  },
  passwordInput: {
    paddingRight: Spacing["4xl"] + Spacing.sm,
  },
  inputIcon: {
    position: "absolute",
    left: Spacing.lg,
    top: Spacing.lg,
    zIndex: 1,
  },
  eyeButton: {
    position: "absolute",
    right: Spacing.lg,
    top: Spacing.lg,
    zIndex: 1,
  },
  requirements: {
    gap: Spacing.sm,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  resetButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
});
