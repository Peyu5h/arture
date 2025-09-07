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
