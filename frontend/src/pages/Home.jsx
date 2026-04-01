import CanvasBoard from "../components/CanvasBoard";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div className="h-screen w-screen flex flex-col bg-[#171717]">

      {/* Navbar */}
      <div className="w-full flex justify-center pt-2">
        <Navbar />
      </div>

      {/* Canvas area */}
      <div className="flex-1 border-3 mx-2 mb-2 border-white/20 backdrop-blur-md rounded-2xl overflow-hidden" >
        <CanvasBoard />
      </div>

    </div>
  );
}
