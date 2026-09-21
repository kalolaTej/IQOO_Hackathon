import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

export const DashboardLayout = ({ children }) => {
  const { user, t, getRoleLabel } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Role-aware navigation definitions with i18n keys
  const navByRole = {
    farmer: [
      {
        groupKey: 'nav.overview',
        group: 'Overview',
        items: [
          { labelKey: 'nav.dashboard', label: 'Dashboard', path: '/dashboard', icon: 'grid_view' },
        ]
      },
      {
        groupKey: 'nav.riskField',
        group: 'Risk & Field (Animal Intrusion)',
        items: [
          { labelKey: 'nav.intrusionSummary', label: 'Intrusion Summary', path: '/protect/analytics', icon: 'analytics' },
          { labelKey: 'nav.animalManagement', label: 'Animal Management', path: '/protect/animals', icon: 'pets' },
          { labelKey: 'nav.perimeterCameras', label: 'Perimeter Cameras', path: '/cameras', icon: 'videocam' },
          { labelKey: 'nav.detectionHistory', label: 'Detection History', path: '/detections', icon: 'history' },
          { labelKey: 'nav.intrusionAlerts', label: 'Intrusion Alerts', path: '/alerts', icon: 'warning' },
          { labelKey: 'nav.cropIncidents', label: 'Crop Incidents', path: '/protect/incidents', icon: 'shield_with_heart' },
        ]
      },
      {
        groupKey: 'nav.commerceMandi',
        group: 'Commerce & Mandi',
        items: [
          { labelKey: 'nav.myProduce', label: 'My Produce', path: '/produce', icon: 'inventory_2' },
          { labelKey: 'nav.sellingAdvisory', label: 'Selling Advisory', path: '/sell/advisory', icon: 'lightbulb' },
          { labelKey: 'nav.verifiedBuyers', label: 'Verified Buyers', path: '/sell/buyers', icon: 'storefront' },
          { labelKey: 'nav.marketPrices', label: 'Market Prices', path: '/market', icon: 'trending_up' },
        ]
      },
      {
        groupKey: 'nav.fulfillmentFinance',
        group: 'Fulfillment & Finance',
        items: [
          { labelKey: 'nav.storageWarehouses', label: 'Storage & Warehouses', path: '/storage', icon: 'warehouse' },
          { labelKey: 'nav.ruralTransport', label: 'Rural Transport', path: '/transport', icon: 'local_shipping' },
          { labelKey: 'nav.transactions', label: 'Transactions', path: '/transactions', icon: 'receipt_long' },
        ]
      }
    ],
    apmc: [
      {
        groupKey: 'nav.mandiOperations',
        group: 'Mandi Operations',
        items: [
          { labelKey: 'nav.liveQueue', label: 'Live Queue Status', path: '/mandi/queue', icon: 'format_list_numbered' },
          { labelKey: 'nav.gateSecurity', label: 'Gate Security ANPR', path: '/mandi/gate', icon: 'videocam' },
          { labelKey: 'nav.weighbridge', label: 'Weighbridge Console', path: '/mandi/weighbridge', icon: 'scale' },
          { labelKey: 'nav.qualityAssayer', label: 'Quality Assayer (NIR)', path: '/mandi/quality', icon: 'science' },
        ]
      }
    ],
    buyer: [
      {
        groupKey: 'nav.procurement',
        group: 'Procurement',
        items: [
          { labelKey: 'nav.procurementBids', label: 'Procurement Bids & POs', path: '/buyer/bids', icon: 'shopping_bag' },
          { labelKey: 'nav.marketPrices', label: 'Market Prices', path: '/market', icon: 'trending_up' },
          { labelKey: 'nav.storageWarehouses', label: 'Storage Facilities', path: '/storage', icon: 'warehouse' },
        ]
      }
    ],
    driver: [
      {
        groupKey: 'nav.drayage',
        group: 'Drayage',
        items: [
          { labelKey: 'nav.driverGatePass', label: 'Fast-Track Gate Pass', path: '/driver/gate-pass', icon: 'qr_code_2' },
          { labelKey: 'nav.mandiLiveQueue', label: 'Mandi Live Queue', path: '/mandi/queue', icon: 'format_list_numbered' },
        ]
      }
    ],
    public: [
      {
        groupKey: 'nav.portal',
        group: 'Portal',
        items: [
          { labelKey: 'nav.publicHomepage', label: 'Public Homepage', path: '/', icon: 'language' },
          { labelKey: 'nav.howItWorks', label: 'How It Works', path: '/how-it-works', icon: 'play_circle' },
          { labelKey: 'nav.registerKYC', label: 'Register / KYC', path: '/register', icon: 'how_to_reg' },
          { labelKey: 'nav.marketPrices', label: 'Market Prices', path: '/market', icon: 'trending_up' },
        ]
      }
    ]
  };

  const currentNavGroups = navByRole[user?.role] || navByRole.farmer;

  return (
    <div className="min-h-screen bg-[#f4fbf7] flex">
      {/* Fixed Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#0f172a] text-white z-50 flex flex-col justify-between py-4 shadow-xl border-r border-[#1e293b]">
        <div>
          {/* Brand Logo & Title */}
          <div className="px-4 pb-4 flex items-center gap-3 border-b border-[#1e293b]">
            <img src="/agrisync-logo.png" alt="AgriSync Logo" className="w-10 h-10 rounded-xl object-contain shadow-xs bg-white p-0.5 border border-[#dcfce7]" />
            <div>
              <span className="text-base font-black text-white tracking-tight block">AgriSync</span>
              <span className="text-[10px] text-[#a7f3d0] font-bold uppercase tracking-wider block">{getRoleLabel(user?.role)}</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="px-3 pt-4 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto">
            {currentNavGroups.map((group, gIdx) => (
              <div key={gIdx}>
                <div className="px-2 pb-1 text-[10px] font-bold uppercase text-[#a7f3d0] tracking-wider opacity-90">
                  {t(group.groupKey, group.group)}
                </div>
                <div className="space-y-1">
                  {group.items.map((item, iIdx) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={iIdx}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all ${
                          isActive
                            ? 'bg-[#047857] text-white font-bold shadow-md translate-x-0.5'
                            : 'text-slate-300 hover:bg-[#1e293b] hover:text-white'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-lg ${isActive ? 'text-white' : 'text-[#a7f3d0]'}`}>{item.icon}</span>
                        <span>{t(item.labelKey, item.label)}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="px-3 pt-3 border-t border-[#1e293b]">
          <nav className="space-y-1">
            <Link
              to="/settings"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                location.pathname === '/settings'
                  ? 'bg-[#047857] text-white font-bold'
                  : 'text-slate-300 hover:bg-[#1e293b] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-lg text-[#a7f3d0]">tune</span>
              <span>{t('nav.settings', 'Settings')}</span>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-[#1e293b] hover:text-white transition-all"
            >
              <span className="material-symbols-outlined text-lg text-[#a7f3d0]">logout</span>
              <span>{t('nav.exitPortal', 'Exit to Portal')}</span>
            </Link>
          </nav>

          <div className="mt-3 mx-1 p-2.5 bg-[#1e293b] rounded-lg border border-[#047857]/40">
            <div className="flex items-center gap-1.5 text-[#a7f3d0]">
              <span className="material-symbols-outlined text-sm">support</span>
              <span className="text-[11px] font-bold text-[#dcfce7]">{t('nav.apmcSupport', 'APMC Support')}</span>
            </div>
            <span className="font-data-tabular text-xs font-bold text-white block mt-0.5">1800 233 4567</span>
          </div>
        </div>
      </aside>

      {/* Main Layout Body */}
      <div className="pl-64 flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="pt-16 min-h-screen p-6 bg-[#f4fbf7]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

