import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export const PublicPortal = () => {
  const { isAuthenticated, user, loginUser, registerUser, logoutUser, t } = useAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ mobile: '', password: '', role: 'farmer' });
  const [registerForm, setRegisterForm] = useState({ fullName: '', mobile: '', password: '', role: 'farmer', aadhaar: '', bankAccount: '', ifsc: '' });
  const [loginError, setLoginError] = useState('');
  const [formKey, setFormKey] = useState(Date.now());

  useEffect(() => {
    setLoginForm({ mobile: '', password: '', role: 'farmer' });
    setRegisterForm({ fullName: '', mobile: '', password: '', role: 'farmer', aadhaar: '', bankAccount: '', ifsc: '' });
    setLoginError('');
    setFormKey(Date.now());
  }, []);

  const [activeAuthTab, setActiveAuthTab] = useState('login');

  const handleTabChange = (tab) => {
    setActiveAuthTab(tab);
    setLoginError('');
    setLoginForm({ mobile: '', password: '', role: 'farmer' });
    setRegisterForm({ fullName: '', mobile: '', password: '', role: 'farmer', aadhaar: '', bankAccount: '', ifsc: '' });
    setFormKey(Date.now());
  };

  const handleFocusAuth = (tab = 'login') => {
    handleTabChange(tab);
    document.getElementById('auth-card')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickDemoLogin = (role) => {
    const demoMobiles = {
      farmer: '+91 98231 44210',
      apmc: '+91 94220 18400',
      buyer: '+91 98200 55100',
      driver: '+91 98233 11204'
    };
    try {
      const loggedInUser = loginUser({
        role: role,
        mobile: demoMobiles[role],
        password: 'password123'
      });
      if (loggedInUser.role === 'buyer') navigate('/buyer/bids');
      else if (loggedInUser.role === 'apmc') navigate('/mandi/queue');
      else if (loggedInUser.role === 'driver') navigate('/driver/gate-pass');
      else navigate('/dashboard');
    } catch (error) {
      setLoginError(error.message);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginForm.mobile || !loginForm.password) {
      setLoginError('Please enter both mobile and password.');
      return;
    }
    try {
      const loggedInUser = loginUser(loginForm);
      if (loggedInUser.role === 'buyer') navigate('/buyer/bids');
      else if (loggedInUser.role === 'apmc') navigate('/mandi/queue');
      else if (loggedInUser.role === 'driver') navigate('/driver/gate-pass');
      else navigate('/dashboard');
    } catch (error) {
      setLoginError(error.message);
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!registerForm.fullName || !registerForm.mobile || !registerForm.password) {
      setLoginError('Full name, mobile, and password are required.');
      return;
    }
    try {
      const registered = registerUser(registerForm);
      if (registered.role === 'buyer') navigate('/buyer/bids');
      else if (registered.role === 'apmc') navigate('/mandi/queue');
      else if (registered.role === 'driver') navigate('/driver/gate-pass');
      else navigate('/dashboard');
    } catch (error) {
      setLoginError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0f172a] font-sans">
      {/* Main Navigation Bar */}
      <header className="bg-white/90 backdrop-blur-md py-3 px-6 shadow-xs border-b border-[#e2e8f0] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/agrisync-logo.png" alt="AgriSync Logo" className="w-11 h-11 rounded-xl object-contain shadow-xs bg-white p-0.5 border border-[#dcfce7]" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold text-[#166534] tracking-tight leading-none">AgriSync</span>
                <span className="bg-[#dcfce7] text-[#166534] text-[10px] px-1.5 py-0.2 rounded font-bold border border-[#bbf7d0]">INDIA</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{t('hero.nationalMandi', 'National Mandi & Procurement Platform')}</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-700">
            <a href="#features" className="hover:text-[#047857]">{t('hero.featuresLink', 'Features')}</a>
            <Link to="/how-it-works" className="hover:text-[#047857]">{t('hero.howItWorksLink', 'How It Works')}</Link>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher size="sm" />
            <button onClick={() => handleFocusAuth('login')} className="text-xs bg-[#047857] text-white hover:bg-[#065f46] font-extrabold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer">
              {t('hero.loginRegisterBtn', 'Login / Register')}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6 bg-gradient-to-b from-[#f0fdf4] via-[#f4fbf7] to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#047857] animate-pulse"></span>
              <span>{t('hero.badge', 'Trusted by 45,000+ Farmers & 12 APMC Mandis')}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-[#0f172a] tracking-tight leading-[1.1]">
              {t('hero.titleLine1', 'From Farm Protection to')} <br />
              <span className="text-[#047857]">{t('hero.titleLine2', 'Better Selling Decisions.')}</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              {t('hero.desc', 'AgriSync connects solar perimeter intrusion defense with real-time APMC mandi slot booking, NIR produce assaying, and direct institutional buyer matching.')}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button onClick={() => handleFocusAuth('login')} className="px-6 py-3.5 rounded-xl bg-[#047857] text-white font-extrabold text-sm hover:bg-[#065f46] shadow-lg transition-all flex items-center gap-2 cursor-pointer">
                <span className="material-symbols-outlined">login</span> {t('hero.loginWorkspace', 'Login to Workspace')}
              </button>
              <Link to="/how-it-works" className="px-6 py-3.5 rounded-xl bg-white text-[#0f172a] font-bold text-sm border border-slate-200 hover:bg-slate-50 shadow-xs transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[#047857]">play_circle</span> {t('hero.exploreHow', 'Explore How It Works')}
              </Link>
            </div>
          </div>

          {/* Right Auth Forms */}
          <div id="auth-card" className="lg:col-span-5 scroll-mt-24">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden relative">
              {/* Tabs */}
              <div className="flex border-b border-slate-100">
                <button 
                  onClick={() => handleTabChange('login')}
                  className={`flex-1 py-4 text-sm font-extrabold transition-colors ${activeAuthTab === 'login' ? 'bg-[#f4fbf7] text-[#047857] border-b-2 border-[#047857]' : 'bg-white text-slate-500 hover:text-slate-800'}`}
                >
                  {t('auth.loginTab', 'Login')}
                </button>
                <button 
                  onClick={() => handleTabChange('register')}
                  className={`flex-1 py-4 text-sm font-extrabold transition-colors ${activeAuthTab === 'register' ? 'bg-[#f4fbf7] text-[#047857] border-b-2 border-[#047857]' : 'bg-white text-slate-500 hover:text-slate-800'}`}
                >
                  {t('auth.registerTab', 'Register')}
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[550px] overflow-y-auto">
                {activeAuthTab === 'login' && (
                  <form key={formKey} autoComplete="off" onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                    {loginError && (
                      <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 font-bold">
                        {loginError}
                      </div>
                    )}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t('auth.mobileEmail', 'Mobile / Email *')}</label>
                      <input 
                        type="text"
                        value={loginForm.mobile}
                        onChange={(e) => setLoginForm({...loginForm, mobile: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl font-semibold text-[#0f172a] outline-none focus:border-[#047857]"
                        placeholder={t('auth.mobilePlaceholder', 'Enter registered mobile')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t('auth.password', 'Password *')}</label>
                      <input 
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl font-semibold text-[#0f172a] outline-none focus:border-[#047857]"
                        placeholder={t('auth.passwordPlaceholder', 'Enter password')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t('auth.role', 'Role *')}</label>
                      <select 
                        value={loginForm.role}
                        onChange={(e) => setLoginForm({...loginForm, role: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl font-bold text-[#0f172a] outline-none"
                      >
                        <option value="farmer">{t('role.farmer', 'Farmer Producer (FPO)')}</option>
                        <option value="apmc">{t('role.apmc', 'APMC Mandi Official')}</option>
                        <option value="buyer">{t('role.buyer', 'Institutional Buyer')}</option>
                        <option value="driver">{t('role.driver', 'Logistics Drayage Driver')}</option>
                      </select>
                    </div>
                    <div className="pt-2">
                      <button type="submit" className="w-full py-3 bg-[#047857] text-white font-extrabold text-sm rounded-xl hover:bg-[#065f46] shadow-md transition-all cursor-pointer">
                        {t('auth.loginSecurely', 'Login Securely')}
                      </button>
                    </div>

                    {/* Quick Demo Shortcuts */}
                    <div className="pt-3 border-t border-slate-100 mt-3">
                      <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">{t('auth.quickDemo', '⚡ Quick 1-Click Demo Login')}</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => handleQuickDemoLogin('farmer')} className="px-2.5 py-1.5 bg-[#dcfce7] text-[#166534] rounded-lg font-extrabold text-[11px] hover:bg-[#bbf7d0] transition-colors border border-[#bbf7d0] text-left">
                          {t('auth.demoFarmer', '🌾 Farmer FPO')}
                        </button>
                        <button type="button" onClick={() => handleQuickDemoLogin('apmc')} className="px-2.5 py-1.5 bg-slate-100 text-[#0f172a] rounded-lg font-extrabold text-[11px] hover:bg-slate-200 transition-colors border border-slate-200 text-left">
                          {t('auth.demoApmc', '🏢 APMC Mandi')}
                        </button>
                        <button type="button" onClick={() => handleQuickDemoLogin('buyer')} className="px-2.5 py-1.5 bg-slate-100 text-[#0f172a] rounded-lg font-extrabold text-[11px] hover:bg-slate-200 transition-colors border border-slate-200 text-left">
                          {t('auth.demoBuyer', '💼 Buyer Co.')}
                        </button>
                        <button type="button" onClick={() => handleQuickDemoLogin('driver')} className="px-2.5 py-1.5 bg-slate-100 text-[#0f172a] rounded-lg font-extrabold text-[11px] hover:bg-slate-200 transition-colors border border-slate-200 text-left">
                          {t('auth.demoDriver', '🚛 Drayage Driver')}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {activeAuthTab === 'register' && (
                  <form key={formKey} autoComplete="off" onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                    {loginError && (
                      <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 font-bold">
                        {loginError}
                      </div>
                    )}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t('auth.fullName', 'Full Name / Entity Name *')}</label>
                      <input 
                        type="text"
                        value={registerForm.fullName}
                        onChange={(e) => setRegisterForm({...registerForm, fullName: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl font-semibold text-[#0f172a] outline-none focus:border-[#047857]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t('auth.mobileNumber', 'Mobile Number *')}</label>
                      <input 
                        type="text"
                        value={registerForm.mobile}
                        onChange={(e) => setRegisterForm({...registerForm, mobile: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl font-semibold text-[#0f172a] outline-none focus:border-[#047857]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t('auth.aadhaar', 'Aadhaar Number (e-KYC)')}</label>
                      <input 
                        type="text"
                        placeholder="e.g. 4589-1234-9810"
                        value={registerForm.aadhaar}
                        onChange={(e) => setRegisterForm({...registerForm, aadhaar: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl font-semibold text-[#0f172a] outline-none focus:border-[#047857]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">{t('auth.bankAccount', 'Bank A/c Number')}</label>
                        <input 
                          type="text"
                          placeholder="e.g. 9100238491823"
                          value={registerForm.bankAccount}
                          onChange={(e) => setRegisterForm({...registerForm, bankAccount: e.target.value})}
                          className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl font-semibold text-[#0f172a] outline-none focus:border-[#047857]"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">{t('auth.ifsc', 'Bank IFSC Code')}</label>
                        <input 
                          type="text"
                          placeholder="e.g. ICIC0000102"
                          value={registerForm.ifsc}
                          onChange={(e) => setRegisterForm({...registerForm, ifsc: e.target.value})}
                          className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl font-semibold text-[#0f172a] outline-none focus:border-[#047857]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t('auth.role', 'Role *')}</label>
                      <select 
                        value={registerForm.role}
                        onChange={(e) => setRegisterForm({...registerForm, role: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl font-bold text-[#0f172a] outline-none"
                      >
                        <option value="farmer">{t('role.farmer', 'Farmer Producer (FPO)')}</option>
                        <option value="apmc">{t('role.apmc', 'APMC Mandi Official')}</option>
                        <option value="buyer">{t('role.buyer', 'Institutional Buyer')}</option>
                        <option value="driver">{t('role.driver', 'Logistics Drayage Driver')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{t('auth.createPassword', 'Create Password *')}</label>
                      <input 
                        type="password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                        className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl font-semibold text-[#0f172a] outline-none focus:border-[#047857]"
                        required
                      />
                    </div>
                    <div className="pt-2">
                      <button type="submit" className="w-full py-3 bg-[#0f172a] text-white font-extrabold text-sm rounded-xl hover:bg-[#1e293b] shadow-md transition-all cursor-pointer">
                        {t('auth.registerNow', 'Register Now')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Website Overview & Features Section */}
      <section id="features" className="py-16 px-6 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#047857] bg-[#dcfce7] px-3.5 py-1 rounded-full border border-[#bbf7d0]">
              {t('features.badge', 'Platform Overview')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0f172a] mt-3">
              {t('features.title', 'What AgriSync Does For You')}
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              {t('features.subtitle', 'AgriSync is an end-to-end digital agritech ecosystem unifying farm security, market intelligence, APMC mandi logistics, quality assaying, and direct bank settlement.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#f8fafc] rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#dcfce7] text-[#047857] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">shield</span>
              </div>
              <h3 className="font-extrabold text-base text-[#0f172a]">{t('features.card1Title', '1. AI Farm Intrusion Defense')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('features.card1Desc', 'Solar-powered cameras with real-time AI animal detection automatically trigger acoustic deterrents and generate evidence logs for PMFBY crop insurance claims.')}
              </p>
            </div>

            <div className="bg-[#f8fafc] rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#dcfce7] text-[#047857] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">trending_up</span>
              </div>
              <h3 className="font-extrabold text-base text-[#0f172a]">{t('features.card2Title', '2. Smart Selling Advisory')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('features.card2Desc', 'Analyze price trends across APMC mandis to determine the best 48–72 hour harvest selling window and match with verified institutional buyers.')}
              </p>
            </div>

            <div className="bg-[#f8fafc] rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#dcfce7] text-[#047857] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">qr_code_2</span>
              </div>
              <h3 className="font-extrabold text-base text-[#0f172a]">{t('features.card3Title', '3. APMC Mandi Slot Booking')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('features.card3Desc', 'Reserve arrival slots to skip long yard congestion queues. ANPR camera gate security scans vehicle plates and assigns instant digital entry tokens.')}
              </p>
            </div>

            <div className="bg-[#f8fafc] rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-shadow space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#dcfce7] text-[#047857] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
              </div>
              <h3 className="font-extrabold text-base text-[#0f172a]">{t('features.card4Title', '4. Instant Escrow DBT Settlement')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('features.card4Desc', 'Certified weighbridge & NIR quality assay grading automatically trigger direct escrow payment to the farmer\'s bank account with zero middleman deductions.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Branded Footer */}
      <footer className="w-full bg-[#0f172a] text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-800">
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img src="/agrisync-logo.png" alt="AgriSync Logo" className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 border border-[#dcfce7]" />
                <div>
                  <span className="font-extrabold text-base text-white block">AgriSync India</span>
                  <span className="text-[10px] text-[#a7f3d0] font-semibold">Smarter Farms • Safer Harvests</span>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                {t('features.subtitle', 'National APMC Mandi Slot Allocation, YOLOv8 Crop Perimeter Defense, and Instant Settlement Platform.')}
              </p>
            </div>

            {/* Col 2: Platform Links */}
            <div>
              <h4 className="text-white font-bold text-xs mb-3 uppercase tracking-wider">{t('nav.overview', 'Farmer Operations')}</h4>
              <ul className="space-y-2 text-[11px]">
                <li><Link to="/login" className="hover:text-emerald-400 transition-colors">{t('nav.dashboard', 'Operations Dashboard')}</Link></li>
                <li><Link to="/how-it-works" className="hover:text-emerald-400 transition-colors">{t('nav.howItWorks', 'How AgriSync Works')}</Link></li>
                <li><Link to="/register" className="hover:text-emerald-400 transition-colors">{t('nav.registerKYC', 'Farmer e-KYC Onboarding')}</Link></li>
                <li><Link to="/market" className="hover:text-emerald-400 transition-colors">{t('nav.marketPrices', 'Agmarknet Live Mandi Rates')}</Link></li>
              </ul>
            </div>

            {/* Col 3: Mandi Services */}
            <div>
              <h4 className="text-white font-bold text-xs mb-3 uppercase tracking-wider">{t('nav.mandiOperations', 'APMC Mandi Infrastructure')}</h4>
              <ul className="space-y-2 text-[11px]">
                <li><Link to="/login" className="hover:text-emerald-400 transition-colors">{t('nav.weighbridge', 'Digital Weighbridge Console')}</Link></li>
                <li><Link to="/login" className="hover:text-emerald-400 transition-colors">{t('nav.gateSecurity', 'ANPR Automatic Gate-In Queue')}</Link></li>
                <li><Link to="/login" className="hover:text-emerald-400 transition-colors">{t('nav.qualityAssayer', 'NIR Assayer Quality Grading')}</Link></li>
                <li><Link to="/login" className="hover:text-emerald-400 transition-colors">{t('nav.transactions', 'Bank Escrow Fast Settlement')}</Link></li>
              </ul>
            </div>

            {/* Col 4: Support */}
            <div>
              <h4 className="text-white font-bold text-xs mb-3 uppercase tracking-wider">{t('nav.apmcSupport', 'Helpdesk & Support')}</h4>
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block font-medium">National APMC Kisan Toll-Free</span>
                <span className="text-emerald-400 font-bold text-base block font-mono">1800 233 4567</span>
                <span className="text-[10px] text-slate-500 block">Available 24/7 in Marathi, Hindi & English</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-500">
            <p>© 2026 AgriSync National Platform. All rights reserved under National Agricultural Market standards.</p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{t('dash.allOperational', 'All 48 Mandi Gateways Operational')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicPortal;

