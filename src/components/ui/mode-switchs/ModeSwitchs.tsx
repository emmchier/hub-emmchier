'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/store/ui/ui-store';
import { ButtonGroup, ButtonGroupItem } from '@/components';

export const ModeSwitchs = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'es'>('en');

  const { toggleLanguage } = useUIStore();

  useEffect(() => {
    setIsMounted(true);
    // Leer el idioma del localStorage solo en el cliente
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage === 'es') {
      setCurrentLanguage('es');
    }
  }, []);

  const handleLanguageToggle = () => {
    const newLang = currentLanguage === 'en' ? 'es' : 'en';
    setCurrentLanguage(newLang);
    localStorage.setItem('language', newLang);
    toggleLanguage();
  };

  // Durante SSR, renderizar sin estado selected para evitar diferencias
  if (!isMounted) {
    return (
      <div className="flex gap-2 md:w-auto justify-start md:justify-end">
        <ButtonGroup>
          <ButtonGroupItem
            id="english"
            icon="EN"
            selected={false}
            tooltipContent="English lang"
            onClick={() => {}}
            tooltipEnabled={false}
          />
          <ButtonGroupItem
            id="spanish"
            icon="ES"
            selected={false}
            tooltipContent="Spanish Lang"
            onClick={() => {}}
            tooltipEnabled={false}
          />
        </ButtonGroup>
      </div>
    );
  }

  return (
    <div className="flex gap-2 md:w-auto justify-start md:justify-end">
      <ButtonGroup>
        <ButtonGroupItem
          id="english"
          icon="EN"
          selected={currentLanguage === 'en'}
          tooltipContent="English lang"
          onClick={() => currentLanguage !== 'en' && handleLanguageToggle()}
        />
        <ButtonGroupItem
          id="spanish"
          icon="ES"
          selected={currentLanguage === 'es'}
          tooltipContent="Spanish Lang"
          onClick={() => currentLanguage !== 'es' && handleLanguageToggle()}
        />
      </ButtonGroup>
    </div>
  );
};
