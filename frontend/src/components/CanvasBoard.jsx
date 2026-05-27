import { useState, useEffect, useRef } from "react";
import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import { Sliders, ChevronLeft } from "lucide-react";

import "@excalidraw/excalidraw/index.css";

export default function CanvasBoard({ socket, sessionId, canDraw = true, previousSessionData = null, drawingData = [], setDrawingData = null, canvasDarkMode = false }) {
  const [elements, setElements] = useState([]);
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);
  const [activeTool, setActiveTool] = useState("selection");
  const excalidrawRef = useRef(null);
  const collaboratorsRef = useRef(new Map());
  const localElementsRef = useRef([]);
  const syncTimeoutRef = useRef(null);
  const localVersionSumRef = useRef(0);
  const lastSyncedVersionsRef = useRef(new Map());
  const syncedFileIdsRef = useRef(new Set()); // Track which image file IDs we've already broadcast

  useEffect(() => {
    if (!socket || !sessionId) return;

    // Receive drawing elements from other members
    const handleDraw = (data) => {
      const incomingElements = data.elements;
      if (excalidrawRef.current && incomingElements) {
        const currentElements = localElementsRef.current;
        const elementMap = new Map(currentElements.map(el => [el.id, el]));

        let hasChanges = false;

        incomingElements.forEach(incomingEl => {
          const existingEl = elementMap.get(incomingEl.id);
          if (!existingEl || incomingEl.version > existingEl.version) {
            elementMap.set(incomingEl.id, incomingEl);
            hasChanges = true;
            lastSyncedVersionsRef.current.set(incomingEl.id, incomingEl.version);
          }
        });

        if (!hasChanges) return;

        const mergedElements = Array.from(elementMap.values());
        const newVersionSum = mergedElements.reduce((sum, el) => sum + el.version, 0);
        localVersionSumRef.current = newVersionSum;
        localElementsRef.current = mergedElements;
        excalidrawRef.current.updateScene({ elements: mergedElements });
      }
    };

    // Receive image file blobs from other members and inject them into Excalidraw
    const handleSyncFiles = (data) => {
      const { files } = data;
      if (!files || !excalidrawRef.current) return;

      const fileEntries = Object.entries(files);
      if (fileEntries.length === 0) return;

      // Convert to the format Excalidraw's addFiles() expects: BinaryFileData[]
      const newFiles = fileEntries
        .filter(([fileId]) => !syncedFileIdsRef.current.has(fileId)) // skip already-known files
        .map(([fileId, fileData]) => ({
          id: fileId,
          dataURL: fileData.dataURL,
          mimeType: fileData.mimeType,
          created: fileData.created || Date.now(),
        }));

      if (newFiles.length > 0) {
        excalidrawRef.current.addFiles(newFiles);
        newFiles.forEach(f => syncedFileIdsRef.current.add(f.id));
      }
    };

    // Receive cursor events
    const handleCursorMove = (data) => {
      if (excalidrawRef.current) {
        const collaborators = new Map(collaboratorsRef.current);
        collaborators.set(data.userId, {
          pointer: { x: data.x, y: data.y },
          button: data.button || "up",
          username: "User " + data.userId.substring(0, 4),
          selectedElementIds: data.selectedElementIds || {}
        });
        collaboratorsRef.current = collaborators;
        excalidrawRef.current.updateScene({ collaborators });
      }
    };

    const handleUserLeft = (userId) => {
       if (excalidrawRef.current) {
          const currentCollaborators = new Map(collaboratorsRef.current);
          currentCollaborators.delete(userId);
          collaboratorsRef.current = currentCollaborators;
          excalidrawRef.current.updateScene({ collaborators: currentCollaborators });
       }
    };

    socket.on("draw", handleDraw);
    socket.on("sync-files", handleSyncFiles);
    socket.on("cursor-move", handleCursorMove);
    socket.on("user-left", handleUserLeft);

    return () => {
      socket.off("draw", handleDraw);
      socket.off("sync-files", handleSyncFiles);
      socket.off("cursor-move", handleCursorMove);
      socket.off("user-left", handleUserLeft);
    };
  }, [socket, sessionId]);

  // Load previous session data (elements + files) when available
  useEffect(() => {
    const api = excalidrawAPI || excalidrawRef.current;
    if (previousSessionData?.drawingData && previousSessionData.drawingData.length > 0 && api) {
      const previousElements = previousSessionData.drawingData;

      previousElements.forEach(el => {
        lastSyncedVersionsRef.current.set(el.id, el.version);
      });

      localElementsRef.current = previousElements;
      setElements(previousElements);
      api.updateScene({ elements: previousElements });

      // Also restore image files if delivered (e.g. from join-accepted or rejoin)
      if (previousSessionData.files) {
        const fileEntries = Object.entries(previousSessionData.files);
        if (fileEntries.length > 0 && api.addFiles) {
          const filesToAdd = fileEntries
            .filter(([fileId]) => !syncedFileIdsRef.current.has(fileId))
            .map(([fileId, fileData]) => ({
              id: fileId,
              dataURL: fileData.dataURL,
              mimeType: fileData.mimeType,
              created: fileData.created || Date.now(),
            }));
          if (filesToAdd.length > 0) {
            api.addFiles(filesToAdd);
            filesToAdd.forEach(f => syncedFileIdsRef.current.add(f.id));
          }
        }
      }

      if (setDrawingData) {
        setDrawingData(previousElements);
      }
    }
  }, [previousSessionData, excalidrawAPI, setDrawingData]);


  const handleChange = (newElements, appState) => {
    if (appState?.activeTool?.type) {
      setActiveTool(appState.activeTool.type);
    }
    if (!socket || !sessionId) return;

    setElements(newElements);
    localElementsRef.current = newElements;

    if (!canDraw) return;

    // --- Sync new image files ---
    // Whenever elements change, check for image elements whose file blobs haven't been broadcast yet
    if (excalidrawRef.current) {
      const allFiles = excalidrawRef.current.getFiles(); // { [fileId]: BinaryFileData }
      if (allFiles) {
        const newFiles = {};
        Object.entries(allFiles).forEach(([fileId, fileData]) => {
          if (!syncedFileIdsRef.current.has(fileId)) {
            newFiles[fileId] = {
              dataURL: fileData.dataURL,
              mimeType: fileData.mimeType,
              created: fileData.created,
            };
            syncedFileIdsRef.current.add(fileId);
          }
        });
        if (Object.keys(newFiles).length > 0) {
          socket.emit("sync-files", { sessionId, files: newFiles });
        }
      }
    }

    // --- Sync elements ---
    const currentVersionSum = newElements.reduce((sum, el) => sum + el.version, 0);

    if (currentVersionSum === localVersionSumRef.current) {
      return;
    }

    localVersionSumRef.current = currentVersionSum;

    if (!syncTimeoutRef.current) {
      syncTimeoutRef.current = setTimeout(() => {
        let elementsToSync = localElementsRef.current;
        if (excalidrawRef.current) {
          elementsToSync = excalidrawRef.current.getSceneElementsIncludingDeleted();
        }

        const changedElements = [];
        const lastVersions = lastSyncedVersionsRef.current;

        elementsToSync.forEach(el => {
          const lastVersion = lastVersions.get(el.id);
          if (lastVersion === undefined || el.version > lastVersion) {
            changedElements.push(el);
            lastVersions.set(el.id, el.version);
          }
        });

        if (changedElements.length > 0) {
          socket.emit("draw", { sessionId, elements: changedElements });
        }

        syncTimeoutRef.current = null;
      }, 50);
    }
  };

  const lastCursorEmitTimeRef = useRef(0);

  const handlePointerUpdate = (payload) => {
     if (!socket || !sessionId) return;
     if (!canDraw) return;

     const now = Date.now();
     if (now - lastCursorEmitTimeRef.current < 80) return;
     lastCursorEmitTimeRef.current = now;

     socket.emit("cursor-move", {
       sessionId,
       x: payload.pointer.x,
       y: payload.pointer.y,
       button: payload.button || "up",
       selectedElementIds: payload.selectedElementIds || {}
     });
  };

  const hasPropertiesPanel = canDraw && !["selection", "hand", "eraser"].includes(activeTool);

  return (
    <div 
      className={`excalidraw-container relative ${propertiesCollapsed ? 'properties-collapsed' : ''}`} 
      style={{ height: "100%", width: "100%" }}
    >
      {hasPropertiesPanel && (
        <button
          onClick={() => setPropertiesCollapsed(!propertiesCollapsed)}
          className="absolute z-[5] flex items-center justify-center p-2 rounded-xl bg-[#121214]/90 hover:bg-[#121214] border border-white/10 text-indigo-400 hover:text-white transition-all duration-300 shadow-xl cursor-pointer active:scale-95 hover:border-white/20 select-none"
          style={{
            left: propertiesCollapsed ? "12px" : "216px",
            top: "135px",
            transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          title={propertiesCollapsed ? "Show Properties Panel" : "Hide Properties Panel"}
        >
          {propertiesCollapsed ? (
            <div className="flex items-center gap-1.5 px-1.5 py-0.5">
              <Sliders size={12} className="animate-pulse text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-200">Show Styling</span>
            </div>
          ) : (
            <ChevronLeft size={14} />
          )}
        </button>
      )}
      <Excalidraw
        viewModeEnabled={!canDraw}
        theme={canvasDarkMode ? "dark" : "light"}
        excalidrawAPI={(api) => {
          excalidrawRef.current = api;
          if (api) {
            if (api !== excalidrawAPI) {
              setTimeout(() => setExcalidrawAPI(api), 0);
            }
          } else {
            if (excalidrawAPI !== null) {
              setTimeout(() => setExcalidrawAPI(null), 0);
            }
          }
        }}
        onChange={handleChange}
        onPointerUpdate={handlePointerUpdate}
        renderLibraryMenu={() => null}
        renderTopRightUI={() => null}
        renderMobileMenu={() => null}
        UIOptions={{
          canvasActions: {
            help: false,
            toggleTheme: false,
          }
        }}
      >
        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.SaveToActiveFile />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.Separator />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
      </Excalidraw>
    </div>
  );
}