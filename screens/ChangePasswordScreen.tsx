import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import Spacer from "@/components/Spacer";

type ChangePasswordScreenNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  "ChangePassword"
>;

export default function ChangePasswordScreen() {
  const navigation = useNavigation<ChangePasswordScreenNavigationProp>();
  const { theme } = useTheme();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChangePassword = () => {
    if (!currentPassword.trim()) {
      setError("Please enter your current password");
      return;
    }
    if (!newPassword.trim()) {
      setError("Please enter a new password");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (currentPassword === newPassword) {
      setError("New password must be different from current password");
      return;
    }

    Alert.alert(
      "Password Changed",
      "Your password has been updated successfully.",
      [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
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
    <ScreenKeyboardAwareScrollView>
      <ThemedText style={{ color: theme.textMuted }}>
        Create a strong password that you don't use for other websites
      </ThemedText>

      <Spacer height={Spacing["2xl"]} />

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
          Current Password
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
            value={currentPassword}
            onChangeText={(text) => {
              setCurrentPassword(text);
              setError("");
            }}
            placeholder="Enter current password"
            placeholderTextColor={theme.textMuted}
            secureTextEntry={!showCurrentPassword}
            autoCapitalize="none"
          />
          <Pressable
            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            style={styles.eyeButton}
          >
            <Feather
              name={showCurrentPassword ? "eye-off" : "eye"}
              size={20}
              color={theme.textMuted}
            />
          </Pressable>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

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
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setError("");
            }}
            placeholder="Enter new password"
            placeholderTextColor={theme.textMuted}
            secureTextEntry={!showNewPassword}
            autoCapitalize="none"
          />
          <Pressable
            onPress={() => setShowNewPassword(!showNewPassword)}
            style={styles.eyeButton}
          >
            <Feather
              name={showNewPassword ? "eye-off" : "eye"}
              size={20}
              color={theme.textMuted}
            />
          </Pressable>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <View style={styles.inputContainer}>
        <ThemedText type="small" style={styles.label}>
          Confirm New Password
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
        <ThemedText type="small" style={{ color: theme.textMuted, fontWeight: "600" }}>
          Password requirements:
        </ThemedText>
        <View style={styles.requirementItem}>
          <Feather
            name={newPassword.length >= 8 ? "check-circle" : "circle"}
            size={14}
            color={newPassword.length >= 8 ? Colors.dark.success : theme.textMuted}
          />
          <ThemedText
            type="small"
            style={{
              color: newPassword.length >= 8 ? Colors.dark.success : theme.textMuted,
            }}
          >
            At least 8 characters
          </ThemedText>
        </View>
        <View style={styles.requirementItem}>
          <Feather
            name={newPassword !== currentPassword && newPassword.length > 0 ? "check-circle" : "circle"}
            size={14}
            color={
              newPassword !== currentPassword && newPassword.length > 0
                ? Colors.dark.success
                : theme.textMuted
            }
          />
          <ThemedText
            type="small"
            style={{
              color:
                newPassword !== currentPassword && newPassword.length > 0
                  ? Colors.dark.success
                  : theme.textMuted,
            }}
          >
            Different from current password
          </ThemedText>
        </View>
        <View style={styles.requirementItem}>
          <Feather
            name={
              newPassword === confirmPassword && newPassword.length > 0
                ? "check-circle"
                : "circle"
            }
            size={14}
            color={
              newPassword === confirmPassword && newPassword.length > 0
                ? Colors.dark.success
                : theme.textMuted
            }
          />
          <ThemedText
            type="small"
            style={{
              color:
                newPassword === confirmPassword && newPassword.length > 0
                  ? Colors.dark.success
                  : theme.textMuted,
            }}
          >
            Passwords match
          </ThemedText>
        </View>
      </View>

      <Spacer height={Spacing["2xl"]} />

      <Pressable
        onPress={handleChangePassword}
        style={({ pressed }) => [
          styles.submitButton,
          { backgroundColor: Colors.dark.primary, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <ThemedText style={styles.submitButtonText}>Update Password</ThemedText>
      </Pressable>

      <Spacer height={Spacing["2xl"]} />
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
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
    flex: 1,
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
  submitButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
});
