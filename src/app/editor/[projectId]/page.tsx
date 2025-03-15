"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEditor } from "~/hooks/useEditor";
import { fabric } from "fabric";
import { Navbar } from "~/components/editor/navbar";
import { Toolbar } from "~/components/editor/toolbar";
import { Footer } from "~/components/editor/footer";
import { Sidebar } from "~/components/editor/sidebar/sidebar";
import { ActiveTool, selectionDependentTool } from "~/lib/types";
import { useParams } from "next/navigation";
import { useProject } from "~/hooks/projects.hooks";
import { useUpdateProject } from "~/hooks/useUpdateProject";
import { LucideLoader2 } from "lucide-react";
import { useToast } from "~/components/ui/use-toast";

export default function Editor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const projectId = useParams().projectId as string;
  const {
    data: project,
    isLoading: isProjectLoading,
    error: projectError,
  } = useProject(projectId);

  const { mutate: updateProject, isPending: isSaving } = useUpdateProject();

  // Track changes for auto-save
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [canvasInitialized, setCanvasInitialized] = useState(false);

  const [activeTool, setActiveTool] = React.useState<ActiveTool>("select");

  const onClearSelection = useCallback(() => {
    if (selectionDependentTool.includes(activeTool)) {
      setActiveTool("select");
    }
  }, [activeTool]);
  const savingRef = useRef(false);

  const handleModification = useCallback(() => {
    // Only set unsavedChanges if we're not already saving
    if (!savingRef.current) {
      setUnsavedChanges(true);
    }
  }, []);

  const { init, editor } = useEditor({
    clearSelection: onClearSelection,
    onModified: handleModification,
  });

  // Handle manual save
  const handleManualSave = useCallback(() => {
    if (!editor || !projectId) return;

    try {
      const jsonData = editor.canvas.toJSON();
      const workspace = editor.getWorkspace();

      updateProject(
        {
          id: projectId,
          data: {
            json: JSON.stringify(jsonData),
            width: workspace?.width || 900,
            height: workspace?.height || 1200,
          },
        },
        {
          onSuccess: () => {
            setUnsavedChanges(false);
            setLastSaved(new Date());
            toast({
              description: "Changes saved successfully",
            });
          },
        },
      );
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  }, [editor, projectId, updateProject, toast]);

  // Auto-save changes
  useEffect(() => {
    if (!unsavedChanges || !editor || !projectId) return;

    // Clear existing timeout
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timeout to save after 2 seconds of inactivity
    debounceTimerRef.current = setTimeout(() => {
      try {
        // Mark that we're saving to prevent new modifications from triggering
        // another save immediately
        savingRef.current = true;

        const jsonData = editor.canvas.toJSON();
        const workspace = editor.getWorkspace();

        updateProject(
          {
            id: projectId,
            data: {
              json: JSON.stringify(jsonData),
              width: workspace?.width || 900,
              height: workspace?.height || 1200,
            },
          },
          {
            onSuccess: () => {
              setUnsavedChanges(false);
              setLastSaved(new Date());
              // Reset saving flag after successful save
              savingRef.current = false;
            },
            onError: () => {
              // Reset saving flag on error too
              savingRef.current = false;
            },
          },
        );
      } catch (error) {
        console.error("Error auto-saving project:", error);
        savingRef.current = false;
      }
    }, 2000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [unsavedChanges, editor, projectId, updateProject]);

  // Initialize canvas and load project data
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !project) return;

    console.log("Initializing canvas and loading project");

    try {
      const canvas = new fabric.Canvas(canvasRef.current, {
        controlsAboveOverlay: true,
        preserveObjectStacking: true,
      });

      init({
        initialCanvas: canvas,
        initialContainer: containerRef.current,
      });

      setCanvasInitialized(true);

      return () => {
        canvas.dispose();
      };
    } catch (error) {
      console.error("Error initializing canvas:", error);
      toast({
        description: "Failed to initialize canvas",
        variant: "destructive",
      });
    }
  }, [init, project, toast]);

  // Load project data when available
  useEffect(() => {
    if (!editor || !project || !canvasInitialized) return;

    console.log("Loading project data:", project);

    try {
      // Only load if we have project data and canvas is initialized
      if (
        project.json &&
        typeof project.json === "string" &&
        project.json !== "{}"
      ) {
        try {
          const jsonData = JSON.parse(project.json);

          // Clear the canvas first to prevent duplicate objects
          editor.canvas.clear();

          // Recreate the workspace
          const initialWorkspace = new fabric.Rect({
            width: project.width || 900,
            height: project.height || 1200,
            name: "clip",
            fill: "white",
            selectable: false,
            hasControls: false,
            shadow: new fabric.Shadow({
              color: "rgba(0, 0, 0, 0.8)",
              blur: 5,
            }),
          });

          editor.canvas.add(initialWorkspace);
          editor.canvas.clipPath = initialWorkspace;

          // Load the project JSON
          editor.canvas.loadFromJSON(jsonData, () => {
            editor.canvas.renderAll();

            // Make sure the workspace is sent to back
            const workspace = editor.getWorkspace();
            if (workspace) {
              workspace.sendToBack();
            }

            // Auto zoom after everything is loaded
            setTimeout(() => {
              editor.autoZoom();
            }, 200);
          });
        } catch (parseError) {
          console.error("Failed to parse project JSON:", parseError);
        }
      } else {
        // Just set dimensions if no JSON
        const workspace = editor.getWorkspace();
        if (workspace && project.width && project.height) {
          workspace.set({
            width: project.width,
            height: project.height,
          });
          editor.autoZoom();
        }
      }

      // Initialize lastSaved time
      if (project.updatedAt) {
        setLastSaved(new Date(project.updatedAt));
      }
    } catch (error) {
      console.error("Failed to load project data:", error);
    }
  }, [editor, project, canvasInitialized]);

  const onChangeActiveTool = useCallback(
    (tool: ActiveTool) => {
      if (tool === activeTool) {
        return setActiveTool("select");
      }

      if (tool == "draw" && editor) {
        editor.enableDrawingMode();
      }
      if (activeTool == "draw" && editor) {
        editor.disableDrawingMode();
      }

      setActiveTool(tool);
    },
    [activeTool, editor],
  );

  if (isProjectLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LucideLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Error loading project: {projectError.message}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col">
      <Navbar
        editor={editor}
        activeTool={activeTool}
        onChangeActiveTool={onChangeActiveTool}
        onSave={handleManualSave}
        isSaving={isSaving}
        lastSaved={lastSaved}
        unsavedChanges={unsavedChanges}
        projectName={project?.name || "Untitled Design"}
      />
      <div className="relative flex h-[calc(100vh-68px)] w-full overflow-hidden">
        <Sidebar
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <main className="ml-[100px] flex w-[calc(100vw-100px)] flex-1 flex-col overflow-hidden bg-secondary">
          <Toolbar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
          />
          <div
            className="canvas-container relative flex-1"
            ref={containerRef}
            style={{ height: "calc(100% - 52px)", width: "100%" }}
          >
            <canvas ref={canvasRef} />
            {!editor && (
              <div className="absolute inset-0 flex items-center justify-center">
                <LucideLoader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
          <Footer editor={editor} />
        </main>
      </div>
    </div>
  );
}
