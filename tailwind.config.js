/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Regal color palette for British gentlemen's club
        primary: {
          50: '#f8f7f4',
          100: '#f0ede6',
          200: '#e1dcc8',
          300: '#cfc5a6',
          400: '#b8a882',
          500: '#a08c64',
          600: '#8a7551',
          700: '#6d5d41',
          800: '#5a4d37',
          900: '#4c4130',
        },
        accent: {
          50: '#faf9f7',
          100: '#f5f2ed',
          200: '#e8e0d4',
          300: '#d9cbb6',
          400: '#c5b191',
          500: '#b29470',
          600: '#a37d59',
          700: '#876649',
          800: '#6d533e',
          900: '#584434',
        },
        royal: {
          50: '#f7f6f9',
          100: '#efecf3',
          200: '#ddd7e5',
          300: '#c6b8d0',
          400: '#a991b7',
          500: '#8f6b9d',
          600: '#7a5384',
          700: '#66446b',
          800: '#553a59',
          900: '#48344c',
        },
        forest: {
          50: '#f4f6f4',
          100: '#e6eae6',
          200: '#ced5ce',
          300: '#adb8ad',
          400: '#869686',
          500: '#6a7a6a',
          600: '#556355',
          700: '#465046',
          800: '#3a433a',
          900: '#323832',
        },
        burgundy: {
          50: '#fdf6f6',
          100: '#fbeaea',
          200: '#f5d8d8',
          300: '#ecb8b8',
          400: '#df8d8d',
          500: '#ce6565',
          600: '#b84a4a',
          700: '#9a3a3a',
          800: '#803333',
          900: '#6d2f2f',
        }
      },
      animation: {
        // Bottom sheet animations with spring physics
        "slide-up": "slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "slide-down": "slideDown 0.25s cubic-bezier(0.55, 0.085, 0.68, 0.53)",
        "fade-in": "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-out": "fadeOut 0.15s cubic-bezier(0.3, 0, 0.8, 0.15)",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "scale-out": "scaleOut 0.2s cubic-bezier(0.55, 0.085, 0.68, 0.53)",
        // Additional spring-based animations
        "bounce-in": "bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "spring-scale": "springScale 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        scaleOut: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.95)", opacity: "0" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        springScale: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.1)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
      }
    },
  },
  plugins: [],
}