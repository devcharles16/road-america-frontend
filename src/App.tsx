import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import QuotePage from "./pages/QuotePage";
import TrackingPage from "./pages/TrackingPage";
import AdminShipmentsPage from "./pages/AdminShipmentsPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import MyShipmentsPage from "./pages/MyShipmentsPage";
import ClientLoginPage from "./pages/ClientLoginPage";
import BlogPage from "./pages/BlogPage";
import AboutPage from "./pages/AboutPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import ClientRegisterPage from "./pages/ClientRegisterPage";
import BlogListPage from "./pages/BlogListPage";
import BlogPostPage from "./pages/BlogPostPage";
import AdminBlogPage from "./pages/AdminBlogPage";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import { RequireRoles } from "./routes/RequireRoles";
import AuthDebugBanner from "./components/AuthDebugBanner"





function App() {
  return (
    <div className="min-h-screen bg-brand-dark text-white flex flex-col">
      <Header />
      <main className="flex-1">
        <AuthDebugBanner />
        <Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/quote" element={<QuotePage />} />
  <Route path="/track" element={<TrackingPage />} />
  <Route path="/about" element={<AboutPage />} />
    <Route path="/blog" element={<BlogListPage />} />
  <Route path="/blog/:slug" element={<BlogPostPage />} />


  {/* Client portal */}
  <Route path="/login" element={<ClientLoginPage />} />
  <Route path="/register" element={<ClientRegisterPage />} />
  <Route path="/my-shipments" element={<MyShipmentsPage />} />

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

  {/* ADMIN ONLY */}
  <Route
    path="users"
    element={
      <RequireRoles allowed={["admin"]}>
        <AdminUsersPage />
      </RequireRoles>
    }
  />
</Route>


   {/* Terms and Privacy */}
  <Route path="/privacy" element={<PrivacyPage />} />
  <Route path="/terms" element={<TermsPage />} />


  {/* Blog placeholder */}
<Route path="/blog" element={<BlogPage />} />
</Routes>

      </main>
      <Footer />
    </div>
  );
}

export default App;
