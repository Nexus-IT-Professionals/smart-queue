import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { translate, formatDate, formatTime, type Language } from "./locale";
const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
} | null>(null);
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return localStorage.getItem("smart-queue-language") === "es"
        ? "es"
        : "en";
    } catch {
      return "en";
    }
  });
  useEffect(() => {
    document.documentElement.lang = language;
    document.title =
      language === "es"
        ? "Smart Queue · Cola de citas"
        : "Smart Appointment Queue";
    try {
      localStorage.setItem("smart-queue-language", language);
    } catch {
      /* Preference storage is optional; navigation still works. */
    }
  }, [language]);
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("Missing language provider");
  return {
    ...context,
    t: (text: string) => translate(context.language, text),
    dateText: (date: string, options?: Intl.DateTimeFormatOptions) =>
      formatDate(context.language, date, options),
    timeText: (time: string) => formatTime(context.language, time),
  };
}
