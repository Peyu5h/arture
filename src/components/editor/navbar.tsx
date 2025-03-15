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
  MousePointerClick,
  Redo2,
  Save,
  Undo2,
  LucideLoader2,
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
import { formatDistanceToNow, ny } from "~/lib/utils";
import { useFilePicker } from "use-file-picker";
import Link from "next/link";

interface NavbarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  editor: Editor | any;
  onSave?: () => void;
  isSaving?: boolean;
  lastSaved?: Date | null;
  unsavedChanges?: boolean;
  projectName?: string;
}

interface FileSelectionResult {
  filesContent: Array<{ content: string }>;
  plainFiles: File[];
}

export const Navbar = ({
  activeTool,
  onChangeActiveTool,
  editor,
  onSave,
  isSaving,
  lastSaved,
  unsavedChanges,
  projectName = "Untitled Design",
}: NavbarProps) => {
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
        <Link href="/">
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
        </Link>
      </div>
      <div className="flex h-full w-full items-center gap-x-1">
        <div className="mr-4">
          <p className="text-sm font-medium">{projectName}</p>
        </div>
        <Menubar className="border-none">
          <MenubarMenu>
            <MenubarTrigger className="cursor-pointer hover:bg-secondary/60">
              File
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => openFilePicker()}>
                Import Project <MenubarShortcut>⌘T</MenubarShortcut>
              </MenubarItem>
              <MenubarItem asChild>
                <Link href="/">New Project</Link>
                <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem
                onClick={onSave}
                disabled={isSaving || !unsavedChanges}
              >
                Save changes
                <MenubarShortcut>⌘S</MenubarShortcut>
              </MenubarItem>
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
              <MenubarItem
                onClick={() => editor?.undo()}
                disabled={!editor?.canUndo()}
              >
                Undo <MenubarShortcut>⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem
                onClick={() => editor?.redo()}
                disabled={!editor?.canRedo()}
              >
                Redo <MenubarShortcut>⌘Y</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={() => editor?.onCopy()}>
                Copy <MenubarShortcut>⌘C</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={() => editor?.onPaste()}>
                Paste <MenubarShortcut>⌘V</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={() => editor?.delete()}>
                Delete <MenubarShortcut>Del</MenubarShortcut>
              </MenubarItem>
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

        {/* Save status indicator */}
        <div className="flex items-center gap-x-2">
          {isSaving ? (
            <>
              <LucideLoader2 className="size-4 animate-spin text-muted-foreground" />
              <div className="text-xs text-muted-foreground">Saving...</div>
            </>
          ) : unsavedChanges ? (
            <>
              <BsCloudSlash className="size-4 text-amber-500" />
              <div className="text-xs text-amber-500">Unsaved changes</div>
            </>
          ) : (
            <>
              <BsCloudCheck className="size-4 text-emerald-600" />
              <div className="text-xs text-muted-foreground">
                {lastSaved
                  ? `Saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}`
                  : "All changes saved"}
              </div>
            </>
          )}
        </div>

        {/* Manual save button */}
        {onSave && (
          <Hint label="Save" side="bottom" sideOffset={10}>
            <Button
              disabled={isSaving || !unsavedChanges}
              variant="ghost"
              size="icon"
              onClick={onSave}
              className="ml-2"
            >
              <span>
                <Save className="size-4" />
              </span>
            </Button>
          </Hint>
        )}
      </div>
      <div className="ml-auto flex items-center gap-x-4">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              Share
              <CiShare1 className="ml-3 size-5" />
            </Button>
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
                        <SelectItem value="view">Can View</SelectItem>
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
