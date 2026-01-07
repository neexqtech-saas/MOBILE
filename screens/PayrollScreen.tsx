import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore, PaySlip } from "@/store/hrmsStore";
import Spacer from "@/components/Spacer";

export default function PayrollScreen() {
  const { theme } = useTheme();
  const { paySlips, employee } = useHRMSStore();

  const [selectedSlip, setSelectedSlip] = useState<PaySlip | null>(
    paySlips[0] || null
  );
  const [showDetails, setShowDetails] = useState(false);

  if (!selectedSlip) {
    return (
      <ScreenScrollView>
        <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="file-text" size={48} color={theme.textMuted} />
          <ThemedText style={{ color: theme.textMuted, marginTop: Spacing.md }}>
            No payslips available
          </ThemedText>
        </View>
      </ScreenScrollView>
    );
  }

  const grossSalary =
    selectedSlip.basicSalary +
    selectedSlip.hra +
    selectedSlip.da +
    selectedSlip.ta +
    selectedSlip.otherAllowances;

  const totalDeductions =
    selectedSlip.pf +
    selectedSlip.esi +
    selectedSlip.professionalTax +
    selectedSlip.tds +
    selectedSlip.otherDeductions;

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`;
  };

  return (
    <ScreenScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthsContainer}
      >
        {paySlips.map((slip) => (
          <Pressable
            key={slip.id}
            onPress={() => setSelectedSlip(slip)}
            style={[
              styles.monthCard,
              {
                backgroundColor:
                  selectedSlip.id === slip.id
                    ? Colors.dark.primary
                    : theme.backgroundDefault,
              },
            ]}
          >
            <ThemedText
              type="body"
              style={{
                color: selectedSlip.id === slip.id ? "#000000" : theme.text,
                fontWeight: selectedSlip.id === slip.id ? "600" : "400",
              }}
            >
              {slip.month}
            </ThemedText>
            <ThemedText
              type="small"
              style={{
                color:
                  selectedSlip.id === slip.id ? "#000000" : theme.textMuted,
              }}
            >
              {slip.year}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      <Spacer height={Spacing.xl} />

      <View
        style={[styles.summaryCard, { backgroundColor: Colors.dark.primary }]}
      >
        <ThemedText type="small" style={{ color: "#000000", opacity: 0.7 }}>
          Net Salary
        </ThemedText>
        <ThemedText type="h1" style={{ color: "#000000" }}>
          {formatCurrency(selectedSlip.netSalary)}
        </ThemedText>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Feather name="plus-circle" size={16} color="#000000" />
            <ThemedText type="small" style={{ color: "#000000" }}>
              Earnings: {formatCurrency(grossSalary)}
            </ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <Feather name="minus-circle" size={16} color="#000000" />
            <ThemedText type="small" style={{ color: "#000000" }}>
              Deductions: {formatCurrency(totalDeductions)}
            </ThemedText>
          </View>
        </View>
      </View>

      <Spacer height={Spacing.xl} />

      <Pressable
        onPress={() => {
          Alert.alert(
            "Download Payslip",
            `Payslip for ${selectedSlip.month} ${selectedSlip.year} has been downloaded`,
            [{ text: "OK" }]
          );
        }}
        style={({ pressed }) => [
          styles.downloadButton,
          { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Feather name="download" size={20} color={Colors.dark.primary} />
        <ThemedText style={{ color: Colors.dark.primary, fontWeight: "600" }}>
          Download PDF
        </ThemedText>
      </Pressable>

      <Spacer height={Spacing.xl} />

      <View style={[styles.detailCard, { backgroundColor: theme.backgroundDefault }]}>
        <Pressable
          onPress={() => setShowDetails(!showDetails)}
          style={styles.detailHeader}
        >
          <View style={styles.detailHeaderContent}>
            <Feather name="plus-circle" size={20} color={Colors.dark.success} />
            <ThemedText type="h4">Earnings</ThemedText>
          </View>
          <View style={styles.detailHeaderRight}>
            <ThemedText style={{ color: Colors.dark.success, fontWeight: "600" }}>
              {formatCurrency(grossSalary)}
            </ThemedText>
            <Feather
              name={showDetails ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.textMuted}
            />
          </View>
        </Pressable>

        {showDetails ? (
          <View style={styles.detailContent}>
            <View style={styles.detailRow}>
              <ThemedText style={{ color: theme.textMuted }}>Basic Salary</ThemedText>
              <ThemedText>{formatCurrency(selectedSlip.basicSalary)}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={{ color: theme.textMuted }}>HRA</ThemedText>
              <ThemedText>{formatCurrency(selectedSlip.hra)}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={{ color: theme.textMuted }}>DA</ThemedText>
              <ThemedText>{formatCurrency(selectedSlip.da)}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={{ color: theme.textMuted }}>TA</ThemedText>
              <ThemedText>{formatCurrency(selectedSlip.ta)}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={{ color: theme.textMuted }}>Other Allowances</ThemedText>
              <ThemedText>{formatCurrency(selectedSlip.otherAllowances)}</ThemedText>
            </View>
          </View>
        ) : null}
      </View>

      <Spacer height={Spacing.lg} />

      <View style={[styles.detailCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.detailHeader}>
          <View style={styles.detailHeaderContent}>
            <Feather name="minus-circle" size={20} color={Colors.dark.error} />
            <ThemedText type="h4">Deductions</ThemedText>
          </View>
          <ThemedText style={{ color: Colors.dark.error, fontWeight: "600" }}>
            {formatCurrency(totalDeductions)}
          </ThemedText>
        </View>

        <View style={styles.detailContent}>
          <View style={styles.detailRow}>
            <ThemedText style={{ color: theme.textMuted }}>Provident Fund (PF)</ThemedText>
            <ThemedText>{formatCurrency(selectedSlip.pf)}</ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText style={{ color: theme.textMuted }}>ESI</ThemedText>
            <ThemedText>{formatCurrency(selectedSlip.esi)}</ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText style={{ color: theme.textMuted }}>Professional Tax</ThemedText>
            <ThemedText>{formatCurrency(selectedSlip.professionalTax)}</ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText style={{ color: theme.textMuted }}>TDS</ThemedText>
            <ThemedText>{formatCurrency(selectedSlip.tds)}</ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText style={{ color: theme.textMuted }}>Other Deductions</ThemedText>
            <ThemedText>{formatCurrency(selectedSlip.otherDeductions)}</ThemedText>
          </View>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <View style={[styles.detailCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.detailHeader}>
          <View style={styles.detailHeaderContent}>
            <Feather name="credit-card" size={20} color={Colors.dark.primary} />
            <ThemedText type="h4">Bank Details</ThemedText>
          </View>
        </View>
        <View style={styles.detailContent}>
          <View style={styles.detailRow}>
            <ThemedText style={{ color: theme.textMuted }}>Account Number</ThemedText>
            <ThemedText>{employee.bankAccount}</ThemedText>
          </View>
          <View style={styles.detailRow}>
            <ThemedText style={{ color: theme.textMuted }}>IFSC Code</ThemedText>
            <ThemedText>{employee.ifscCode}</ThemedText>
          </View>
        </View>
      </View>

      <Spacer height={Spacing["3xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  monthsContainer: {
    gap: Spacing.md,
    paddingRight: Spacing.xl,
  },
  monthCard: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  summaryCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  summaryRow: {
    flexDirection: "row",
    marginTop: Spacing.lg,
    gap: Spacing["2xl"],
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  detailCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  detailHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  detailHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  emptyState: {
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
});
