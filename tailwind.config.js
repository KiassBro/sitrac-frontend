/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        title: ['Montserrat', 'sans-serif'],
      },
      colors: {
        orange: {
          DEFAULT: '#F5A623',
          dark:    '#D4890A',
          light:   '#FFF4DC',
          hover:   '#E09510',
        },
        brand: {
          green:        '#27AE60',
          'green-dark': '#1E8449',
          'green-light':'#D4EFDF',
          blue:         '#2980B9',
          'blue-light': '#D6EAF8',
          red:          '#C0392B',
          'red-light':  '#FADBD8',
          purple:       '#8E44AD',
          'purple-light':'#E8DAEF',
        },
      },
      borderRadius: {
        xl:  '14px',
        '2xl': '18px',
        '3xl': '22px',
      },
      boxShadow: {
        card: '0 2px 10px rgba(0,0,0,0.08)',
        modal:'0 8px 48px rgba(0,0,0,0.18)',
      },
      animation: {
        'fade-up':   'fadeUp .3s ease',
        'fade-in':   'fadeIn .2s ease',
        'scale-in':  'scaleIn .22s ease',
        'slide-in':  'slideIn .25s ease',
      },
      keyframes: {
        fadeUp:  { from:{ opacity:0, transform:'translateY(16px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        fadeIn:  { from:{ opacity:0 }, to:{ opacity:1 } },
        scaleIn: { from:{ opacity:0, transform:'scale(.94)' }, to:{ opacity:1, transform:'scale(1)' } },
        slideIn: { from:{ opacity:0, transform:'translateX(-12px)' }, to:{ opacity:1, transform:'translateX(0)' } },
      },
    },
  },
  plugins: [],
}
