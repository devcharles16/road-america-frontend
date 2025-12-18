import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";

import HomePage from "./pages/HomePage";
import QuotePage from "./pages/QuotePage";
import TrackingPage from "./pages/TrackingPage";
import AboutPage from "./pages/AboutPage";

import BlogListPage from "./pages/BlogListPage";
import BlogPostPage from "./pages/BlogPostPage";

import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

import ClientLoginPage from "./pages/ClientLoginPage";
import ClientRegisterPage from "./pages/ClientRegisterPage";
import MyShipmentsPage from "./pages/MyShipmentsPage";

import AdminLoginPage from "./pages/AdminLoginPage";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminShipmentsPage from "./pages/AdminShipmentsPage";
import AdminBlogPage from "./pages/AdminBlogPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import PostLoginRedirectPage from "./pages/PostLoginRedirectPage";


import { RequireRoles } from "./routes/RequireRoles";

function App() {
  return (
    <div className="min-h-screen bg-brand-dark text-white flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/quote" element={<QuotePage />} />
          <Route path="/track" element={<TrackingPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Blog (public) */}
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />

          {/* Client portal */}
          <Route path="/login" element={<ClientLoginPage />} />
          <Route path="/register" element={<ClientRegisterPage />} />
          <Route path="/my-shipments" element={<MyShipmentsPage />} />

<Route path="/post-login" element={<PostLoginRedirectPage />} />


          {/* Footer-only pages */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          <Route
            path="/admin"
            element={
              <RequireRoles allowed={["admin", "employee"]}>
                <AdminLayout />
              </RequireRoles>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="shipments" element={<AdminShipmentsPage />} />
            <Route path="blog" element={<AdminBlogPage />} />

            {/* Admin only */}
            <Route
              path="users"
              element={
                <RequireRoles allowed={["admin"]}>
                  <AdminUsersPage />
                </RequireRoles>
              }
            />
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
