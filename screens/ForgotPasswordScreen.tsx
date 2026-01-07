import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";
import Spacer from "@/components/Spacer";

type ForgotPasswordScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "ForgotPassword">;
};

export default function ForgotPasswordScreen({
  navigation,
}: ForgotPasswordScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSendOTP = () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    navigation.navigate("OTP", { email });
  };

  return (
    <ScreenKeyboardAwareScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + Spacing["3xl"] },
      ]}
    >
      <Pressable
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Feather name="arrow-left" size={24} color={theme.text} />
      </Pressable>

      <Spacer height={Spacing["2xl"]} />

      <View style={[styles.iconContainer, { backgroundColor: Colors.dark.primary }]}>
        <Feather name="key" size={40} color="#000000" />
      </View>

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h2" style={styles.title}>
        Forgot Password?
      </ThemedText>
      <ThemedText style={[styles.description, { color: theme.textMuted }]}>
        Enter your email address and we'll send you a verification code to reset your password.
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
          Email Address
        </ThemedText>
        <View style={styles.inputWrapper}>
          <Feather
            name="mail"
            size={20}
            color={theme.textMuted}
            style={styles.inputIcon}
          />
          <TextInput
            style={[
              styles.input,
              styles.inputWithIcon,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError("");
            }}
            placeholder="Enter your email"
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>
      </View>

      <Spacer height={Spacing["2xl"]} />

      <Pressable
        onPress={handleSendOTP}
        style={({ pressed }) => [
          styles.submitButton,
          { backgroundColor: Colors.dark.primary, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <ThemedText style={styles.submitButtonText}>Send OTP</ThemedText>
      </Pressable>

      <Spacer height={Spacing["2xl"]} />

      <Pressable onPress={() => navigation.goBack()} style={styles.backToLogin}>
        <ThemedText style={{ color: theme.textMuted }}>
          Remember your password?{" "}
        </ThemedText>
        <ThemedText style={{ color: Colors.dark.primary }}>Sign In</ThemedText>
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
  inputIcon: {
    position: "absolute",
    left: Spacing.lg,
    top: Spacing.lg,
    zIndex: 1,
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
  backToLogin: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
