/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Indigo Scale - Brand accent
        indigo: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',    // Primary brand color
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        // Gray Scale - Neutral backgrounds and text
        gray: {
          50: '#F9FAFB',     // Surface backgrounds
          100: '#F3F4F6',    // Elevated backgrounds
          200: '#E5E7EB',    // Borders
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',    // Secondary text
          700: '#374151',
          800: '#1F2937',    // Primary text
          900: '#111827',    // Inverse text
          950: '#030712',    // Deep backgrounds
        },
        // Semantic colors - flat design
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
      },
      fontFamily: {
        // Inter for all text - clean, professional, data-focused
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Comprehensive type scale for data products
        'caption': ['11px', { lineHeight: '16px', fontWeight: '500', letterSpacing: '0.01em' }],
        'xs': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'sm': ['13px', { lineHeight: '20px', fontWeight: '400' }],
        'base': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'lg': ['15px', { lineHeight: '24px', fontWeight: '400' }],
        'xl': ['16px', { lineHeight: '24px', fontWeight: '500' }],
        '2xl': ['18px', { lineHeight: '28px', fontWeight: '500' }],
        '3xl': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        '4xl': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        '5xl': ['30px', { lineHeight: '38px', fontWeight: '600' }],
        '6xl': ['36px', { lineHeight: '44px', fontWeight: '600' }],
        'display-xs': ['32px', { lineHeight: '40px', fontWeight: '600', letterSpacing: '-0.01em' }],
        'display-sm': ['36px', { lineHeight: '44px', fontWeight: '600', letterSpacing: '-0.01em' }],
        'display-md': ['40px', { lineHeight: '48px', fontWeight: '600', letterSpacing: '-0.02em' }],
      },
      spacing: {
        // 4px base unit system
        '0': '0px',
        'px': '1px',
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '28': '112px',
        '32': '128px',
        '36': '144px',
        '40': '160px',
        '44': '176px',
        '48': '192px',
        '52': '208px',
        '56': '224px',
        '60': '240px',
        '64': '256px',
        '72': '288px',
        '80': '320px',
        '96': '384px',
      },
      borderRadius: {
        // Consistent 6px radius (matches spec)
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '6px',
        xl: '8px',
        '2xl': '12px',
        full: '9999px',
      },
      boxShadow: {
        // Professional, subtle shadows
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.08)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.08)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
        // Focused shadows for inputs and interactive elements
        'focus': '0 0 0 3px rgba(79, 70, 229, 0.1)',
        'focus-visible': '0 0 0 3px rgba(79, 70, 229, 0.15)',
      },
      animation: {
        // Functional, performance-focused animations
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin': 'spin 1s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}
