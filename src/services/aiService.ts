import { GoogleGenAI } from "@google/genai";

export type RestorationType = 'full' | 'colorize' | 'sharpen' | 'repair';

export interface RestorationOptions {
  type: RestorationType;
  enhanceFace: boolean;
  upscale: boolean;
}

export async function restorePhoto(
  base64Image: string, 
  options: RestorationOptions, 
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1"
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  // Extract mime type and base64 data
  const mimeType = base64Image.split(';')[0].split(':')[1];
  const imageData = base64Image.split(',')[1];

  let prompt = "";
  
  switch (options.type) {
    case 'colorize':
      prompt = "Colorize this black and white photo with realistic and natural colors. Maintain original details and dimensions exactly.";
      break;
    case 'sharpen':
      prompt = "Professional photo enhancement: Sharpen this blurry image, reconstruct lost details in eyes, skin texture, and hair. Remove motion blur and focus issues while maintaining a natural look and original image structure.";
      break;
    case 'repair':
      prompt = "Advanced photo repair: Patch and fix all quality issues including pixelation, compression artifacts, scratches, and physical damage. Use high-quality inpainting to reconstruct missing areas seamlessly while keeping the original image size and layout.";
      break;
    default:
      prompt = "Ultra-high quality photo restoration and enhancement: Perform deep patching to fix pixelation and artifacts. Colorize naturally, remove all noise, repair every scratch/tear, and perform professional face reconstruction (eyes, nose, mouth). Sharpen the entire image and enhance background details to a professional studio quality while strictly preserving the original identity, dimensions, and layout.";
  }

  if (options.enhanceFace) {
    prompt += " Pay extra attention to facial details, specifically making the eyes, nose, and mouth clear, sharp, and highly detailed while preserving the original likeness and identity.";
  }

  if (options.upscale) {
    prompt += " Increase the resolution and overall quality of the image.";
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { inlineData: { data: imageData, mimeType } },
        { text: prompt }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated in the response.");
}
