declare module "expo-image-manipulator" {
  export enum SaveFormat {
    JPEG = "jpeg",
    PNG = "png",
    WEBP = "webp",
  }

  export function manipulateAsync(
    uri: string,
    actions: { resize?: { width?: number; height?: number } }[],
    options?: {
      compress?: number;
      format?: SaveFormat;
      base64?: boolean;
    }
  ): Promise<{ uri: string; width: number; height: number; base64?: string }>;
}
