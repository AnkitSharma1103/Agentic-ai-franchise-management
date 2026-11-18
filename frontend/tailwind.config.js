export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7C3AED', secondary: '#8B5CF6', navy: '#17172F',
        canvas: '#F7F7FC', ink: '#17172F', muted: '#77778C', line: '#E8E8F0',
        success: '#16A34A', warning: '#F59E0B', danger: '#EF4444',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(23,23,47,.04), 0 4px 16px rgba(23,23,47,.05)' },
    },
  },
  plugins: [],
}
