import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";

export default function HelpScreen() {
  const { theme } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I check in for attendance?",
      answer: "Tap the 'Check In' button on the home screen. You'll need to take a selfie for verification.",
    },
    {
      question: "How do I apply for leave?",
      answer: "Go to the Leave section, tap 'Apply Leave', select the dates and type, then submit your request.",
    },
    {
      question: "How can I view my attendance history?",
      answer: "Navigate to the Attendance tab to see your complete attendance history with check-in and check-out times.",
    },
    {
      question: "What should I do if I forget my password?",
      answer: "On the login screen, tap 'Forgot Password' and follow the instructions to reset your password via email.",
    },
    {
      question: "How do I update my profile?",
      answer: "Go to Profile section and tap on any field you want to update. Save your changes when done.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <ThemedText type="h2" style={styles.title}>
          Help Center
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textMuted }]}>
          Frequently asked questions
        </ThemedText>

        <Spacer height={Spacing["2xl"]} />

        {faqs.map((faq, index) => (
          <Pressable
            key={index}
            onPress={() => toggleFAQ(index)}
            style={({ pressed }) => [
              styles.faqCard,
              {
                backgroundColor: "#FFFFFF",
                borderColor: "#FFE0CC",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={styles.faqHeader}>
              <ThemedText style={styles.faqQuestion}>{faq.question}</ThemedText>
              <Feather
                name={expandedIndex === index ? "chevron-up" : "chevron-down"}
                size={20}
                color="#FFB380"
              />
            </View>
            {expandedIndex === index && (
              <View style={styles.faqAnswer}>
                <ThemedText style={[styles.answerText, { color: theme.textMuted }]}>
                  {faq.answer}
                </ThemedText>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing["2xl"],
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#424242",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: Spacing.xl,
  },
  faqCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#424242",
  },
  faqAnswer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#FFE0CC",
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

