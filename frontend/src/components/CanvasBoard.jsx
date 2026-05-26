import { useState, useEffect, useRef } from "react";
import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";

import "@excalidraw/excalidraw/index.css";

export default function CanvasBoard({ socket, sessionId, canDraw = true, previousSessionData = null, drawingData = [], setDrawingData = null }) {
  const [elements, setElements] = useState([]);
  const excalidrawRef = useRef(null);
  const collaboratorsRef = useRef(new Map());
  const localElementsRef = useRef([]);
  const syncTimeoutRef = useRef(null);
  const localVersionSumRef = useRef(0); // Tracks the version sum of elements to prevent unnecessary syncs and echo loops

  useEffect(() => {
    if (!socket || !sessionId) return;

    // Receive drawing events
    const handleDraw = (data) => {
      const incomingElements = data.elements;
      if (excalidrawRef.current && incomingElements) {
        // Merge current scene elements with incoming elements
        // VERY IMPORTANT: Use localElementsRef instead of getSceneElements() to ensure deleted elements map correctly
        const currentElements = localElementsRef.current;
        
        // Create a map of existing elements for quick lookup by ID
        const elementMap = new Map(currentElements.map(el => [el.id, el]));

        let hasChanges = false;

        // Reconcile incoming elements based on version
        incomingElements.forEach(incomingEl => {
          const existingEl = elementMap.get(incomingEl.id);
          // If element is new to us, or its remote version is newer than our local version, overwrite it
          if (!existingEl || incomingEl.version > existingEl.version) {
            elementMap.set(incomingEl.id, incomingEl);
            hasChanges = true;
          }
        });

        // Only update scene and potentially trigger echo if we actually have new data
        if (!hasChanges) {
          return;
        }

        // Convert back to array (preserve order as much as possible)
        const mergedElements = Array.from(elementMap.values());

        // Calculate the new version sum of the merged items so we don't bounce it back
        const newVersionSum = mergedElements.reduce((sum, el) => sum + el.version, 0);
        localVersionSumRef.current = newVersionSum; // Update our known remote state to prevent echo
        localElementsRef.current = mergedElements; // Update our absolute ref

        // Update the screen with the merged items without wiping out what the current user is drawing
        excalidrawRef.current.updateScene({ elements: mergedElements });
      }
    };

    // Receive cursor events
    const handleCursorMove = (data) => {
      if (excalidrawRef.current) {
        const collaborators = new Map(collaboratorsRef.current);
        // Assume data.userId is a unique socket id for the remote
        collaborators.set(data.userId, {
          pointer: { x: data.x, y: data.y },
          button: data.button || "up",
          username: "User " + data.userId.substring(0, 4), // display shortened ID
          selectedElementIds: data.selectedElementIds || {}
        });
        
        collaboratorsRef.current = collaborators;

        // Use updateScene to show cursor and selection box
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
    socket.on("cursor-move", handleCursorMove);
    socket.on("user-left", handleUserLeft);

    return () => {
      socket.off("draw", handleDraw);
      socket.off("cursor-move", handleCursorMove);
      socket.off("user-left", handleUserLeft);
    };
  }, [socket, sessionId]);

  // Load previous session data when available
  useEffect(() => {
    if (previousSessionData?.drawingData && previousSessionData.drawingData.length > 0 && excalidrawRef.current) {
      const previousElements = previousSessionData.drawingData;
      localElementsRef.current = previousElements;
      setElements(previousElements);
      excalidrawRef.current.updateScene({ elements: previousElements });
      
      if (setDrawingData) {
        setDrawingData(previousElements);
      }
    }
  }, [previousSessionData, setDrawingData]);


  const handleChange = (newElements, appState) => {
    if (!socket || !sessionId) return;

    // Maintain local state for the react layer wrapper
    setElements(newElements);
    localElementsRef.current = newElements; // Always hold the absolute latest including `isDeleted: true` elements

    if (!canDraw) return; // If blocked from drawing, stop syncing outgoing changes

    // Calculate a version sum of all objects to see if anything ACTUALLY changed.
    // If you only moved your mouse or if we just merged remote elements, this sum is the same!
    const currentVersionSum = newElements.reduce((sum, el) => sum + el.version, 0);

    if (currentVersionSum === localVersionSumRef.current) {
      return; // Nothing changed in the shapes (likely just a cursor move, selection, or remote echo)
    }

    localVersionSumRef.current = currentVersionSum; // Update local tracker

    // THROTTLE: Only emit 20 times a second max to prevent massive network lag and heavy serialization
    if (!syncTimeoutRef.current) {
      syncTimeoutRef.current = setTimeout(() => {
        let elementsToSync = localElementsRef.current;
        if (excalidrawRef.current) {
          // ALWAYS use getSceneElementsIncludingDeleted to ensure remote clients
          // know which items were erased. Otherwise, they never receive the isDeleted: true flag!
          elementsToSync = excalidrawRef.current.getSceneElementsIncludingDeleted();
        }
        
        socket.emit("draw", { 
          sessionId, 
          elements: elementsToSync
        });
        syncTimeoutRef.current = null;
      }, 50); // 50ms = 20 fps network sync
    }
  };

  const handlePointerUpdate = (payload) => {
     if (!socket || !sessionId) return;
     if (!canDraw) return; // Prevent sending pointer updates if not allowed

     socket.emit("cursor-move", { 
       sessionId, 
       x: payload.pointer.x, 
       y: payload.pointer.y,
       button: payload.button || "up",
       selectedElementIds: payload.selectedElementIds || {}
     });
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Excalidraw
        viewModeEnabled={!canDraw}
        excalidrawAPI={(api) => excalidrawRef.current = api}
        onChange={handleChange}
        onPointerUpdate={handlePointerUpdate}
        // 1. Force the Library menu and its triggers to be null
        renderLibraryMenu={() => null}
        // 2. Hide the Library button and any custom UI in the top right
        renderTopRightUI={() => null}
        // 3. Disable specific UI actions and elements
        renderMobileMenu={() => null}
        UIOptions={{
          canvasActions: {
            help: false, // This removes the Help button (bottom right)
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
          <MainMenu.DefaultItems.ToggleTheme />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
      </Excalidraw>
    </div>
  );
}