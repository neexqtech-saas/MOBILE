/**
 * Comprehensive Face Detection Utility
 * Detects real faces and prevents fake selfies (screenshots, objects, etc.)
 * Works for both web and mobile platforms
 */

export interface FaceDetectionResult {
  valid: boolean;
  error?: string;
  confidence?: number;
  detectedFace?: boolean;
  isLive?: boolean;
}

/**
 * Comprehensive face detection with multiple validation methods
 */
export const validateFaceImage = async (base64Image: string): Promise<FaceDetectionResult> => {
  return new Promise((resolve) => {
    try {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        // Web platform - comprehensive validation
        validateFaceImageWeb(base64Image, resolve);
      } else {
        // Mobile platform - use available validation
        validateFaceImageMobile(base64Image, resolve);
      }
    } catch (error) {
      console.error('Face detection error:', error);
      resolve({ valid: false, error: 'Face detection failed. Please try again.' });
    }
  });
};

/**
 * Web platform face detection with multiple methods
 */
const validateFaceImageWeb = (
  base64Image: string,
  resolve: (result: FaceDetectionResult) => void
) => {
  const img = new Image();
  
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve({ valid: false, error: 'Image processing failed' });
      return;
    }

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // ========== CHECK 1: Image Dimensions ==========
    if (img.width < 200 || img.height < 200) {
      resolve({ valid: false, error: 'Image is too small. Please capture a clear photo of your face.' });
      return;
    }

    // ========== CHECK 2: Overall Brightness (Dark/Light Detection) ==========
    const brightnessResult = detectBrightness(data, canvas.width, canvas.height);
    const isLowLight = brightnessResult.avgBrightness < 50; // More lenient for low light
    const isVeryDark = brightnessResult.avgBrightness < 15; // Only reject extremely dark (almost black)
    const isOverExposed = brightnessResult.avgBrightness > 240; // Slightly more lenient

    // Only reject if it's extremely dark (almost black image)
    if (isVeryDark) {
      resolve({ valid: false, error: 'Image is too dark. Please ensure your face is visible with some lighting.' });
      return;
    }

    if (isOverExposed) {
      resolve({ valid: false, error: 'Image is too bright. Please reduce lighting or move to a better location.' });
      return;
    }

    // ========== CHECK 3: Screenshot/Screen Detection (LENIENT - Only obvious screenshots) ==========
    // Only reject if it's VERY obviously a screenshot (very high confidence)
    const screenshotCheck = detectScreenshot(data, canvas.width, canvas.height, isLowLight);
    if (screenshotCheck.isScreenshot && screenshotCheck.confidence > 0.85) {
      // Only reject if confidence is very high (85%+) - obvious screenshot
      resolve({ valid: false, error: 'Please capture a live photo with your face, not a screenshot or photo of a mobile screen.' });
      return;
    }

    // ========== CHECK 4: Face Detection - Multiple Methods (LENIENT FOR DARK) ==========
    const faceDetection = detectFaceMultipleMethods(data, canvas.width, canvas.height, isLowLight);
    
    // Very lenient confidence threshold - especially in dark
    const minConfidence = isLowLight ? 0.25 : 0.35; // Much more lenient
    if (!faceDetection.hasFace || faceDetection.confidence < minConfidence) {
      if (isLowLight) {
        resolve({ valid: false, error: 'Face not detected. Please ensure your face is visible in the camera frame.' });
      } else {
        resolve({ valid: false, error: 'Face not detected. Please ensure your face is clearly visible in the center of the camera.' });
      }
      return;
    }

    // ========== CHECK 5: Object Detection (Not a Face) - STRICT ==========
    // This is important - ensure it's a human face, not an object
    const objectCheck = detectObjectNotFace(data, canvas.width, canvas.height, isLowLight);
    if (objectCheck.isObject && objectCheck.confidence > 0.7) {
      // Only reject if high confidence it's an object
      resolve({ valid: false, error: 'Please capture a photo of your face, not an object or other item.' });
      return;
    }

    // ========== CHECK 6: Image Quality - Blur Detection ==========
    if (!isLowLight) {
      const blurCheck = detectBlur(data, canvas.width, canvas.height);
      if (blurCheck.isBlurry) {
        resolve({ valid: false, error: 'Image is too blurry. Please hold the camera steady and ensure good lighting.' });
        return;
      }
    }

    // ========== CHECK 7: Face Position and Size ==========
    const facePosition = checkFacePosition(faceDetection, canvas.width, canvas.height);
    if (!facePosition.isCentered) {
      resolve({ valid: false, error: 'Please position your face in the center of the camera frame.' });
      return;
    }

    // ========== CHECK 8: Liveness Detection (Basic) ==========
    const livenessCheck = detectLiveness(data, canvas.width, canvas.height, isLowLight);
    if (!livenessCheck.isLive) {
      resolve({ valid: false, error: 'Please capture a live photo. Static images or photos of photos are not allowed.' });
      return;
    }

    // All checks passed
    resolve({
      valid: true,
      confidence: faceDetection.confidence,
      detectedFace: true,
      isLive: livenessCheck.isLive,
    });
  };

  img.onerror = () => {
    resolve({ valid: false, error: 'Invalid image. Please try again.' });
  };

  img.src = base64Image;
};

