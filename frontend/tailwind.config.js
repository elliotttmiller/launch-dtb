/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Tailwind's default `.container` max-width steps up per breakpoint and
    // tops out at 1536px (the stock `2xl` value) — on wide/ultra-wide
    // monitors (1800px+) that leaves large empty gutters on both sides of
    // every page using `container mx-auto` (ProductsCatalogPlatform.jsx,
    // Home.jsx, Product.jsx, ProductDetailPage.jsx's loading/error shells),
    // which is what read as the page being "boxed in" instead of spacing
    // out to the design blueprint's edges. Overriding only the `2xl` step
    // (not touching sm/md/lg/xl) means `.container` stays width:100% (truly
    // fluid, no cap) up to 1728px, and only caps beyond that — so it never
    // artificially narrows a normal desktop/laptop viewport, and only
    // prevents line-lengths/card rows from stretching uncomfortably thin on
    // genuinely ultra-wide displays. Pages that deliberately want a
    // narrower reading width (e.g. ProductDetailPage.jsx's PDP shell stacks
    // `max-w-6xl` alongside `container`) are unaffected — that utility
    // already wins the cascade today and continues to.
    container: {
      screens: {
        '2xl': '1728px',
      },
    },
    extend: {
      colors: {
        // Use CSS custom properties so the color palette can be swapped centrally
        // without changing Tailwind classes. The variables are defined in
        // `src/index.css` and `css/styles.css` (e.g. --color-primary-500).
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },
        accent: {
          50: 'var(--color-accent-50)',
          100: 'var(--color-accent-100)',
          200: 'var(--color-accent-200)',
          300: 'var(--color-accent-300)',
          400: 'var(--color-accent-400)',
          500: 'var(--color-accent-500)',
          600: 'var(--color-accent-600)',
          700: 'var(--color-accent-700)',
          800: 'var(--color-accent-800)',
          900: 'var(--color-accent-900)',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      zIndex: {
        'modal': '1100',
        'modal-close': '1110',
      },
    },
  },
  plugins: [],
}
