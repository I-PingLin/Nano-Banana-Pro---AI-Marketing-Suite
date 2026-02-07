
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, Chat } from "@google/genai";

export interface EmailCampaign {
  subjectLines: string[];
  body: string;
  targetAudience: string;
  tone: string;
  visualPrompt: string;
}

@Injectable({ providedIn: 'root' })
export class AIService {
  private ai: GoogleGenAI;
  private chatInstance?: Chat;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: (process as any).env.API_KEY });
  }

  async generateCampaign(prompt: string): Promise<EmailCampaign> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a complete email marketing campaign based on this prompt: ${prompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subjectLines: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Three catchy subject lines."
            },
            body: {
              type: Type.STRING,
              description: "The HTML or text content of the email body."
            },
            targetAudience: {
              type: Type.STRING,
              description: "Brief description of the target audience."
            },
            tone: {
              type: Type.STRING,
              description: "The tone used in the campaign."
            },
            visualPrompt: {
              type: Type.STRING,
              description: "A detailed prompt for generating a hero image for this email."
            }
          },
          propertyOrdering: ["subjectLines", "body", "targetAudience", "tone", "visualPrompt"]
        }
      }
    });

    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse campaign JSON", e);
      throw new Error("Could not parse AI response.");
    }
  }

  async generateImage(prompt: string, size: string): Promise<string> {
    // Note: The SDK currently uses aspectRatio in its config rather than explicit resolution labels.
    // We will use the 'imagen-4.0-generate-001' model as instructed.
    const response = await this.ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `${prompt}, high resolution, professional photography, marketing style, ${size}`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9'
      }
    });

    return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
  }

  getChat() {
    if (!this.chatInstance) {
      this.chatInstance = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are an expert marketing consultant for Nano Banana Pro. Help users optimize their email campaigns.'
        }
      });
    }
    return this.chatInstance;
  }
}
