import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export const LoginPage = () => {
  const { loginUser, t } = useAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({
    mobile: '',
    password: '',
    role: 'farmer'
  });
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginForm.mobile || !loginForm.password) {
      setLoginError('Please enter both mobile and password.');
      return;
    }
    
    try {
      const loggedInUser = loginUser(loginForm);
      // Redirect based on role
      if (loggedInUser.role === 'buyer') navigate('/buyer/bids');
      else if (loggedInUser.role === 'apmc') navigate('/mandi/queue');
      else if (loggedInUser.role === 'driver') navigate('/driver/gate-pass');
      else navigate('/dashboard');
    } catch (error) {
      setLoginError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4fbf7] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-3">
          <LanguageSwitcher size="sm" />
        </div>
        <Link to="/" className="inline-block">
          <img src="/agrisync-logo.png" alt="AgriSync Logo" className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-contain shadow-lg mb-3 sm:mb-4 bg-white p-1 border border-[#dcfce7]" />
        </Link>
        <h2 className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">{t('auth.signInTitle', 'Sign in to AgriSync')}</h2>
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-600 font-semibold">
          Or <Link to="/register" className="font-extrabold text-[#047857] hover:text-[#065f46]">{t('auth.orRegister', 'register as a new user')}</Link>
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 sm:py-8 px-4 sm:px-10 shadow-xl border border-slate-200 rounded-3xl">
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {loginError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 font-bold text-xs">
                {loginError}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.mobileEmail', 'Mobile / Email *')}</label>
              <input 
                type="text"
                value={loginForm.mobile}
                onChange={(e) => setLoginForm({...loginForm, mobile: e.target.value})}
                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm font-semibold text-[#0f172a] outline-none focus:border-[#047857]"
                placeholder={t('auth.mobilePlaceholder', 'Enter registered mobile')}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.password', 'Password *')}</label>
              <input 
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm font-semibold text-[#0f172a] outline-none focus:border-[#047857]"
                placeholder={t('auth.passwordPlaceholder', 'Enter password')}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.role', 'Role *')}</label>
              <select 
                value={loginForm.role}
                onChange={(e) => setLoginForm({...loginForm, role: e.target.value})}
                className="w-full px-4 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-sm font-bold text-[#0f172a] outline-none focus:border-[#047857]"
              >
                <option value="farmer">{t('role.farmer', 'Farmer Producer (FPO)')}</option>
                <option value="apmc">{t('role.apmc', 'APMC Mandi Official')}</option>
                <option value="buyer">{t('role.buyer', 'Institutional Buyer')}</option>
                <option value="driver">{t('role.driver', 'Logistics Drayage Driver')}</option>
              </select>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                className="w-full py-3 bg-[#047857] text-white font-extrabold rounded-xl hover:bg-[#065f46] shadow-lg transition-all cursor-pointer"
              >
                {t('auth.loginSecurely', 'Login Securely')}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-xs text-slate-500 font-medium">
            {t('auth.demoCredentials', 'Demo Credentials: Use password password123 for testing.')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

