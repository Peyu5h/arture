"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import React from "react";
import { Button } from "./ui/button";
import {
  ChevronDown,
  Download,
  MousePointerClick,
  Redo2,
  Undo2,
} from "lucide-react";
import { BsFileEarmarkPdf } from "react-icons/bs";
import { DropdownMenuItem } from "./ui/dropdown-menu";
import { CiFileOn } from "react-icons/ci";
import { Separator } from "./ui/separator";
import { Hint } from "./hintToolTip";
import { BsCloudCheck } from "react-icons/bs";
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
import { FiDownload } from "react-icons/fi";

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
import { ActiveTool, Editor } from "./editor/types";
import { ny } from "~/lib/utils";

interface NavbarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  editor: Editor | undefined;
}

export const Navbar = ({
  activeTool,
  onChangeActiveTool,
  editor,
}: NavbarProps) => {
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
              <MenubarItem>
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
                  <MenubarItem>PNG</MenubarItem>
                  <MenubarItem>PDF</MenubarItem>
                  <MenubarItem>JSON</MenubarItem>
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
        <Hint label="Select" side="bottom" sideOffset={10}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChangeActiveTool("select")}
            className={ny(activeTool === "select" && "bg-gray-100")}
          >
            <MousePointerClick className="size-4" />
          </Button>
        </Hint>

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
        <div className="flex items-center gap-x-2"></div>
        <BsCloudCheck className="size-5 text-muted-foreground" />
        <div className="text-xs text-muted-foreground">Saved</div>
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
              <FiDownload className="size-5" />
            </p>
            <DropdownMenuItem className="flex cursor-pointer items-center gap-x-2">
              <CiFileOn className="size-6" />
              <div className="">
                <p>JSON</p>
                <p className="text-xs text-muted-foreground">
                  Save for editing later
                </p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex cursor-pointer items-center gap-x-2">
              <CiImageOn className="size-6" />
              <div className="">
                <p>PNG</p>
                <p className="text-xs text-muted-foreground">Save as image</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex cursor-pointer items-center gap-x-2">
              <BsFileEarmarkPdf className="size-6 bg-opacity-85" />
              <div className="">
                <p>PDF</p>
                <p className="text-xs text-muted-foreground">
                  Save as document
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
