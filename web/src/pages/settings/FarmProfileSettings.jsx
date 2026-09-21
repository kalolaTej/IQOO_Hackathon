import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export const FarmProfileSettings = () => {
  const { language, setLanguage, t } = useAuth();
  const [farmName, setFarmName] = useState('Green Acres Farm (Niphad)');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-[#0f172a]">{t('settings.title', 'Farm Profile & Platform Settings')}</h1>
        <p className="text-xs text-slate-600 mt-1">{t('settings.subtitle', 'Configure role permissions, language preference, notification channels, and farm geolocation settings.')}</p>
      </div>

      {saved && (
        <div className="p-3 bg-[#dcfce7] border border-[#bbf7d0] text-[#15803d] rounded-xl text-xs font-bold shadow-2xs">
          {t('settings.savedSuccess', '✓ Profile and settings saved successfully!')}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        {/* Language Selection */}
        <div className="p-4 bg-[#f0fdf4] rounded-xl border border-[#bbf7d0] space-y-2">
          <label className="block text-xs font-extrabold text-[#166534]">
            {t('settings.languagePref', 'Display Language / भाषा निवडा')}
          </label>
          <div className="flex items-center gap-3">
            <LanguageSwitcher size="md" />
            <span className="text-xs text-[#047857] font-semibold">
              {language === 'MR' ? 'मराठी भाषा सक्रिय आहे' : language === 'HI' ? 'हिन्दी भाषा सक्रिय है' : 'English language active'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0f172a] mb-1">{t('settings.farmName', 'Registered Farm Name')}</label>
          <input 
            type="text" 
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold text-[#0f172a] outline-none focus:border-[#047857]"
          />
        </div>

        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-[#0f172a]">{t('settings.smsEvents', 'SMS & Push Notification Events')}</label>
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-[#047857] w-4 h-4" /> {t('settings.smsMandi', 'SMS alerts for ANPR Mandi queue token updates')}
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-[#047857] w-4 h-4" /> {t('settings.smsSiren', 'Real-time sound siren push for perimeter animal intrusions')}
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-[#047857] w-4 h-4" /> {t('settings.smsPrice', 'Agmarknet daily price advisory notifications')}
          </label>
        </div>

        <div className="pt-2">
          <button type="submit" className="px-5 py-2.5 bg-[#047857] text-white rounded-xl text-xs font-bold hover:bg-[#065f46] shadow-xs transition-colors cursor-pointer">
            {t('settings.savePref', 'Save Preferences')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FarmProfileSettings;

