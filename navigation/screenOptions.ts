import { Platform } from "react-native";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { isExpoGo } from "@/utils/expoGo";

function isLiquidGlassAvailableSafe(): boolean {
  if (isExpoGo()) return false;
  try {
    const { isLiquidGlassAvailable } = require("expo-glass-effect");
    return isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

interface ScreenOptionsParams {
  theme: {
    backgroundRoot: string;
    text: string;
  };
  isDark: boolean;
  transparent?: boolean;
}

export const getCommonScreenOptions = ({
  theme,
  isDark,
  transparent = true,
}: ScreenOptionsParams): NativeStackNavigationOptions => ({
  headerTitleAlign: "center",
  headerTransparent: transparent,
  headerBlurEffect: isDark ? "dark" : "light",
  headerTintColor: theme.text,
  headerStyle: {
    backgroundColor: Platform.select({
      ios: undefined,
      android: theme.backgroundRoot,
      web: theme.backgroundRoot,
    }),
  },
  gestureEnabled: true,
  gestureDirection: "horizontal",
  fullScreenGestureEnabled: isLiquidGlassAvailableSafe() ? false : true,
  contentStyle: {
    backgroundColor: theme.backgroundRoot,
  },
});
