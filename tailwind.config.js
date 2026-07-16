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

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            keyframes: {
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
            },
            animation: {
                twinkle: 'twinkle 2.6s ease-in-out infinite',
                'sun-pulse': 'sun-pulse 3.2s ease-in-out infinite',
                'sun-spin': 'sun-spin 18s linear infinite',
            },
        },
    },

    plugins: [forms],
};