/**
 * Mobile platform face detection
 */
const validateFaceImageMobile = (
  base64Image: string,
  resolve: (result: FaceDetectionResult) => void
) => {
  // For mobile, we can still do some validation using canvas if available
  // Try to use web validation if canvas is available (React Native Web)
  if (typeof document !== 'undefined' && typeof Image !== 'undefined') {
    // Use web validation for React Native Web
    validateFaceImageWeb(base64Image, resolve);
  } else {
    // For native mobile, we need to be strict
    // Reject if we can't validate - backend must validate
    resolve({ 
      valid: false, 
      error: 'Face detection requires better image quality. Please ensure your face is clearly visible and well-lit.',
      detectedFace: false 
    });
  }
};

/**
 * Detect overall image brightness
 */
const detectBrightness = (
  data: Uint8ClampedArray,
  width: number,
  height: number
): { avgBrightness: number; minBrightness: number; maxBrightness: number } => {
  let totalBrightness = 0;
  let minBrightness = 255;
  let maxBrightness = 0;
  const stepX = Math.max(1, Math.floor(width / 20));
  const stepY = Math.max(1, Math.floor(height / 20));
  let sampleCount = 0;

  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = r * 0.299 + g * 0.587 + b * 0.114;
      
      totalBrightness += brightness;
      minBrightness = Math.min(minBrightness, brightness);
      maxBrightness = Math.max(maxBrightness, brightness);
      sampleCount++;
    }
  }

  return {
    avgBrightness: totalBrightness / sampleCount,
    minBrightness,
    maxBrightness,
  };
};

/**
 * Detect if image is a screenshot or photo of a screen (ENHANCED)
 */
