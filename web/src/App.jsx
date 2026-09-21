import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Public & Onboarding Pages
import LoginPage from './pages/public/LoginPage';
import PublicPortal from './pages/public/PublicPortal';
import HowItWorks from './pages/public/HowItWorks';
import FarmerRegistration from './pages/public/FarmerRegistration';

// Core Dashboard & Pre-Harvest Pages
import Dashboard from './pages/Dashboard';
import Alerts from './pages/preharvest/Alerts';
import Cameras from './pages/Cameras';
import Detections from './pages/Detections';
import DetectionDetail from './pages/DetectionDetail';
import AnimalManagement from './pages/preharvest/AnimalManagement';
import CropIncidents from './pages/preharvest/CropIncidents';
import IncidentAnalytics from './pages/preharvest/IncidentAnalytics';

// Produce & Selling Pages
import ProduceBatches from './pages/produce/ProduceBatches';
import SellingAdvisory from './pages/sell/SellingAdvisory';
import BuyerMatches from './pages/sell/BuyerMatches';
import MarketPrices from './pages/market/MarketPrices';
import MarketDetail from './pages/market/MarketDetail';

// Fulfillment & Finance Pages
import StorageDiscovery from './pages/fulfillment/StorageDiscovery';
import TransportOptions from './pages/fulfillment/TransportOptions';
import TransactionsSettlements from './pages/fulfillment/TransactionsSettlements';
import TransactionDetail from './pages/fulfillment/TransactionDetail';
import FarmProfileSettings from './pages/settings/FarmProfileSettings';

// APMC Mandi Operations Pages
import LiveQueue from './pages/mandi/LiveQueue';
import GateSecurityKiosk from './pages/mandi/GateSecurityKiosk';
import WeighbridgeConsole from './pages/mandi/WeighbridgeConsole';
import QualityAssayer from './pages/mandi/QualityAssayer';

// Buyer, Driver & Design System Pages
import InstitutionalBids from './pages/buyer/InstitutionalBids';
import DriverGatePass from './pages/driver/DriverGatePass';
import DesignSystemTokens from './pages/design/DesignSystemTokens';

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Portal & Onboarding Routes */}
          <Route path="/" element={<PublicPortal />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/register" element={<FarmerRegistration />} />

          {/* Farmer Overview */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'public', 'apmc', 'buyer', 'driver']}>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Risk & Field (Animal Intrusion System) */}
          <Route
            path="/alerts"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <DashboardLayout>
                  <Alerts />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cameras"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <DashboardLayout>
                  <Cameras />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/detections"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <DashboardLayout>
                  <Detections />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/detections/:id"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <DashboardLayout>
                  <DetectionDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/protect/animals"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <DashboardLayout>
                  <AnimalManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/protect/incidents"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'apmc']}>
                <DashboardLayout>
                  <CropIncidents />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/protect/analytics"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <DashboardLayout>
                  <IncidentAnalytics />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Commerce & Mandi */}
          <Route
            path="/produce"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <DashboardLayout>
                  <ProduceBatches />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sell/advisory"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <DashboardLayout>
                  <SellingAdvisory />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sell/buyers"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <DashboardLayout>
                  <BuyerMatches />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/market"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'public', 'apmc', 'buyer', 'driver']}>
                <DashboardLayout>
                  <MarketPrices />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/market/:id"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'public', 'apmc', 'buyer', 'driver']}>
                <DashboardLayout>
                  <MarketDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Fulfillment & Finance */}
          <Route
            path="/storage"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'buyer']}>
                <DashboardLayout>
                  <StorageDiscovery />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transport"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <DashboardLayout>
                  <TransportOptions />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <DashboardLayout>
                  <TransactionsSettlements />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions/:id"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <DashboardLayout>
                  <TransactionDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'apmc', 'buyer', 'driver', 'public']}>
                <DashboardLayout>
                  <FarmProfileSettings />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* APMC Mandi Operator Routes */}
          <Route
            path="/mandi/queue"
            element={
              <ProtectedRoute allowedRoles={['apmc', 'farmer', 'driver']}>
                <DashboardLayout>
                  <LiveQueue />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mandi/gate"
            element={
              <ProtectedRoute allowedRoles={['apmc']}>
                <DashboardLayout>
                  <GateSecurityKiosk />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mandi/weighbridge"
            element={
              <ProtectedRoute allowedRoles={['apmc']}>
                <DashboardLayout>
                  <WeighbridgeConsole />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/mandi/quality"
            element={
              <ProtectedRoute allowedRoles={['apmc']}>
                <DashboardLayout>
                  <QualityAssayer />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Buyer Routes */}
          <Route
            path="/buyer/bids"
            element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <DashboardLayout>
                  <InstitutionalBids />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Driver Route */}
          <Route
            path="/driver/gate-pass"
            element={
              <ProtectedRoute allowedRoles={['driver', 'farmer']}>
                <DashboardLayout>
                  <DriverGatePass />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Design System Token View */}
          <Route
            path="/design-system"
            element={
              <DashboardLayout>
                <DesignSystemTokens />
              </DashboardLayout>
            }
          />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
