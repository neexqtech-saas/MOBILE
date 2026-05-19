import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { HomeStackParamList } from "@/navigation/HomeStackNavigator";
import { apiService, LiftComplianceSubmitPayload } from "@/services/api";
import Spacer from "@/components/Spacer";

type Nav = NativeStackNavigationProp<HomeStackParamList, "COCComplianceForm">;

type FormState = LiftComplianceSubmitPayload & {
  certificate_preview?: string;
};

function Field({
  label,
  value,
  onChangeText,
  required = true,
  multiline,
  keyboardType,
  editable = true,
  theme,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "numeric";
  editable?: boolean;
  theme: ReturnType<typeof useTheme>["theme"];
}) {
  return (
    <View style={styles.fieldWrap}>
      <ThemedText style={styles.fieldLabel}>
        {label}
        {required ? <ThemedText style={{ color: Colors.light.error }}> *</ThemedText> : null}
      </ThemedText>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundRoot },
        ]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
        placeholderTextColor={theme.textMuted}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const validToIso = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

/** Local fallback example (matches backend dummy / PDF sample) if API fails */
const exampleForm = (): FormState => ({
  email: "john.doe@example.com",
  username: "johndoe",
  phone_number: "9876543210",
  custom_employee_id: "EMP001",
  gender: "Male",
  date_of_joining: "2024-01-15",
  user_name: "John Doe",
  state: "Tamil Nadu",
  city: "Karur",
  date_of_issue: todayIso(),
  issue_number: "17",
  location_number: "VID-593",
  product_manufacturer:
    "3S Industry Industry (Beijing) Co., Ltd. No 15 Chuangyi East 2nd Road Xiji Town Tongzhou District Beijing China 101106 Phone Hot Line No: 0086 400-0024580.",
  lift_model: "3S Lift WM08R224, 240kg",
  customer_name: "Renfra Energy India Pvt Ltd",
  customer_address: "No122/12,122/13 Varthaga nagar, Kuthukavasalai, Tenkasi (Dt)-627811.",
  date_of_assessment: todayIso(),
  reference_text: "Service Lift Installation as mentioned below",
  inspection_date: todayIso(),
  site_location_name: "Karur",
  lift_serial_number: "WMF25110090",
  operating_hours: "00Hrs.",
  inspected_done_by: "Mr.R.Vijayabalan",
  inspection_remarks: "Fit to use",
  certificate_valid_from: todayIso(),
  certificate_valid_to: validToIso(),
  lift_installed_by: "Mr.R.Vijayabalan Service Engineer - 3S Lift India Pvt Ltd.",
  compliance_inference:
    "The Lift WM08R224 Rope Guided Service lift, 240Kg Serial number is WMF25110090 Fit to use. It complies with the requirements of GB19155-2017/EN81-43-2009, Safety requirements of suspended equipment",
});

const mapDefaultsToForm = (d: Record<string, unknown>): FormState => ({
  email: String(d.email ?? ""),
  username: String(d.username ?? ""),
  phone_number: String(d.phone_number ?? ""),
  custom_employee_id: String(d.custom_employee_id ?? ""),
  gender: String(d.gender ?? "").trim(),
  date_of_joining: String(d.date_of_joining ?? ""),
  user_name: String(d.user_name ?? ""),
  state: String(d.state ?? ""),
  city: String(d.city ?? ""),
  date_of_issue: String(d.date_of_issue ?? ""),
  issue_number: String(d.issue_number ?? 17),
  location_number: String(d.location_number ?? ""),
  product_manufacturer: String(d.product_manufacturer ?? ""),
  lift_model: String(d.lift_model ?? ""),
  customer_name: String(d.customer_name ?? ""),
  customer_address: String(d.customer_address ?? ""),
  date_of_assessment: String(d.date_of_assessment ?? ""),
  reference_text: String(d.reference_text ?? ""),
  inspection_date: String(d.inspection_date ?? ""),
  site_location_name: String(d.site_location_name ?? ""),
  lift_serial_number: String(d.lift_serial_number ?? ""),
  operating_hours: String(d.operating_hours ?? "00Hrs."),
  inspected_done_by: String(d.inspected_done_by ?? ""),
  inspection_remarks: String(d.inspection_remarks ?? "Fit to use"),
  certificate_valid_from: String(d.certificate_valid_from ?? ""),
  certificate_valid_to: String(d.certificate_valid_to ?? ""),
  lift_installed_by: String(d.lift_installed_by ?? ""),
  compliance_inference: String(d.compliance_inference ?? ""),
  certificate_preview: String(d.suggested_certificate_number ?? ""),
});

