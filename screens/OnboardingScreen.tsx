import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  ViewToken,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";

const { width } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    icon: "clock",
    title: "Track Attendance",
    description:
      "Check-in and check-out with a single tap. GPS-based attendance tracking for accurate records.",
  },
  {
    id: "2",
    icon: "calendar",
    title: "Manage Leaves",
    description:
      "Apply for leaves, track balances, and get instant approval notifications all in one place.",
  },
  {
    id: "3",
    icon: "check-square",
    title: "Stay Productive",
    description:
      "Manage tasks, view payroll, and stay updated with company announcements effortlessly.",
  },
];

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Onboarding">;
};

export default function OnboardingScreen({
  navigation,
}: OnboardingScreenProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const completeOnboarding = useHRMSStore((state) => state.completeOnboarding);

  const scrollX = useSharedValue(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]) {
        setCurrentIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ 
        index: nextIndex,
        animated: true,
      });
    } else {
      // Last slide - navigate to Login
      completeOnboarding();
      setTimeout(() => {
        navigation.replace("Login");
      }, 300);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    navigation.replace("Login");
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View style={[styles.slide, { width }]}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: Colors.dark.primary },
        ]}
      >
        <Feather name={item.icon} size={60} color="#000000" />
      </View>
      <ThemedText type="h2" style={styles.title}>
        {item.title}
      </ThemedText>
      <ThemedText type="body" style={[styles.description, { color: theme.textMuted }]}>
        {item.description}
      </ThemedText>
    </View>
  );

  const renderDot = (index: number) => {
    const isActive = index === currentIndex;
    return (
      <View
        key={index}
        style={[
          styles.dot,
          {
            backgroundColor: isActive ? Colors.dark.primary : theme.border,
            width: isActive ? 24 : 8,
          },
        ]}
      />
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <ThemedText style={{ color: theme.textMuted }}>Skip</ThemedText>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        scrollEventThrottle={16}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.pagination}>
          {slides.map((_, index) => renderDot(index))}
        </View>

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextButton,
            { backgroundColor: Colors.dark.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <ThemedText style={styles.nextButtonText}>
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          </ThemedText>
          <Feather name="arrow-right" size={20} color="#000000" />
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.xl,
  },
  skipButton: {
    padding: Spacing.sm,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: BorderRadius["3xl"],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["3xl"],
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  description: {
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
});
