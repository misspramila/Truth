import React, { useState, useEffect, useCallback } from 'react';
import { checkTruth } from './services/geminiService';
import type { AnalysisResult } from './types';
import { translations, Language } from './utils/translations';

import Header from './components/Header';
import ThemeToggle from './components/ThemeToggle';
import LanguageSelector from './components/LanguageSelector';
import ExamplePrompts from './components/ExamplePrompts';
import LoadingSpinner from './components/LoadingSpinner';
import ResultDisplay from './components/ResultDisplay';
import UrlAlertModal from './components/UrlAlertModal';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        return 'dark';
      }
    }
    return 'light';
  });

  const [language, setLanguage] = useState<Language>('en');
  const [claim, setClaim] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleClaimChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setClaim(text);
    try {
      const url = new URL(text.trim());
      if (url.protocol === "http:" || url.protocol === "https:") {
        setUrlError(text.trim());
      } else {
        setUrlError(null);
      }
    } catch (_) {
      setUrlError(null);
    }
  };

  const handleSubmit = useCallback(async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!claim.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiResult = await checkTruth(claim);
      setResult(apiResult);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [claim, isLoading]);

  const handleExampleClick = (text: string) => {
    setClaim(text);
    setUrlError(null);
  };

  const t = translations[language];

  return (
    <>
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      <LanguageSelector language={language} setLanguage={setLanguage} />
      {urlError && <UrlAlertModal url={urlError} onClose={() => setUrlError(null)} t={t} />}
      <div className="min-h-screen flex flex-col">
        <Header t={t} />
        <main className="container mx-auto px-4 py-8 flex-grow flex flex-col items-center">
          <div className="w-full max-w-3xl">
            <div className="bg-white dark:bg-gray-800/50 p-4 sm:p-6 border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-lg dark:shadow-2xl dark:shadow-gray-950/20 backdrop-blur-sm">
              <form onSubmit={handleSubmit}>
                <textarea
                  value={claim}
                  onChange={handleClaimChange}
                  placeholder={t.textareaPlaceholder}
                  className="w-full h-36 p-3 bg-gray-100 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder-gray-500 dark:placeholder-gray-400 resize-none text-lg"
                  disabled={isLoading}
                  aria-label="Claim input"
                />
                <button
                  type="submit"
                  disabled={isLoading || !claim.trim()}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-cyan-500"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{t.analyzingButton}</span>
                    </>
                  ) : (
                    <span>{t.checkButton}</span>
                  )}
                </button>
              </form>
            </div>

            {!result && !isLoading && !error && (
              <ExamplePrompts onExampleClick={handleExampleClick} t={t} />
            )}

            {isLoading && <LoadingSpinner t={t} />}

            {error && (
              <div className="mt-8 flex items-center gap-3 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 p-4 rounded-lg border border-red-300 dark:border-red-500/30 animate-fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <p className="font-semibold">{t.errorTitle}</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {result && <ResultDisplay result={result} t={t} />}
          </div>
        </main>
        <footer className="text-center p-4 text-gray-500 dark:text-gray-400 text-sm">
          <p>{t.footerText}</p>
        </footer>
      </div>
    </>
  );
};

export default App;