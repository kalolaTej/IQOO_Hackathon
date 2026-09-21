import React from 'react';
import { useAuth } from '../context/AuthContext';

export const LanguageSwitcher = ({ className = '', size = 'md' }) => {
  const { language, setLanguage } = useAuth();

  const isSmall = size === 'sm';

  return (
    <div className={`inline-flex items-center bg-[#f0fdf4] rounded-lg p-0.5 border border-[#bbf7d0] shadow-2xs ${className}`}>
      <button 
        type="button"
        onClick={() => setLanguage('EN')} 
        className={`${isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'} font-extrabold rounded-md transition-all ${
          language === 'EN' 
            ? 'bg-[#047857] text-white shadow-xs' 
            : 'text-[#166534] hover:bg-[#dcfce7]'
        }`}
        title="English"
      >
        EN
      </button>
      <button 
        type="button"
        onClick={() => setLanguage('MR')} 
        className={`${isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'} font-extrabold rounded-md transition-all ${
          language === 'MR' 
            ? 'bg-[#047857] text-white shadow-xs' 
            : 'text-[#166534] hover:bg-[#dcfce7]'
        }`}
        title="मराठी (Marathi)"
      >
        मराठी
      </button>
      <button 
        type="button"
        onClick={() => setLanguage('HI')} 
        className={`${isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'} font-extrabold rounded-md transition-all ${
          language === 'HI' 
            ? 'bg-[#047857] text-white shadow-xs' 
            : 'text-[#166534] hover:bg-[#dcfce7]'
        }`}
        title="हिन्दी (Hindi)"
      >
        हिन्दी
      </button>
    </div>
  );
};

export default LanguageSwitcher;
