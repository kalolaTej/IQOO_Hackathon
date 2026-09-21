import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export const HowItWorks = () => {
  const { t } = useAuth();

  return (
    <div className="min-h-screen bg-[#f4fbf7] text-[#0f172a] font-sans pb-16">
      {/* Header Bar */}
      <header className="bg-[#0f172a] text-white py-4 px-6 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/agrisync-logo.png" alt="AgriSync Logo" className="w-9 h-9 rounded-xl object-contain bg-white p-0.5 border border-[#dcfce7]" />
            <span className="font-extrabold text-lg text-white">AgriSync Architecture</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher size="sm" />
            <Link to="/" className="text-xs bg-[#047857] text-white hover:bg-[#065f46] font-bold px-3.5 py-1.5 rounded-lg transition-colors">
              {t('how.backHome', 'Back to Home')}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-6 pt-10">
        <div className="text-center mb-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#047857] bg-[#dcfce7] px-3 py-1 rounded-full border border-[#bbf7d0]">
            {t('how.badge', 'Step-by-Step Workflow')}
          </span>
          <h1 className="text-3xl font-black text-[#0f172a] mt-3">
            {t('how.title', 'How AgriSync End-to-End System Works')}
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            {t('how.subtitle', 'Connecting pre-harvest field monitoring with post-harvest Mandi sales and instant payment settlement.')}
          </p>
        </div>

        {/* Workflow Steps Timeline */}
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0f172a] text-white flex items-center justify-center font-black text-xl shrink-0">1</div>
            <div>
              <h3 className="font-extrabold text-base text-[#0f172a]">{t('how.step1Title', 'Perimeter Intrusion Detection & Field Claims')}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t('how.step1Desc', 'IoT cameras equipped with YOLOv8 AI models constantly monitor farm boundaries. When wild boars or animals break perimeter zones, sound deterrents trigger automatically while logging incident evidence for PMFBY crop insurance claims.')}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 bg-[#dcfce7] rounded text-[11px] text-[#166534] font-bold border border-[#bbf7d0]">
                <span className="material-symbols-outlined text-sm text-[#047857]">videocam</span> Module: {t('nav.riskField', 'Risk & Field')}
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#047857] text-white flex items-center justify-center font-black text-xl shrink-0">2</div>
            <div>
              <h3 className="font-extrabold text-base text-[#0f172a]">{t('how.step2Title', 'Harvest Lot Creation & Smart Selling Advisory')}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t('how.step2Desc', 'Farmers log harvest batch size, crop variety, and moisture level. AgriSync matches Agmarknet historical trends with local mandi arrival volume to generate an optimal 48–72 hour selling window advisory.')}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 bg-[#dcfce7] rounded text-[11px] text-[#166534] font-bold border border-[#bbf7d0]">
                <span className="material-symbols-outlined text-sm text-[#047857]">lightbulb</span> Module: {t('nav.sellingAdvisory', 'Market Intelligence')}
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#166534] text-white flex items-center justify-center font-black text-xl shrink-0">3</div>
            <div>
              <h3 className="font-extrabold text-base text-[#0f172a]">{t('how.step3Title', 'APMC Slot Reservation & ANPR Gate Entry')}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t('how.step3Desc', 'Farmers or drayage drivers pick a digital time slot at APMC Mandi yard (e.g. Pimpalgaon APMC). Upon arrival, ANPR cameras scan the truck plate, open the automated barrier, and assign a digital queue token (#B-14).')}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 bg-[#dcfce7] rounded text-[11px] text-[#166534] font-bold border border-[#bbf7d0]">
                <span className="material-symbols-outlined text-sm text-[#047857]">format_list_numbered</span> Module: {t('nav.mandiOperations', 'Mandi Operations')}
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#dcfce7] text-[#166534] flex items-center justify-center font-black text-xl shrink-0">4</div>
            <div>
              <h3 className="font-extrabold text-base text-[#0f172a]">{t('how.step4Title', 'Digital Weighbridge & NIR Assay Grading')}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t('how.step4Desc', 'Truck gross weight is captured directly from digital scales. Certified quality assayer uses NIR handheld device to instantly test sample moisture (11.2%) and grade the produce (Grade A1).')}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 bg-[#dcfce7] rounded text-[11px] text-[#166534] font-bold border border-[#bbf7d0]">
                <span className="material-symbols-outlined text-sm text-[#047857]">science</span> Module: {t('nav.qualityAssayer', 'Quality Assayer')}
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0f172a] text-white flex items-center justify-center font-black text-xl shrink-0">5</div>
            <div>
              <h3 className="font-extrabold text-base text-[#0f172a]">{t('how.step5Title', 'Instant Escrow DBT Settlement (#SAUDA-2024)')}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {t('how.step5Desc', 'Once buyer match or bid is finalized, funds held in ICICI bank escrow are cleared directly to the farmer\'s Aadhaar-linked bank account within minutes without unverified deductions.')}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 bg-[#dcfce7] rounded text-[11px] text-[#166534] font-bold border border-[#bbf7d0]">
                <span className="material-symbols-outlined text-sm text-[#047857]">account_balance_wallet</span> Module: {t('nav.transactions', 'Settlement & Handoff')}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link to="/dashboard" className="px-6 py-3 rounded-xl bg-[#047857] text-white font-extrabold text-xs hover:bg-[#065f46] shadow-md transition-all inline-flex items-center gap-2">
            <span className="material-symbols-outlined">arrow_forward</span> {t('how.exploreApp', 'Explore Integrated App Shell')}
          </Link>
        </div>
      </main>
    </div>
  );
};

export default HowItWorks;

