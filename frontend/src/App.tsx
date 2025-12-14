import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ClipsPage } from "@/pages/ClipsPage";
import { CreateClipPage } from "@/pages/CreateClipPage";
import { ViewClipPage } from "@/pages/ViewClipPage";
import { ViralTrackerPage } from "@/pages/ViralTrackerPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "sonner";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout><ClipsPage /></Layout>} />
          <Route path="/create" element={<Layout><CreateClipPage /></Layout>} />
          <Route path="/clip/:id" element={<Layout><ViewClipPage /></Layout>} />
          <Route path="/viral-tracker" element={<Layout><ViralTrackerPage /></Layout>} />
        </Route>
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;

