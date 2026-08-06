/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#007acc',
          foreground: '#ffffff',
          light: '#094771',
        },
        accent: {
          DEFAULT: '#7cb342',
          foreground: '#1a1a1a',
          light: '#8bc34a',
        },
        ws: {
          canvas: '#1a1a1a',
          panel: '#1e1e1e',
          elevated: '#252526',
          border: '#333333',
          'border-strong': '#444444',
          hover: '#2a2d2e',
          'hover-strong': '#383838',
          selected: '#094771',
          ink: '#d4d4d4',
          bright: '#e0e0e0',
          secondary: '#cccccc',
          muted: '#888888',
          cyan: '#4ec9b0',
          yellow: '#dcdcaa',
          orange: '#ce9178',
          green: '#b5cea8',
          red: '#f48771',
          sky: '#9cdcfe',
          blue: '#569cd6',
        },
        surface: {
          DEFAULT: '#1e1e1e',
          muted: '#1a1a1a',
        },
        sidebar: {
          DEFAULT: '#252526',
          hover: '#2a2d2e',
          active: '#094771',
          muted: '#888888',
        },
        border: '#333333',
        foreground: '#e0e0e0',
        'muted-foreground': '#888888',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.45)',
        header: '0 1px 0 0 #333333',
      },
    },
  },
  plugins: [],
};
