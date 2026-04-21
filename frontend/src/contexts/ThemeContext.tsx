/**
 * Theme Context - Dark Mode Only
 * Always uses dark theme
 */

import { createContext, useContext, useEffect } from 'react'
import type { ReactNode } from 'react'

interface ThemeContextType {
  theme: 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Always apply dark mode
    const root = document.documentElement
    root.classList.add('dark')
  }, [])

  return (
    <ThemeContext.Provider value={{ theme: 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
