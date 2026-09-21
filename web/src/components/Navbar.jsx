import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';

export const Navbar = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logoutUser, getRoleLabel, t } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white/95 backdrop-blur-xl border-b border-[#e2e8f0] shadow-xs z-40 flex items-center justify-between px-3 sm:px-6">
      {/* Left: Mobile Hamburger & Role Pill Display */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Hamburger Menu Toggle Button (Mobile & Tablet) */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-hidden"
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="material-symbols-outlined text-2xl">
            {sidebarOpen ? 'close' : 'menu'}
          </span>
        </button>

        {/* Active Role Pill (Read-Only) */}
        <div className="flex items-center gap-1.5 bg-[#dcfce7] px-2.5 py-1 rounded-lg text-xs border border-[#bbf7d0] shadow-2xs">
          <span className="material-symbols-outlined text-base text-[#166534]">badge</span>
          <span className="hidden sm:inline font-extrabold text-[#166534]">{t('nav.activeRole', 'Role')}:</span>
          <span className="text-[#047857] font-bold truncate max-w-[90px] sm:max-w-none">{getRoleLabel(user?.role)}</span>
        </div>

        {/* Language Switcher */}
        <div className="hidden xs:block">
          <LanguageSwitcher size="sm" />
        </div>
      </div>

      {/* Right: Action Controls, Language Switcher (on xs), User Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="xs:hidden">
          <LanguageSwitcher size="sm" />
        </div>

        {/* Gate-In Entry Button: RESTRICTED STRICTLY TO DRIVER ROLE */}
        {user?.role === 'driver' && (
          <button 
            onClick={() => navigate('/mandi/queue')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#dcfce7] text-[#047857] hover:bg-[#bbf7d0] font-extrabold text-xs transition-colors border border-[#bbf7d0]"
          >
            <span className="material-symbols-outlined text-sm">local_shipping</span>
            <span>{t('nav.gateInEntry', '+ Gate-In Entry')}</span>
          </button>
        )}

        <div className="hidden sm:block h-6 w-px bg-slate-200"></div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right hidden sm:block">
            <div className="font-extrabold text-xs text-[#0f172a] leading-tight truncate max-w-[120px] lg:max-w-none">{user.name}</div>
            <div className="text-[11px] text-[#047857] font-semibold flex items-center justify-end gap-0.5 truncate max-w-[120px] lg:max-w-none">
              <span className="material-symbols-outlined text-xs text-[#166534]">location_on</span>
              <span className="truncate">{user.apmc || user.location || 'Farmland'}</span>
            </div>
          </div>
          {user.avatar ? (
            <img src={user.avatar} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-[#047857] shadow-xs" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#166534] text-white flex items-center justify-center font-bold text-xs border border-[#a7f3d0] shrink-0">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
          )}

          <button 
            onClick={handleLogout}
            title={t('nav.logout', 'Log out of account')}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;


