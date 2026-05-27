import { useState, useRef, useCallback, useEffect } from "react";
import { X, Sparkles, Download, Loader2, Crop, AlertCircle, ChevronRight } from "lucide-react";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ─── Utility: capture a rectangular region of the Excalidraw canvas ───────────
function captureCanvasRegion(containerRef, rect) {
  // Find the actual <canvas> element inside the Excalidraw container
  const excalidrawCanvas = containerRef.querySelector("canvas");
  if (!excalidrawCanvas) throw new Error("Canvas element not found.");

  const dpr = window.devicePixelRatio || 1;

  // containerRect gives us the position of the container on screen
  const containerRect = containerRef.getBoundingClientRect();

  // Map screen selection coordinates to canvas pixel coordinates
  const scaleX = (excalidrawCanvas.width) / containerRect.width;
  const scaleY = (excalidrawCanvas.height) / containerRect.height;

  const srcX = (rect.x - containerRect.left) * scaleX;
  const srcY = (rect.y - containerRect.top) * scaleY;
  const srcW = rect.width * scaleX;
  const srcH = rect.height * scaleY;

  if (srcW < 10 || srcH < 10) throw new Error("Selection too small. Please drag a larger area.");

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = Math.round(srcW);
  tempCanvas.height = Math.round(srcH);
  const ctx = tempCanvas.getContext("2d");
  ctx.drawImage(excalidrawCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
  return tempCanvas.toDataURL("image/png").split(",")[1]; // base64 only
}

// ─── Utility: call Gemini vision API ─────────────────────────────────────────
async function callGemini(base64Image) {
  if (!GEMINI_API_KEY) throw new Error("Gemini API key is not configured. Add VITE_GEMINI_API_KEY to your .env file.");

  const body = {
    contents: [
      {
        parts: [
          {
            text: `You are an expert at analyzing whiteboards, design diagrams, and collaborative canvases.
Analyze the provided canvas screenshot and generate a comprehensive, well-structured summary.

Your summary should:
1. **Overview**: Briefly describe what is on the canvas (drawings, text, diagrams, sticky notes, shapes, etc.)
2. **Key Content**: Extract and list all readable text, labels, and annotations
3. **Structure & Layout**: Describe the logical organization and relationships between elements
4. **Insights**: Highlight main ideas, themes, or decisions visible on the canvas
5. **Action Items** (if any): List any tasks or next steps mentioned

Format the output clearly with headers and bullet points. Be concise but thorough.`,
          },
          {
            inline_data: {
              mime_type: "image/png",
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
    },
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No summary returned from Gemini.");
  return text;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SummarizeModal({ isOpen, onClose, canvasContainerRef }) {
  // Phases: "idle" | "selecting" | "loading" | "result" | "error"
  const [phase, setPhase] = useState("idle");
  const [summary, setSummary] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Selection box state
  const overlayRef = useRef(null);
  const selectionRef = useRef(null);
  const dragStart = useRef(null);
  const [selBox, setSelBox] = useState(null); // { x, y, width, height } in viewport px

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setPhase("idle");
      setSummary("");
      setErrorMsg("");
      setSelBox(null);
      dragStart.current = null;
    }
  }, [isOpen]);

  // ── Selection drag handlers ──
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragStart.current = { x: e.clientX, y: e.clientY };
    setSelBox({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!dragStart.current) return;
    const x = Math.min(e.clientX, dragStart.current.x);
    const y = Math.min(e.clientY, dragStart.current.y);
    const width = Math.abs(e.clientX - dragStart.current.x);
    const height = Math.abs(e.clientY - dragStart.current.y);
    setSelBox({ x, y, width, height });
  }, []);

  const onMouseUp = useCallback(
    async (e) => {
      if (!dragStart.current) return;
      const finalBox = {
        x: Math.min(e.clientX, dragStart.current.x),
        y: Math.min(e.clientY, dragStart.current.y),
        width: Math.abs(e.clientX - dragStart.current.x),
        height: Math.abs(e.clientY - dragStart.current.y),
      };
      dragStart.current = null;

      if (finalBox.width < 20 || finalBox.height < 20) {
        setSelBox(null);
        return;
      }

      setPhase("loading");
      setSelBox(null);

      try {
        const container = canvasContainerRef?.current;
        if (!container) throw new Error("Canvas container not available.");
        const base64 = captureCanvasRegion(container, finalBox);
        const result = await callGemini(base64);
        setSummary(result);
        setPhase("result");
      } catch (err) {
        setErrorMsg(err.message || "Something went wrong.");
        setPhase("error");
      }
    },
    [canvasContainerRef]
  );

  // Touch support
  const onTouchStart = useCallback((e) => {
    const t = e.touches[0];
    dragStart.current = { x: t.clientX, y: t.clientY };
    setSelBox({ x: t.clientX, y: t.clientY, width: 0, height: 0 });
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!dragStart.current) return;
    const t = e.touches[0];
    const x = Math.min(t.clientX, dragStart.current.x);
    const y = Math.min(t.clientY, dragStart.current.y);
    setSelBox({ x, y, width: Math.abs(t.clientX - dragStart.current.x), height: Math.abs(t.clientY - dragStart.current.y) });
  }, []);

  const onTouchEnd = useCallback((e) => {
    const t = e.changedTouches[0];
    onMouseUp({ clientX: t.clientX, clientY: t.clientY });
  }, [onMouseUp]);

  // ── Download handler ──
  const handleDownload = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `canvas-summary-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  // ── PHASE: selecting ──
  if (phase === "idle" || phase === "selecting") {
    return (
      <>
        {/* Full-screen selection overlay */}
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[200] cursor-crosshair"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Instruction banner */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#0f0f12]/90 backdrop-blur-xl border border-indigo-500/40 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-none select-none">
            <Crop size={18} className="text-indigo-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">Drag to select canvas area</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Draw a rectangle over the area you want Gemini to analyze</p>
            </div>
            <button
              className="ml-4 pointer-events-auto p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              onMouseDown={(e) => { e.stopPropagation(); onClose(); }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Live selection rectangle */}
          {selBox && selBox.width > 4 && (
            <div
              ref={selectionRef}
              className="absolute border-2 border-indigo-400 pointer-events-none"
              style={{
                left: selBox.x,
                top: selBox.y,
                width: selBox.width,
                height: selBox.height,
                background: "rgba(99,102,241,0.08)",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.25)",
              }}
            >
              {/* Corner handles */}
              {[["top-0 left-0", "-translate-x-1/2 -translate-y-1/2"], ["top-0 right-0", "translate-x-1/2 -translate-y-1/2"], ["bottom-0 left-0", "-translate-x-1/2 translate-y-1/2"], ["bottom-0 right-0", "translate-x-1/2 translate-y-1/2"]].map(([pos, tr], i) => (
                <div key={i} className={`absolute ${pos} w-2.5 h-2.5 bg-indigo-400 rounded-sm transform ${tr}`} />
              ))}
              {/* Size indicator */}
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-black/80 text-indigo-300 text-[10px] font-mono px-2 py-0.5 rounded whitespace-nowrap">
                {Math.round(selBox.width)} × {Math.round(selBox.height)}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // ── PHASE: loading ──
  if (phase === "loading") {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[#0f0f12]/95 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl max-w-sm w-full mx-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Loader2 size={32} className="text-indigo-400 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-base">Analyzing Canvas...</p>
            <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">Gemini is reading your canvas and generating a summary</p>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: error ──
  if (phase === "error") {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-[#0f0f12]/95 border border-rose-500/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <AlertCircle size={20} className="text-rose-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Analysis Failed</h3>
              <p className="text-rose-300 text-xs mt-1 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPhase("idle")}
              className="flex-1 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 text-xs font-bold transition-all cursor-pointer"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: result ──
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f0f12]/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-2xl shadow-[0_30px_60px_rgba(0,0,0,0.7)] flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles size={16} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-white font-black text-sm tracking-tight">Canvas Summary</h2>
              <p className="text-gray-500 text-[10px] mt-0.5">Generated by Gemini AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPhase("idle")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 text-[10px] font-bold transition-all cursor-pointer"
            >
              <Crop size={12} /> New Selection
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold transition-all cursor-pointer"
            >
              <Download size={12} /> Download .txt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Summary content */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="prose prose-invert prose-sm max-w-none">
            {summary.split("\n").map((line, i) => {
              // Render markdown-like headings
              if (line.startsWith("### ")) return <h3 key={i} className="text-indigo-300 font-bold text-sm mt-4 mb-1.5">{line.slice(4)}</h3>;
              if (line.startsWith("## ")) return <h2 key={i} className="text-white font-black text-sm mt-5 mb-2 border-b border-white/10 pb-1">{line.slice(3)}</h2>;
              if (line.startsWith("# ")) return <h1 key={i} className="text-white font-black text-base mt-4 mb-2">{line.slice(2)}</h1>;
              if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-white font-bold text-xs mt-3 mb-1">{line.slice(2, -2)}</p>;
              if (line.startsWith("- ") || line.startsWith("• ")) return (
                <div key={i} className="flex items-start gap-2 mt-1">
                  <ChevronRight size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-gray-300 text-xs leading-relaxed">{line.slice(2)}</p>
                </div>
              );
              if (line.trim() === "") return <div key={i} className="h-2" />;
              // Handle **bold** inline
              const parts = line.split(/\*\*(.*?)\*\*/g);
              return (
                <p key={i} className="text-gray-300 text-xs leading-relaxed mt-0.5">
                  {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part)}
                </p>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 shrink-0 flex items-center justify-between">
          <p className="text-[10px] text-gray-600">Powered by Google Gemini 1.5 Flash · Results may vary based on canvas content</p>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-[10px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.25)]"
          >
            <Download size={12} /> Download Summary
          </button>
        </div>
      </div>
    </div>
  );
}