const detectScreenshot = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  isLowLight: boolean
): { isScreenshot: boolean; confidence: number } => {
  let detectionScore = 0;
  const maxScore = 5; // Multiple checks, each adds to score

  // Check 1: Edge uniformity (screenshots often have uniform edges)
  const edgeSampleSize = 20; // Increased samples
  const topEdge: number[] = [];
  const bottomEdge: number[] = [];
  const leftEdge: number[] = [];
  const rightEdge: number[] = [];

  for (let i = 0; i < edgeSampleSize; i++) {
    // Top edge
    const topIdx = (0 * width + i) * 4;
    topEdge.push(data[topIdx], data[topIdx + 1], data[topIdx + 2]);

    // Bottom edge
    const bottomIdx = ((height - 1) * width + i) * 4;
    bottomEdge.push(data[bottomIdx], data[bottomIdx + 1], data[bottomIdx + 2]);

    // Left edge
    const leftIdx = (i * width + 0) * 4;
    leftEdge.push(data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]);

    // Right edge
    const rightIdx = (i * width + (width - 1)) * 4;
    rightEdge.push(data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]);
  }

  const checkUniformity = (edge: number[]): boolean => {
    if (edge.length < 9) return false;
    const avg = edge.reduce((a, b) => a + b, 0) / edge.length;
    const variance = edge.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / edge.length;
    return variance < 60; // Slightly relaxed but still strict
  };

  const edgesUniform = 
    checkUniformity(topEdge) && 
    checkUniformity(bottomEdge) && 
    checkUniformity(leftEdge) && 
    checkUniformity(rightEdge);

  if (edgesUniform) detectionScore += 2;

  // Check 2: Color patterns typical of screens (RGB subpixel patterns)
  let screenPatternCount = 0;
  let highBrightnessCount = 0;
  let lowVariationCount = 0;
  const patternSamples = 100; // Increased samples
  for (let i = 0; i < patternSamples; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const brightness = r * 0.299 + g * 0.587 + b * 0.114;
    
    // Screens often have very specific RGB patterns (very similar RGB values)
    if (Math.abs(r - g) < 8 && Math.abs(g - b) < 8 && r > 180) {
      screenPatternCount++;
    }
    
    // Screens often have high brightness areas
    if (brightness > 200) {
      highBrightnessCount++;
    }
    
    // Check nearby pixels for low variation (screen characteristic)
    if (x < width - 1 && y < height - 1) {
      const nextIdx = (y * width + (x + 1)) * 4;
      const nextR = data[nextIdx];
      const nextG = data[nextIdx + 1];
      const nextB = data[nextIdx + 2];
      const variation = Math.abs(r - nextR) + Math.abs(g - nextG) + Math.abs(b - nextB);
      if (variation < 10) {
        lowVariationCount++;
      }
    }
  }

  const screenPatternRatio = screenPatternCount / patternSamples;
  const highBrightnessRatio = highBrightnessCount / patternSamples;
  const lowVariationRatio = lowVariationCount / patternSamples;

  if (screenPatternRatio > 0.25) detectionScore += 1.5;
  if (highBrightnessRatio > 0.4 && !isLowLight) detectionScore += 1;
  if (lowVariationRatio > 0.3) detectionScore += 0.5;

  // Check 3: Check for rectangular UI elements (common in screenshots)
  let rectangularPatternCount = 0;
  const rectSamples = 30;
  for (let i = 0; i < rectSamples; i++) {
    const x = Math.floor(Math.random() * (width - 10));
    const y = Math.floor(Math.random() * (height - 10));
    
    // Check for horizontal lines (UI elements)
    let horizontalLine = true;
    for (let dx = 0; dx < 10; dx++) {
      const idx1 = (y * width + (x + dx)) * 4;
      const idx2 = (y * width + (x + dx + 1)) * 4;
      const diff = Math.abs(data[idx1] - data[idx2]) + Math.abs(data[idx1 + 1] - data[idx2 + 1]) + Math.abs(data[idx1 + 2] - data[idx2 + 2]);
      if (diff > 15) {
        horizontalLine = false;
        break;
      }
    }
    
    if (horizontalLine) rectangularPatternCount++;
  }

  if (rectangularPatternCount / rectSamples > 0.2) detectionScore += 1;

  // Check 4: Check for lack of natural gradients (screens have sharp transitions)
  let sharpTransitionCount = 0;
  const gradientSamples = 50;
  for (let i = 0; i < gradientSamples; i++) {
    const x = Math.floor(Math.random() * (width - 2));
    const y = Math.floor(Math.random() * (height - 2));
    const idx1 = (y * width + x) * 4;
    const idx2 = (y * width + (x + 1)) * 4;
    
    const brightness1 = data[idx1] * 0.299 + data[idx1 + 1] * 0.587 + data[idx1 + 2] * 0.114;
    const brightness2 = data[idx2] * 0.299 + data[idx2 + 1] * 0.587 + data[idx2 + 2] * 0.114;
    const transition = Math.abs(brightness1 - brightness2);
    
    // Screens have very sharp transitions (no gradual gradients)
    if (transition > 100) {
      sharpTransitionCount++;
    }
  }

  if (sharpTransitionCount / gradientSamples > 0.3) detectionScore += 0.5;

  // If score is high enough, it's likely a screenshot
  // Only flag as screenshot if score is VERY high (obvious screenshot)
  const isScreenshot = detectionScore >= 4.0; // Much more lenient - only obvious screenshots

  return {
    isScreenshot,
    confidence: Math.min(detectionScore / maxScore, 1),
  };
};

