import { Routes, Route, Outlet } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ClipsPage } from "@/pages/ClipsPage";
import { CreateClipPage } from "@/pages/CreateClipPage";
import { ViewClipPage } from "@/pages/ViewClipPage";
import { ViralTrackerPage } from "@/pages/ViralTrackerPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { IdeationPage } from "@/pages/IdeationPage";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { LandingPage } from "@/pages/LandingPage";
import { SubscriptionPage } from "@/pages/SubscriptionPage";
import { SettingsPage } from "@/pages/SettingsPage";



// Guard for routes that require active subscription
const SubscriptionGuard = () => {
  const { isSubscribed } = useAuth();
  if (!isSubscribed) return <Layout><SubscriptionPage /></Layout>;
  return <Outlet />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes (Require Login) */}
        <Route element={<ProtectedRoute />}>
          {/* Routes available to ALL logged in users */}
          <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
          <Route path="/subscription" element={<Layout><SubscriptionPage /></Layout>} />

          {/* Routes requiring Active Subscription */}
          <Route element={<SubscriptionGuard />}>
            <Route path="/dashboard" element={<Layout><ClipsPage /></Layout>} />
            <Route path="/create" element={<Layout><CreateClipPage /></Layout>} />
            <Route path="/clip/:id" element={<Layout><ViewClipPage /></Layout>} />
            <Route path="/viral-tracker" element={<Layout><ViralTrackerPage /></Layout>} />
            <Route path="/ideation" element={<Layout><IdeationPage /></Layout>} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;

