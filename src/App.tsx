import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import QuotePage from "./pages/QuotePage";
import TrackingPage from "./pages/TrackingPage";
import AboutPage from "./pages/AboutPage";

import BlogListPage from "./pages/BlogListPage";
import BlogPostPage from "./pages/BlogPostPage";

import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import OptInPage from "./pages/OptInPage";

import ClientLoginPage from "./pages/ClientLoginPage";
import ClientRegisterPage from "./pages/ClientRegisterPage";
import MyShipmentsPage from "./pages/MyShipmentsPage";

import AdminLayout from "./layouts/AdminLayout";
import MainLayout from "./layouts/MainLayout";
import LandingLayout from "./layouts/LandingLayout";

import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminShipmentsPage from "./pages/AdminShipmentsPage";
import AdminBlogPage from "./pages/AdminBlogPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import PostLoginRedirectPage from "./pages/PostLoginRedirectPage";
import AdminQuotesPage from "./pages/AdminQuotesPage";
import RequireRoles from "./routes/RequireRoles";
import LandingPage from "./pages/LandingPage";
import GlobalBanner from "./components/GlobalBanner";

function App() {
  return (
    <>
      <GlobalBanner />
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/quote" element={<QuotePage />} />
          <Route path="/track" element={<TrackingPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Blog (public) */}
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />

          {/* Auth pages exist, but are NOT public while troubleshooting */}
          <Route path="/login" element={<ClientLoginPage />} />

          <Route
            path="/register"
            element={<ClientRegisterPage />}
          />
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          {/* Post-login redirect (you can keep this public or gate it too) */}
          <Route path="/post-login" element={<PostLoginRedirectPage />} />

          {/* Client-protected */}
          <Route element={<RequireRoles allowed={["client"]} />}>
            <Route path="/shipments" element={<MyShipmentsPage />} />
          </Route>

          {/* Footer-only pages */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/opt-in" element={<OptInPage />} />
        </Route>

        {/* Landing Pages */}
        <Route element={<LandingLayout />}>
          <Route path="/express-quote" element={<LandingPage />} />
        </Route>

        {/* Admin + Employee */}
        <Route
          element={
            <RequireRoles allowed={["admin", "employee"]} redirectTo="/login" />
          }
        >
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="quotes" element={<AdminQuotesPage />} />
            <Route path="shipments" element={<AdminShipmentsPage />} />
            <Route path="blog" element={<AdminBlogPage />} />

            {/* Admin-only */}
            <Route element={<RequireRoles allowed={["admin"]} redirectTo="/login" />}>
              <Route path="users" element={<AdminUsersPage />} />
            </Route>
          </Route>
        </Route>

      </Routes>
    </>
  );
}

export default App;
