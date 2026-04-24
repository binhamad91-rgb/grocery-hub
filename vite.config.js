import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // مهم: لو رفعت على GitHub Pages، غير base لاسم المستودع
  // مثال: base: '/grocery-hub/'
  // لو على Vercel أو Netlify، خله '/'
  base: '/',
});
