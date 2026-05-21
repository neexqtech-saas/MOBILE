import Constants from "expo-constants";

/** True when app runs inside Expo Go (not dev build / standalone). */
export function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}
