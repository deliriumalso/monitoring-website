import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        // Check localStorage first, then system preference
        const saved = localStorage.getItem('theme');
        if (saved) {
            return saved === 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        // Apply theme to document with smooth transition
        const applyTheme = (dark) => {
            setIsTransitioning(true);
            
            // Add transition class for smooth theme switching
            document.documentElement.classList.add('theme-transition');
            
            if (dark) {
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
                document.body.style.backgroundColor = '#111827';
                document.body.style.color = '#f9fafb';
            } else {
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';
                document.body.style.backgroundColor = '#f9fafb';
                document.body.style.color = '#111827';
            }
            
            // Remove transition class after animation
            setTimeout(() => {
                document.documentElement.classList.remove('theme-transition');
                setIsTransitioning(false);
            }, 200);
        };

        applyTheme(isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            // Only auto-switch if user hasn't manually set a preference
            const userPreference = localStorage.getItem('theme-user-preference');
            if (!userPreference) {
                setIsDark(e.matches);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [isDark]);

    // Add CSS for smooth transitions
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .theme-transition,
            .theme-transition *,
            .theme-transition *:before,
            .theme-transition *:after {
                transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1) !important;
                transition-delay: 0 !important;
            }
        `;
        document.head.appendChild(style);
        
        return () => {
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        };
    }, []);

    const toggleTheme = () => {
        setIsDark(!isDark);
        // Mark that user has manually set a preference
        localStorage.setItem('theme-user-preference', 'true');
    };

    const setTheme = (theme) => {
        setIsDark(theme === 'dark');
        localStorage.setItem('theme-user-preference', 'true');
    };

    const resetToSystem = () => {
        localStorage.removeItem('theme-user-preference');
        const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(systemPreference);
    };

    return (
        <ThemeContext.Provider value={{ 
            isDark, 
            toggleTheme, 
            setTheme, 
            resetToSystem, 
            isTransitioning 
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
