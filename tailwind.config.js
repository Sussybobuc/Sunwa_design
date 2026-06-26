/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#B8520A', // Cam đất — CTA chính, accent
          light: '#FDF0E6',   // Nền nhạt của primary
          dark: '#8A3D08',    // Hover state của primary
        },
        bg: {
          DEFAULT: '#FFFFFF',
          secondary: '#F8F6F3', // Nền section xen kẽ
          dark: '#1A1208',      // Hero background
        },
        text: {
          DEFAULT: '#1C1917',
          muted: '#78716C',
          light: '#A8A29E',
        },
        border: {
          DEFAULT: '#E7E5E4',
          dark: '#292524',
        },
        success: '#22A06B',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        xs: '0.75rem',     // 12px
        sm: '0.8125rem',   // 13px
        base: '0.875rem',  // 14px
        md: '1rem',        // 16px
        lg: '1.125rem',    // 18px
        xl: '1.25rem',     // 20px
        '2xl': '1.5rem',   // 24px
        '3xl': '2rem',     // 32px
        hero: '2.5rem',    // 40px — desktop hero title
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.08)',
        md: '0 4px 12px rgba(0,0,0,0.10)',
        lg: '0 8px 24px rgba(0,0,0,0.12)',
      },
      transitionDuration: {
        fast: '200ms',
        normal: '300ms',
      },
      maxWidth: {
        container: '1140px',
      },
      height: {
        nav: '64px',
      },
      spacing: {
        nav: '64px',
      },
      screens: {
        sm: '480px',   // phone landscape
        md: '768px',   // tablet
        lg: '1024px',  // desktop nhỏ
        xl: '1280px',  // desktop đầy đủ
      },
      keyframes: {
        pulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(34,160,107,0.5)' },
          '70%': { boxShadow: '0 0 0 10px rgba(34,160,107,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(34,160,107,0)' },
        },
      },
      animation: {
        pulse: 'pulse 2s infinite',
      },
    },
  },
  plugins: [],
};