/**
 * Detect face using multiple methods
 */
const detectFaceMultipleMethods = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  isLowLight: boolean
): { hasFace: boolean; confidence: number; centerX?: number; centerY?: number; faceSize?: number } => {
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const checkSize = Math.min(width, height) * 0.5; // Check larger area
  const startX = Math.max(0, centerX - checkSize / 2);
  const startY = Math.max(0, centerY - checkSize / 2);
  const endX = Math.min(width, centerX + checkSize / 2);
  const endY = Math.min(height, centerY + checkSize / 2);

  let skinTonePixels = 0;
  let totalPixels = 0;
  let eyeLikePixels = 0;
  let faceStructureScore = 0;

  // Method 1: Skin tone detection
  for (let y = startY; y < endY; y += 3) {
    for (let x = startX; x < endX; x += 3) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = r * 0.299 + g * 0.587 + b * 0.114;

      let isSkinTone = false;
      if (isLowLight) {
        // More realistic skin tone detection for low light
        isSkinTone = 
          r > 20 && r < 255 &&
          g > 12 && g < 240 &&
          b > 8 && b < 200 &&
          brightness > 12 && // More lenient
          (r > g || Math.abs(r - g) < 30); // Allow more variation in low light
      } else {
        // Standard skin tone detection
        isSkinTone = 
          r > 90 && r < 255 && // Slightly more lenient
          g > 35 && g < 240 &&
          b > 18 && b < 200 &&
          r > g && r > b &&
          Math.abs(r - g) > 12 && // Slightly more lenient
          brightness > 45; // Slightly more lenient
      }

      if (isSkinTone) {
        skinTonePixels++;
      }
      totalPixels++;
    }
  }

  const skinToneRatio = skinTonePixels / totalPixels;
  // More lenient in dark conditions - allow lower skin tone ratio
  const minSkinToneRatio = isLowLight ? 0.08 : 0.16; // Even more lenient for dark light

  // Method 2: Eye detection (darker regions in upper face area) - ENHANCED
  const eyeAreaY = startY + (endY - startY) * 0.15; // Slightly higher
  const eyeAreaHeight = (endY - startY) * 0.35; // Larger area
  let eyeRegionCount = 0;
  let totalEyePixels = 0;
  
  for (let y = eyeAreaY; y < eyeAreaY + eyeAreaHeight; y += 1) { // Denser sampling
    for (let x = startX; x < endX; x += 1) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = r * 0.299 + g * 0.587 + b * 0.114;
      
      // Realistic eye detection - darker regions with specific characteristics
      const eyeBrightnessThreshold = isLowLight ? 140 : 100; // Very lenient in dark light
      const eyeMinBrightness = isLowLight ? 5 : 15; // Allow very dark eyes in low light
      
      if (brightness < eyeBrightnessThreshold && brightness > eyeMinBrightness && r < 150 && g < 150 && b < 150) {
        eyeLikePixels++;
        // Check for eye-like patterns (circular darker regions) - only in normal light
        if (!isLowLight && x > startX + 5 && x < endX - 5 && y > eyeAreaY + 5 && y < eyeAreaY + eyeAreaHeight - 5) {
          const surroundingBrightness = [];
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const surIdx = ((y + dy) * width + (x + dx)) * 4;
              const surBrightness = data[surIdx] * 0.299 + data[surIdx + 1] * 0.587 + data[surIdx + 2] * 0.114;
              surroundingBrightness.push(surBrightness);
            }
          }
          const avgSurrounding = surroundingBrightness.reduce((a, b) => a + b, 0) / surroundingBrightness.length;
          // Eye should be darker than surrounding area
          if (brightness < avgSurrounding - 15) { // More lenient threshold
            eyeRegionCount++;
          }
        }
      }
      totalEyePixels++;
    }
  }
  
  const eyeRatio = eyeLikePixels / totalEyePixels;
  const eyeRegionRatio = eyeRegionCount / totalEyePixels;
  const minEyeRatio = isLowLight ? 0.01 : 0.04; // Very lenient in dark light - eyes almost optional

  // Method 3: Face structure (symmetry check)
  const faceCenterX = centerX;
  const symmetrySamples = 20;
  let symmetryScore = 0;
  for (let i = 0; i < symmetrySamples; i++) {
    const y = startY + Math.floor((endY - startY) * Math.random());
    const leftX = faceCenterX - Math.floor((faceCenterX - startX) * Math.random());
    const rightX = faceCenterX + Math.floor((endX - faceCenterX) * Math.random());
    
    if (leftX >= startX && rightX < endX) {
      const leftIdx = (y * width + leftX) * 4;
      const rightIdx = (y * width + rightX) * 4;
      const leftBrightness = data[leftIdx] * 0.299 + data[leftIdx + 1] * 0.587 + data[leftIdx + 2] * 0.114;
      const rightBrightness = data[rightIdx] * 0.299 + data[rightIdx + 1] * 0.587 + data[rightIdx + 2] * 0.114;
      const diff = Math.abs(leftBrightness - rightBrightness);
      if (diff < 30) {
        symmetryScore++;
      }
    }
  }

  faceStructureScore = symmetryScore / symmetrySamples;

  // Very lenient: Require skin tone, eyes are optional especially in dark
  const hasSkinTone = skinToneRatio >= minSkinToneRatio;
  const hasEyes = eyeRatio >= minEyeRatio || (isLowLight && eyeRatio >= 0.003) || eyeRegionRatio >= 0.003;
  // In dark light, only skin tone matters, eyes are completely optional
  const hasFace = hasSkinTone && (hasEyes || isLowLight || skinToneRatio >= minSkinToneRatio * 1.2); // Very lenient
  
  // Calculate confidence realistically
  const skinConfidence = Math.min(skinToneRatio / minSkinToneRatio, 1);
  const eyeConfidence = isLowLight 
    ? Math.min((eyeRatio / Math.max(minEyeRatio, 0.01)) * 1.5, 1) 
    : Math.min((eyeRatio / minEyeRatio) * 2, 1);
  const structureConfidence = faceStructureScore;
  
  // Weighted confidence - adjust for dark light (very lenient)
  const skinWeight = isLowLight ? 0.8 : 0.5; // Skin tone is most important in dark
  const eyeWeight = isLowLight ? 0.05 : 0.3; // Eyes almost irrelevant in dark
  const structureWeight = isLowLight ? 0.15 : 0.2;
  const confidence = (skinConfidence * skinWeight) + (eyeConfidence * eyeWeight) + (structureConfidence * structureWeight);
  
  // Additional check: Face must have reasonable size in center (very lenient)
  const faceSizeRatio = checkSize / Math.min(width, height);
  const hasReasonableSize = faceSizeRatio > 0.20; // Very lenient - 20% for dark conditions
  
  // Very lenient confidence threshold for dark light
  const minConfidence = isLowLight ? 0.25 : 0.35; // Much lower threshold for dark light
  const finalHasFace = hasFace && hasReasonableSize && confidence >= minConfidence;

  return {
    hasFace: finalHasFace,
    confidence: Math.min(confidence, 1),
    centerX: finalHasFace ? centerX : undefined,
    centerY: finalHasFace ? centerY : undefined,
    faceSize: finalHasFace ? checkSize : undefined,
  };
};

