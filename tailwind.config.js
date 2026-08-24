import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    darkMode: 'class',

    theme: {
        extend: {
            fontFamily: {
                sans: ['Ubuntu', ...defaultTheme.fontFamily.sans],
            },
            borderRadius: {
                none: '0px',
                sm: '2px',
                DEFAULT: '3px',
                md: '4px',
                lg: '6px',
                xl: '8px',
                '2xl': '10px',
                '3xl': '12px',
                full: '9999px',
            },
            colors: {
                brand: {
                    cream: 'var(--brand-cream)',
                    surface: 'var(--brand-surface)',
                    card: 'var(--brand-card)',
                    input: 'var(--brand-input)',
                    hover: 'var(--brand-hover)',
                    navy: 'var(--brand-navy)',
                    'navy-dark': 'var(--brand-navy-dark)',
                    ink: 'var(--brand-ink)',
                    'ink-strong': 'var(--brand-ink-strong)',
                    'ink-soft': 'var(--brand-ink-soft)',
                    muted: 'var(--brand-muted)',
                    'muted-soft': 'var(--brand-muted-soft)',
                    border: 'var(--brand-border)',
                    'border-faint': 'var(--brand-border-faint)',
                    thead: 'var(--brand-thead)',
                    link: 'var(--brand-link)',
                    pink: 'oklch(74% 0.13 350)',
                    blue: 'oklch(66% 0.13 240)',
                    green: 'oklch(72% 0.12 155)',
                    amber: 'oklch(75% 0.14 55)',
                    gold: 'oklch(78% 0.13 85)',
                },
            },
            keyframes: {
                'fade-in': {
                    '0%': { opacity: 0, transform: 'translateY(22px) scale(0.98)' },
                    '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
                },
                'fade-in-soft': {
                    '0%': { opacity: 0, transform: 'translateY(6px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                twinkle: {
                    '0%, 100%': { opacity: 0.25, transform: 'scale(0.75)' },
                    '50%': { opacity: 1, transform: 'scale(1.15)' },
                },
                'sun-pulse': {
                    '0%, 100%': { opacity: 0.55, transform: 'scale(1)' },
                    '50%': { opacity: 0.9, transform: 'scale(1.12)' },
                },
                'sun-spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                },
                'drift-down': {
                    '0%': { backgroundPosition: '0 0, 30px 20px' },
                    '100%': { backgroundPosition: '0 360px, 30px 200px' },
                },
                'drift-pattern': {
                    '0%': { backgroundPosition: '0 0, 0 0' },
                    '100%': { backgroundPosition: '0 0, 0 340px' },
                },
                'rain-fall': {
                    '0%': { top: '-10%', opacity: 0 },
                    '12%': { opacity: 0.85 },
                    '88%': { opacity: 0.85 },
                    '100%': { top: '110%', opacity: 0 },
                },
                'hail-fall': {
                    '0%': { top: '-10%', opacity: 0, transform: 'translateX(0)' },
                    '12%': { opacity: 1 },
                    '88%': { opacity: 1 },
                    '100%': { top: '110%', opacity: 0, transform: 'translateX(10px)' },
                },
                'snow-fall': {
                    '0%': { top: '-10%', opacity: 0, transform: 'translateX(0)' },
                    '15%': { opacity: 0.85 },
                    '85%': { opacity: 0.85 },
                    '100%': { top: '110%', opacity: 0, transform: 'translateX(14px)' },
                },
                'cloud-drift': {
                    '0%': { left: '-20%' },
                    '100%': { left: '120%' },
                },
                'fog-drift': {
                    '0%, 100%': { opacity: 0.3, transform: 'translateX(-4%)' },
                    '50%': { opacity: 0.55, transform: 'translateX(4%)' },
                },
                'storm-flash': {
                    '0%, 92%, 100%': { opacity: 0 },
                    '93%, 96%': { opacity: 0.7 },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
                    '50%': { transform: 'translateY(-16px) rotate(1deg)' },
                },
                'float-reverse': {
                    '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
                    '50%': { transform: 'translateY(-12px) rotate(-1deg)' },
                },
                'float-shadow': {
                    '0%, 100%': { transform: 'scale(1)', opacity: 0.35 },
                    '50%': { transform: 'scale(0.82)', opacity: 0.16 },
                },
                'particle-float': {
                    '0%': { transform: 'translate(0, 0)', opacity: 0 },
                    '12%': { opacity: 0.7 },
                    '88%': { opacity: 0.7 },
                    '100%': {
                        transform: 'translate(var(--dx, 10px), -150px)',
                        opacity: 0,
                    },
                },
                'shine-scan': {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100%)' },
                },
            },
            animation: {
                'fade-in': 'fade-in 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
                'fade-in-soft': 'fade-in-soft 0.3s ease-out',
                twinkle: 'twinkle 2.6s ease-in-out infinite',
                'sun-pulse': 'sun-pulse 3.2s ease-in-out infinite',
                'sun-spin': 'sun-spin 18s linear infinite',
                'drift-down': 'drift-down 24s linear infinite',
                'drift-pattern': 'drift-pattern 30s linear infinite',
                'rain-fall': 'rain-fall 1.3s linear infinite',
                'hail-fall': 'hail-fall 1s linear infinite',
                'snow-fall': 'snow-fall 6s linear infinite',
                'cloud-drift': 'cloud-drift 28s linear infinite',
                'fog-drift': 'fog-drift 7s ease-in-out infinite',
                'storm-flash': 'storm-flash 5s ease-in-out infinite',
                float: 'float 6s ease-in-out infinite',
                'float-reverse': 'float-reverse 7s ease-in-out infinite',
                'float-shadow': 'float-shadow 6s ease-in-out infinite',
                'particle-float':
                    'particle-float 11s ease-in-out infinite',
                'shine-scan': 'shine-scan 0.45s linear forwards',
            },
        },
    },

    plugins: [forms],
};
