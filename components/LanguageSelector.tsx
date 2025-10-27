import React from 'react';
import { translations, Language } from '../utils/translations';

interface LanguageSelectorProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ language, setLanguage }) => {
  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'mr', name: 'मराठी' },
  ];

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="relative">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="appearance-none w-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 py-2 pl-3 pr-8 rounded-full leading-tight focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:border-cyan-500 transition-colors"
          aria-label="Select language"
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;