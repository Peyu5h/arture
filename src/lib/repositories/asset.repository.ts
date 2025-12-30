import { prisma } from "~/lib/prisma";
import { Asset, AssetType } from "@prisma/client";

export interface CreateAssetData {
  name: string;
  type: AssetType;
  category: string;
  tags: string[];
  theme: string[];
  color?: string;
  size: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  url: string;
  thumbnail: string;
  metadata: any;
  uploadedBy?: string;
  isPublic?: boolean;
}

export interface AssetFilters {
  type?: AssetType;
  category?: string;
  tags?: string[];
  theme?: string[];
  color?: string;
  search?: string;
  isPublic?: boolean;
}

export class AssetRepository {
  async create(data: CreateAssetData): Promise<Asset> {
    return await prisma.asset.create({
      data: {
        ...data,
        size: data.size as any,
        metadata: data.metadata as any,
        isPublic: data.isPublic ?? true,
      },
    });
  }

  async findById(id: string): Promise<Asset | null> {
    return await prisma.asset.findUnique({
      where: { id },
    });
  }

  async findPublicAssets(filters?: AssetFilters): Promise<Asset[]> {
    const where: any = {
      isPublic: true,
    };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters?.theme && filters.theme.length > 0) {
      where.theme = {
        hasSome: filters.theme,
      };
    }

    if (filters?.color) {
      where.color = filters.color;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { category: { contains: filters.search, mode: "insensitive" } },
        { tags: { hasSome: [filters.search] } },
        { theme: { hasSome: [filters.search] } },
      ];
    }

    return await prisma.asset.findMany({
      where,
      orderBy: { usageCount: "desc" },
    });
  }

  async findAll(filters?: AssetFilters): Promise<Asset[]> {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters?.theme && filters.theme.length > 0) {
      where.theme = {
        hasSome: filters.theme,
      };
    }

    if (filters?.color) {
      where.color = filters.color;
    }

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { category: { contains: filters.search, mode: "insensitive" } },
        { tags: { hasSome: [filters.search] } },
        { theme: { hasSome: [filters.search] } },
      ];
    }

    return await prisma.asset.findMany({
      where,
      orderBy: { usageCount: "desc" },
    });
  }

  async update(id: string, data: Partial<CreateAssetData>): Promise<Asset> {
    return await prisma.asset.update({
      where: { id },
      data: {
        ...data,
        ...(data.size && { size: data.size as any }),
        ...(data.metadata && { metadata: data.metadata as any }),
      },
    });
  }

  async delete(id: string): Promise<Asset> {
    return await prisma.asset.delete({
      where: { id },
    });
  }

  async incrementUsage(id: string): Promise<Asset> {
    return await prisma.asset.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }

  async getPopularAssets(limit: number = 20): Promise<Asset[]> {
    return await prisma.asset.findMany({
      where: { isPublic: true },
      orderBy: { usageCount: "desc" },
      take: limit,
    });
  }

  async getAssetsByCategory(category: string): Promise<Asset[]> {
    return await prisma.asset.findMany({
      where: {
        category,
        isPublic: true,
      },
      orderBy: { usageCount: "desc" },
    });
  }

  async getAssetsByType(type: AssetType): Promise<Asset[]> {
    return await prisma.asset.findMany({
      where: {
        type,
        isPublic: true,
      },
      orderBy: { usageCount: "desc" },
    });
  }

  async searchAssets(query: string): Promise<Asset[]> {
    return await prisma.asset.findMany({
      where: {
        isPublic: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          { tags: { hasSome: [query] } },
          { theme: { hasSome: [query] } },
        ],
      },
      orderBy: { usageCount: "desc" },
    });
  }

  // fuzzy search with levenshtein distance for typo tolerance
  async fuzzySearch(
    query: string,
    type?: string,
    limit: number = 50
  ): Promise<Asset[]> {
    const { distance } = await import("fastest-levenshtein");
    const queryLower = query.toLowerCase();

    // fetch all assets of type (cached in production)
    const allAssets = await prisma.asset.findMany({
      where: {
        isPublic: true,
        ...(type ? { type: type as AssetType } : {}),
      },
      orderBy: { usageCount: "desc" },
    });

    // calculate similarity scores
    const scored = allAssets
      .map((asset) => {
        const nameLower = asset.name.toLowerCase().replace(/_/g, " ");
        const words = nameLower.split(" ");

        // check exact contains first
        if (nameLower.includes(queryLower)) {
          return { asset, score: 1.0 };
        }

        // check each word for fuzzy match
        let bestScore = 0;
        for (const word of words) {
          const maxLen = Math.max(word.length, queryLower.length);
          if (maxLen === 0) continue;
          const dist = distance(word, queryLower);
          const similarity = 1 - dist / maxLen;
          bestScore = Math.max(bestScore, similarity);
        }

        // also check tags
        for (const tag of asset.tags) {
          const tagLower = tag.toLowerCase();
          if (tagLower.includes(queryLower)) {
            bestScore = Math.max(bestScore, 0.95);
          } else {
            const maxLen = Math.max(tagLower.length, queryLower.length);
            if (maxLen > 0) {
              const dist = distance(tagLower, queryLower);
              const similarity = 1 - dist / maxLen;
              bestScore = Math.max(bestScore, similarity);
            }
          }
        }

        return { asset, score: bestScore };
      })
      .filter((item) => item.score >= 0.6) // 60% threshold (allows 1-2 typos)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map((s) => s.asset);
  }

  async addAssetToProject(
    projectId: string,
    assetId: string,
    usageData: any,
  ): Promise<void> {
    await prisma.projectAsset.upsert({
      where: {
        projectId_assetId: {
          projectId,
          assetId,
        },
      },
      update: {
        usageData: usageData as any,
      },
      create: {
        projectId,
        assetId,
        usageData: usageData as any,
      },
    });

    await this.incrementUsage(assetId);
  }

  async getProjectAssets(projectId: string): Promise<Asset[]> {
    const projectAssets = await prisma.projectAsset.findMany({
      where: { projectId },
      include: { asset: true },
    });

    return projectAssets.map((pa) => pa.asset);
  }

  async removeAssetFromProject(
    projectId: string,
    assetId: string,
  ): Promise<void> {
    await prisma.projectAsset.delete({
      where: {
        projectId_assetId: {
          projectId,
          assetId,
        },
      },
    });
  }
}
