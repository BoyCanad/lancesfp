import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { translations } from './translations';
import type { Language } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('English');

  useEffect(() => {
    const updateLanguage = () => {
      const activeProfile = localStorage.getItem('activeProfile');
      if (activeProfile) {
        const { id } = JSON.parse(activeProfile);
        const savedLang = localStorage.getItem(`lsfplus_language_${id}`) as Language;
        if (savedLang && translations[savedLang]) {
          setLanguageState(savedLang);
        } else {
          setLanguageState('English');
        }
      } else {
        const savedLang = localStorage.getItem('lsfplus_language_global') as Language;
        if (savedLang && translations[savedLang]) {
          setLanguageState(savedLang);
        }
      }
    };

    updateLanguage();

    // Listen for custom profile change events or storage changes
    window.addEventListener('profileChanged', updateLanguage);
    window.addEventListener('storage', updateLanguage);
    return () => {
      window.removeEventListener('profileChanged', updateLanguage);
      window.removeEventListener('storage', updateLanguage);
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    const activeProfile = localStorage.getItem('activeProfile');
    if (activeProfile) {
      const { id } = JSON.parse(activeProfile);
      localStorage.setItem(`lsfplus_language_${id}`, lang);
    } else {
      localStorage.setItem('lsfplus_language_global', lang);
    }
  };

  const t = (key: string, replacements?: Record<string, string>) => {
    let text = translations[language][key] || translations['English'][key] || key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
