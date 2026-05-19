import React, { useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

export type ThreeSWorkType = "piece_rate" | "subsidy";

export interface ThreeSCheckInPayload {
  workType: ThreeSWorkType;
  liftInstallationNumber: string;
  liftImage: string;
  selfieImage: string;
}

interface ThreeSCheckInModalProps {
  visible: boolean;
  onClose: () => void;
  onCaptureLiftPhoto: () => Promise<string | null>;
  onCaptureSelfie: () => Promise<string | null>;
  onSubmit: (payload: ThreeSCheckInPayload) => Promise<void>;
}

type Step = "work_type" | "installation" | "lift_photo" | "selfie";

export function ThreeSCheckInModal({
  visible,
  onClose,
  onCaptureLiftPhoto,
  onCaptureSelfie,
  onSubmit,
}: ThreeSCheckInModalProps) {
  const { theme } = useTheme();
  const [step, setStep] = useState<Step>("work_type");
  const [workType, setWorkType] = useState<ThreeSWorkType | null>(null);
  const [installationNumber, setInstallationNumber] = useState("");
  const [liftImage, setLiftImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep("work_type");
    setWorkType(null);
    setInstallationNumber("");
    setLiftImage(null);
    setSelfieImage(null);
    setIsBusy(false);
    setError(null);
  };

  const handleClose = () => {
    if (isBusy) return;
    reset();
    onClose();
  };

  const handleSelectWorkType = (type: ThreeSWorkType) => {
    setWorkType(type);
    setError(null);
    setStep("installation");
  };

  const handleInstallationNext = () => {
    const trimmed = installationNumber.trim();
    if (!trimmed) {
      setError("Please enter lift installation number.");
      return;
    }
    setError(null);
    setStep("lift_photo");
  };

  const handleCaptureLift = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const image = await onCaptureLiftPhoto();
      if (!image) {
        setError("Lift picture is required.");
        return;
      }
      setLiftImage(image);
      setStep("selfie");
    } finally {
      setIsBusy(false);
    }
  };

  const handleCaptureSelfie = async () => {
    if (!workType || !installationNumber.trim() || !liftImage) {
      setError("Complete previous steps first.");
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const image = await onCaptureSelfie();
      if (!image) {
        setError("Selfie is required.");
        return;
      }
      setSelfieImage(image);
      await onSubmit({
        workType,
        liftInstallationNumber: installationNumber.trim(),
        liftImage,
        selfieImage: image,
      });
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check-in failed. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const stepTitle = () => {
    switch (step) {
      case "work_type":
        return "Select work type";
      case "installation":
        return "Lift installation number";
      case "lift_photo":
        return "Capture lift picture";
      case "selfie":
        return "Capture selfie";
      default:
        return "";
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>{stepTitle()}</ThemedText>
            <Pressable onPress={handleClose} hitSlop={12} disabled={isBusy}>
              <Feather name="x" size={22} color={theme.text} />
            </Pressable>
          </View>

          {error ? (
            <ThemedText style={[styles.error, { color: Colors.light.error }]}>
              {error}
            </ThemedText>
          ) : null}

          {step === "work_type" && (
            <View style={styles.options}>
              <Pressable
                style={[styles.optionBtn, { borderColor: "#2563EB", backgroundColor: "#EFF6FF" }]}
                onPress={() => handleSelectWorkType("piece_rate")}
              >
                <ThemedText style={[styles.optionLabel, { color: "#1D4ED8" }]}>Piece Rate</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.optionBtn, { borderColor: "#7C3AED", backgroundColor: "#F5F3FF" }]}
                onPress={() => handleSelectWorkType("subsidy")}
              >
                <ThemedText style={[styles.optionLabel, { color: "#6D28D9" }]}>Subsidy</ThemedText>
              </Pressable>
            </View>
          )}

          {step === "installation" && (
            <View>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundRoot,
                  },
                ]}
                placeholder="Enter lift installation number"
                placeholderTextColor={theme.textMuted}
                value={installationNumber}
                onChangeText={setInstallationNumber}
                autoCapitalize="characters"
                editable={!isBusy}
              />
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: Colors.light.primary }]}
                onPress={handleInstallationNext}
                disabled={isBusy}
              >
                <ThemedText style={styles.primaryBtnText}>Continue</ThemedText>
              </Pressable>
            </View>
          )}

          {step === "lift_photo" && (
            <View style={styles.centerBlock}>
              <ThemedText style={styles.hint}>
                Take a clear photo of the lift installation.
              </ThemedText>
              {liftImage ? (
                <ThemedText style={styles.successHint}>Lift photo captured.</ThemedText>
              ) : null}
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: Colors.light.primary }]}
                onPress={handleCaptureLift}
                disabled={isBusy}
              >
                {isBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="camera" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <ThemedText style={styles.primaryBtnText}>Click lift picture</ThemedText>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {step === "selfie" && (
            <View style={styles.centerBlock}>
              <ThemedText style={styles.hint}>Take your selfie to complete check-in.</ThemedText>
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: Colors.light.primary }]}
                onPress={handleCaptureSelfie}
                disabled={isBusy}
              >
                {isBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="user" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <ThemedText style={styles.primaryBtnText}>Click selfie</ThemedText>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  card: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === "ios" ? Spacing["3xl"] : Spacing.xl,
    minHeight: 280,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  error: {
    marginBottom: Spacing.md,
    fontSize: 13,
  },
  options: {
    gap: Spacing.md,
  },
  optionBtn: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: "center",
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  centerBlock: {
    gap: Spacing.md,
  },
  hint: {
    fontSize: 14,
    opacity: 0.85,
    marginBottom: Spacing.sm,
  },
  successHint: {
    fontSize: 13,
    color: "#16A34A",
    marginBottom: Spacing.sm,
  },
});
