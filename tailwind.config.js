/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx,jsx,js}',
    './context/**/*.{ts,tsx,jsx,js}',
    './types.{ts,tsx,jsx,js}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Architects Daughter', 'sans-serif'],
      },
      borderRadius: {
        sm: 'calc(0.625rem - 4px)',
        md: 'calc(0.625rem - 2px)',
        lg: '0.625rem',
        xl: 'calc(0.625rem + 4px)',
      },
      letterSpacing: {
        tighter: 'calc(0.5px - 0.05em)',
        tight: 'calc(0.5px - 0.025em)',
        normal: '0.5px',
        wide: 'calc(0.5px + 0.025em)',
        wider: 'calc(0.5px + 0.05em)',
        widest: 'calc(0.5px + 0.1em)',
      },
      boxShadow: {
        '2xs': '1px 4px 5px 0px hsl(0 0% 0% / 0.01)',
        'xs': '1px 4px 5px 0px hsl(0 0% 0% / 0.01)',
        'sm': '1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 1px 2px -1px hsl(0 0% 0% / 0.03)',
        DEFAULT: '1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 1px 2px -1px hsl(0 0% 0% / 0.03)',
        'md': '1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 2px 4px -1px hsl(0 0% 0% / 0.03)',
        'lg': '1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 4px 6px -1px hsl(0 0% 0% / 0.03)',
        'xl': '1px 4px 5px 0px hsl(0 0% 0% / 0.03), 1px 8px 10px -1px hsl(0 0% 0% / 0.03)',
        '2xl': '1px 4px 5px 0px hsl(0 0% 0% / 0.07)',
      },
    },
  },
  plugins: [],
};
