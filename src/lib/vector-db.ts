import { Pinecone } from "@pinecone-database/pinecone";
import { Asset } from "@prisma/client";

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: any;
}

export interface AssetFilters {
  type?: string;
  category?: string;
  tags?: string[];
  theme?: string[];
  color?: string;
}

export class AssetVectorDB {
  private pinecone: Pinecone;
  private index: any;

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    this.index = this.pinecone.index(
      process.env.PINECONE_INDEX_NAME || "arture-assets",
    );
  }

  private padEmbedding(
    embedding: number[],
    targetDimension: number = 1024,
  ): number[] {
    if (embedding.length === targetDimension) {
      return embedding;
    }

    if (embedding.length > targetDimension) {
      return embedding.slice(0, targetDimension);
    }

    // Pad with zeros to reach target dimension
    return [
      ...embedding,
      ...new Array(targetDimension - embedding.length).fill(0),
    ];
  }

  async addAsset(asset: Asset, embedding: number[]): Promise<void> {
    try {
      // Pad embedding to match index dimension (1024)
      const paddedEmbedding = this.padEmbedding(embedding, 1024);

      await this.index.upsert([
        {
          id: asset.id,
          values: paddedEmbedding,
          metadata: {
            name: asset.name,
            type: asset.type,
            category: asset.category,
            tags: asset.tags,
            theme: asset.theme,
            color: asset.color,
            usageCount: asset.usageCount,
            url: asset.url,
            thumbnail: asset.thumbnail,
          },
        },
      ]);
    } catch (error) {
      console.error("Pinecone upsert error:", error);
      // Don't throw error - just log it and continue
      // This allows the asset to be saved even if vector DB fails
      console.warn(
        "Asset saved to database but vector search may not be available",
      );
    }
  }

  async updateAsset(asset: Asset, embedding: number[]): Promise<void> {
    try {
      await this.index.upsert([
        {
          id: asset.id,
          values: embedding,
          metadata: {
            name: asset.name,
            type: asset.type,
            category: asset.category,
            tags: asset.tags,
            theme: asset.theme,
            color: asset.color,
            usageCount: asset.usageCount,
            url: asset.url,
            thumbnail: asset.thumbnail,
          },
        },
      ]);
    } catch (error) {
      console.error("Pinecone update error:", error);
      throw new Error("Failed to update asset in vector database");
    }
  }

  async deleteAsset(assetId: string): Promise<void> {
    try {
      await this.index.deleteOne(assetId);
    } catch (error) {
      console.error("Pinecone delete error:", error);
      throw new Error("Failed to delete asset from vector database");
    }
  }

  async searchAssets(
    query: string,
    embedding: number[],
    filters?: AssetFilters,
    topK: number = 20,
  ): Promise<VectorSearchResult[]> {
    try {
      const filter: any = {};

      if (filters?.type) {
        filter.type = { $eq: filters.type };
      }

      if (filters?.category) {
        filter.category = { $eq: filters.category };
      }

      if (filters?.tags && filters.tags.length > 0) {
        filter.tags = { $in: filters.tags };
      }

      if (filters?.theme && filters.theme.length > 0) {
        filter.theme = { $in: filters.theme };
      }

      if (filters?.color) {
        filter.color = { $eq: filters.color };
      }

      // Pad query embedding to match index dimension (1024)
      const paddedQueryEmbedding = this.padEmbedding(embedding, 1024);

      const queryRequest: any = {
        vector: paddedQueryEmbedding,
        topK,
        includeMetadata: true,
      };

      if (Object.keys(filter).length > 0) {
        queryRequest.filter = filter;
      }

      const results = await this.index.query(queryRequest);

      return results.matches.map((match: any) => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata,
      }));
    } catch (error) {
      console.error("Pinecone search error:", error);
      throw new Error("Failed to search assets in vector database");
    }
  }

  async findSimilarAssets(
    assetId: string,
    topK: number = 10,
  ): Promise<VectorSearchResult[]> {
    try {
      // First get the asset's vector
      const fetchResult = await this.index.fetch([assetId]);
      if (!fetchResult.vectors[assetId]) {
        throw new Error("Asset not found in vector database");
      }

      const vector = fetchResult.vectors[assetId].values;
      const metadata = fetchResult.vectors[assetId].metadata;

      // Search for similar assets
      const results = await this.index.query({
        vector,
        topK: topK + 1, // +1 to exclude the original asset
        includeMetadata: true,
        filter: {
          id: { $ne: assetId },
        },
      });

      return results.matches.map((match: any) => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata,
      }));
    } catch (error) {
      console.error("Pinecone similar search error:", error);
      throw new Error("Failed to find similar assets");
    }
  }

  async getPopularAssets(topK: number = 20): Promise<VectorSearchResult[]> {
    try {
      // This is a simplified approach - in a real implementation,
      // you might want to use a hybrid search approach
      const dummyVector = new Array(1024).fill(0); // Updated to 1024
      const results = await this.index.query({
        vector: dummyVector,
        topK,
        includeMetadata: true,
        filter: {
          usageCount: { $gte: 1 },
        },
      });

      return results.matches
        .sort(
          (a: any, b: any) =>
            (b.metadata?.usageCount || 0) - (a.metadata?.usageCount || 0),
        )
        .map((match: any) => ({
          id: match.id,
          score: match.score || 0,
          metadata: match.metadata,
        }));
    } catch (error) {
      console.error("Pinecone popular search error:", error);
      throw new Error("Failed to get popular assets");
    }
  }

  async getAssetsByCategory(
    category: string,
    topK: number = 50,
  ): Promise<VectorSearchResult[]> {
    try {
      const dummyVector = new Array(1024).fill(0); // Updated to 1024
      const results = await this.index.query({
        vector: dummyVector,
        topK,
        includeMetadata: true,
        filter: {
          category: { $eq: category },
        },
      });

      return results.matches.map((match: any) => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata,
      }));
    } catch (error) {
      console.error("Pinecone category search error:", error);
      throw new Error("Failed to get assets by category");
    }
  }

  async getAssetsByType(
    type: string,
    topK: number = 50,
  ): Promise<VectorSearchResult[]> {
    try {
      const dummyVector = new Array(1024).fill(0); // Updated to 1024
      const results = await this.index.query({
        vector: dummyVector,
        topK,
        includeMetadata: true,
        filter: {
          type: { $eq: type },
        },
      });

      return results.matches.map((match: any) => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata,
      }));
    } catch (error) {
      console.error("Pinecone type search error:", error);
      throw new Error("Failed to get assets by type");
    }
  }
}
