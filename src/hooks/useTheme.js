import { useState, useEffect } from 'react';

export function useTheme() {
  // Leer tema guardado o usar preferencia del sistema
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    // Detectar preferencia del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    // Aplicar tema al document y body
    const html = document.documentElement;
    const body = document.body;
    
    html.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);
    
    // Forzar recálculo de estilos
    html.style.backgroundColor = theme === 'dark' ? '#1a202c' : '#f7fafc';
    body.style.backgroundColor = theme === 'dark' ? '#1a202c' : '#f7fafc';
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
}
