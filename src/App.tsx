import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ClipsPage } from "@/pages/ClipsPage";
import { CreateClipPage } from "@/pages/CreateClipPage";
import { ViewClipPage } from "@/pages/ViewClipPage";
import { ViralTrackerPage } from "@/pages/ViralTrackerPage";


function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ClipsPage />} />
        <Route path="/create" element={<CreateClipPage />} />
        <Route path="/clip/:id" element={<ViewClipPage />} />
        <Route path="/viral-tracker" element={<ViralTrackerPage />} />
      </Routes>
    </Layout>
  );
}

export default App;

