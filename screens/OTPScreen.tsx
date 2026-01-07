import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";
import Spacer from "@/components/Spacer";

type OTPScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "OTP">;
  route: RouteProp<AuthStackParamList, "OTP">;
};

export default function OTPScreen({ navigation, route }: OTPScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { email } = route.params;

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 4) {
      setError("Please enter the complete OTP");
      return;
    }
    navigation.navigate("ResetPassword", { email });
  };

  const handleResend = () => {
    setTimer(30);
    setOtp(["", "", "", ""]);
    setError("");
  };

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
        <Feather name="shield" size={40} color="#000000" />
      </View>

      <Spacer height={Spacing["2xl"]} />

      <ThemedText type="h2" style={styles.title}>
        Verify OTP
      </ThemedText>
      <ThemedText style={[styles.description, { color: theme.textMuted }]}>
        Enter the 4-digit code sent to{"\n"}
        <ThemedText style={{ color: theme.text, fontWeight: "600" }}>
          {email}
        </ThemedText>
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

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) inputRefs.current[index] = ref;
            }}
            style={[
              styles.otpInput,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: digit ? Colors.dark.primary : theme.border,
              },
            ]}
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <Spacer height={Spacing["2xl"]} />

      <View style={styles.resendContainer}>
        {timer > 0 ? (
          <ThemedText style={{ color: theme.textMuted }}>
            Resend code in {timer}s
          </ThemedText>
        ) : (
          <Pressable onPress={handleResend}>
            <ThemedText style={{ color: Colors.dark.primary, fontWeight: "600" }}>
              Resend Code
            </ThemedText>
          </Pressable>
        )}
      </View>

      <Spacer height={Spacing["3xl"]} />

      <Pressable
        onPress={handleVerify}
        style={({ pressed }) => [
          styles.verifyButton,
          { backgroundColor: Colors.dark.primary, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <ThemedText style={styles.verifyButtonText}>Verify</ThemedText>
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
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    alignSelf: "center",
  },
  errorText: {
    fontSize: 14,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  otpInput: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  resendContainer: {
    alignItems: "center",
  },
  verifyButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
});
