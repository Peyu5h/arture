"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PresenceAvatars } from "~/components/editor/presence-avatars";
import { Button } from "../ui/button";
import { PreviewDialog } from "./preview-dialog";
import { SaveTemplateDialog } from "./save-template-dialog";
import {
  ChevronDown,
  Download,
  EyeIcon,
  LucideLoader2,
  MousePointerClick,
  Redo2,
  Undo2,
  LayoutTemplate,
  Copy,
  Link2,
  Check,
  Lock,
  Pencil,
} from "lucide-react";
import { SiSvgdotjs } from "react-icons/si";
import { BsFileEarmarkPdf, BsFiletypeSvg } from "react-icons/bs";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import { CiFileOn } from "react-icons/ci";
import { Separator } from "../ui/separator";
import { Hint } from "../ui/hintToolTip";
import { BsCloudCheck, BsCloudSlash } from "react-icons/bs";
import { CiImageOn } from "react-icons/ci";

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "~/components/ui/menubar";
import { CiExport } from "react-icons/ci";
import { CiShare1 } from "react-icons/ci";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import Image from "next/image";
import { ActiveTool, Editor } from "../../lib/types";
import { ny } from "~/lib/utils";
import { useFilePicker } from "use-file-picker";
import { useUpdateProject } from "~/hooks/useUpdateProject";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";
import { SaveState } from "~/hooks/useAutoSave";
import { authClient } from "~/lib/auth-client";
import { useProject } from "~/hooks/projects.hooks";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { generateThumbnail } from "~/lib/thumbnail";

const ADMIN_EMAIL = "admin@gmail.com";

interface NavbarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  editor: Editor | any;
  saveState?: SaveState;
  viewMode?: "editing" | "viewOnly";
  onViewModeChange?: (mode: "editing" | "viewOnly") => void;
  isSharedView?: boolean;
}

interface FileSelectionResult {
  filesContent: Array<{ content: string }>;
  plainFiles: File[];
}

