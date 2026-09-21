import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export const FarmerRegistration = () => {
  const navigate = useNavigate();
  const { registerUser, t } = useAuth();

  const [formData, setFormData] = useState({
    fullName: 'Rajesh Tukaram Patil',
    role: 'farmer',
    mobile: '9823144210',
    aadhaar: '4589-1234-9810',
    village: 'Pimpalgaon Baswant',
    taluka: 'Niphad',
    district: 'Nashik',
    state: 'Maharashtra',
    landHolding: '4.5',
    primaryCrop: 'Red Onion (Garwa)',
    bankAccount: '9100238491823',
    ifsc: 'ICIC0000102',
    mandi: 'Pimpalgaon Baswant APMC (Nashik)',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      errs.fullName = 'Full Name must be at least 3 characters.';
    }
    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      errs.mobile = 'Mobile number must be exactly 10 digits.';
    }
    const cleanAadhaar = formData.aadhaar.replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      errs.aadhaar = 'Aadhaar number must be exactly 12 digits.';
    }
    if (!formData.bankAccount || formData.bankAccount.length < 8) {
      errs.bankAccount = 'Valid bank account number is required.';
    }
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
    if (!ifscRegex.test(formData.ifsc.trim())) {
      errs.ifsc = 'Invalid IFSC code format (e.g. ICIC0000102).';
    }
    if (!formData.password || formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const registered = registerUser(formData);
      setSubmitted(true);

      setTimeout(() => {
        if (registered.role === 'buyer') {
          navigate('/buyer/bids');
        } else if (registered.role === 'apmc') {
          navigate('/mandi/queue');
        } else if (registered.role === 'driver') {
          navigate('/driver/gate-pass');
        } else {
          navigate('/dashboard');
        }
      }, 1200);
    } catch (error) {
      setErrors({ mobile: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-[#f4fbf7] text-[#0f172a] font-sans py-10 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <LanguageSwitcher size="sm" />
          </div>
          <Link to="/" className="inline-flex items-center gap-3 mb-3">
            <img src="/agrisync-logo.png" alt="AgriSync Logo" className="w-14 h-14 rounded-2xl object-contain shadow-md bg-white p-1 border border-[#dcfce7]" />
            <span className="text-3xl font-black text-[#166534] tracking-tight">AgriSync</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-[#0f172a]">{t('auth.onboardingTitle', 'User Onboarding & Role e-KYC Registration')}</h1>
          <p className="text-xs text-slate-600 mt-1">{t('auth.onboardingSubtitle', 'Select your platform role and verify credentials for direct Mandi queue slots, NIR quality certificates, and escrow payments.')}</p>
        </div>

        {submitted ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-xl space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#dcfce7] text-[#047857] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h2 className="text-xl font-extrabold text-[#0f172a]">{t('auth.accountSuccess', 'e-KYC Account Created Successfully!')}</h2>
            <p className="text-xs text-slate-600">
              {t('auth.redirecting', 'Redirecting to your AgriSync Workspace...')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            
            {/* Role Selection Box */}
            <div className="bg-[#f0fdf4] border-2 border-[#047857] p-5 rounded-2xl space-y-3">
              <label className="block text-xs font-black uppercase text-[#166534] tracking-wider">
                {t('auth.selectRole', 'Select Platform Account Role *')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${formData.role === 'farmer' ? 'bg-[#047857] text-white border-[#047857] font-bold shadow-xs' : 'bg-white text-slate-800 border-slate-200 hover:border-[#047857]'}`}>
                  <input type="radio" name="role" value="farmer" checked={formData.role === 'farmer'} onChange={(e) => setFormData({...formData, role: e.target.value})} className="hidden" />
                  <span className="material-symbols-outlined text-xl">agriculture</span>
                  <div>
                    <div className="font-extrabold">{t('role.farmer', 'Farmer Producer (FPO)')}</div>
                    <div className="text-[10px] opacity-80">Produce, Mandi slots, Sale Advisory</div>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${formData.role === 'apmc' ? 'bg-[#047857] text-white border-[#047857] font-bold shadow-xs' : 'bg-white text-slate-800 border-slate-200 hover:border-[#047857]'}`}>
                  <input type="radio" name="role" value="apmc" checked={formData.role === 'apmc'} onChange={(e) => setFormData({...formData, role: e.target.value})} className="hidden" />
                  <span className="material-symbols-outlined text-xl">warehouse</span>
                  <div>
                    <div className="font-extrabold">{t('role.apmc', 'APMC Mandi Official')}</div>
                    <div className="text-[10px] opacity-80">Queue, ANPR Gate, Weighbridge, Assayer</div>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${formData.role === 'buyer' ? 'bg-[#047857] text-white border-[#047857] font-bold shadow-xs' : 'bg-white text-slate-800 border-slate-200 hover:border-[#047857]'}`}>
                  <input type="radio" name="role" value="buyer" checked={formData.role === 'buyer'} onChange={(e) => setFormData({...formData, role: e.target.value})} className="hidden" />
                  <span className="material-symbols-outlined text-xl">storefront</span>
                  <div>
                    <div className="font-extrabold">{t('role.buyer', 'Institutional Buyer')}</div>
                    <div className="text-[10px] opacity-80">Purchase Orders, Direct Bids, Escrow</div>
                  </div>
                </label>

                <label className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${formData.role === 'driver' ? 'bg-[#047857] text-white border-[#047857] font-bold shadow-xs' : 'bg-white text-slate-800 border-slate-200 hover:border-[#047857]'}`}>
                  <input type="radio" name="role" value="driver" checked={formData.role === 'driver'} onChange={(e) => setFormData({...formData, role: e.target.value})} className="hidden" />
                  <span className="material-symbols-outlined text-xl">local_shipping</span>
                  <div>
                    <div className="font-extrabold">{t('role.driver', 'Logistics Drayage Driver')}</div>
                    <div className="text-[10px] opacity-80">Fast-Track Gate Pass & Yard Entry</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-[#0f172a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#047857]">badge</span> {t('auth.identityInfo', 'Identity Information')}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.fullName', 'Full Registered Name *')}</label>
                <input 
                  type="text" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-[#0f172a] outline-none focus:border-[#047857]"
                />
                {errors.fullName && <span className="text-[10px] font-bold text-red-600 mt-0.5 block">{errors.fullName}</span>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.mobileNumber', 'Mobile Number (10 Digits) *')}</label>
                <input 
                  type="tel" 
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-[#0f172a] outline-none focus:border-[#047857]"
                />
                {errors.mobile && <span className="text-[10px] font-bold text-red-600 mt-0.5 block">{errors.mobile}</span>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.aadhaar', 'Aadhaar Card Number (12 Digits) *')}</label>
                <input 
                  type="text" 
                  value={formData.aadhaar}
                  onChange={(e) => setFormData({...formData, aadhaar: e.target.value})}
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-[#0f172a] outline-none focus:border-[#047857]"
                />
                {errors.aadhaar && <span className="text-[10px] font-bold text-red-600 mt-0.5 block">{errors.aadhaar}</span>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary APMC Mandi Jurisdiction</label>
                <select 
                  value={formData.mandi}
                  onChange={(e) => setFormData({...formData, mandi: e.target.value})}
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-bold text-[#0f172a] outline-none"
                >
                  <option>Pimpalgaon Baswant APMC (Nashik)</option>
                  <option>Lasalgaon APMC (Nashik)</option>
                  <option>Yeola APMC (Nashik)</option>
                  <option>Solapur APMC</option>
                </select>
              </div>
            </div>

            <div className="border-b border-slate-100 pb-4 pt-2">
              <h2 className="text-base font-extrabold text-[#0f172a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#047857]">account_balance</span> {t('auth.bankEscrowInfo', 'Bank Account for Direct Escrow DBT')}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.bankAccount', 'Bank Account Number *')}</label>
                <input 
                  type="text" 
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-[#0f172a] outline-none focus:border-[#047857]"
                />
                {errors.bankAccount && <span className="text-[10px] font-bold text-red-600 mt-0.5 block">{errors.bankAccount}</span>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.ifsc', 'Bank IFSC Code *')}</label>
                <input 
                  type="text" 
                  value={formData.ifsc}
                  onChange={(e) => setFormData({...formData, ifsc: e.target.value})}
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-[#0f172a] outline-none focus:border-[#047857]"
                />
                {errors.ifsc && <span className="text-[10px] font-bold text-red-600 mt-0.5 block">{errors.ifsc}</span>}
              </div>
            </div>

            <div className="border-b border-slate-100 pb-4 pt-2">
              <h2 className="text-base font-extrabold text-[#0f172a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#047857]">lock</span> {t('auth.accountSecurity', 'Account Security')}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('auth.createPassword', 'Create Password *')}</label>
                <input 
                  type="password" 
                  value={formData.password || ''}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-[#0f172a] outline-none focus:border-[#047857]"
                />
                {errors.password && <span className="text-[10px] font-bold text-red-600 mt-0.5 block">{errors.password}</span>}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Link to="/" className="text-xs font-bold text-slate-500 hover:text-[#0f172a]">{t('common.cancel', 'Cancel')}</Link>
              <button 
                type="submit" 
                className="px-6 py-2.5 bg-[#047857] text-white hover:bg-[#065f46] font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">verified_user</span> {t('auth.registerNow', 'Register Account & Launch Workspace')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FarmerRegistration;