/**
 * Detect if image contains objects instead of a face
 */
const detectObjectNotFace = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  isLowLight: boolean
): { isObject: boolean; confidence: number } => {
  // Check for geometric patterns (objects often have sharp edges)
  let sharpEdgeCount = 0;
  const edgeSamples = 100;
  
  for (let i = 0; i < edgeSamples; i++) {
    const x = Math.floor(Math.random() * (width - 2));
    const y = Math.floor(Math.random() * (height - 2));
    const idx = (y * width + x) * 4;
    const nextXIdx = (y * width + (x + 1)) * 4;
    const nextYIdx = ((y + 1) * width + x) * 4;

    const currentBrightness = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
    const nextXBrightness = data[nextXIdx] * 0.299 + data[nextXIdx + 1] * 0.587 + data[nextXIdx + 2] * 0.114;
    const nextYBrightness = data[nextYIdx] * 0.299 + data[nextYIdx + 1] * 0.587 + data[nextYIdx + 2] * 0.114;

    const edgeX = Math.abs(currentBrightness - nextXBrightness);
    const edgeY = Math.abs(currentBrightness - nextYBrightness);

    if (edgeX > 80 || edgeY > 80) {
      sharpEdgeCount++;
    }
  }

  const sharpEdgeRatio = sharpEdgeCount / edgeSamples;
  // Too many sharp edges might indicate an object, not a face
  // Much more lenient - only flag if very high ratio (obvious object)
  const isObject = sharpEdgeRatio > 0.6 && !isLowLight; // Very lenient - was 0.4

  return {
    isObject,
    confidence: sharpEdgeRatio,
  };
};

