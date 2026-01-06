"use client";

import { useState } from "react";
import { X, Save, Tag, Folder, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { useCreateTemplate } from "~/hooks/templates.hooks";

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canvasJson: any;
  thumbnailUrl?: string;
  width: number;
  height: number;
}

const CATEGORIES = [
  { value: "resume", label: "Resume" },
  { value: "poster", label: "Poster" },
  { value: "events", label: "Events" },
  { value: "cards", label: "Cards" },
  { value: "invitations", label: "Invitations" },
];

const SUGGESTED_TAGS = [
  "professional",
  "modern",
  "minimal",
  "creative",
  "elegant",
  "bold",
  "colorful",
  "corporate",
  "vintage",
  "playful",
];

export function SaveTemplateDialog({
  open,
  onOpenChange,
  canvasJson,
  thumbnailUrl,
  width,
  height,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const { mutate: createTemplate, isPending } = useCreateTemplate();

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !tags.includes(normalizedTag)) {
      setTags([...tags, normalizedTag]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !category) return;

    createTemplate(
      {
        name: name.trim(),
        category,
        tags,
        json: canvasJson,
        thumbnailUrl,
        width,
        height,
      },
      {
        onSuccess: () => {
          setName("");
          setCategory("");
          setTags([]);
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Save className="h-5 w-5" />
            Save as Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* template name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Template Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., Modern Business Resume"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
            />
          </div>

          {/* category */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10">
                <div className="flex items-center gap-2">
                  <Folder className="text-muted-foreground h-4 w-4" />
                  <SelectValue placeholder="Select a category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* tags */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Tags{" "}
              <span className="text-muted-foreground font-normal">
                (for search)
              </span>
            </Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Tag className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Add tags..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-10 pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddTag(tagInput)}
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>

            {/* tags display */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 px-2 py-0.5"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* suggested tags */}
            <div className="pt-1">
              <p className="text-muted-foreground mb-2 text-xs">
                Suggested tags:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="border-border text-muted-foreground hover:bg-accent hover:text-foreground rounded-full border px-2.5 py-0.5 text-xs transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !category || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
