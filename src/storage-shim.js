// Storage shim: يحاكي API الخاص بـ Claude.ai window.storage في أي متصفح عادي
// باستخدام localStorage. كل المفاتيح تُخزن مع prefix لتجنب التعارض.

const PREFIX = 'gh:';

if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    async get(key, shared = false) {
      const fullKey = (shared ? 'shared:' : '') + PREFIX + key;
      const v = localStorage.getItem(fullKey);
      if (v === null) throw new Error(`Key not found: ${key}`);
      return { key, value: v, shared };
    },
    async set(key, value, shared = false) {
      const fullKey = (shared ? 'shared:' : '') + PREFIX + key;
      localStorage.setItem(fullKey, value);
      return { key, value, shared };
    },
    async delete(key, shared = false) {
      const fullKey = (shared ? 'shared:' : '') + PREFIX + key;
      localStorage.removeItem(fullKey);
      return { key, deleted: true, shared };
    },
    async list(prefix = '', shared = false) {
      const search = (shared ? 'shared:' : '') + PREFIX + prefix;
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(search)) {
          keys.push(k.substring(((shared ? 'shared:' : '') + PREFIX).length));
        }
      }
      return { keys, prefix, shared };
    },
  };
}

// Stub للـ Anthropic API: في Claude.ai الـ fetch إلى api.anthropic.com يشتغل تلقائياً.
// خارج Claude.ai، نحتاج مفتاح API. لو ما فيه مفتاح، نرجع رد معلوماتي بدل ما ينكسر التطبيق.
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (url, options) => {
    const urlStr = typeof url === 'string' ? url : url.url;
    if (urlStr.includes('api.anthropic.com')) {
      const apiKey = localStorage.getItem('gh:anthropic_api_key');
      if (!apiKey) {
        // رد وهمي يخلي التطبيق يكمل بدون انهيار
        return new Response(
          JSON.stringify({
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: 'لتفعيل الميزات الذكية (مسح الفواتير، تحليل التاقات)، أضف مفتاح Anthropic API من الإعدادات.',
                products: [], deals: [], items: []
              })
            }]
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      // أضف المفتاح في الـheaders
      const newOptions = {
        ...options,
        headers: {
          ...(options?.headers || {}),
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
      };
      return originalFetch(url, newOptions);
    }
    return originalFetch(url, options);
  };
}
