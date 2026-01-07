import React from "react";
import { View, StyleSheet, Pressable, Linking, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";

export default function ContactUsScreen() {
  const { theme } = useTheme();

  const contactMethods = [
    {
      icon: "mail" as const,
      title: "Email",
      subtitle: "neexqtech@gmail.com",
      onPress: () => Linking.openURL("mailto:neexqtech@gmail.com"),
    },
    {
      icon: "phone" as const,
      title: "Phone",
      subtitle: "+91 7621920215",
      onPress: () => Linking.openURL("tel:+917621920215"),
    },
    {
      icon: "message-circle" as const,
      title: "Live Chat",
      subtitle: "Chat on WhatsApp",
      onPress: () => {
        const phoneNumber = "917621920215"; // +91 7621920215 without + and spaces
        const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
        const webWhatsappUrl = `https://wa.me/${phoneNumber}`;
        
        // Try to open WhatsApp app first, fallback to web
        Linking.canOpenURL(whatsappUrl)
          .then((supported) => {
            if (supported) {
              return Linking.openURL(whatsappUrl);
            } else {
              return Linking.openURL(webWhatsappUrl);
            }
          })
          .catch((err) => {
            console.error("Error opening WhatsApp:", err);
            // Fallback to web WhatsApp
            Linking.openURL(webWhatsappUrl).catch((error) => {
              Alert.alert("Error", "Unable to open WhatsApp. Please install WhatsApp or try again later.");
            });
          });
      },
    },
  ];

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <ThemedText type="h2" style={styles.title}>
          Contact Us
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textMuted }]}>
          Get in touch with our support team
        </ThemedText>

        <Spacer height={Spacing["2xl"]} />

        {contactMethods.map((method, index) => (
          <Pressable
            key={index}
            onPress={method.onPress}
            style={({ pressed }) => [
              styles.contactCard,
              {
                backgroundColor: "#FFFFFF",
                borderColor: "#FFE0CC",
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={[styles.iconContainer, { backgroundColor: "#FFE8CC" }]}>
              <Feather name={method.icon} size={24} color="#FFB380" />
            </View>
            <View style={styles.contactInfo}>
              <ThemedText style={styles.contactTitle}>{method.title}</ThemedText>
              <ThemedText style={[styles.contactSubtitle, { color: theme.textMuted }]}>
                {method.subtitle}
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textMuted} />
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
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
  },
});

