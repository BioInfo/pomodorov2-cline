'use client';

import { ReactNode } from 'react';
import { UserPreferences } from '../../types/timer';

interface RootLayoutProps {
  children: ReactNode;
  preferences?: UserPreferences;
}

export default function RootLayout({ 
  children,
  preferences = {
    theme: 'system',
    notifications: true,
    sound: true,
    autoStartBreaks: false,
    autoStartPomodoros: false,
  }
}: RootLayoutProps) {
  // Determine theme class based on preferences and system settings
  const getThemeClass = () => {
    if (preferences.theme === 'system') {
      // Check system preference
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      return 'light'; // Default to light if window is not available
    }
    return preferences.theme;
  };

  return (
    <div className={`min-h-screen w-full ${getThemeClass()}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header will be added here */}
        <main className="py-8">
          {children}
        </main>
        {/* Footer will be added here */}
      </div>
    </div>
  );
}
