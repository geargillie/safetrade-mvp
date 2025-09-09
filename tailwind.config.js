/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Modern gradient palette from reference
        'purple-gradient-start': '#8B5CF6',
        'purple-gradient-end': '#3B82F6',
        
        // Premium messaging colors (flat for Tailwind)
        'msg-accent': '#8B5CF6',
        'msg-primary': '#3B82F6',
        'msg-bg': '#F8FAFC', 
        'msg-surface': '#FFFFFF',
        'msg-surface-2': '#F1F5F9',
        'msg-surface-3': '#E2E8F0',
        'msg-text-1': '#1E293B',
        'msg-text-2': '#64748B', 
        'msg-text-3': '#94A3B8',
        'msg-text-inv': '#FFFFFF',
        'msg-sent': '#3B82F6',
        'msg-received': '#F1F5F9',
        'msg-border': '#E2E8F0',
        'msg-border-soft': '#F1F5F9',
        'msg-success': '#10B981',
        'msg-warning': '#F59E0B', 
        'msg-error': '#EF4444',
      },
      backgroundImage: {
        // Primary gradients matching reference
        'purple-blue-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
        'cyan-purple-gradient': 'linear-gradient(45deg, #06B6D4 0%, #8B5CF6 100%)',
        
        // Messaging specific gradients
        'gradient-messaging': 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
        'gradient-card': 'linear-gradient(45deg, #06B6D4 0%, #8B5CF6 100%)',
        'gradient-subtle': 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
        
        // Interactive gradients
        'gradient-hover': 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
        'gradient-active': 'linear-gradient(135deg, #6D28D9 0%, #1D4ED8 100%)',
      },
      borderRadius: {
        // iOS-style radius system
        '2xl': '16px',
        '3xl': '18px',
        'messaging': '16px',
        'bubble': '18px',
        'card': '12px',
      },
      fontFamily: {
        'ios': ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'sans-serif'],
        'messaging': ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'Segoe UI', 'sans-serif'],
      },
      
      boxShadow: {
        // Premium shadow system
        'messaging': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'messaging-lg': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'messaging-xl': '0 8px 24px rgba(0, 0, 0, 0.15)',
        'message-sent': '0 1px 2px rgba(59, 130, 246, 0.2)',
        'message-received': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 8px 32px rgba(139, 92, 246, 0.15)',
      },
    },
  },
  plugins: [],
}