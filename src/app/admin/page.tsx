"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import NextImage from "next/image";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/lib/api";
import { Asset, Template } from "@prisma/client";
import {
  Upload,
  Search,
  Trash2,
  Edit,
  Eye,
  Star,
  StarOff,
  ArrowUp,
  ArrowDown,
  TrendingUp,
} from "lucide-react";
import { useToast } from "~/components/ui/use-toast";
import { AuthGuard } from "~/components/auth-guard";
import {
  useTemplates,
  useTrendingTemplates,
  useUpdateTemplateTrending,
} from "~/hooks/templates.hooks";

interface TemplateWithTrending extends Template {
  isTrending?: boolean;
  displayOrder?: number;
}

interface AssetWithScore extends Asset {
  score?: number;
}

export default function AdminPage() {
  const [assets, setAssets] = useState<AssetWithScore[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadPrompt, setUploadPrompt] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const { toast } = useToast();

  // Load assets
  const loadAssets = async () => {
    try {
      const response = await api.get("/api/assets");
      if ((response.data as any).success) {
        setAssets((response.data as any).data.assets);
      }
    } catch (error) {
      console.error("Failed to load assets:", error);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsUploading(true);
      try {
        for (const file of acceptedFiles) {
          const formData = new FormData();
          formData.append("file", file);
          if (uploadPrompt) {
            formData.append("prompt", uploadPrompt);
          }

          try {
            console.log("Uploading file:", file.name, file.type, file.size);
            console.log("FormData created:", formData);

            // Debug FormData contents
            for (const [key, value] of formData.entries()) {
              console.log(`FormData entry - ${key}:`, value);
            }

            // Test FormData with debug endpoint first
            console.log("Testing FormData with debug endpoint...");
            try {
              const debugResponse = await fetch("/api/assets/debug", {
                method: "POST",
                body: formData,
              });
              const debugData = await debugResponse.json();
              console.log("Debug response:", debugData);
            } catch (debugError) {
              console.error("Debug test failed:", debugError);
            }

            // Use regular fetch instead of api client
            console.log("Uploading with fetch...");
            const response = await fetch("/api/assets/upload", {
              method: "POST",
              body: formData,
            });

            const responseData = await response.json();
            console.log("Upload response:", responseData);

            if (responseData.success) {
              toast({
                title: "Asset uploaded successfully",
                description: `${file.name} has been uploaded and analyzed.`,
              });
              loadAssets();
            } else {
              throw new Error(responseData.error || "Upload failed");
            }
          } catch (uploadError: any) {
            console.error("Upload error for file:", file.name, uploadError);

            // Provide more specific error messages
            let errorMessage = "Failed to upload asset. Please try again.";
            if (uploadError.message?.includes("Content-Type")) {
              errorMessage = "File upload format error. Please try again.";
            } else if (uploadError.message?.includes("Unauthorized")) {
              errorMessage = "Please sign in to upload assets.";
            } else if (uploadError.message?.includes("Invalid file type")) {
              errorMessage = `Invalid file type for ${file.name}. Only images are allowed.`;
            }

            toast({
              title: "Upload failed",
              description: errorMessage,
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("General upload error:", error);
        toast({
          title: "Upload failed",
          description: "Failed to upload assets. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        setUploadPrompt("");
      }
    },
    [uploadPrompt, toast, loadAssets],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".svg"],
    },
    multiple: true,
  });

  // Search assets
  const searchAssets = async () => {
    if (!searchQuery.trim()) {
      loadAssets();
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.post("/api/assets/search", {
        query: searchQuery,
        filters: {
          type: selectedType !== "all" ? selectedType : undefined,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
        },
      });

      if ((response.data as any).success) {
        setAssets((response.data as any).data.assets);
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast({
        title: "Search failed",
        description: "Failed to search assets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Delete asset
  const deleteAsset = async (assetId: string) => {
    try {
      const response = await api.delete(`/api/assets/${assetId}`);
      if ((response.data as any).success) {
        toast({
          title: "Asset deleted",
          description: "Asset has been deleted successfully.",
        });
        loadAssets();
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete asset. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load assets on mount
  React.useEffect(() => {
    loadAssets();
  }, []);

  const categories = [
    "all",
    "geometric-shapes",
    "business-icons",
    "social-icons",
    "arrows",
    "borders",
    "backgrounds",
    "text-placeholders",
    "decorations",
  ];

  const types = [
    "all",
    "SHAPE",
    "ICON",
    "FRAME",
    "PLACEHOLDER",
    "BACKGROUND",
    "TEXT_STYLE",
    "DECORATION",
  ];

  return (
    <AuthGuard>
      <div className="container mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Asset Management</h1>
          <div className="flex items-center space-x-2">
            <Button onClick={loadAssets} variant="outline">
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload Assets</TabsTrigger>
            <TabsTrigger value="search">Search & Browse</TabsTrigger>
            <TabsTrigger value="manage">Manage Assets</TabsTrigger>
            <TabsTrigger value="trending">Trending Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload New Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    AI Prompt (Optional)
                  </label>
                  <Input
                    placeholder="Describe the asset for better AI analysis..."
                    value={uploadPrompt}
                    onChange={(e) => setUploadPrompt(e.target.value)}
                  />
                </div>

                <div
                  {...getRootProps()}
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isDragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  {isDragActive ? (
                    <p className="text-blue-600">Drop the files here...</p>
                  ) : (
                    <div>
                      <p className="mb-2 text-lg font-medium">
                        Drag & drop files here, or click to select
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports PNG, JPEG, SVG, and GIF files
                      </p>
                    </div>
                  )}
                </div>

                {isUploading && (
                  <div className="py-4 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-sm text-gray-600">
                      Uploading and analyzing assets...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search assets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && searchAssets()}
                  />
                  <Button onClick={searchAssets} disabled={isSearching}>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </Button>
                </div>

                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Category</label>
                    <select
                      className="mt-1 w-full rounded-md border p-2"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category
                            .replace("-", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="text-sm font-medium">Type</label>
                    <select
                      className="mt-1 w-full rounded-md border p-2"
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                    >
                      {types.map((type) => (
                        <option key={type} value={type}>
                          {type === "all" ? "All Types" : type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onDelete={deleteAsset}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Asset Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{assets.length}</div>
                    <div className="text-sm text-gray-600">Total Assets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {assets.filter((a) => a.type === "ICON").length}
                    </div>
                    <div className="text-sm text-gray-600">Icons</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {assets.filter((a) => a.type === "SHAPE").length}
                    </div>
                    <div className="text-sm text-gray-600">Shapes</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trending" className="space-y-4">
            <TrendingTemplatesManager />
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}

function TrendingTemplatesManager() {
  const { toast } = useToast();
  const { data: allTemplates = [], isLoading: isLoadingAll } = useTemplates();
  const { data: trendingTemplates = [], isLoading: isLoadingTrending } =
    useTrendingTemplates();
  const updateTrending = useUpdateTemplateTrending();

  // cast to extended type that includes trending fields
  const trendingList = trendingTemplates as TemplateWithTrending[];
  const allList = allTemplates as TemplateWithTrending[];

  const handleToggleTrending = async (
    template: TemplateWithTrending,
    isTrending: boolean,
  ) => {
    try {
      await updateTrending.mutateAsync({
        id: template.id,
        isTrending,
        displayOrder: isTrending ? trendingList.length : 0,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    }
  };

  const handleMoveOrder = async (
    template: TemplateWithTrending,
    direction: "up" | "down",
  ) => {
    const currentIndex = trendingList.findIndex((t) => t.id === template.id);
    const newOrder =
      direction === "up"
        ? Math.max(0, (template.displayOrder || 0) - 1)
        : (template.displayOrder || 0) + 1;

    try {
      await updateTrending.mutateAsync({
        id: template.id,
        isTrending: true,
        displayOrder: newOrder,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reorder template",
        variant: "destructive",
      });
    }
  };

  const nonTrendingTemplates = allList.filter(
    (t) => !trendingList.some((tr) => tr.id === t.id),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Currently Trending ({trendingTemplates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTrending ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : trendingList.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No trending templates. Add templates from the list below.
            </div>
          ) : (
            <div className="space-y-2">
              {trendingList.map((t, index) => {
                const template = t as TemplateWithTrending;
                return (
                  <div
                    key={template.id}
                    className="flex items-center gap-4 rounded-lg border p-3"
                  >
                    <span className="text-muted-foreground w-6 text-sm font-medium">
                      #{index + 1}
                    </span>
                    <div className="bg-muted relative h-12 w-16 overflow-hidden rounded">
                      {template.thumbnailUrl ? (
                        <NextImage
                          src={template.thumbnailUrl}
                          alt={template.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-400">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{template.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {template.category} • {template.width}x{template.height}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveOrder(template, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMoveOrder(template, "down")}
                        disabled={index === trendingList.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleToggleTrending(template, false)}
                      >
                        <StarOff className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Templates ({nonTrendingTemplates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAll ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : nonTrendingTemplates.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              All templates are trending or no templates available.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {nonTrendingTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="bg-muted relative h-12 w-16 flex-shrink-0 overflow-hidden rounded">
                    {template.thumbnailUrl ? (
                      <NextImage
                        src={template.thumbnailUrl}
                        alt={template.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{template.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {template.category}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleTrending(template, true)}
                  >
                    <Star className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface AssetCardProps {
  asset: AssetWithScore;
  onDelete: (assetId: string) => void;
}

function AssetCard({ asset, onDelete }: AssetCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className="relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square bg-gray-100">
        <NextImage
          src={asset.thumbnail}
          alt={asset.name}
          className="h-full w-full object-cover"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {isHovered && (
          <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center space-x-2 bg-black">
            <Button size="sm" variant="secondary">
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary">
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(asset.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="mb-2 truncate text-sm font-medium">{asset.name}</h3>

        <div className="mb-2 flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {asset.type}
          </Badge>
          {asset.score && (
            <span className="text-xs text-gray-500">
              Score: {(asset.score * 100).toFixed(1)}%
            </span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {asset.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{asset.tags.length - 3}
              </Badge>
            )}
          </div>

          <div className="text-xs text-gray-500">
            Used {asset.usageCount} times
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
