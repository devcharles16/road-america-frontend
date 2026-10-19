import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import QuotePage from "./pages/QuotePage";
import QuotePageAB from "./pages/QuotePageAB";
import TrackingPage from "./pages/TrackingPage";
import AboutPage from "./pages/AboutPage";
import TruthAboutAutoTransportPage from "./pages/TruthAboutAutoTransportPage";
import BusinessAutoTransportPage from "./pages/BusinessAutoTransportPage";

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
import AdminBannerPage from "./pages/AdminBannerPage";
import CarShippingRoutesIndexPage from "./pages/CarShippingRoutesIndexPage";
import RoutePage from "./pages/RoutePage";
import { getAllRoutes } from "./data/routesData";

function App() {
  return (
    <>
      <GlobalBanner />
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/quote" element={<QuotePage />} />
          <Route path="/quote-ab" element={<QuotePageAB />} />
          <Route path="/track" element={<TrackingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/the-truth-about-auto-transport" element={<TruthAboutAutoTransportPage />} />
          <Route path="/business-auto-transport" element={<BusinessAutoTransportPage />} />

          {/* Car Shipping Routes */}
          <Route path="/car-shipping-routes" element={<CarShippingRoutesIndexPage />} />
          <Route path="/car-shipping-routes/:slug" element={<RoutePage />} />

          {/* Legacy "/auto-transport-city-to-city" aliases, one exact route per
              entry in ROUTES_DATA. NOTE: React Router cannot match a dynamic
              param fused onto literal text within the same path segment
              (":slug" must be preceded by a literal "/" to be treated as a
              param — see compilePath in react-router's source), so a single
              "/auto-transport-:slug" catch-all can never work here. Explicit
              per-route paths, generated from route.legacyPath, are the fix. */}
          {getAllRoutes().map((route) => (
            <Route key={route.id} path={route.legacyPath} element={<RoutePage routeId={route.id} />} />
          ))}

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
            <Route path="banner" element={<AdminBannerPage />} />

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
