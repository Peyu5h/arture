"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import React from "react";
import { Button } from "../ui/button";
import {
  ChevronDown,
  Download,
  LucideLoader2,
  MousePointerClick,
  Redo2,
  Undo2,
} from "lucide-react";
import { SiSvgdotjs } from "react-icons/si";
import { BsFileEarmarkPdf, BsFiletypeSvg } from "react-icons/bs";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import { CiFileOn } from "react-icons/ci";
import { Separator } from "../ui/separator";
import { Hint } from "../hintToolTip";
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
import { useParams } from "next/navigation";
import { useToast } from "../ui/use-toast";
import { SaveState } from "~/hooks/useAutoSave";

interface NavbarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  editor: Editor | any;
  saveState?: SaveState;
}

interface FileSelectionResult {
  filesContent: Array<{ content: string }>;
  plainFiles: File[];
}

export const Navbar = ({
  activeTool,
  editor,
  saveState = "Idle",
}: NavbarProps) => {
  const { projectId } = useParams();
  const updateProject = useUpdateProject();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!editor?.canvas || !projectId) return;

    try {
      const canvasState = editor.canvas.toJSON(canvasState);

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
      className="flex h-[68px] min-w-full items-center gap-x-8 overflow-hidden border-b bg-white p-4 lg:pl-8"
    >
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
        />
      </div>
      <div className="flex h-full w-full items-center gap-x-1">
        <Menubar className="border-none">
          <MenubarMenu>
            <MenubarTrigger className="cursor-pointer hover:bg-secondary/60">
              File
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => openFilePicker()}>
                Import Project <MenubarShortcut>⌘T</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
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
            <MenubarTrigger className="cursor-pointer hover:bg-secondary/60">
              Edit
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                Undo <MenubarShortcut>⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Redo <MenubarShortcut>⌘Y</MenubarShortcut>
              </MenubarItem>

              <MenubarItem>Cut</MenubarItem>
              <MenubarItem>Copy</MenubarItem>
              <MenubarItem>Paste</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="cursor-pointer hover:bg-secondary/60">
              View
            </MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked>Editing mode</MenubarCheckboxItem>
              <MenubarCheckboxItem>View only</MenubarCheckboxItem>
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
        <Separator orientation="vertical" className="mx-2" />

        <Hint label="Undo" side="bottom" sideOffset={10}>
          <Button
            disabled={!editor?.canUndo()}
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
            disabled={!editor?.canRedo()}
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
      </div>
      <div className="ml-auto flex items-center gap-x-4">
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
              <p className="text- mt-2 text-lg text-foreground">
                Share this project
              </p>

              <div className="mb-4 mt-4">
                <p className="mb-2 text-sm font-medium">
                  Create collaboration link
                </p>
                <div className="gap- flex items-center">
                  <p className="cursor-default select-none rounded-l-md border border-r-0 p-[9px] pr-3 text-sm">
                    Anyone with this link
                  </p>
                  <Select>
                    <SelectTrigger className="w-[120px] rounded-l-none outline-none focus:outline-none">
                      <SelectValue placeholder="Can Edit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="edit">Can Edit</SelectItem>
                        <SelectItem value="pineapple">Can View</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="mt-2 w-full" variant="default">
                  Copy Link
                </Button>
              </div>
            </div>
            <Separator />
            <p className="text mx-2 my-2 mb-2 flex cursor-default select-none items-center gap-x-2 font-medium">
              Download your project
            </p>
            <DropdownMenuItem
              onClick={() => editor?.saveJson()}
              className="flex cursor-pointer items-center gap-x-2"
            >
              <CiFileOn className="size-6" />
              <div className="">
                <p>JSON</p>
                <p className="text-xs text-muted-foreground">
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
                <p className="text-xs text-muted-foreground">Save as image</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor?.savePdf()}
              className="flex cursor-pointer items-center gap-x-2"
            >
              <BsFileEarmarkPdf className="size-6 bg-opacity-85 text-zinc-700" />
              <div className="">
                <p>PDF</p>
                <p className="text-xs text-muted-foreground">
                  Save as document
                </p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => editor?.saveSvg()}
              className="flex cursor-pointer items-center gap-x-2"
            >
              <BsFiletypeSvg className="size-6 bg-opacity-85 text-zinc-700" />

              <div className="">
                <p>SVG</p>
                <p className="text-xs text-muted-foreground">
                  Save as vector file
                </p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
