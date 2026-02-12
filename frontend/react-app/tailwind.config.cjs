/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                primary: {
                    light: '#dbeafe',
                    DEFAULT: '#3b82f6',
                    dark: '#2563eb',
                },
            }
        },
    },
    plugins: [],
}
