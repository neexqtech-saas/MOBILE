import { Platform } from "react-native";

export const Colors = {
  light: {
    primary: "#FFC300",
    primaryDark: "#E6B000",
    text: "#000000",
    textSecondary: "#333333",
    textMuted: "#666666",
    buttonText: "#000000",
    tabIconDefault: "#666666",
    tabIconSelected: "#FFC300",
    link: "#FFC300",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F5F5F5",
    backgroundSecondary: "#EBEBEB",
    backgroundTertiary: "#E0E0E0",
    cardBackground: "#FFFFFF",
    border: "#E0E0E0",
    success: "#22C55E",
    error: "#EF4444",
    warning: "#F59E0B",
    pending: "#FFC300",
  },
  dark: {
    primary: "#FFC300",
    primaryDark: "#E6B000",
    text: "#FFFFFF",
    textSecondary: "#E0E0E0",
    textMuted: "#999999",
    buttonText: "#000000",
    tabIconDefault: "#999999",
    tabIconSelected: "#FFC300",
    link: "#FFC300",
    backgroundRoot: "#000000",
    backgroundDefault: "#1A1A1A",
    backgroundSecondary: "#252525",
    backgroundTertiary: "#333333",
    cardBackground: "#1A1A1A",
    border: "#333333",
    success: "#22C55E",
    error: "#EF4444",
    warning: "#F59E0B",
    pending: "#FFC300",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 52,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
