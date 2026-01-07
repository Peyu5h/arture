import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AssetType } from "@prisma/client";

export interface AssetAnalysis {
  name: string;
  type: AssetType;
  category: string;
  tags: string[];
  theme: string[];
  color?: string;
  description: string;
  fabricMetadata: any;
}

export class AssetAnalyzer {
  private model: ChatGoogleGenerativeAI;
  private embeddings: GoogleGenerativeAIEmbeddings;

  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
    });
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "embedding-001",
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  async analyzeAsset(
    imageUrl: string,
    fileName: string,
    fileSize: number,
    dimensions: { width: number; height: number },
  ): Promise<AssetAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(
        imageUrl,
        fileName,
        fileSize,
        dimensions,
      );

      // Add retry logic for API overload
      let result;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          result = await this.model.invoke(prompt);
          break;
        } catch (error: any) {
          attempts++;
          console.log(`AI analysis attempt ${attempts} failed:`, error.message);

          if (attempts >= maxAttempts) {
            throw error;
          }

          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        }
      }

      if (!result) {
        throw new Error("Failed to get response from model");
      }

      const text = result.content.toString();
      return this.parseAnalysisResult(text);
    } catch (error) {
      console.error("Asset analysis error:", error);
      // Fallback to basic analysis
      return this.generateFallbackAnalysis(fileName, dimensions);
    }
  }

  private buildAnalysisPrompt(
    imageUrl: string,
    fileName: string,
    fileSize: number,
    dimensions: { width: number; height: number },
  ): string {
    return `
    You are an expert graphic designer and asset curator. Analyze this image and provide detailed metadata for a design asset library.

    Image URL: ${imageUrl}
    File Name: ${fileName}
    File Size: ${fileSize} bytes
    Dimensions: ${dimensions.width}x${dimensions.height} pixels

    Please analyze this asset and provide a JSON response with the following structure:

    {
      "name": "Descriptive name for the asset",
      "type": "SHAPE|ICON|FRAME|PLACEHOLDER|BACKGROUND|TEXT_STYLE|DECORATION",
      "category": "Specific category like 'geometric-shapes', 'business-icons', 'borders', 'text-placeholders', etc.",
      "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
      "theme": ["corporate", "creative", "minimal", "vintage", "modern", "playful", "elegant"],
      "color": "dominant color in hex format (e.g., #ff6b6b)",
      "description": "Brief description of what this asset is and how it can be used",
      "fabricMetadata": {
        "type": "fabric.js object type (rect, circle, path, image, etc.)",
        "properties": {
          "fill": "color or gradient",
          "stroke": "border color",
          "strokeWidth": "border width",
          "fontFamily": "font family if text",
          "fontSize": "font size if text",
          "fontWeight": "font weight if text"
        }
      }
    }

    Guidelines:
    - Choose the most appropriate type from the enum
    - Create specific, descriptive categories
    - Include 3-7 relevant tags
    - Select 2-4 theme options
    - Extract the dominant color if present
    - Provide Fabric.js compatible metadata
    - Consider the asset's potential use cases in design
    - Make the name descriptive and searchable
    `;
  }

  private parseAnalysisResult(text: string): AssetAnalysis {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        name: parsed.name,
        type: parsed.type as AssetType,
        category: parsed.category,
        tags: parsed.tags || [],
        theme: parsed.theme || [],
        color: parsed.color,
        description: parsed.description,
        fabricMetadata: parsed.fabricMetadata || {},
      };
    } catch (error) {
      console.error("Failed to parse AI analysis:", error);
      throw new Error("Failed to parse asset analysis");
    }
  }

  private generateFallbackAnalysis(
    fileName: string,
    dimensions: { width: number; height: number },
  ): AssetAnalysis {
    const name = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    const aspectRatio = dimensions.width / dimensions.height;

    let type: AssetType = "ICON";
    let category = "general";
    let tags = ["general", "basic", "default"];
    const theme = ["minimal", "modern"];

    if (aspectRatio > 2 || aspectRatio < 0.5) {
      type = "SHAPE";
      category = "geometric-shapes";
      tags = ["geometric", "shape", "design", "basic"];
    } else if (dimensions.width < 100 && dimensions.height < 100) {
      type = "ICON";
      category = "general-icons";
      tags = ["icon", "small", "symbol", "basic"];
    } else {
      type = "PLACEHOLDER";
      category = "content-placeholders";
      tags = ["placeholder", "content", "layout", "design"];
    }

    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      type,
      category,
      tags,
      theme,
      color: undefined,
      description: `A ${type.toLowerCase()} asset with dimensions ${dimensions.width}x${dimensions.height} pixels. This is a basic design element that can be used in various design projects.`,
      fabricMetadata: {
        type: "image",
        properties: {
          fill: "#000000",
          stroke: "transparent",
          strokeWidth: 0,
        },
      },
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Add retry logic for API overload
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          // Use LangChain's embedQuery method
          const result = await this.embeddings.embedQuery(text);
          return result;
        } catch (error: any) {
          attempts++;
          console.log(
            `Embedding generation attempt ${attempts} failed:`,
            error.message,
          );

          if (attempts >= maxAttempts) {
            throw error;
          }

          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        }
      }

      throw new Error("Failed to generate embedding after all attempts");
    } catch (error) {
      console.error("Embedding generation error:", error);
      throw new Error("Failed to generate embedding");
    }
  }

  async generateAssetDescription(asset: any): Promise<string> {
    const prompt = `
    Generate a comprehensive description for this design asset:

    Name: ${asset.name}
    Type: ${asset.type}
    Category: ${asset.category}
    Tags: ${asset.tags.join(", ")}
    Theme: ${asset.theme.join(", ")}
    Color: ${asset.color || "N/A"}
    Description: ${asset.description}

    Create a detailed description that would be useful for semantic search and AI-powered asset selection.
    `;

    try {
      // Add retry logic for API overload
      let result;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          result = await this.model.invoke(prompt);
          break;
        } catch (error: any) {
          attempts++;
          console.log(
            `Description generation attempt ${attempts} failed:`,
            error.message,
          );

          if (attempts >= maxAttempts) {
            throw error;
          }

          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        }
      }

      if (!result) {
        throw new Error("Failed to get response from model");
      }

      return result.content.toString();
    } catch (error) {
      console.error("Description generation error:", error);
      return asset.description;
    }
  }
}
