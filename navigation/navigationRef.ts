import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef<any>();

export function navigateToMyMaterials() {
  if (navigationRef.isReady()) {
    navigationRef.navigate("HomeTab", { screen: "MyMaterials" });
  }
}