/**
 * Detect image blur
 */
const detectBlur = (
  data: Uint8ClampedArray,
  width: number,
  height: number
): { isBlurry: boolean; blurScore: number } => {
  let blurScore = 0;
  const blurSampleCount = 150;
  
  for (let i = 0; i < blurSampleCount; i++) {
    const x = Math.floor(Math.random() * (width - 2));
    const y = Math.floor(Math.random() * (height - 2));
    const idx = (y * width + x) * 4;
    const nextIdx = (y * width + (x + 1)) * 4;

    const diff = 
      Math.abs(data[idx] - data[nextIdx]) +
      Math.abs(data[idx + 1] - data[nextIdx + 1]) +
      Math.abs(data[idx + 2] - data[nextIdx + 2]);
    blurScore += diff;
  }

  const avgBlur = blurScore / blurSampleCount;
  const isBlurry = avgBlur < 10;

  return {
    isBlurry,
    blurScore: avgBlur,
  };
};

/**
 * Check if face is properly positioned
 */
const checkFacePosition = (
  faceDetection: { centerX?: number; centerY?: number; faceSize?: number },
  width: number,
  height: number
): { isCentered: boolean; offsetX?: number; offsetY?: number } => {
  if (!faceDetection.centerX || !faceDetection.centerY) {
    return { isCentered: false };
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const offsetX = Math.abs(faceDetection.centerX - centerX) / width;
  const offsetY = Math.abs(faceDetection.centerY - centerY) / height;

  // Face should be within 30% of center
  const isCentered = offsetX < 0.3 && offsetY < 0.3;

  return {
    isCentered,
    offsetX,
    offsetY,
  };
};

/**
 * Basic liveness detection
 */
const detectLiveness = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  isLowLight: boolean
): { isLive: boolean; confidence: number } => {
  // Method 1: Check for natural variation (live photos have more variation)
  let variationScore = 0;
  const variationSamples = 50;
  
  for (let i = 0; i < variationSamples; i++) {
    const x1 = Math.floor(Math.random() * width);
    const y1 = Math.floor(Math.random() * height);
    const x2 = Math.floor(Math.random() * width);
    const y2 = Math.floor(Math.random() * height);
    
    const idx1 = (y1 * width + x1) * 4;
    const idx2 = (y2 * width + x2) * 4;
    
    const brightness1 = data[idx1] * 0.299 + data[idx1 + 1] * 0.587 + data[idx1 + 2] * 0.114;
    const brightness2 = data[idx2] * 0.299 + data[idx2 + 1] * 0.587 + data[idx2 + 2] * 0.114;
    
    const variation = Math.abs(brightness1 - brightness2);
    if (variation > 20) {
      variationScore++;
    }
  }

  const variationRatio = variationScore / variationSamples;
  // Natural photos have good variation, static images or photos of photos have less
  const isLive = variationRatio > 0.3 || isLowLight; // More lenient in low light

  return {
    isLive,
    confidence: variationRatio,
  };
};

