import { useState } from "react";
import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";

import "@excalidraw/excalidraw/index.css";

export default function CanvasBoard() {
  const [elements, setElements] = useState([]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Excalidraw
        onChange={(newElements) => setElements(newElements)}
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