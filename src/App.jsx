import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/layout/Layout';
import AdminLayout from './pages/admin/AdminLayout';
import PageLoader from './components/common/PageLoader';
import { pageTransition } from './animations/variants';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Categories = lazy(() => import('./pages/Categories'));
const Collections = lazy(() => import('./pages/Collections'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Shipping = lazy(() => import('./pages/Shipping'));
const Returns = lazy(() => import('./pages/Returns'));
const NotFound = lazy(() => import('./pages/NotFound'));

const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminInvoices = lazy(() => import('./pages/admin/AdminInvoices'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminFeedback = lazy(() => import('./pages/admin/AdminFeedback'));

function AnimatedPage({ children }) {
  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={pageTransition}>
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <AnimatePresence>{initialLoading && <PageLoader />}</AnimatePresence>

      <Suspense fallback={<div className="route-fallback" aria-hidden="true" />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route element={<Layout />}>
              <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
              <Route path="/shop" element={<AnimatedPage><Shop /></AnimatedPage>} />
              <Route path="/product/:slug" element={<AnimatedPage><ProductDetails /></AnimatedPage>} />
              <Route path="/categories" element={<AnimatedPage><Categories /></AnimatedPage>} />
              <Route path="/collections" element={<AnimatedPage><Collections /></AnimatedPage>} />
              <Route path="/wishlist" element={<AnimatedPage><Wishlist /></AnimatedPage>} />
              <Route path="/cart" element={<AnimatedPage><Cart /></AnimatedPage>} />
              <Route path="/checkout" element={<AnimatedPage><Checkout /></AnimatedPage>} />
              <Route path="/order-confirmation" element={<AnimatedPage><OrderConfirmation /></AnimatedPage>} />
              <Route path="/order-tracking" element={<AnimatedPage><OrderTracking /></AnimatedPage>} />
              <Route path="/dashboard" element={<AnimatedPage><Dashboard /></AnimatedPage>} />
              <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
              <Route path="/register" element={<AnimatedPage><Register /></AnimatedPage>} />
              <Route path="/about" element={<AnimatedPage><About /></AnimatedPage>} />
              <Route path="/contact" element={<AnimatedPage><Contact /></AnimatedPage>} />
              <Route path="/faq" element={<AnimatedPage><FAQ /></AnimatedPage>} />
              <Route path="/privacy-policy" element={<AnimatedPage><Privacy /></AnimatedPage>} />
              <Route path="/terms-conditions" element={<AnimatedPage><Terms /></AnimatedPage>} />
              <Route path="/shipping-policy" element={<AnimatedPage><Shipping /></AnimatedPage>} />
              <Route path="/returns-policy" element={<AnimatedPage><Returns /></AnimatedPage>} />
              <Route path="*" element={<AnimatedPage><NotFound /></AnimatedPage>} />
            </Route>

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="invoices" element={<AdminInvoices />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="feedback" element={<AdminFeedback />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
}