export const Navbar = ({
  activeTool,
  editor,
  saveState = "Idle",
  viewMode = "editing",
  onViewModeChange,
  isSharedView = false,
}: NavbarProps) => {
  const { projectId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const updateProject = useUpdateProject();
  const { toast } = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [templateThumbnail, setTemplateThumbnail] = useState<
    string | undefined
  >(undefined);
  const [isEditingName, setIsEditingName] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [sharePermission, setSharePermission] = useState<"edit" | "view">(
    "view",
  );
  const [copied, setCopied] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { data: session } = authClient.useSession();
  const { data: project } = useProject(projectId as string);
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (project?.name) {
      setProjectName(project.name);
    }
  }, [project?.name]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameDoubleClick = () => {
    if (viewMode === "editing") {
      setIsEditingName(true);
    }
  };

  const handleNameBlur = async () => {
    setIsEditingName(false);
    if (projectName !== project?.name && projectName.trim()) {
      try {
        await updateProject.mutateAsync({
          id: projectId as string,
          data: { name: projectName.trim() },
        });
        toast({
          title: "Project renamed",
          description: `Project renamed to "${projectName.trim()}"`,
        });
      } catch (error) {
        setProjectName(project?.name || "Untitled");
      }
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameBlur();
    }
    if (e.key === "Escape") {
      setProjectName(project?.name || "Untitled");
      setIsEditingName(false);
    }
  };

  const handleSave = async () => {
    if (!editor?.canvas || !projectId) return;

    try {
      const canvasState = editor.canvas.toJSON([
        "name",
        "selectable",
        "hasControls",
        "width",
        "height",
        "fill",
        "stroke",
        "strokeWidth",
        "strokeDashArray",
        "fontFamily",
        "fontSize",
        "fontWeight",
        "fontStyle",
        "textAlign",
        "underline",
        "linethrough",
        "opacity",
        "shadow",
        "clipPath",
        "visible",
        "backgroundColor",
        "radius",
        "startAngle",
        "endAngle",
        "type",
        "originX",
        "originY",
        "left",
        "top",
        "scaleX",
        "scaleY",
        "flipX",
        "flipY",
        "skewX",
        "skewY",
        "angle",
        "src",
        "crossOrigin",
      ]);

      await updateProject.mutate({
        id: projectId as string,
        data: {
          json: canvasState,
          width: editor.canvas.getWidth(),
          height: editor.canvas.getHeight(),
        },
      });

      toast({
        title: "Changes saved",
        description: "Your project has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Save failed",
        description: "Failed to save your changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    setIsGeneratingLink(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission: sharePermission }),
      });

      if (response.ok) {
        const result = await response.json();
        const shareUrl = `${window.location.origin}/editor/${projectId}?share=${result.data.token}`;
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Link copied",
          description:
            sharePermission === "edit"
              ? "Anyone with this link can edit the project"
              : "Anyone with this link can view the project",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to create share link",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleViewModeChange = (mode: "editing" | "viewOnly") => {
    onViewModeChange?.(mode);
  };

  const { openFilePicker } = useFilePicker({
    accept: ".json",
    multiple: false,
    onFilesSuccessfullySelected: (files: FileSelectionResult) => {
      try {
        if (files.plainFiles && files.plainFiles.length > 0) {
          const file = files.plainFiles[0];
          const reader = new FileReader();

          reader.onload = (event) => {
            if (event.target?.result) {
              editor?.loadJson(event.target.result as string);
            }
          };

          reader.onerror = (error) => {
            console.error("Error reading file:", error);
          };

          reader.readAsText(file, "UTF-8");
        }
      } catch (error) {
        console.error("Error processing file:", error);
      }
    },
  });

  return (
    <nav
      style={{ zIndex: 40 }}
      className="bg-background flex h-[68px] min-w-full items-center gap-x-8 overflow-hidden border-b p-4 lg:pl-8"
    >
      <div className="flex items-center gap-x-3">
        <div className="select-none">
          <Image
            priority
            className="cursor-pointer"
            src="https://res.cloudinary.com/dkysrpdi6/image/upload/v1728660806/Arture/arture-logo_oljtzy.png"
            width={56}
            height={56}
            alt="logo"
            draggable={false}
            unoptimized={true}
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["projects"] });
              queryClient.invalidateQueries({ queryKey: ["user-projects"] });
              router.push("/");
            }}
          />
        </div>

        {/* project name input */}
        <div className="relative flex items-center">
          <div className="relative max-w-[180px]">
            <span
              onDoubleClick={handleNameDoubleClick}
              className={ny(
                "block truncate rounded px-2 py-1 text-sm font-medium transition-colors",
                viewMode === "editing"
                  ? "hover:bg-muted cursor-text"
                  : "cursor-default",
                isEditingName && "invisible",
              )}
              title={
                viewMode === "editing" ? "Double-click to rename" : projectName
              }
            >
              {projectName || "Untitled"}
            </span>
            {isEditingName && (
              <Input
                ref={nameInputRef}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={handleNameKeyDown}
                className="absolute inset-0 h-full w-full border-none bg-transparent px-2 text-sm font-medium focus-visible:ring-1"
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex h-full w-full items-center gap-x-1">
        {!isSharedView && (
          <Menubar className="border-none">
            <MenubarMenu>
              <MenubarTrigger className="hover:bg-secondary/60 cursor-pointer">
                File
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem
                  onClick={() => openFilePicker()}
                  disabled={viewMode === "viewOnly"}
                >
                  Import Project <MenubarShortcut>⌘T</MenubarShortcut>
                </MenubarItem>
                <MenubarItem disabled={viewMode === "viewOnly"}>
                  New Project <MenubarShortcut>⌘N</MenubarShortcut>
                </MenubarItem>
                <MenubarItem disabled>Save all changes</MenubarItem>
                <MenubarSeparator />
                <MenubarSub>
                  <MenubarSubTrigger>Download</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarItem onClick={() => editor?.savePng()}>
                      PNG
                    </MenubarItem>
                    <MenubarItem onClick={() => editor?.saveJson()}>
                      JSON
                    </MenubarItem>
                    <MenubarItem onClick={() => editor?.savePdf()}>
                      PDF
                    </MenubarItem>
                    <MenubarItem onClick={() => editor?.saveSvg()}>
                      SVG
                    </MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                <MenubarItem>
                  Settings<MenubarShortcut></MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="hover:bg-secondary/60 cursor-pointer">
                Edit
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem
                  onClick={() => editor?.undo()}
                  disabled={viewMode === "viewOnly"}
                >
                  Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem
                  onClick={() => editor?.redo()}
                  disabled={viewMode === "viewOnly"}
                >
                  Redo <MenubarShortcut>⌘Y</MenubarShortcut>
                </MenubarItem>

                <MenubarItem disabled={viewMode === "viewOnly"}>
                  Cut
                </MenubarItem>
                <MenubarItem disabled={viewMode === "viewOnly"}>
                  Copy
                </MenubarItem>
                <MenubarItem disabled={viewMode === "viewOnly"}>
                  Paste
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="hover:bg-secondary/60 cursor-pointer">
                View
              </MenubarTrigger>
              <MenubarContent>
                <MenubarCheckboxItem
                  checked={viewMode === "editing"}
                  onClick={() => handleViewModeChange("editing")}
                >
                  <Pencil className="mr-2 size-4" />
                  Editing mode
                </MenubarCheckboxItem>
                <MenubarCheckboxItem
                  checked={viewMode === "viewOnly"}
                  onClick={() => handleViewModeChange("viewOnly")}
                >
                  <Lock className="mr-2 size-4" />
                  View only
                </MenubarCheckboxItem>
                <MenubarSeparator />
                <MenubarSub>
                  <MenubarSubTrigger inset>Theme</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarCheckboxItem checked>Dark mode</MenubarCheckboxItem>
                    <MenubarCheckboxItem>Light mode</MenubarCheckboxItem>
                  </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />

                <MenubarItem inset>Toggle Fullscreen</MenubarItem>
                <MenubarSeparator />
                <MenubarItem inset>Hide Sidebar</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        )}
        {!isSharedView && <Separator orientation="vertical" className="mx-2" />}

        {!isSharedView && (
          <>
            <Hint label="Undo" side="bottom" sideOffset={10}>
              <Button
                disabled={!editor?.canUndo() || viewMode === "viewOnly"}
                variant="ghost"
                size="icon"
                onClick={() => {
                  editor?.undo();
                }}
              >
                <span>
                  <Undo2 className="size-4" />
                </span>
              </Button>
            </Hint>

            <Hint label="Redo" side="bottom" sideOffset={10}>
              <Button
                disabled={!editor?.canRedo() || viewMode === "viewOnly"}
                variant="ghost"
                size="icon"
                onClick={() => {
                  editor?.redo();
                }}
              >
                <span>
                  <Redo2 className="size-4" />
                </span>
              </Button>
            </Hint>
            <Separator orientation="vertical" className="mx-2" />
            {viewMode !== "viewOnly" && (
              <div className="flex items-center gap-x-2">
                <div className="flex items-center gap-x-2">
                  {(saveState === "Saving" ||
                    saveState === "Saved" ||
                    saveState == "Idle") && (
                    <>
                      <span className="text-xs">
                        {saveState === "Saving" ? (
                          <LucideLoader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <BsCloudCheck className="h-4 w-4" />
                        )}
                      </span>

                      <span className="text-xs">
                        {saveState === "Saving" ? "Saving..." : "Saved"}
                      </span>
                    </>
                  )}
                  {saveState === "Save failed" && (
                    <>
                      <BsCloudSlash className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-red-500">Save failed</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="ml-auto flex items-center gap-x-4">
        {/* presence avatars */}
        <PresenceAvatars projectId={projectId as string} maxVisible={4} />

        {/* view only indicator */}
        {viewMode === "viewOnly" && (
          <button
            onClick={() => !isSharedView && onViewModeChange?.("editing")}
            className={`flex w-28 items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs font-medium text-amber-600 transition-colors dark:text-amber-400 ${
              isSharedView
                ? "cursor-default"
                : "cursor-pointer hover:bg-amber-500/20"
            }`}
            title={
              isSharedView
                ? "View only access via share link"
                : "Click to enable editing"
            }
            disabled={isSharedView}
          >
            <Lock className="size-4" />
            <span>View Only</span>
          </button>
        )}

        {!isSharedView && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  Share
                  <CiShare1 className="ml-3 size-5" />
                </Button>
              </DropdownMenuTrigger>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-60">
              <div className="mx-2">
                <p className="text- text-foreground mt-2 text-lg">
                  Share this project
                </p>

                <div className="mt-4 mb-4">
                  <p className="mb-2 text-sm font-medium">
                    Create collaboration link
                  </p>
                  <div className="gap- flex items-center">
                    <p className="cursor-default rounded-l-md border border-r-0 p-[9px] pr-3 text-sm select-none">
                      Anyone with this link
                    </p>
                    <Select
                      value={sharePermission}
                      onValueChange={(v) =>
                        setSharePermission(v as "edit" | "view")
                      }
                    >
                      <SelectTrigger className="w-[120px] rounded-l-none outline-none focus:outline-none">
                        <SelectValue placeholder="Can View" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="edit">Can Edit</SelectItem>
                          <SelectItem value="view">Can View</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="mt-2 w-full"
                    variant="default"
                    onClick={handleCopyLink}
                    disabled={isGeneratingLink}
                  >
                    {isGeneratingLink ? (
                      <LucideLoader2 className="mr-2 size-4 animate-spin" />
                    ) : copied ? (
                      <Check className="mr-2 size-4" />
                    ) : (
                      <Link2 className="mr-2 size-4" />
                    )}
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                </div>
              </div>
              <Separator />
              <p className="text mx-2 my-2 mb-2 flex cursor-default items-center gap-x-2 font-medium select-none">
                Download your project
              </p>
              <DropdownMenuItem
                onClick={() => editor?.saveJson()}
                className="flex cursor-pointer items-center gap-x-2"
              >
                <CiFileOn className="size-6" />
                <div className="">
                  <p>JSON</p>
                  <p className="text-muted-foreground text-xs">
                    Save for editing later
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor?.savePng()}
                className="flex cursor-pointer items-center gap-x-2"
              >
                <CiImageOn className="size-6" />
                <div className="">
                  <p>PNG</p>
                  <p className="text-muted-foreground text-xs">Save as image</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor?.savePdf()}
                className="flex cursor-pointer items-center gap-x-2"
              >
                <BsFileEarmarkPdf className="bg-opacity-85 size-6 text-zinc-700" />
                <div className="">
                  <p>PDF</p>
                  <p className="text-muted-foreground text-xs">
                    Save as document
                  </p>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => editor?.saveSvg()}
                className="flex cursor-pointer items-center gap-x-2"
              >
                <BsFiletypeSvg className="bg-opacity-85 size-6 text-zinc-700" />

                <div className="">
                  <p>SVG</p>
                  <p className="text-muted-foreground text-xs">
                    Save as vector file
                  </p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreviewOpen(true)}
        >
          <EyeIcon className="size-4" />
          <span className="text-xs">Preview</span>
        </Button>

        {isAdmin && (
          <Button
            variant="default"
            size="sm"
            onClick={async () => {
              // generate thumbnail before opening dialog
              if (editor?.canvas) {
                const thumbnail = await generateThumbnail(editor.canvas, {
                  maxWidth: 400,
                  maxHeight: 300,
                  quality: 0.85,
                  format: "jpeg",
                });
                setTemplateThumbnail(thumbnail || undefined);
              }
              setSaveTemplateOpen(true);
            }}
          >
            <LayoutTemplate className="size-4" />
            <span className="text-xs">Save as Template</span>
          </Button>
        )}
      </div>

      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        canvas={editor?.canvas}
      />

      {isAdmin && (
        <SaveTemplateDialog
          open={saveTemplateOpen}
          onOpenChange={setSaveTemplateOpen}
          canvasJson={editor?.canvas?.toJSON([
            "name",
            "selectable",
            "hasControls",
            "width",
            "height",
            "fill",
            "stroke",
            "strokeWidth",
            "strokeDashArray",
            "fontFamily",
            "fontSize",
            "fontWeight",
            "fontStyle",
            "textAlign",
            "underline",
            "linethrough",
            "opacity",
            "shadow",
            "clipPath",
            "visible",
            "backgroundColor",
            "radius",
            "startAngle",
            "endAngle",
            "type",
            "originX",
            "originY",
            "left",
            "top",
            "scaleX",
            "scaleY",
            "flipX",
            "flipY",
            "skewX",
            "skewY",
            "angle",
            "src",
            "crossOrigin",
          ])}
          thumbnailUrl={templateThumbnail}
          width={editor?.canvas?.getWidth() || 800}
          height={editor?.canvas?.getHeight() || 600}
        />
      )}
    </nav>
  );
};

export default Navbar;
