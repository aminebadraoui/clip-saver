import { Routes, Route } from "react-router-dom";
import { ClipsPage } from "@/pages/ClipsPage";
import { CreateClipPage } from "@/pages/CreateClipPage";
import { ViewClipPage } from "@/pages/ViewClipPage";

function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <main className="container max-w-3xl mx-auto p-6 py-10">
        <Routes>
          <Route path="/" element={<ClipsPage />} />
          <Route path="/create" element={<CreateClipPage />} />
          <Route path="/clip/:id" element={<ViewClipPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