export default function COCComplianceFormScreen() {
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const { employee } = useHRMSStore();
  const [form, setForm] = useState<FormState>(exampleForm());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const load = async () => {
      if (!employee?.id) {
        setForm(exampleForm());
        setIsLoading(false);
        return;
      }
      try {
        const res = await apiService.getLiftComplianceDefaults(employee.id);
        if (res.data) {
          setForm(mapDefaultsToForm(res.data as Record<string, unknown>));
        }
      } catch (e) {
        console.error(e);
        setForm(exampleForm());
        setError("Using offline example data — edit fields before submit.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [employee?.id, employee?.name]);

  const validate = (): string | null => {
    const requiredKeys: (keyof FormState)[] = [
      "email", "username", "phone_number", "custom_employee_id", "gender",
      "date_of_joining", "user_name", "state", "city",
      "date_of_issue", "location_number", "product_manufacturer",
      "lift_model", "customer_name", "customer_address", "date_of_assessment",
      "reference_text", "inspection_date", "site_location_name", "lift_serial_number",
      "operating_hours", "inspected_done_by", "inspection_remarks",
      "certificate_valid_from", "certificate_valid_to", "lift_installed_by",
      "compliance_inference",
    ];
    for (const key of requiredKeys) {
      const v = String(form[key] ?? "").trim();
      if (!v) {
        return `Please fill: ${key.replace(/_/g, " ")}`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (!employee?.id) {
      Alert.alert("Error", "Please login again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const { certificate_preview: _preview, ...rest } = form;
      const payload: LiftComplianceSubmitPayload = {
        ...rest,
        ...(form.issue_number && /^\d+$/.test(String(form.issue_number).trim())
          ? { issue_number: parseInt(String(form.issue_number), 10) }
          : {}),
      };
      const res = await apiService.submitLiftCompliance(employee.id, payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const certNo = res.data?.certificate_number;
      const pdfUrl = res.data?.pdf_file_url;

      navigation.goBack();

      setTimeout(() => {
        Alert.alert(
          "Certificate created",
          certNo ? `Certificate No: ${certNo}` : "Submitted successfully.",
          [
            ...(pdfUrl
              ? [{ text: "Open PDF", onPress: () => Linking.openURL(pdfUrl) }]
              : []),
            { text: "OK", style: "cancel" as const },
          ]
        );
      }, 350);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Submit failed";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.backgroundDefault }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <ThemedText style={{ marginTop: Spacing.md }}>Loading form...</ThemedText>
      </View>
    );
  }

  return (
    <ScreenScrollView>
      <View style={styles.exampleBanner}>
        <Feather name="info" size={16} color="#1D4ED8" />
        <ThemedText style={styles.exampleBannerText}>
          Example data is pre-filled (Karur / VID-593 sample). Please review and edit before submit.
        </ThemedText>
      </View>
      <ThemedText style={styles.pageHint}>
        All fields are required. Certificate PDF & Excel are generated on submit.
      </ThemedText>
      {error ? (
        <View style={styles.errorBox}>
          <ThemedText style={{ color: Colors.light.error, fontSize: 13 }}>{error}</ThemedText>
        </View>
      ) : null}

      <Section title="Employee details">
        <Field label="Email" value={form.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" theme={theme} />
        <Field label="Username" value={form.username} onChangeText={(v) => set("username", v)} theme={theme} />
        <Field label="Phone number" value={form.phone_number} onChangeText={(v) => set("phone_number", v)} keyboardType="phone-pad" theme={theme} />
        <Field label="Employee ID" value={form.custom_employee_id} onChangeText={(v) => set("custom_employee_id", v)} theme={theme} />
        <Field
          label="Gender"
          value={form.gender}
          onChangeText={(v) => set("gender", v)}
          theme={theme}
        />
        <Field label="Date of joining (YYYY-MM-DD)" value={form.date_of_joining} onChangeText={(v) => set("date_of_joining", v)} theme={theme} />
        <Field label="Full name" value={form.user_name} onChangeText={(v) => set("user_name", v)} theme={theme} />
        <Field label="State" value={form.state} onChangeText={(v) => set("state", v)} theme={theme} />
        <Field label="City" value={form.city} onChangeText={(v) => set("city", v)} theme={theme} />
      </Section>

      <Section title="Certificate details">
        <Field label="Date of issue (YYYY-MM-DD)" value={form.date_of_issue} onChangeText={(v) => set("date_of_issue", v)} theme={theme} />
        <Field
          label="Certificate no. (auto)"
          value={form.certificate_preview || "Auto-generated on submit"}
          onChangeText={() => {}}
          editable={false}
          required={false}
          theme={theme}
        />
        <Field label="Location number (e.g. VID-593)" value={form.location_number} onChangeText={(v) => set("location_number", v)} theme={theme} />
        <Field label="Certificate valid from" value={form.certificate_valid_from} onChangeText={(v) => set("certificate_valid_from", v)} theme={theme} />
        <Field label="Certificate valid upto" value={form.certificate_valid_to} onChangeText={(v) => set("certificate_valid_to", v)} theme={theme} />
      </Section>

      <Section title="Product & customer">
        <Field label="Product manufacturer" value={form.product_manufacturer} onChangeText={(v) => set("product_manufacturer", v)} multiline theme={theme} />
        <Field label="Lift model" value={form.lift_model} onChangeText={(v) => set("lift_model", v)} theme={theme} />
        <Field label="Customer name" value={form.customer_name} onChangeText={(v) => set("customer_name", v)} theme={theme} />
        <Field label="Customer address" value={form.customer_address} onChangeText={(v) => set("customer_address", v)} multiline theme={theme} />
        <Field label="Date of assessment" value={form.date_of_assessment} onChangeText={(v) => set("date_of_assessment", v)} theme={theme} />
        <Field label="Reference" value={form.reference_text} onChangeText={(v) => set("reference_text", v)} multiline theme={theme} />
      </Section>

      <Section title="Inspection">
        <Field label="Inspection date" value={form.inspection_date} onChangeText={(v) => set("inspection_date", v)} theme={theme} />
        <Field label="Site / location name" value={form.site_location_name} onChangeText={(v) => set("site_location_name", v)} theme={theme} />
        <Field label="Lift serial number" value={form.lift_serial_number} onChangeText={(v) => set("lift_serial_number", v)} theme={theme} />
        <Field label="Operating hours" value={form.operating_hours} onChangeText={(v) => set("operating_hours", v)} theme={theme} />
        <Field label="Done by (inspector)" value={form.inspected_done_by} onChangeText={(v) => set("inspected_done_by", v)} theme={theme} />
        <Field label="Remarks" value={form.inspection_remarks} onChangeText={(v) => set("inspection_remarks", v)} theme={theme} />
        <Field label="Lift installed by" value={form.lift_installed_by} onChangeText={(v) => set("lift_installed_by", v)} multiline theme={theme} />
        <Field label="Inference" value={form.compliance_inference} onChangeText={(v) => set("compliance_inference", v)} multiline theme={theme} />
      </Section>

      <Spacer height={Spacing.lg} />
      <Pressable
        style={[styles.submitBtn, isSubmitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Feather name="file-text" size={20} color="#fff" style={{ marginRight: 8 }} />
            <ThemedText style={styles.submitText}>Submit & generate PDF</ThemedText>
          </>
        )}
      </Pressable>
      <Spacer height={Spacing["3xl"]} />

    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  exampleBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  exampleBannerText: { flex: 1, fontSize: 13, color: "#1E40AF", lineHeight: 18 },
  pageHint: { fontSize: 13, opacity: 0.75, marginBottom: Spacing.md },
  errorBox: {
    backgroundColor: "#FEF2F2",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: Spacing.sm },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  fieldWrap: { marginBottom: Spacing.md },
  fieldLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4, opacity: 0.85 },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: 15,
  },
  inputMultiline: { minHeight: 88, textAlignVertical: "top" },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
  },
  submitBtn: {
    flexDirection: "row",
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  modalContent: { borderRadius: BorderRadius.lg, padding: Spacing.sm },
  modalItem: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
});
