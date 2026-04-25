import { useState, useEffect, useRef, useMemo } from "react";
import {
  Receipt, BookOpen, Sparkles, Upload, ExternalLink,
  TrendingDown, TrendingUp, ArrowUp, ArrowDown,
  Loader2, CheckCircle2, AlertCircle, Trash2, Plus, Minus,
  Store, MapPin, X, Search, Tag, Lightbulb, Settings, Bell, BellOff,
  Calculator, Package, Star, Fish, Files, Sunrise, Edit3, Save,
  Camera, Image as ImageIcon, ShoppingCart, MessageCircle, Check, RefreshCw,
  Share2, QrCode, Copy, Smartphone, Heart
} from "lucide-react";

// ============ CONSTANTS ============
const STORES = [
  { id: 'panda',     name: 'بنده',         url: 'https://panda.com.sa',                  color: '#00A859', regions: ['riyadh', 'eastern'] },
  { id: 'lulu',      name: 'لولو',         url: 'https://www.luluhypermarket.com/ar-sa', color: '#E30613', regions: ['riyadh', 'eastern'] },
  { id: 'tamimi',    name: 'التميمي',      url: 'https://shop.tamimimarkets.com',        color: '#003B71', regions: ['riyadh', 'eastern'] },
  { id: 'carrefour', name: 'كارفور',       url: 'https://www.carrefourksa.com',          color: '#004E9F', regions: ['riyadh', 'eastern'] },
  { id: 'othaim',    name: 'العثيم',       url: 'https://www.othaimmarkets.com.sa',      color: '#E60012', regions: ['riyadh', 'eastern'] },
  { id: 'danube',    name: 'الدانوب',      url: 'https://www.danubeco.com',              color: '#D4A017', regions: ['riyadh', 'eastern'] },
  { id: 'nesto',     name: 'نستو',         url: 'https://www.nestoksa.com',              color: '#F37021', regions: ['eastern'] },
  { id: 'manuel',    name: 'مانويل',       url: 'https://www.manuelmarket.com.sa',       color: '#8B0000', regions: ['riyadh'] },
  { id: 'shona',     name: 'شونه',         url: '',                                      color: '#6B4423', regions: ['riyadh'] },
  { id: 'alwafa',    name: 'هايبر الوفاء', url: '',                                      color: '#E91E63', regions: ['riyadh'] },
  { id: 'thimar',    name: 'ثمار العقيلات', url: '',                                     color: '#4CAF50', regions: ['riyadh'] },
];

const AGGREGATORS = [
  { name: 'فستق',      url: 'https://fustog.app',           desc: 'مقارنة أسعار فورية' },
  { name: 'ClicFlyer', url: 'https://www.clicflyer.com/sa', desc: 'كل النشرات الأسبوعية' },
  { name: 'قوتي',      url: 'https://qooty.net',            desc: 'تنبيهات أسعار في الخلفية ✓' },
];

// ============ LOCATION SYSTEM ============
const LOCATIONS = {
  riyadh:  { id: 'riyadh',  label: 'الرياض',       icon: '📍', color: '#0D4F3C' },
  dammam:  { id: 'dammam',  label: 'الدمام',       icon: '📍', color: '#3B82F6' },
  online:  { id: 'online',  label: 'اون لاين',     icon: '🌐', color: '#8B5CF6' },
  unknown: { id: 'unknown', label: 'غير معروف',    icon: '❓', color: '#9CA3AF' },
};

// Stores that are uniquely in one city (used for auto-detection)
// Chain stores (Panda/Lulu/etc) exist in both cities — fall back to user's defaultCity
const STORE_CITY_MAP = {
  'شونه':         'riyadh',     // Shona Cash & Carry — Riyadh, Qadisiyah
  'شونة':         'riyadh',
  'shona':        'riyadh',
  'هايبر الوفاء': 'riyadh',     // Hyper Alwafa — Riyadh
  'مانويل':       'riyadh',     // Manuel Markets — Riyadh
};

function getLocationFromStore(storeName, userDefaultCity) {
  if (!storeName) return userDefaultCity || 'unknown';
  const normalized = storeName.trim().toLowerCase();
  for (const [key, city] of Object.entries(STORE_CITY_MAP)) {
    if (normalized.includes(key.toLowerCase())) return city;
  }
  // Chain store → use user's default (since they're shopping in their home city)
  return userDefaultCity || 'unknown';
}

function LocationBadge({ location, size = 'sm' }) {
  const loc = LOCATIONS[location] || LOCATIONS.unknown;
  const sizes = {
    xs: 'text-[9px] px-1.5 py-0.5',
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizes[size]}`}
      style={{ background: `${loc.color}15`, color: loc.color }}>
      <span>{loc.icon}</span>{loc.label}
    </span>
  );
}

// Brand & store knowledge base for AI extraction
const SAUDI_KNOWLEDGE = `
سياق مهم لاستخراج فواتير سعودية:

أسماء المتاجر السعودية المعروفة (طابقها مع شعار/اسم المتجر في الفاتورة):
- بنده / Panda
- لولو / Lulu
- التميمي / Tamimi Markets
- كارفور / Carrefour
- العثيم / Othaim
- الدانوب / Danube
- نستو / Nesto
- شونه / Shona (رقم موحد 920051133، الرياض حي القادسية)
- هايبر الوفاء / Hyper Alwafa
- مانويل / Manuel
- المنتزه / Al-Muntazah
- العزيزية بنده

براندات سعودية شائعة (للتعرف الصحيح):
- ألبان وأجبان: المراعي (Almarai - حليب طازج 1L، لبن عيران منعش 1.4L، لبن كامل/قليل الدسم 2L، لبن 2.85L), الصافي (AlSafi), نادا (Nada), السعودية (Saudia), Anchor (أنكور Daily Plus / Fortified), Puck, جبنة فيتا, زبادي الشام
- لحوم ودواجن: تنمية (Tanmiah), ساديا (Sadia - أحجام 450g/600g/700g/800g/900g/1000g/1100g/1200g/1300g), رضوى (Radwa), أمريكان جاردن (American Garden), اسناد (Esnad), الوطنية, إنتاج (Entaj)
- مخبوزات وكيك: لوزين (Lusine - كب كيك فانيلا 30جم × 10 × 12 باكيت), جالكسي (Galaxy), خبز يوم
- مكرونة وحبوب: قودي (Goody - مكرونة + خل طبيعي 980ml), الكويتي (Kuwaiti)
- زيوت وزيتون: كوبوليفا (Coopoliva), عافية, النخيل, العربية
- عصائر ومشروبات: المراعي (مانجو وعنب 18×140ml), نادا, الربيع (Al-Rabie - برتقال 125ml/كوكتيل), الري (Al-Rai - كوكتيل 125ml), Britvic, Rauch (نكتار التفاح فوار 355ml/خوخ)
- شراب الشعير (مالت): موسي (Moussy - كلاسيك/Ice Berry/Raspberry/توت أحمر 6×330ml), هولستن (Holsten 6×330ml)
- صلصات وتوابل: AG French, هاينز, كنور, فرشلي (Freshly - صلصة فرنسية 237ml)
- بهارات متخصصة: ثمار العقيلات (Thimar AlOqailat - براند متجر الرياض: بهار سمك/برياني/معمول/فهيتا/كيدة، كمون، بصل أصفر مطحون، كشنة بالمكسرات، بديل مكعبات الماجي)
- مربيات: حلواني إخوان (Halwani Bros - Raspberry/Strawberry Jam)، الراقي (AlRaky - Mulberry Jam 600g، توت شامي)
- قهوة: ماكسويل هاوس (Maxwell House 326g)، نسكافيه
- زيتون: كوبوليفا (Coopoliva - أسباني أسود/أخضر شرائح 510g/700g)، أليسا (Alissa - أسود شرائح 230g)، بنده (Panda - زيتون أخضر شرائح براند خاص)
- بيض: الفيلق (30 حبة), أمل الخير, الفارس, لؤلؤة المزارع
- تنظيف وعناية شعر: كلوركس (Clorox), Rinzo, ديتول (Dettol), بانتين (Pantene - بلسم ملكي للتلف 360ml/ضد تساقط), صانسيلك (Sunsilk - بلسم ناعم وانسيابي 340ml), هيد آند شولدرز
- عناية الأطفال: جونسون (Johnson's - شامبو أطفال 750ml بعرض 2+1), بامبرز (Pampers), بيبي جوي (BabyJoy - حفاضات مضغوطة قياس 4+ كبير 70 حفاض، عرض 40% خصم على الحبة الثانية)
- كريمات: فازلين (Vaseline), جلسوليد (Glysolid - علبة 250ml × 36 كرتون)
- مكسرات ومسحوق: هنتز (Hintz)
- مناديل ورقية: شونة (private label - 180 منديل × 10 × 5 ربطة، كرتون 96 ر.س)

ملاحظات خاصة بمتجر شونة (Cash & Carry):
- تاقات شونة: شريط أخضر يساري + خلفية صفراء + شعار "shona شونة" بسلة تسوق ملونة
- شونة يعرض السعرين معاً: "سعر الحبة" + "سعر الكرتون" — استخرج كلاهما
- "سعر الطبق" يعني سعر الكرتون من البيض (30 حبة)
- "شد 12" يعني عبوة شد فيها 12 طبق
- "عرض خاص PROMOTION" بالأحمر يعني عرض

ملاحظات خاصة بتاقات بنده (Panda) للمخبوزات الطازجة:
- تاقات بيضاء مع شعار Panda في الأعلى + رقم فرع "PANDA 452" + شريط أحمر "السعر / PRICE"
- فيها خانات: "PACKED DATE تاريخ الإنتاج", "EXPIRY DATE تاريخ الإنتهاء", "WEIGHT الوزن", "Unit Price"
- استخرج الـ packed/expiry إذا كان ظاهراً
- منتجات شائعة: ENGLISH CAKE VANILLA, ROLL BUNS PESTO, MINI CROISSANT CHEESE, BAKLAWA PISTACHIO

ملاحظات خاصة بمتجر ثمار العقيلات (Thimar AlOqailat):
- متجر بهارات متخصص في الرياض، شارع الإمام سعود بن فيصل، حي الياسمين، 0112790100
- تاقات صغيرة مع شعار شجرة خضراء وخلفية بيضاء أو صفراء
- براندهم الخاص يطبع "THIMAR ALOQAILAT ثمار العقيلات" مع شجرة على كل المنتجات
- مشهور بالبهارات: بهار سمك، بهار برياني، كمون مطحون، بهار معمول، بهارات كيدة، بهار فهيتا، بهار بريانى
- منتجات فريدة: بديل مكعبات الماجي الأصفر، كشنة بالمكسرات (زيت/بصل/مكسرات)، بصل أصفر مطحون
- يبيع أيضاً قهوة ماكسويل هاوس الأصلية 326g
- "ربطه" = شد (عبوة محزمة)
- "باكيت" = packet (شد أو علبة كرتون)
- لمنتجات جلسوليد وبانتين شونة يستخدم "SR:" بدل "ر.س"

ملاحظات خاصة بهايبر الوفاء (Hyper Alwafa):
- تاقات صفراء "عرض خاص SPECIAL OFFER" مع شريط أخضر علوي
- يعرض السعر القديم مشطوب + الجديد بحجم كبير
- يكتب "VAT Included" و "ريال SAR"
- شعار: W-shape مع "هايبر الوفاء"

ملاحظات خاصة بالتميمي (Tamimi Markets):
- تاق عرض: أصفر مع شريط أحمر "PROMOTION عرض خاص" أسفل
- يعرض "Regular Price السعر العادي" مع السعر القديم مشطوب أعلى
- "1 PACK / عبوة" بجانب السعر العادي
- ملصق أبيض على اليمين فيه باركود + اسم المنتج بالإنجليزي والعربي + "SAR" + رمز w# (week number)
- عبارة "سعر مخفض LOWER PRICE" بشريط أحمر سفلي
- "Valid upto DD.MM.YYYY" تاريخ انتهاء العرض
- QR code "SCAN FOR OFFERS / امسح للعروض"

براندات إضافية مكتشفة:
- KITCO (كيتكو - بوبكورن كراميل/جبنة 3×90g مايكرويف، صنع في فرنسا)
- Nature Valley (ناتشور فالي - أصابع جرانولا شوفان وشوكولاتة 10 أصابع 5×42g)
- Goody Microwave Popcorn (قودي - بوبكورن مايكرويف بالزبدة/أصلي 3×85g)
- المراعي مارفيلو (Almarai Marvello - جبنة كريمة 200g - منتج جديد)
- بوك Lighter (Puck - جبنة كريمة لايت 200g)
- فام (Fam - فوط صحية، 30 حبة Super/Normal مع أجنحة)
- كلوركس عائلي (Clorox Family Pack - 5.3L، كرتون 3×5.3L أو 6×3.78L)
- قودي تونة (Goody Tuna - Light Meat in Brine 185g/130g مصفى)
- فونتيه (Fonte - Sub Sandwich Sesame Jumbo 375g)

═══════════════════════════════════════════════════════════
🌍 تحديد الموقع (CRITICAL - أرجع location في كل استخراج):
═══════════════════════════════════════════════════════════
أرجع حقل location بإحدى القيم التالية:
- "online" → إذا الصورة سكرين شوت من واتساب (واجهة خضراء، فقاعات رسائل، أسماء مرسلين، شعار WhatsApp)، أو سكرين شوت من موقع/تطبيق (شريط متصفح، URL ظاهر، Instagram، Twitter)
- "riyadh" → إذا المتجر معروف بأنه في الرياض حصراً (شونة، هايبر الوفاء، مانويل) أو فيه إشارة واضحة (لافتة الفرع تذكر الرياض، حي القادسية، حي العليا، إلخ)
- "dammam" → إذا فيه إشارة واضحة للدمام/الخبر/الظهران/المنطقة الشرقية (لافتة الفرع، اسم الحي)
- "unknown" → إذا ما تقدر تحدد بثقة (متاجر سلسلة كبيرة بدون لافتة فرع: بنده، لولو، كارفور، التميمي، العثيم، الدانوب، نستو)

⚠️ مهم: لا تخمّن الموقع. لو ما فيه دليل واضح من الصورة، أرجع "unknown".
⚠️ السكرين شوتس من Instagram/Twitter/WhatsApp (مثل صورة فيها comments أو رسائل) ليست منتجات للبيع — أرجع identified=false إذا الصورة غير متعلقة بسعر أو منتج.

⚠️ تنبيه حرج لاستخراج الأسعار:
الفواتير عادة بأعمدة: [الوصف] [الوحدة] [الكمية] [السعر للوحدة] [الإجمالي]
- أرجع price = سعر الوحدة الواحدة (ليس الإجمالي!)
- أرجع quantity = العدد
- مثال: "صدور دجاج | حبة | 2 | 18 | 36" → price: 18, quantity: 2 (مو 36!)
- إذا في عمود "X @ Y" مثل "1.246 KG @ 6.99" → quantity: 1.246, unit: kg, unitPrice: 6.99
`;

const SMART_TIPS = [
  { icon: '⚖️', title: 'سعر الوحدة', body: 'قارن بالكيلو/اللتر/الغسلة، مو بسعر العبوة. الكبيرة قد تكون أغلى للوحدة.' },
  { icon: '🧮', title: 'رياضيات العروض', body: '"اشتر 2 + 1 مجاناً" = 33% خصم فقط. خصم 40% المباشر أفضل.' },
  { icon: '🎣', title: 'منتجات الجذب', body: 'كل متجر يخفّض 5-10 منتجات بخسارة لجذبك. اشترِها فقط واخرج.' },
  { icon: '⛽', title: 'حاسبة الوقود', body: 'أحياناً 20 ريال توفير لا يستاهل 25 كم.' },
  { icon: '📦', title: 'تتبع المخزون', body: 'كثير من الصرف يجي من شراء مكرر لشي عندك أصلاً.' },
  { icon: '🔄', title: 'ذكاء البدائل', body: 'إذا براند مخفّض بقوة، استبدل عادتك مؤقتاً.' },
];

const DEFAULT_SETTINGS = {
  fuelPricePerLiter: 2.33,
  kmPerLiter: 12,
  storeDistances: {},
  notificationsEnabled: false,
  whatsappNumber: '',              // رقم الزوجة (الوسيط) — العاملة ترسل له
  husbandNumber: '',               // رقم الأب/الزوج — الزوجة ترسل له بعد المراجعة
  defaultCity: 'الرياض',           // المدينة الافتراضية للمستخدم — للموقع التلقائي
  monthlyBudget: 2000,
  budgetCategories: {
    'بقالة': 0.45,
    'لحوم ودواجن': 0.20,
    'خضار وفواكه': 0.15,
    'ألبان': 0.10,
    'منظفات وعناية': 0.10
  },
  homeLat: null,
  homeLng: null,
  homeAddress: '',
};

const KEYS = {
  PRICE_BOOK: 'gh_price_book_v3',
  WATCH_LIST: 'gh_watch_list_v2',
  INVENTORY: 'gh_inventory_v1',
  SETTINGS: 'gh_settings_v3',
  RECENT_DEALS: 'gh_recent_deals_v1',
  HOUSEHOLD_ITEMS: 'gh_household_items_v1',
  PENDING_ALERTS: 'gh_pending_alerts_v1',
  SPENDING_LOG: 'gh_spending_log_v1',  // سجل المصروفات الشهرية
};

// ============ STORAGE ============
async function loadAll() {
  try {
    const [pb, wl, inv, set, rd, hi, pa, sl] = await Promise.all([
      window.storage.get(KEYS.PRICE_BOOK).catch(() => null),
      window.storage.get(KEYS.WATCH_LIST).catch(() => null),
      window.storage.get(KEYS.INVENTORY).catch(() => null),
      window.storage.get(KEYS.SETTINGS).catch(() => null),
      window.storage.get(KEYS.RECENT_DEALS).catch(() => null),
      window.storage.get(KEYS.HOUSEHOLD_ITEMS).catch(() => null),
      window.storage.get(KEYS.PENDING_ALERTS).catch(() => null),
      window.storage.get(KEYS.SPENDING_LOG).catch(() => null),
    ]);
    return {
      priceBook: pb ? JSON.parse(pb.value) : {},
      watchList: wl ? JSON.parse(wl.value) : [],
      inventory: inv ? JSON.parse(inv.value) : {},
      settings: set ? { ...DEFAULT_SETTINGS, ...JSON.parse(set.value) } : DEFAULT_SETTINGS,
      recentDeals: rd ? JSON.parse(rd.value) : [],
      householdItems: hi ? JSON.parse(hi.value) : [],
      pendingAlerts: pa ? JSON.parse(pa.value) : [],
      spendingLog: sl ? JSON.parse(sl.value) : [],
    };
  } catch {
    return { priceBook: {}, watchList: [], inventory: {}, settings: DEFAULT_SETTINGS, recentDeals: [], householdItems: [], pendingAlerts: [], spendingLog: [] };
  }
}

async function saveKey(key, value) {
  try { await window.storage.set(key, JSON.stringify(value)); } catch (e) { console.error(e); }
}

// ============ AI HELPERS ============
async function callClaude(messages, systemPrompt, maxTokens = 3000) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await response.json();
  return data.content.map(b => b.text || "").join("\n");
}

function parseJSON(text) {
  const c = text.replace(/```json\s*|```/g, "").trim();
  try { return JSON.parse(c); } catch { return null; }
}

async function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

// Extract photo capture date from EXIF metadata, fallback to file modified date
// Extract both date AND GPS coordinates from photo EXIF metadata.
// Returns { date: ISO string, lat: number|null, lng: number|null, altitude: number|null }
async function extractPhotoMetadata(file) {
  const fallback = {
    date: file.lastModified ? new Date(file.lastModified).toISOString() : new Date().toISOString(),
    lat: null, lng: null, altitude: null
  };
  try {
    // Read first 128KB - both date and GPS tags are in the first EXIF segment
    const slice = file.slice(0, 131072);
    const buffer = await slice.arrayBuffer();
    const view = new DataView(buffer);

    if (view.getUint16(0) !== 0xFFD8) return fallback;

    let offset = 2;
    while (offset < view.byteLength - 4) {
      const marker = view.getUint16(offset);
      if (marker === 0xFFE1) {
        // APP1 (EXIF)
        const exifLength = view.getUint16(offset + 2);
        const exifStart = offset + 10; // Skip APP1 marker + length + "Exif\0\0"
        if (exifStart + 8 > view.byteLength) break;

        const littleEndian = view.getUint16(exifStart) === 0x4949;
        const tiffBase = exifStart; // all offsets in EXIF are relative to this

        // Helper readers
        const u16 = (p) => littleEndian ? view.getUint16(p, true) : view.getUint16(p);
        const u32 = (p) => littleEndian ? view.getUint32(p, true) : view.getUint32(p);

        // Parse IFD entries to find tags
        let dateStr = null;
        let gpsIfdOffset = null;

        const endScan = Math.min(exifStart + exifLength, view.byteLength - 20);
        for (let i = exifStart; i < endScan; i++) {
          const tag = u16(i);
          if (tag === 0x9003 && !dateStr) {
            // DateTimeOriginal: 20-byte ASCII at offset
            const dataOffset = tiffBase + u32(i + 8);
            if (dataOffset + 19 < view.byteLength) {
              let s = '';
              for (let j = 0; j < 19; j++) s += String.fromCharCode(view.getUint8(dataOffset + j));
              const m = s.match(/(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
              if (m) dateStr = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`).toISOString();
            }
          }
          if (tag === 0x8825 && !gpsIfdOffset) {
            // GPS IFD pointer
            gpsIfdOffset = tiffBase + u32(i + 8);
          }
        }

        // Parse GPS IFD if we found a pointer
        let lat = null, lng = null, altitude = null, latRef = 'N', lngRef = 'E';
        if (gpsIfdOffset && gpsIfdOffset + 2 < view.byteLength) {
          const entryCount = u16(gpsIfdOffset);
          if (entryCount < 100) {
            for (let k = 0; k < entryCount; k++) {
              const entry = gpsIfdOffset + 2 + (k * 12);
              if (entry + 12 > view.byteLength) break;
              const gpsTag = u16(entry);
              const valueOrOffset = u32(entry + 8);

              if (gpsTag === 0x0001) {
                // GPSLatitudeRef: 'N' or 'S' (first byte of value)
                latRef = String.fromCharCode(view.getUint8(entry + 8));
              } else if (gpsTag === 0x0003) {
                lngRef = String.fromCharCode(view.getUint8(entry + 8));
              } else if (gpsTag === 0x0002) {
                // GPSLatitude: 3 rationals at offset
                const base = tiffBase + valueOrOffset;
                if (base + 24 <= view.byteLength) {
                  const deg = u32(base) / u32(base + 4);
                  const min = u32(base + 8) / u32(base + 12);
                  const sec = u32(base + 16) / u32(base + 20);
                  lat = deg + (min / 60) + (sec / 3600);
                }
              } else if (gpsTag === 0x0004) {
                const base = tiffBase + valueOrOffset;
                if (base + 24 <= view.byteLength) {
                  const deg = u32(base) / u32(base + 4);
                  const min = u32(base + 8) / u32(base + 12);
                  const sec = u32(base + 16) / u32(base + 20);
                  lng = deg + (min / 60) + (sec / 3600);
                }
              } else if (gpsTag === 0x0006) {
                // Altitude: single rational
                const base = tiffBase + valueOrOffset;
                if (base + 8 <= view.byteLength) {
                  const num = u32(base), den = u32(base + 4);
                  if (den !== 0) altitude = num / den;
                }
              }
            }
            if (lat !== null && latRef === 'S') lat = -lat;
            if (lng !== null && lngRef === 'W') lng = -lng;
          }
        }

        return {
          date: dateStr || fallback.date,
          lat: (lat !== null && !isNaN(lat)) ? Number(lat.toFixed(6)) : null,
          lng: (lng !== null && !isNaN(lng)) ? Number(lng.toFixed(6)) : null,
          altitude: altitude !== null ? Math.round(altitude) : null
        };
      } else if ((marker & 0xFF00) !== 0xFF00) {
        break;
      } else {
        offset += 2 + view.getUint16(offset + 2);
      }
    }
  } catch (e) {
    console.warn('EXIF extraction failed:', e);
  }
  return fallback;
}

// Backward-compat: keep old function name returning just the date string
async function extractPhotoDate(file) {
  const meta = await extractPhotoMetadata(file);
  return meta.date;
}

// Haversine distance in km between two GPS points
function gpsDistance(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371; // earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Reverse-geocode a GPS point to a known Saudi city (no external API needed).
// Uses hardcoded city centers; matches within a reasonable radius.
function guessCityFromGPS(lat, lng) {
  if (lat == null || lng == null) return null;
  const cities = [
    { name: 'الرياض',   lat: 24.7136, lng: 46.6753, radius: 60 },
    { name: 'جدة',       lat: 21.4858, lng: 39.1925, radius: 50 },
    { name: 'مكة',       lat: 21.3891, lng: 39.8579, radius: 30 },
    { name: 'المدينة',   lat: 24.5247, lng: 39.5692, radius: 30 },
    { name: 'الدمام',    lat: 26.4207, lng: 50.0888, radius: 30 },
    { name: 'الخبر',     lat: 26.2172, lng: 50.1971, radius: 20 },
    { name: 'الظهران',   lat: 26.2361, lng: 50.0393, radius: 20 },
    { name: 'الأحساء',   lat: 25.3833, lng: 49.5833, radius: 40 },
    { name: 'الجبيل',    lat: 27.0174, lng: 49.6225, radius: 25 },
    { name: 'القطيف',    lat: 26.5205, lng: 50.0116, radius: 20 },
    { name: 'الطائف',    lat: 21.2703, lng: 40.4158, radius: 25 },
    { name: 'تبوك',      lat: 28.3998, lng: 36.5700, radius: 30 },
    { name: 'بريدة',     lat: 26.3260, lng: 43.9750, radius: 25 },
    { name: 'أبها',      lat: 18.2465, lng: 42.5117, radius: 20 },
    { name: 'حائل',      lat: 27.5219, lng: 41.6907, radius: 25 },
  ];
  let best = null;
  let bestDist = Infinity;
  for (const c of cities) {
    const d = gpsDistance(lat, lng, c.lat, c.lng);
    if (d !== null && d <= c.radius && d < bestDist) {
      best = c.name;
      bestDist = d;
    }
  }
  return best;
}

// Calculate inflation between two price snapshots of the same product
function calcInflation(priceHistory) {
  if (!priceHistory || priceHistory.length < 2) return null;
  // Sort chronologically
  const sorted = [...priceHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
  const oldest = sorted[0];
  const newest = sorted[sorted.length - 1];

  const oldDate = new Date(oldest.date);
  const newDate = new Date(newest.date);
  const monthsDiff = (newDate - oldDate) / (1000 * 60 * 60 * 24 * 30.44);

  if (monthsDiff < 1) return null; // Need at least 1 month

  const totalChange = ((newest.price - oldest.price) / oldest.price) * 100;
  const annualizedRate = (Math.pow(newest.price / oldest.price, 12 / monthsDiff) - 1) * 100;

  return {
    oldPrice: oldest.price,
    newPrice: newest.price,
    oldDate: oldest.date,
    newDate: newest.date,
    monthsDiff: monthsDiff.toFixed(1),
    totalChangePct: totalChange.toFixed(1),
    annualizedRate: annualizedRate.toFixed(1)
  };
}

// ============ UTILITIES ============
function normalizeProductName(name) {
  return (name || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w\u0600-\u06FF_]/g, '');
}

// ============ PROMOTION-AWARE PRICE FILTERING ============
// Critical: promotional prices are temporary and can expire. Using them for
// comparisons misleads the user ("Panda was 2.50!" — but that promo ended 3 months ago).
// These helpers separate regular prices from promotional ones.

// Returns the "regular" (non-promotional) prices only.
function getRegularPrices(prices) {
  return (prices || []).filter(p => !p.wasPromotion);
}

// Returns the "promotional" prices only.
function getPromotionalPrices(prices) {
  return (prices || []).filter(p => p.wasPromotion);
}

// Classify a promotional price by age: fresh (<14d), recent (<45d), stale (>45d).
// Helps decide whether to surface a promo as relevant or just as historical reference.
function classifyPromoAge(priceRecord) {
  if (!priceRecord.wasPromotion) return null;
  const now = Date.now();
  const d = new Date(priceRecord.date).getTime();
  if (isNaN(d)) return 'stale';
  const ageDays = (now - d) / (1000 * 60 * 60 * 24);
  if (ageDays < 14) return 'fresh';
  if (ageDays < 45) return 'recent';
  return 'stale';
}

// The "fair floor price" — cheapest REGULAR price, ignoring promotions.
// This is what you actually pay day-to-day.
function calcFairFloorPrice(prices) {
  const regular = getRegularPrices(prices);
  if (regular.length === 0) return null;
  return Math.min(...regular.map(p => p.price));
}

// The "promo floor price" — cheapest promotional price ever seen.
// Useful as "wait for this price" benchmark when stockpiling.
function calcPromoFloorPrice(prices) {
  const promos = getPromotionalPrices(prices);
  if (promos.length === 0) return null;
  return Math.min(...promos.map(p => p.price));
}

// Smart comparison: find the cheapest REGULAR price at a different store.
// Returns { store, price, date, wasPromotion: false } or null.
// We deliberately ignore promotional prices here for fair comparison.
function findFairCheaperStore(currentStore, priceHistory, currentPrice) {
  const regular = getRegularPrices(priceHistory).filter(p => p.store !== currentStore);
  if (regular.length === 0) return null;
  const cheapest = regular.reduce((min, p) => p.price < min.price ? p : min);
  // Only recommend if meaningfully cheaper (>5%)
  if (cheapest.price >= currentPrice * 0.95) return null;
  return {
    store: cheapest.store,
    price: cheapest.price,
    date: cheapest.date,
    wasPromotion: false,
    savings: (currentPrice - cheapest.price).toFixed(2)
  };
}

// Find best-ever promotional price at a different store (for "watch list" guidance).
// Returns null if the promo is stale (>45d old).
function findFreshPromoAtOtherStore(currentStore, priceHistory, currentPrice) {
  const promos = getPromotionalPrices(priceHistory)
    .filter(p => p.store !== currentStore)
    .filter(p => classifyPromoAge(p) !== 'stale'); // ignore old promos
  if (promos.length === 0) return null;
  const cheapest = promos.reduce((min, p) => p.price < min.price ? p : min);
  if (cheapest.price >= currentPrice * 0.9) return null; // needs >10% savings
  return {
    store: cheapest.store,
    price: cheapest.price,
    date: cheapest.date,
    wasPromotion: true,
    age: classifyPromoAge(cheapest),
    savings: (currentPrice - cheapest.price).toFixed(2)
  };
}

// One-time migration: backfill wasPromotion flag on old records that don't have it
// (older records may default to `undefined` — treat as regular prices).
// Also recomputes floor prices to use fair pricing.
function migratePromotionFlags(priceBook) {
  const migrated = {};
  let migratedCount = 0;
  let recomputedFloors = 0;

  Object.entries(priceBook || {}).forEach(([key, prod]) => {
    const prices = (prod.prices || []).map(p => {
      if (p.wasPromotion === undefined || p.wasPromotion === null) {
        migratedCount++;
        return { ...p, wasPromotion: false };
      }
      return p;
    });
    const fairFloor = calcFairFloorPrice(prices);
    const promoFloor = calcPromoFloorPrice(prices);
    const absoluteFloor = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : null;

    const newFairFloor = fairFloor;
    if (prod.fairFloorPrice !== newFairFloor || prod.promoFloorPrice !== promoFloor) {
      recomputedFloors++;
    }

    migrated[key] = {
      ...prod,
      prices,
      floorPrice: absoluteFloor, // legacy: lowest of all
      fairFloorPrice: fairFloor, // NEW: lowest regular price
      promoFloorPrice: promoFloor // NEW: lowest promo price
    };
  });

  return { book: migrated, migratedCount, recomputedFloors, totalProducts: Object.keys(migrated).length };
}

// Smart fuzzy match: finds products in price book matching a scanned product
// Returns array of { key, product, score, prices } sorted by best match
function fuzzyMatchProduct(query, priceBook, opts = {}) {
  const minScore = opts.minScore || 0.3;
  const maxResults = opts.maxResults || 5;
  if (!query || !priceBook) return [];

  // Tokenize: split by space, remove short tokens (<2 chars), normalize Arabic
  const tokenize = (s) => (s || '')
    .toLowerCase()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\w\u0600-\u06FF\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2);

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  // Extract numeric size hints from query (e.g., "1.8kg", "500ml", "120g")
  const extractSize = (s) => {
    const m = (s || '').match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|جم|كجم|مل|لتر|لتر)/i);
    return m ? parseFloat(m[1]) : null;
  };
  const querySize = extractSize(query);

  const results = [];
  Object.entries(priceBook).forEach(([key, product]) => {
    const productTokens = tokenize(product.name || '');
    if (productTokens.length === 0) return;

    // Score 1: token overlap (Jaccard-like)
    const queryT = new Set(queryTokens);
    const prodT = new Set(productTokens);
    const intersect = [...queryT].filter(t => prodT.has(t)).length;
    const union = new Set([...queryT, ...prodT]).size;
    let score = intersect / Math.max(1, union);

    // Score 2: brand bonus (first significant word match)
    const queryBrand = queryTokens.find(t => t.length >= 3);
    const prodBrand = productTokens.find(t => t.length >= 3);
    if (queryBrand && prodBrand && queryBrand === prodBrand) score += 0.15;

    // Score 3: substring containment
    const queryStr = queryTokens.join(' ');
    const prodStr = productTokens.join(' ');
    if (prodStr.includes(queryStr) || queryStr.includes(prodStr)) score += 0.1;

    // Score 4: size match bonus
    const prodSize = extractSize(product.name);
    if (querySize && prodSize && Math.abs(querySize - prodSize) < 0.1) score += 0.1;

    if (score >= minScore) {
      results.push({ key, product, score, prices: product.prices || [] });
    }
  });

  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

// ============ KNOWLEDGE BASE DISTILLATION ============
// Goal: store ONLY structured data, discard images. Build portable, valuable database.

// Calculate database statistics for the knowledge base widget
function calcKnowledgeStats(priceBook) {
  const products = Object.values(priceBook || {});
  if (products.length === 0) {
    return {
      totalProducts: 0, totalPricePoints: 0, uniqueStores: 0,
      uniqueBrands: 0, dataSizeKB: 0, oldestEntry: null, newestEntry: null,
      promotionsCaptured: 0, productsWithMultipleStores: 0,
      productsWithHistory: 0, avgPricesPerProduct: 0,
      databaseValue: 'بداية', completeness: 0
    };
  }

  const stores = new Set();
  const brands = new Set();
  const gpsCities = new Set();
  let pricesWithGPS = 0;
  let totalPricePoints = 0;
  let promotionsCaptured = 0;
  let productsWithMultipleStores = 0;
  let productsWithHistory = 0;
  let oldestDate = null;
  let newestDate = null;

  products.forEach(p => {
    const prices = p.prices || [];
    totalPricePoints += prices.length;
    const productStores = new Set();
    prices.forEach(pr => {
      if (pr.store) { stores.add(pr.store); productStores.add(pr.store); }
      if (pr.wasPromotion) promotionsCaptured++;
      if (pr.gpsLat != null && pr.gpsLng != null) pricesWithGPS++;
      if (pr.gpsCity) gpsCities.add(pr.gpsCity);
      if (pr.date) {
        const d = new Date(pr.date).getTime();
        if (!oldestDate || d < oldestDate) oldestDate = d;
        if (!newestDate || d > newestDate) newestDate = d;
      }
    });
    if (productStores.size >= 2) productsWithMultipleStores++;
    if (prices.length >= 2) productsWithHistory++;
    // Extract brand from product name (first word usually)
    const firstWord = (p.name || '').split(' ')[0];
    if (firstWord && firstWord.length > 2) brands.add(firstWord);
  });

  // Estimate data size
  const dataSizeKB = Math.round(JSON.stringify(priceBook).length / 1024);

  // Database value tier
  let databaseValue = 'بداية';
  if (products.length >= 50) databaseValue = 'نامية';
  if (products.length >= 200) databaseValue = 'قوية';
  if (products.length >= 500) databaseValue = 'قيّمة';
  if (products.length >= 1000) databaseValue = 'احترافية';

  // Completeness: how rich is each entry on average
  const completeness = Math.round(
    (productsWithHistory / Math.max(1, products.length)) * 100
  );

  return {
    totalProducts: products.length,
    totalPricePoints,
    uniqueStores: stores.size,
    uniqueBrands: brands.size,
    dataSizeKB,
    oldestEntry: oldestDate ? new Date(oldestDate).toISOString().split('T')[0] : null,
    newestEntry: newestDate ? new Date(newestDate).toISOString().split('T')[0] : null,
    promotionsCaptured,
    productsWithMultipleStores,
    productsWithHistory,
    avgPricesPerProduct: (totalPricePoints / Math.max(1, products.length)).toFixed(1),
    databaseValue,
    completeness,
    pricesWithGPS,
    gpsCities: Array.from(gpsCities),
    gpsCoverage: totalPricePoints > 0 ? Math.round((pricesWithGPS / totalPricePoints) * 100) : 0
  };
}

// Export entire knowledge base as portable JSON (downloadable file)
function exportKnowledgeBase(data) {
  const exportPayload = {
    schema: 'grocery-hub-kb-v1',
    exportDate: new Date().toISOString(),
    region: 'saudi-arabia',
    currency: 'SAR',
    stats: calcKnowledgeStats(data.priceBook),
    priceBook: data.priceBook || {},
    watchList: data.watchList || [],
    inventory: data.inventory || [],
    spendingLog: data.spendingLog || [],
    recentDeals: data.recentDeals || []
  };
  return JSON.stringify(exportPayload, null, 2);
}

// City-aware price analysis: compare prices across cities for same product.
// Returns top products with city-to-city price gaps, useful for travelers.
function analyzeCrossCityPrices(priceBook) {
  const results = [];
  Object.entries(priceBook || {}).forEach(([key, prod]) => {
    const byCity = {};
    (prod.prices || []).forEach(p => {
      if (!p.gpsCity) return;
      if (!byCity[p.gpsCity]) byCity[p.gpsCity] = [];
      byCity[p.gpsCity].push(p);
    });
    const cities = Object.keys(byCity);
    if (cities.length < 2) return;
    // For each city, find cheapest observation
    const cityMins = cities.map(c => ({
      city: c,
      minPrice: Math.min(...byCity[c].map(p => p.price)),
      store: byCity[c].sort((a, b) => a.price - b.price)[0].store,
      sampleSize: byCity[c].length
    }));
    cityMins.sort((a, b) => a.minPrice - b.minPrice);
    const cheapest = cityMins[0];
    const dearest = cityMins[cityMins.length - 1];
    if (cheapest.minPrice === dearest.minPrice) return;
    const gap = ((dearest.minPrice - cheapest.minPrice) / cheapest.minPrice) * 100;
    if (gap < 5) return; // Skip tiny differences
    results.push({
      key, name: prod.name,
      cheapestCity: cheapest.city, cheapestPrice: cheapest.minPrice, cheapestStore: cheapest.store,
      dearestCity: dearest.city, dearestPrice: dearest.minPrice, dearestStore: dearest.store,
      gapPct: gap.toFixed(1), absoluteDiff: (dearest.minPrice - cheapest.minPrice).toFixed(2),
      citiesCovered: cities.length
    });
  });
  return results.sort((a, b) => parseFloat(b.gapPct) - parseFloat(a.gapPct));
}

// Import knowledge base from JSON (with merge logic, not overwrite)
function importKnowledgeBase(jsonString, currentData) {
  try {
    const imported = JSON.parse(jsonString);
    if (imported.schema !== 'grocery-hub-kb-v1') {
      throw new Error('صيغة الملف غير مدعومة');
    }
    const mergedBook = { ...currentData.priceBook };
    Object.entries(imported.priceBook || {}).forEach(([key, prod]) => {
      if (mergedBook[key]) {
        // Merge prices, deduplicate by store+date+price
        const seen = new Set(mergedBook[key].prices.map(p => `${p.store}|${p.date}|${p.price}`));
        const newPrices = (prod.prices || []).filter(p => !seen.has(`${p.store}|${p.date}|${p.price}`));
        mergedBook[key].prices = [...newPrices, ...mergedBook[key].prices].slice(0, 50);
        mergedBook[key].floorPrice = Math.min(...mergedBook[key].prices.map(pr => pr.price));
      } else {
        mergedBook[key] = prod;
      }
    });
    return { success: true, mergedBook, importedCount: Object.keys(imported.priceBook || {}).length };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function calcRealDiscount(type, params) {
  if (type === 'percent') return params.percent;
  if (type === 'bogo') return (params.free / (params.buy + params.free)) * 100;
  if (type === 'bundle') {
    const single = params.originalPrice;
    const perItem = params.bundlePrice / params.quantity;
    return ((single - perItem) / single) * 100;
  }
  return 0;
}

function calcTripROI(savings, distanceKm, settings) {
  const fuel = ((distanceKm * 2) / settings.kmPerLiter) * settings.fuelPricePerLiter;
  return { fuelCost: fuel, netSavings: savings - fuel, worthIt: savings > fuel + 5 };
}

// Price prediction: analyze price history to recommend buy now / wait
function predictPrice(priceHistory) {
  if (!priceHistory || priceHistory.length < 3) {
    return { recommendation: 'unknown', confidence: 'low', reason: 'بيانات قليلة (تحتاج 3 أسعار على الأقل)' };
  }

  // Sort by date ascending
  const sorted = [...priceHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
  const prices = sorted.map(p => p.price);
  const dates  = sorted.map(p => new Date(p.date).getTime());
  const min    = Math.min(...prices);
  const max    = Math.max(...prices);
  const latest = sorted[sorted.length - 1];
  const range  = max - min;

  if (range < 0.5) {
    return { recommendation: 'stable', confidence: 'high', reason: 'السعر مستقر، لن ينخفض كثيراً' };
  }

  // Find price drops (significant ones, >10% below the previous)
  const drops = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] < prices[i - 1] * 0.9) {
      drops.push({ price: prices[i], date: dates[i], from: prices[i - 1] });
    }
  }

  // Average days between drops
  let avgCycle = null;
  if (drops.length >= 2) {
    let totalDays = 0;
    for (let i = 1; i < drops.length; i++) {
      totalDays += (drops[i].date - drops[i - 1].date) / (1000 * 60 * 60 * 24);
    }
    avgCycle = totalDays / (drops.length - 1);
  }

  // Position of latest price within historical range (0 = floor, 1 = ceiling)
  const position = range > 0 ? (latest.price - min) / range : 0;

  let recommendation, reason, confidence;
  if (position <= 0.1) {
    recommendation = 'buy_now';
    confidence = drops.length >= 2 ? 'high' : 'medium';
    reason = `🟢 سعر أرضي تاريخي (${latest.price} ر.س) — اشترِ واخزّن`;
  } else if (position <= 0.3) {
    recommendation = 'good';
    confidence = 'medium';
    reason = `🟡 سعر جيد، لكن السعر الأرضي ${min} ر.س`;
  } else if (position >= 0.85) {
    recommendation = 'wait';
    confidence = drops.length >= 2 ? 'high' : 'medium';
    let waitMsg = `🔴 سعر مرتفع (السعر الأرضي ${min} ر.س)`;
    if (avgCycle) {
      // Time since last drop
      const daysSinceLastDrop = (Date.now() - drops[drops.length - 1].date) / (1000 * 60 * 60 * 24);
      const daysToNextDrop = Math.max(0, avgCycle - daysSinceLastDrop);
      if (daysToNextDrop < 30) {
        waitMsg += ` — متوقع نزول خلال ~${Math.round(daysToNextDrop)} يوم`;
      }
    }
    reason = waitMsg;
  } else {
    recommendation = 'okay';
    confidence = 'low';
    reason = `🟠 سعر متوسط (المدى: ${min} - ${max} ر.س)`;
  }

  return { recommendation, confidence, reason, min, max, position, avgCycle, drops: drops.length };
}

// ============ NOTIFICATIONS ============
async function requestNotifPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
}

function sendNotif(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try { new Notification(title, { body }); } catch {}
}

// ============ EXTRACTION (with Saudi knowledge) ============
async function extractReceiptData(file) {
  const base64 = await fileToBase64(file);
  const sys = `${SAUDI_KNOWLEDGE}

استخرج بيانات فاتورة سوبر ماركت سعودي. JSON فقط بهذا الشكل:
{
  "store": "اسم المتجر بالعربي (طابقه مع القائمة أعلاه)",
  "date": "YYYY-MM-DD",
  "total": رقم المبلغ النهائي بعد الخصومات,
  "items": [
    {
      "product": "اسم المنتج بالعربي مع البراند الصحيح",
      "price": رقم سعر الوحدة الواحدة (مو الإجمالي!),
      "quantity": رقم الكمية أو الوزن,
      "unit": "حبة/كيلو/لتر/ربطة/باكيت",
      "lineTotal": رقم إجمالي السطر = price × quantity
    }
  ]
}`;
  const res = await callClaude([{
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: file.type, data: base64 }},
      { type: "text", text: "استخرج كل المنتجات بدقة. ميّز بين سعر الوحدة والإجمالي. JSON فقط." }
    ]
  }], sys, 3500);
  const parsed = parseJSON(res);
  if (!parsed?.items) throw new Error("ما قدرت أستخرج البيانات. جرب صورة أوضح.");
  return parsed;
}

async function extractFlyerData(file, priceBook, watchList) {
  const base64 = await fileToBase64(file);
  const sys = `${SAUDI_KNOWLEDGE}

استخرج العروض من نشرة سوبر ماركت سعودي. JSON فقط:
{
  "store": "اسم المتجر بالعربي",
  "validUntil": "تاريخ أو null",
  "deals": [
    {
      "product": "اسم المنتج بالعربي مع البراند",
      "originalPrice": رقم أو null,
      "dealPrice": رقم سعر العرض,
      "unit": "كيلو/قطعة/لتر/ربطة",
      "unitSize": رقم حجم العبوة,
      "unitPrice": سعر الوحدة المعياري (للكيلو/اللتر),
      "discountPct": نسبة الخصم
    }
  ]
}`;
  const res = await callClaude([{
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: file.type, data: base64 }},
      { type: "text", text: "استخرج كل العروض. JSON فقط." }
    ]
  }], sys, 3500);
  const parsed = parseJSON(res);
  if (!parsed?.deals) throw new Error("ما قدرت أستخرج البيانات. جرب صورة أوضح.");
  return parsed;
}

// ============ MAIN APP ============
export default function App() {
  // Check URL hash for special modes (helper for maid, review for wife)
  const [routeMode, setRouteMode] = useState(() => parseRouteHash());

  if (routeMode?.type === 'helper') {
    return <HelperPage payload={routeMode.payload} />;
  }
  if (routeMode?.type === 'review') {
    return <WifeReviewPage payload={routeMode.payload} />;
  }

  return <FullApp />;
}

// Parse URL hash for special routing modes
function parseRouteHash() {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  let type = null, encoded = null;
  if (hash.startsWith('#helper=')) {
    type = 'helper';
    encoded = hash.substring('#helper='.length);
  } else if (hash.startsWith('#review=')) {
    type = 'review';
    encoded = hash.substring('#review='.length);
  } else {
    return null;
  }
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return { type, payload: JSON.parse(json) };
  } catch (e) {
    console.error('Failed to parse route hash', e);
    return null;
  }
}

function FullApp() {
  const [tab, setTab] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  const [region, setRegion] = useState('riyadh');
  const [data, setData] = useState({
    priceBook: {}, watchList: [], inventory: {}, settings: DEFAULT_SETTINGS,
    recentDeals: [], householdItems: [], pendingAlerts: [], spendingLog: []
  });
  const [tipIndex, setTipIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [migrationReport, setMigrationReport] = useState(null);

  useEffect(() => {
    loadAll().then(async (d) => {
      // Migrate old price records: tag missing wasPromotion flags and recompute fair floors.
      // This runs once per session; if nothing changed it's a no-op.
      const existingBook = d.priceBook || {};
      const { book: migratedBook, migratedCount, recomputedFloors, totalProducts } = migratePromotionFlags(existingBook);

      if (migratedCount > 0 || recomputedFloors > 0) {
        await saveKey(KEYS.PRICE_BOOK, migratedBook);
        setMigrationReport({ migratedCount, recomputedFloors, totalProducts });
      }
      setData({ ...d, priceBook: migratedBook });
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    const t = setInterval(() => setTipIndex(i => (i + 1) % SMART_TIPS.length), 8000);
    return () => clearInterval(t);
  }, []);

  const update = async (patch) => {
    const newData = { ...data, ...patch };
    setData(newData);
    if (patch.priceBook)      await saveKey(KEYS.PRICE_BOOK, newData.priceBook);
    if (patch.watchList)      await saveKey(KEYS.WATCH_LIST, newData.watchList);
    if (patch.inventory)      await saveKey(KEYS.INVENTORY, newData.inventory);
    if (patch.settings)       await saveKey(KEYS.SETTINGS, newData.settings);
    if (patch.recentDeals)    await saveKey(KEYS.RECENT_DEALS, newData.recentDeals);
    if (patch.householdItems) await saveKey(KEYS.HOUSEHOLD_ITEMS, newData.householdItems);
    if (patch.pendingAlerts)  await saveKey(KEYS.PENDING_ALERTS, newData.pendingAlerts);
    if (patch.spendingLog)    await saveKey(KEYS.SPENDING_LOG, newData.spendingLog);
  };

  return (
    <div dir="rtl" className="min-h-screen" style={{
      background: 'linear-gradient(180deg, #F5EFE6 0%, #EDE4D3 100%)',
      fontFamily: '"IBM Plex Sans Arabic", "Tajawal", system-ui, sans-serif'
    }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Reem+Kufi:wght@500;600;700&display=swap" rel="stylesheet" />

      <Header region={region} setRegion={setRegion} tipIndex={tipIndex}
        onSettings={() => setShowSettings(true)} notifEnabled={data.settings.notificationsEnabled}
        pendingAlerts={data.pendingAlerts} setTab={setTab} />

      <Tabs tab={tab} setTab={setTab} watchListCount={data.watchList.length}
        pendingAlertsCount={data.pendingAlerts.length} />

      <main className="px-5 pb-24">
        {!loaded ? <Loading /> : (
          <>
            {tab === 'home'      && <HomeTab region={region} data={data} setTab={setTab} update={update} migrationReport={migrationReport} onDismissMigration={() => setMigrationReport(null)} />}
            {tab === 'finished'  && <HouseholdTab data={data} update={update} />}
            {tab === 'flyers'    && <FlyersTab region={region} setTab={setTab} />}
            {tab === 'scan'      && <ScanTab data={data} update={update} />}
            {tab === 'book'      && <BookTab data={data} update={update} />}
            {tab === 'inventory' && <InventoryTab data={data} update={update} />}
            {tab === 'map'       && <MapTab data={data} update={update} region={region} />}
            {tab === 'list'      && <SmartListTab data={data} />}
          </>
        )}
      </main>

      {showSettings && <SettingsSheet data={data} update={update} onClose={() => setShowSettings(false)} />}
    </div>
  );
}

// ============ HEADER ============
function Header({ region, setRegion, tipIndex, onSettings, notifEnabled, pendingAlerts, setTab }) {
  const alertCount = pendingAlerts?.length || 0;
  return (
    <header className="px-5 pt-6 pb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 style={{ fontFamily: 'Reem Kufi, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: '#0D4F3C', letterSpacing: '-0.02em' }}>
            مَرْكَز المقاضي
          </h1>
          <p className="text-[11px] text-[#0D4F3C]/60 mt-0.5">قرارات تسوّق أذكى</p>
        </div>
        <div className="flex items-center gap-2">
          <RegionSelector region={region} setRegion={setRegion} />
          {alertCount > 0 && (
            <button onClick={() => setTab('finished')}
              className="w-9 h-9 rounded-full flex items-center justify-center relative animate-pulse"
              style={{ background: '#8B3A3A', color: '#fff' }}>
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#D4A574] text-[#0D4F3C] text-[10px] font-bold flex items-center justify-center">
                {alertCount}
              </span>
            </button>
          )}
          <button onClick={onSettings} className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 relative"
            style={{ background: 'rgba(13, 79, 60, 0.08)', color: '#0D4F3C' }}>
            <Settings size={16} />
            {notifEnabled && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D4A574]" />}
          </button>
        </div>
      </div>

      <div className="mt-3 p-3 rounded-2xl flex items-start gap-3 transition-all" style={{
        background: 'linear-gradient(135deg, #0D4F3C 0%, #1a6b54 100%)',
        boxShadow: '0 4px 20px -8px rgba(13, 79, 60, 0.4)'
      }}>
        <div className="text-2xl flex-shrink-0">{SMART_TIPS[tipIndex].icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[#D4A574] text-[11px] font-semibold mb-0.5 flex items-center gap-1">
            <Lightbulb size={11} /> فكرة ذكية
          </div>
          <div className="text-white text-sm font-semibold">{SMART_TIPS[tipIndex].title}</div>
          <div className="text-white/80 text-xs mt-0.5 leading-relaxed">{SMART_TIPS[tipIndex].body}</div>
        </div>
      </div>
    </header>
  );
}

function RegionSelector({ region, setRegion }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-full" style={{ background: 'rgba(13, 79, 60, 0.08)' }}>
      {[{id:'riyadh', label:'الرياض'}, {id:'eastern', label:'الشرقية'}].map(r => (
        <button key={r.id} onClick={() => setRegion(r.id)}
          className="px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all flex items-center gap-1"
          style={region === r.id ? { background: '#0D4F3C', color: '#F5EFE6' } : { color: '#0D4F3C' }}>
          {region === r.id && <MapPin size={9} />}
          {r.label}
        </button>
      ))}
    </div>
  );
}

function Tabs({ tab, setTab, watchListCount, pendingAlertsCount }) {
  const tabs = [
    { id: 'home',      label: 'الرئيسية',    icon: Sunrise },
    { id: 'finished',  label: 'خلص!',       icon: ShoppingCart, badge: pendingAlertsCount, urgent: pendingAlertsCount > 0 },
    { id: 'flyers',    label: 'النشرات',    icon: Fish },
    { id: 'scan',      label: 'مسح',        icon: Tag },
    { id: 'book',      label: 'الكتاب',     icon: BookOpen, badge: watchListCount },
    { id: 'inventory', label: 'المخزون',    icon: Package },
    { id: 'map',       label: 'الخريطة',    icon: MapPin },
    { id: 'list',      label: 'قائمة ذكية', icon: Sparkles },
  ];
  return (
    <nav className="px-5 py-3 sticky top-0 z-10 backdrop-blur-md" style={{ background: 'rgba(245, 239, 230, 0.85)' }}>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all relative"
            style={tab === t.id
              ? { background: t.urgent ? '#8B3A3A' : '#0D4F3C', color: '#F5EFE6', boxShadow: '0 4px 12px -4px rgba(13, 79, 60, 0.5)' }
              : t.urgent
                ? { background: 'rgba(139, 58, 58, 0.15)', color: '#8B3A3A' }
                : { background: 'rgba(13, 79, 60, 0.08)', color: '#0D4F3C' }
            }>
            <t.icon size={13} />
            {t.label}
            {t.badge > 0 && (
              <span className="text-[9px] font-bold px-1.5 rounded-full" style={{
                background: tab === t.id ? '#D4A574' : (t.urgent ? '#8B3A3A' : '#0D4F3C'),
                color: tab === t.id ? '#0D4F3C' : '#F5EFE6'
              }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

function Loading() {
  return <div className="pt-12 text-center"><Loader2 className="animate-spin mx-auto text-[#0D4F3C]" /></div>;
}

// ============ KNOWLEDGE BASE CARD - shows user's growing distilled database ============
function KnowledgeBaseCard({ data, update }) {
  const [showDetails, setShowDetails] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const fileRef = useRef();
  const stats = useMemo(() => calcKnowledgeStats(data.priceBook), [data.priceBook]);

  const handleExport = () => {
    const json = exportKnowledgeBase(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grocery-hub-kb-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const text = await file.text();
      const result = importKnowledgeBase(text, data);
      if (result.success) {
        await update({ priceBook: result.mergedBook });
        setImportMsg({ type: 'success', text: `✓ تم استيراد ودمج ${result.importedCount} منتج` });
      } else {
        setImportMsg({ type: 'error', text: `✗ ${result.error}` });
      }
    } catch (err) {
      setImportMsg({ type: 'error', text: 'فشل قراءة الملف' });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const tierColors = {
    'بداية': '#8B7355', 'نامية': '#3B82F6', 'قوية': '#0D4F3C',
    'قيّمة': '#D4A574', 'احترافية': '#8B3A3A'
  };
  const tierColor = tierColors[stats.databaseValue] || '#8B7355';

  if (stats.totalProducts === 0) {
    return (
      <div className="p-4 rounded-2xl border-2 border-dashed" style={{ borderColor: '#D4A574', background: '#FFFBF5' }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="text-2xl">🧠</div>
          <div>
            <div className="font-bold text-sm" style={{ color: '#0D4F3C' }}>قاعدة بياناتك الذكية</div>
            <div className="text-xs text-gray-600">ابدأ بمسح أول تاق سعر</div>
          </div>
        </div>
        <button onClick={() => null} className="text-xs text-gray-500">
          كل ما ترفع صورة → نستخرج البيانات ونحذف الصورة → قاعدتك تكبر بدون استهلاك تخزين
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: `linear-gradient(135deg, ${tierColor} 0%, ${tierColor}dd 100%)`,
      boxShadow: `0 4px 20px -8px ${tierColor}80`
    }}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🧠</div>
            <div>
              <div className="text-white/80 text-xs">قاعدة بياناتك الذكية</div>
              <div className="text-white font-bold">قاعدة {stats.databaseValue}</div>
            </div>
          </div>
          <button onClick={() => setShowDetails(!showDetails)} className="text-white/80 text-xs underline">
            {showDetails ? 'إخفاء' : 'تفاصيل'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white/15 rounded-xl p-2 text-center">
            <div className="text-white text-xl font-bold">{stats.totalProducts}</div>
            <div className="text-white/80 text-[10px]">منتج</div>
          </div>
          <div className="bg-white/15 rounded-xl p-2 text-center">
            <div className="text-white text-xl font-bold">{stats.totalPricePoints}</div>
            <div className="text-white/80 text-[10px]">سعر مسجّل</div>
          </div>
          <div className="bg-white/15 rounded-xl p-2 text-center">
            <div className="text-white text-xl font-bold">{stats.uniqueStores}</div>
            <div className="text-white/80 text-[10px]">متجر</div>
          </div>
        </div>

        {showDetails && (
          <div className="space-y-2 bg-black/20 rounded-xl p-3 mt-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-white/90">براندات: <strong>{stats.uniqueBrands}</strong></div>
              <div className="text-white/90">عروض: <strong>{stats.promotionsCaptured}</strong></div>
              <div className="text-white/90">منتجات بمقارنة: <strong>{stats.productsWithMultipleStores}</strong></div>
              <div className="text-white/90">منتجات بتاريخ: <strong>{stats.productsWithHistory}</strong></div>
              <div className="text-white/90">معدل الأسعار: <strong>{stats.avgPricesPerProduct}</strong></div>
              <div className="text-white/90">حجم البيانات: <strong>{stats.dataSizeKB} KB</strong></div>
            </div>
            {stats.oldestEntry && (
              <div className="text-white/70 text-[11px] pt-2 border-t border-white/20">
                من {stats.oldestEntry} إلى {stats.newestEntry}
              </div>
            )}

            {/* GPS coverage panel */}
            {stats.pricesWithGPS > 0 && (
              <div className="bg-black/25 rounded-lg p-2.5 mt-2 border border-white/10">
                <div className="flex items-center gap-1.5 text-white text-xs font-bold mb-1.5">
                  📍 التغطية الجغرافية
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-white/90">أسعار بموقع: <strong>{stats.pricesWithGPS}</strong></div>
                  <div className="text-white/90">تغطية GPS: <strong>{stats.gpsCoverage}%</strong></div>
                </div>
                {stats.gpsCities.length > 0 && (
                  <div className="text-white/80 text-[11px] mt-1.5 pt-1.5 border-t border-white/15">
                    <span className="text-white/60">مدن مسجّلة: </span>
                    {stats.gpsCities.join('، ')}
                  </div>
                )}
              </div>
            )}
            {stats.pricesWithGPS === 0 && stats.totalPricePoints > 0 && (
              <div className="bg-amber-900/30 rounded-lg p-2 text-[10px] text-amber-100 border border-amber-400/30">
                💡 بياناتك تُحفظ بدون موقع جغرافي حالياً. صور الرف اللي تلتقطها من جوالك مباشرة ستحمل GPS تلقائياً.
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={handleExport} className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs py-2 rounded-lg font-semibold">
                ⬇ تصدير JSON
              </button>
              <button onClick={() => fileRef.current?.click()} className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs py-2 rounded-lg font-semibold">
                ⬆ استيراد ودمج
              </button>
              <input ref={fileRef} type="file" accept="application/json" onChange={handleImport} hidden />
            </div>
            {importing && <div className="text-white/80 text-xs text-center">جاري الاستيراد...</div>}
            {importMsg && (
              <div className={`text-xs text-center p-2 rounded ${importMsg.type === 'success' ? 'bg-green-900/40 text-green-100' : 'bg-red-900/40 text-red-100'}`}>
                {importMsg.text}
              </div>
            )}
            <div className="text-white/60 text-[10px] pt-2 leading-relaxed">
              💡 بياناتك مُقطّرة (نص فقط، بلا صور). تنمو بدون استهلاك تخزين، وقابلة للتصدير لأي مرحلة قادمة (سيرفر، نقل، بيع).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ HOME TAB - BUDGET MANAGER + INSIGHTS ============
function HomeTab({ region, data, setTab, update, migrationReport, onDismissMigration }) {
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);

  // Calculate this month's spending from spending log
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth  = now.getDate();
  const daysLeft    = daysInMonth - dayOfMonth + 1;

  const monthSpending = (data.spendingLog || [])
    .filter(s => s.timestamp >= monthStart && s.timestamp <= monthEnd);
  const totalSpent = monthSpending.reduce((sum, s) => sum + (s.total || 0), 0);
  const budget = data.settings.monthlyBudget || 2000;
  const remaining = budget - totalSpent;
  const expectedSpentByNow = (budget * dayOfMonth) / daysInMonth;
  const isOverPace = totalSpent > expectedSpentByNow;
  const dailyAllowance = remaining / daysLeft;
  const pctUsed = Math.min(100, (totalSpent / budget) * 100);

  // Last month for comparison
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).getTime();
  const lastMonthTotal = (data.spendingLog || [])
    .filter(s => s.timestamp >= lastMonthStart && s.timestamp <= lastMonthEnd)
    .reduce((sum, s) => sum + (s.total || 0), 0);
  const monthChange = lastMonthTotal > 0 ? ((totalSpent - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  // Insights
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const lossLeaders = (data.recentDeals || [])
    .filter(d => d.timestamp > cutoff && d.discountPct >= 35)
    .sort((a, b) => b.discountPct - a.discountPct).slice(0, 5);
  const watchAlerts = (data.recentDeals || [])
    .filter(d => d.timestamp > cutoff && d.isWatchListMatch).slice(0, 3);

  // Top categories spent
  const categoryTotals = {};
  monthSpending.forEach(s => {
    (s.items || []).forEach(item => {
      const cat = guessCategory(item.product);
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (item.price * (item.quantity || 1));
    });
  });
  const topCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="pt-4 space-y-5">
      {/* BUDGET HERO CARD */}
      <section className="p-5 rounded-3xl relative overflow-hidden" style={{
        background: isOverPace
          ? 'linear-gradient(135deg, #8B3A3A 0%, #B85450 100%)'
          : 'linear-gradient(135deg, #0D4F3C 0%, #1a6b54 100%)',
        boxShadow: '0 8px 30px -8px rgba(13, 79, 60, 0.5)'
      }}>
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-32 h-32 rounded-full opacity-10" style={{ background: '#D4A574', transform: 'translate(-30%, -30%)' }} />
        <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full opacity-10" style={{ background: '#fff', transform: 'translate(30%, 30%)' }} />

        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-white/70 text-[11px] font-semibold mb-1">المتبقي هذا الشهر</div>
              <div className="text-white text-4xl font-bold tracking-tight" style={{ fontFamily: 'Reem Kufi, sans-serif' }}>
                {remaining.toFixed(0)}
                <span className="text-base font-normal opacity-70 mr-2">ر.س</span>
              </div>
              <div className="text-white/80 text-xs mt-1">
                من ميزانية {budget.toFixed(0)} · صرفت {totalSpent.toFixed(0)}
              </div>
            </div>
            <button onClick={() => setShowBudgetEdit(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              <Edit3 size={14} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-3 rounded-full overflow-hidden mb-3 relative" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="h-full transition-all" style={{
              width: `${pctUsed}%`,
              background: isOverPace ? '#FFC107' : '#D4A574'
            }} />
            {/* Expected mark */}
            <div className="absolute top-0 h-full w-0.5 bg-white/60"
              style={{ left: `${(dayOfMonth / daysInMonth) * 100}%` }} />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <div className="text-white/70 text-[10px]">المسموح يومياً</div>
              <div className="text-white text-sm font-bold">{dailyAllowance > 0 ? dailyAllowance.toFixed(0) : 0}</div>
            </div>
            <div className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <div className="text-white/70 text-[10px]">باقي يوم</div>
              <div className="text-white text-sm font-bold">{daysLeft}</div>
            </div>
            <div className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <div className="text-white/70 text-[10px]">vs الشهر الماضي</div>
              <div className="text-white text-sm font-bold">
                {lastMonthTotal === 0 ? '—' : `${monthChange > 0 ? '+' : ''}${monthChange.toFixed(0)}%`}
              </div>
            </div>
          </div>

          {/* Status message */}
          <div className="mt-3 p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <div className="text-white text-xs font-semibold">
              {remaining < 0
                ? `⚠️ تجاوزت الميزانية بـ ${Math.abs(remaining).toFixed(0)} ر.س`
                : isOverPace
                  ? `📍 صرفك أسرع من المعتاد بـ ${(totalSpent - expectedSpentByNow).toFixed(0)} ر.س`
                  : daysLeft > 0
                    ? `✓ على المسار — يكفيك ${dailyAllowance.toFixed(0)} ر.س/يوم`
                    : '✓ نهاية الشهر'}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY BREAKDOWN */}
      {topCategories.length > 0 && (
        <section>
          <h2 className="text-xs font-bold mb-3 text-[#0D4F3C]/70 tracking-wide flex items-center gap-1">
            📊 وين تذهب فلوسك هذا الشهر
          </h2>
          <div className="p-4 rounded-2xl bg-white space-y-2.5" style={{ boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.1)' }}>
            {topCategories.map(([cat, amount], i) => {
              const pct = (amount / totalSpent) * 100;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-[#1a1a1a]">{cat}</span>
                    <span className="text-[#0D4F3C] font-bold">{amount.toFixed(0)} ر.س ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(13, 79, 60, 0.08)' }}>
                    <div className="h-full transition-all" style={{
                      width: `${pct}%`,
                      background: ['#0D4F3C', '#1a6b54', '#D4A574', '#B8884F', '#8B3A3A'][i]
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* MIGRATION BANNER — shown once when old records get promo flags backfilled */}
      {migrationReport && (
        <section className="p-4 rounded-2xl" style={{
          background: 'linear-gradient(135deg, #FFF8EC 0%, #FFF3DA 100%)',
          border: '1px solid rgba(212, 165, 116, 0.4)'
        }}>
          <div className="flex items-start gap-3">
            <div className="text-2xl shrink-0">🏷️</div>
            <div className="flex-1">
              <div className="font-bold text-sm text-[#8B6914] mb-1">
                تم تصنيف أسعارك القديمة
              </div>
              <div className="text-[12px] text-[#5C4A1E] leading-relaxed">
                صنّفت <strong>{migrationReport.migratedCount}</strong> سعر قديم من <strong>{migrationReport.totalProducts}</strong> منتج كـ"سعر عادي" (بفرض إنها مو عروض).
                {migrationReport.recomputedFloors > 0 && (
                  <> أعدت حساب <strong>{migrationReport.recomputedFloors}</strong> سعر أرضي.</>
                )}
              </div>
              <div className="text-[11px] text-[#5C4A1E]/80 mt-1.5 leading-relaxed">
                من الآن فصاعداً، المقارنات راح تستخدم <strong>الأسعار العادية فقط</strong>. العروض المؤقتة تظهر كتنبيه منفصل مع تاريخ انتهاء متوقع.
              </div>
              <div className="text-[10px] text-[#8B6914]/70 mt-2">
                💡 لو في منتج سعره كان عرض بالفعل وصنّف كسعر عادي، تقدر تعدله يدوياً من تبويب "الكتاب".
              </div>
              <button onClick={onDismissMigration}
                className="mt-2 text-xs text-[#8B6914] font-semibold underline">
                فهمت، إخفاء
              </button>
            </div>
          </div>
        </section>
      )}

      {/* KNOWLEDGE BASE - your growing distilled database */}
      <KnowledgeBaseCard data={data} update={update} />

      {/* SMART INSIGHTS */}
      {(watchAlerts.length > 0 || lossLeaders.length > 0) && (
        <section className="p-4 rounded-2xl" style={{
          background: 'linear-gradient(135deg, #FFF8EC 0%, #F5EFE6 100%)',
          border: '1px solid rgba(212, 165, 116, 0.3)'
        }}>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={16} className="text-[#B8884F]" />
            <div className="font-bold text-sm text-[#0D4F3C]">رؤى ذكية</div>
          </div>
          {watchAlerts.length > 0 && (
            <button onClick={() => setTab('book')} className="w-full text-right text-xs text-[#1a1a1a]/80 leading-relaxed py-1">
              ⭐ <span className="font-bold text-[#0D4F3C]">{watchAlerts.length}</span> منتج من قائمة مراقبتك بسعر أرضي الآن
            </button>
          )}
          {lossLeaders.length > 0 && (
            <button onClick={() => setTab('map')} className="w-full text-right text-xs text-[#1a1a1a]/80 leading-relaxed py-1">
              🎣 <span className="font-bold text-[#0D4F3C]">{lossLeaders.length}</span> منتج جذب (خصم 35%+) — افتح الخريطة لاصطيادها
            </button>
          )}
        </section>
      )}

      {/* QUICK ACTIONS */}
      <section className="grid grid-cols-2 gap-3">
        <QuickAction icon={Receipt} label="مسح فاتورة" desc="أضفها للميزانية" color="#0D4F3C"
          onClick={() => setTab('scan')} />
        <QuickAction icon={Sparkles} label="قائمة ذكية" desc="اطلب توصيات" color="#D4A574"
          onClick={() => setTab('list')} />
        <QuickAction icon={Camera} label="مسح رف" desc="بالكاميرا داخل المتجر" color="#1a6b54"
          onClick={() => setTab('scan')} />
        <QuickAction icon={MapPin} label="الخريطة" desc="المسار الذهبي" color="#B8884F"
          onClick={() => setTab('map')} />
      </section>

      {showBudgetEdit && <BudgetEditSheet data={data} update={update} onClose={() => setShowBudgetEdit(false)} />}
    </div>
  );
}

// Quick action card on home
function QuickAction({ icon: Icon, label, desc, color, onClick }) {
  return (
    <button onClick={onClick} className="p-3.5 rounded-2xl text-right transition-all active:scale-95"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.15)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: color }}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="font-bold text-sm text-[#1a1a1a]">{label}</div>
      <div className="text-[10px] text-[#0D4F3C]/60 mt-0.5">{desc}</div>
    </button>
  );
}

// Budget edit modal
function BudgetEditSheet({ data, update, onClose }) {
  const [budget, setBudget] = useState(data.settings.monthlyBudget || 2000);
  const save = async () => {
    await update({ settings: { ...data.settings, monthlyBudget: +budget || 2000 } });
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div onClick={e => e.stopPropagation()} className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-5"
        style={{ background: '#F5EFE6' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-[#0D4F3C]" style={{ fontFamily: 'Reem Kufi, sans-serif' }}>
            تعديل الميزانية الشهرية
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(13,79,60,0.1)' }}>
            <X size={16} className="text-[#0D4F3C]" />
          </button>
        </div>
        <div className="p-4 rounded-2xl bg-white mb-4" style={{ boxShadow: '0 1px 8px -2px rgba(13, 79, 60, 0.1)' }}>
          <div className="text-[11px] text-[#0D4F3C]/70 mb-2 leading-relaxed">
            كم تريد تخصيص للسوبر ماركت كل شهر؟ سأتتبع صرفك من الفواتير اللي تمسحها.
          </div>
          <div className="flex items-center gap-2">
            <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl text-2xl font-bold text-center outline-none"
              style={{ background: 'rgba(13, 79, 60, 0.06)', color: '#0D4F3C' }} />
            <span className="text-[#0D4F3C] font-bold">ر.س</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[1500, 2000, 2500, 3000].map(v => (
              <button key={v} onClick={() => setBudget(v)}
                className="py-2 rounded-lg text-xs font-semibold"
                style={{ background: budget == v ? '#0D4F3C' : 'rgba(13, 79, 60, 0.08)', color: budget == v ? '#fff' : '#0D4F3C' }}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <button onClick={save} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: '#0D4F3C', color: '#fff' }}>
          حفظ
        </button>
      </div>
    </div>
  );
}

// Categorize products for budget breakdown
function guessCategory(productName) {
  const name = (productName || '').toLowerCase();
  if (/(دجاج|لحم|كبدة|سمك|روبيان|عجل|غنم|chicken|meat|beef|fish|brst|breast|veal)/i.test(name)) return 'لحوم ودواجن';
  if (/(حليب|زبادي|جبن|قشطة|لبن|milk|yogurt|cheese|butter|cream|labneh|labnah)/i.test(name)) return 'ألبان وأجبان';
  if (/(تفاح|موز|طماطم|خس|خيار|كزبرة|بقدونس|نعناع|ليمون|برتقال|بطاطس|بصل|جزر|tomato|lettuce|cucumber|banana|apple|onion|carrot)/i.test(name)) return 'خضار وفواكه';
  if (/(ارز|أرز|مكرونة|طحين|دقيق|سكر|ملح|زيت|خل|rice|pasta|flour|sugar|salt|oil)/i.test(name)) return 'بقالة جافة';
  if (/(صابون|شامبو|منظف|كلوركس|ديتول|معجون|tide|persil|clorox|dettol|shampoo|soap)/i.test(name)) return 'منظفات وعناية';
  if (/(شوكولاته|بسكويت|كيك|توست|خبز|عصير|مياه|قهوة|شاي|chocolate|biscuit|cake|toast|bread|juice|water|coffee|tea)/i.test(name)) return 'مخبوزات ومشروبات';
  return 'أخرى';
}


// ============ INSTANT BUY SCANNER — "Should I buy this?" ============
// User snaps a product photo → AI identifies → fuzzy-match price book →
// verdict: BUY / DON'T BUY (cheaper elsewhere) / NEW PRODUCT
function InstantBuyScanner({ data, update }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { identified, matches, verdict, currentStore, currentPrice }
  const [currentStore, setCurrentStore] = useState(data.settings?.lastStore || '');
  const [currentPrice, setCurrentPrice] = useState('');
  const camRef = useRef();
  const fileRef = useRef();

  const STORE_OPTIONS = ['بنده', 'لولو', 'العثيم', 'كارفور', 'الدانوب', 'التميمي', 'نستو', 'شونه', 'هايبر الوفاء', 'مانويل'];

  const identifyProduct = async (file) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const base64 = await fileToBase64(file);
      const sys = `${SAUDI_KNOWLEDGE}

أنت ترى صورة منتج (عبوة أو علبة) من سوبر ماركت سعودي. المستخدم في المتجر الآن ويفكر يشتريه.

مهمتك: تعرّف على المنتج بدقة. ركّز على:
- اسم البراند (واضح من الشعار)
- اسم المنتج/النكهة
- الحجم/الوزن إن كان ظاهراً (مهم جداً للمقارنة)
- نوع التغليف

أرجع JSON فقط:
{
  "identified": true/false,
  "brand": "اسم البراند",
  "product": "الاسم الكامل بصيغة قابلة للبحث (مثل: حليب أنكور ديلي بلس بودرة 1.8kg)",
  "size": "الحجم مع الوحدة (1.8kg, 500ml, 30 حبة)",
  "category": "ألبان/مشروبات/عناية شخصية/تنظيف/إلخ",
  "confidence": "high/medium/low",
  "location": "online/riyadh/dammam/unknown (شاهد قسم تحديد الموقع في السياق)",
  "notes": "أي ملاحظات مفيدة (نكهة، نوع، مميزات)"
}

ملاحظة حرجة: لا تخترع. إذا الصورة غير واضحة أو المنتج غير معروف، أرجع identified=false.
ملاحظة الموقع: إذا الصورة سكرين شوت من واتساب/Instagram → location="online" و identified=false (ليس منتج للبيع).`;

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: file.type || 'image/jpeg', data: base64 } },
              { type: 'text', text: sys }
            ]
          }]
        })
      });
      const json = await resp.json();
      const text = json.content?.find(c => c.type === 'text')?.text || '';
      const cleaned = text.replace(/```json|```/g, '').trim();
      const identified = JSON.parse(cleaned);

      if (!identified.identified) {
        setError('ما قدرت أتعرف على المنتج. صوّر العبوة من جهة أوضح.');
        setLoading(false);
        return;
      }

      // Fuzzy match against price book
      const matches = fuzzyMatchProduct(identified.product, data.priceBook || {}, { minScore: 0.25, maxResults: 3 });

      // Build verdict
      let verdict = null;
      const priceNum = parseFloat(currentPrice) || null;

      if (matches.length === 0) {
        verdict = {
          type: 'new',
          headline: '🆕 منتج جديد على قاعدة بياناتك',
          subline: 'ما عندنا تاريخ سعر له. لو اشتريته، سجّله بعدين عشان نقدر نقارن المرة الجاية.',
          color: '#3B82F6'
        };
      } else {
        // Find cheapest historical price across all stores
        const allPrices = matches.flatMap(m => m.prices.map(p => ({ ...p, productKey: m.key, productName: m.product.name })));
        const cheapest = allPrices.sort((a, b) => a.price - b.price)[0];

        if (priceNum && cheapest) {
          const diff = priceNum - cheapest.price;
          const diffPct = (diff / cheapest.price) * 100;

          if (diff > 0 && cheapest.store !== currentStore) {
            // CHEAPER ELSEWHERE
            verdict = {
              type: 'dont_buy',
              headline: '⛔ لا تشتري! فيه أرخص',
              subline: `${cheapest.store} عنده بـ ${cheapest.price.toFixed(2)} ر.س — توفّر ${diff.toFixed(2)} ر.س (${diffPct.toFixed(0)}%)`,
              cheapestStore: cheapest.store,
              cheapestPrice: cheapest.price,
              currentPrice: priceNum,
              savings: diff,
              color: '#8B3A3A'
            };
          } else if (diff <= 0) {
            // GOOD PRICE
            verdict = {
              type: 'buy',
              headline: '✅ اشتري! أفضل سعر',
              subline: diff < -0.5 ? `هذا أرخص بـ ${Math.abs(diff).toFixed(2)} ر.س من أقل سعر سجّلته من قبل!` : 'نفس أقل سعر شفته من قبل',
              currentPrice: priceNum,
              previousFloor: cheapest.price,
              color: '#0D4F3C'
            };
          } else {
            // SAME STORE, NORMAL PRICE
            verdict = {
              type: 'okay',
              headline: '👌 سعر عادي',
              subline: `أرخص سعر سجّلته: ${cheapest.price.toFixed(2)} ر.س عند ${cheapest.store}. السعر الحالي قريب منه.`,
              cheapestStore: cheapest.store,
              cheapestPrice: cheapest.price,
              color: '#D4A574'
            };
          }
        } else if (!priceNum && cheapest) {
          // No price entered - just show history
          verdict = {
            type: 'history',
            headline: '📊 لدينا تاريخ لهذا المنتج',
            subline: `أقل سعر: ${cheapest.price.toFixed(2)} ر.س عند ${cheapest.store}. أدخل السعر الحالي للمقارنة.`,
            cheapestStore: cheapest.store,
            cheapestPrice: cheapest.price,
            color: '#3B82F6'
          };
        }
      }

      setResult({ identified, matches, verdict, currentStore, currentPrice: priceNum });
    } catch (e) {
      setError('فشل التحليل. جرّب صورة أوضح.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    identifyProduct(file);
  };

  const saveCurrentPrice = async () => {
    if (!result?.identified || !result?.currentPrice || !currentStore) return;
    const newBook = { ...data.priceBook };
    const key = result.matches.length > 0
      ? result.matches[0].key
      : normalizeProductName(result.identified.product);
    const existing = newBook[key] || { name: result.identified.product, prices: [], floorPrice: null };
    // Determine location: AI's detection > store-city map > user default
    const aiLocation = result.identified?.location;
    const finalLocation = (aiLocation && aiLocation !== 'unknown')
      ? aiLocation
      : getLocationFromStore(currentStore, data.settings?.defaultCity || 'unknown');
    existing.prices = [{
      store: currentStore,
      price: result.currentPrice,
      unit: result.identified.size || 'قطعة',
      date: new Date().toISOString().split('T')[0],
      location: finalLocation,
      wasPromotion: false
    }, ...existing.prices].slice(0, 50);
    existing.floorPrice = Math.min(...existing.prices.map(p => p.price));
    existing.name = result.identified.product;
    newBook[key] = existing;
    await update({
      priceBook: newBook,
      settings: { ...data.settings, lastStore: currentStore }
    });
    // Reset
    setResult(null);
    setCurrentPrice('');
  };

  return (
    <div className="space-y-4">
      {/* HERO */}
      <div className="p-4 rounded-2xl" style={{
        background: 'linear-gradient(135deg, #0D4F3C 0%, #1a6b54 100%)',
        boxShadow: '0 4px 20px -8px rgba(13, 79, 60, 0.5)'
      }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-2xl">🛒</div>
          <div>
            <div className="text-white font-bold">اشتري؟ مساعدك في المتجر</div>
            <div className="text-white/70 text-xs">صوّر المنتج، أكتب سعره، وأقول لك إذا فيه أرخص</div>
          </div>
        </div>
      </div>

      {/* INPUT FIELDS BEFORE PHOTO */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1 block">المتجر اللي أنت فيه:</label>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {STORE_OPTIONS.map(s => (
              <button key={s} onClick={() => setCurrentStore(s)}
                className="px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all"
                style={currentStore === s
                  ? { background: '#0D4F3C', color: 'white', borderColor: '#0D4F3C' }
                  : { background: 'white', color: '#0D4F3C', borderColor: '#e5e7eb' }
                }>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1 block">السعر المعروض (ر.س):</label>
          <input type="number" step="0.01" inputMode="decimal" value={currentPrice}
            onChange={e => setCurrentPrice(e.target.value)}
            placeholder="مثال: 12.50"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-[#0D4F3C] outline-none"
            style={{ direction: 'ltr', textAlign: 'right' }} />
        </div>
        <div className="text-[10px] text-gray-500 leading-relaxed">
          💡 ممكن تصوّر بدون سعر، بس لو دخلته راح أعطيك حكم أدق (اشتري / لا تشتري)
        </div>
      </div>

      {/* CAMERA BUTTONS */}
      {!loading && !result && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => camRef.current?.click()}
            className="p-4 rounded-2xl text-white font-bold flex flex-col items-center gap-2"
            style={{ background: '#0D4F3C' }}>
            <Camera size={24} />
            <span className="text-sm">صوّر المنتج</span>
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="p-4 rounded-2xl font-bold flex flex-col items-center gap-2 border-2"
            style={{ borderColor: '#D4A574', color: '#0D4F3C', background: '#FFFBF5' }}>
            <Files size={24} />
            <span className="text-sm">اختر من الجوال</span>
          </button>
          <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={onFile} hidden />
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} hidden />
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="p-6 rounded-2xl bg-white border border-gray-200 text-center">
          <Loader2 className="animate-spin mx-auto mb-3 text-[#0D4F3C]" size={32} />
          <div className="text-sm font-semibold text-[#0D4F3C]">جاري التعرّف على المنتج...</div>
          <div className="text-xs text-gray-500 mt-1">أبحث في قاعدة بياناتك عن أفضل سعر</div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="p-4 rounded-xl border-2" style={{ background: '#FEF2F2', borderColor: '#8B3A3A' }}>
          <div className="text-sm text-[#8B3A3A]">{error}</div>
          <button onClick={() => { setError(null); }} className="text-xs mt-2 underline text-[#8B3A3A]">حاول مرة ثانية</button>
        </div>
      )}

      {/* VERDICT */}
      {result && result.verdict && (
        <div className="space-y-3">
          {/* THE BIG VERDICT CARD */}
          <div className="p-5 rounded-3xl text-white" style={{
            background: `linear-gradient(135deg, ${result.verdict.color} 0%, ${result.verdict.color}dd 100%)`,
            boxShadow: `0 8px 30px -8px ${result.verdict.color}80`
          }}>
            <div className="text-3xl mb-2">{result.verdict.headline.split(' ')[0]}</div>
            <div className="text-white text-2xl font-bold mb-2" style={{ fontFamily: 'Reem Kufi, sans-serif' }}>
              {result.verdict.headline.split(' ').slice(1).join(' ')}
            </div>
            <div className="text-white/90 text-sm leading-relaxed">{result.verdict.subline}</div>

            {result.verdict.savings && (
              <div className="mt-4 bg-white/20 rounded-xl p-3 text-center">
                <div className="text-white/80 text-xs">توفير محتمل</div>
                <div className="text-white text-3xl font-bold">{result.verdict.savings.toFixed(2)} <span className="text-base font-normal">ر.س</span></div>
              </div>
            )}
          </div>

          {/* IDENTIFIED PRODUCT */}
          <div className="p-3 rounded-xl bg-white border border-gray-200">
            <div className="text-[10px] text-gray-500 mb-1">تعرّفت على:</div>
            <div className="text-sm font-bold text-[#0D4F3C]">{result.identified.product}</div>
            {result.identified.size && <div className="text-xs text-gray-600">{result.identified.size}</div>}
            <div className="text-[10px] text-gray-400 mt-1">ثقة: {result.identified.confidence === 'high' ? 'عالية' : result.identified.confidence === 'medium' ? 'متوسطة' : 'منخفضة'}</div>
          </div>

          {/* PRICE HISTORY */}
          {result.matches.length > 0 && (
            <div className="p-3 rounded-xl bg-white border border-gray-200">
              <div className="text-xs font-semibold text-gray-700 mb-2">📊 تاريخ هذا المنتج عندك:</div>
              <div className="space-y-2">
                {result.matches.slice(0, 1).flatMap(m => m.prices.slice(0, 5)).map((p, i) => (
                  <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-semibold text-[#0D4F3C]">{p.store}</span>
                      {p.location && <LocationBadge location={p.location} size="xs" />}
                      <span className="text-gray-400">{p.date}</span>
                      {p.wasPromotion && <span className="bg-yellow-100 text-yellow-800 px-1 rounded text-[10px]">عرض</span>}
                    </div>
                    <div className="font-bold whitespace-nowrap">{p.price.toFixed(2)} ر.س</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SAVE PRICE BUTTON */}
          {result.currentPrice && currentStore && (
            <button onClick={saveCurrentPrice}
              className="w-full p-3 rounded-xl bg-[#0D4F3C] text-white font-bold text-sm">
              💾 احفظ السعر الحالي ({currentPrice} ر.س عند {currentStore})
            </button>
          )}

          <button onClick={() => { setResult(null); setCurrentPrice(''); }}
            className="w-full p-3 rounded-xl border-2 border-gray-200 text-gray-700 text-sm font-semibold">
            منتج آخر
          </button>
        </div>
      )}
    </div>
  );
}


// ============ SCAN TAB ============
function ScanTab({ data, update }) {
  const [mode, setMode] = useState('instantBuy');

  return (
    <div className="pt-4">
      <div className="flex gap-1 mb-4 overflow-x-auto p-1 rounded-2xl" style={{ background: 'rgba(13, 79, 60, 0.08)', scrollbarWidth: 'none' }}>
        {[
          { id: 'instantBuy',  label: 'اشتري؟',         icon: Search },
          { id: 'flyer',       label: 'نشرة',           icon: Tag },
          { id: 'flyersBatch', label: 'نشرات الأسبوع',  icon: Files },
          { id: 'receipt',     label: 'فاتورة',         icon: Receipt },
          { id: 'batch',       label: 'فواتير',         icon: Files },
          { id: 'shelf',       label: 'رف',             icon: Camera },
          { id: 'compare',     label: 'مقارنة',         icon: Search },
          { id: 'calc',        label: 'حاسبة',          icon: Calculator },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap"
            style={mode === m.id
              ? { background: '#FFFFFF', color: '#0D4F3C', boxShadow: '0 1px 4px -1px rgba(13,79,60,0.15)' }
              : { color: '#0D4F3C', opacity: 0.6 }
            }>
            <m.icon size={12} />
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'instantBuy'  && <InstantBuyScanner data={data} update={update} />}
      {mode === 'flyer'       && <FlyerScanner data={data} update={update} />}
      {mode === 'flyersBatch' && <FlyersBatchScanner data={data} update={update} />}
      {mode === 'receipt'     && <ReceiptScanner data={data} update={update} />}
      {mode === 'batch'       && <BatchReceiptScanner data={data} update={update} />}
      {mode === 'shelf'       && <ShelfScanner data={data} update={update} />}
      {mode === 'compare'     && <PriceComparator data={data} />}
      {mode === 'calc'        && <DealCalculator settings={data.settings} />}
    </div>
  );
}

// ============ FLYERS BATCH SCANNER — Golden Week Summary ============
// Process multiple flyer screenshots from WhatsApp at once, build unified weekly report
function FlyersBatchScanner({ data, update }) {
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: 'idle' });
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const onFiles = (e) => {
    const fs = Array.from(e.target.files || []);
    setFiles(fs);
    setResults(null); setError(null);
    setProgress({ current: 0, total: 0, status: 'idle' });
  };

  const processAll = async () => {
    if (files.length === 0) return;
    setProgress({ current: 0, total: files.length, status: 'processing' });
    setError(null);

    const allDeals = [];
    const sourcesMap = {}; // store -> count

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const base64 = await fileToBase64(file);
        const sys = `${SAUDI_KNOWLEDGE}

استخرج العروض من نشرة سوبر ماركت سعودي (قد تكون من واتساب). JSON فقط:
{"store":"اسم المتجر","validUntil":"تاريخ أو null","deals":[{"product":"اسم","originalPrice":رقم أو null,"dealPrice":رقم,"unit":"كيلو/قطعة/لتر","unitSize":رقم حجم العبوة,"unitPrice":سعر الوحدة المعياري,"discountPct":نسبة الخصم}]}`;
        const res = await callClaude([{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: file.type, data: base64 }},
            { type: "text", text: "استخرج كل العروض من هذه الصورة (نشرة عروض). JSON فقط." }
          ]
        }], sys, 3000);
        const parsed = parseJSON(res);
        if (parsed?.deals) {
          parsed.deals.forEach(d => {
            allDeals.push({ ...d, store: parsed.store, validUntil: parsed.validUntil, sourceIdx: i });
          });
          sourcesMap[parsed.store] = (sourcesMap[parsed.store] || 0) + 1;
        }
      } catch (e) {
        console.warn('فشل في صورة', i, e);
      }
      setProgress({ current: i + 1, total: files.length, status: 'processing' });
    }

    if (allDeals.length === 0) {
      setError('ما قدرت أستخرج عروض من الصور. تأكد من وضوح الصور.');
      setProgress({ current: 0, total: 0, status: 'idle' });
      return;
    }

    // Annotate each deal with verdict + watch list match
    const annotated = allDeals.map(d => {
      const key = normalizeProductName(d.product);
      const history = data.priceBook[key];
      const watched = (data.watchList || []).find(w => key.includes(w.key) || w.key.includes(key));
      let verdict = 'new', score = 0;
      if (history?.floorPrice != null) {
        if (d.dealPrice <= history.floorPrice * 1.05) {
          verdict = 'floor'; score = 100;
        } else if (d.dealPrice <= history.floorPrice * 1.15) {
          verdict = 'good'; score = 70;
        } else if (d.dealPrice > history.floorPrice * 1.2) {
          verdict = 'skip'; score = 10;
        } else {
          verdict = 'okay'; score = 40;
        }
      } else if (d.discountPct >= 35) {
        verdict = 'lossLeader'; score = 80;
      } else if (d.discountPct >= 20) {
        verdict = 'good'; score = 50;
      }
      return { ...d, verdict, score, isWatched: !!watched, floorPrice: history?.floorPrice };
    });

    // Categorize for Golden Week Summary
    const watchListAtFloor = annotated.filter(d => d.isWatched && d.verdict === 'floor');
    const lossLeaders      = annotated.filter(d => d.verdict === 'lossLeader' && !watchListAtFloor.includes(d));
    const goodDeals        = annotated.filter(d => d.verdict === 'good' && !watchListAtFloor.includes(d) && !lossLeaders.includes(d));
    const okayDeals        = annotated.filter(d => d.verdict === 'okay');
    const skipDeals        = annotated.filter(d => d.verdict === 'skip');

    // Save to recent deals for home tab
    const now = Date.now();
    const newDeals = annotated.map(d => ({
      ...d, timestamp: now,
      isWatchListMatch: d.isWatched && d.verdict === 'floor'
    }));
    const updatedRecent = [...newDeals, ...(data.recentDeals || [])].slice(0, 300);
    await update({ recentDeals: updatedRecent });

    // Build store-by-store action plan: which stores worth visiting
    const storeScores = {};
    annotated.forEach(d => {
      if (!d.store) return;
      if (!storeScores[d.store]) storeScores[d.store] = { name: d.store, totalScore: 0, dealCount: 0, topDeals: [] };
      storeScores[d.store].totalScore += d.score;
      storeScores[d.store].dealCount++;
      if (d.score >= 70) storeScores[d.store].topDeals.push(d);
    });
    const storeRanking = Object.values(storeScores)
      .map(s => ({ ...s, avgScore: s.totalScore / s.dealCount }))
      .sort((a, b) => b.totalScore - a.totalScore);

    setResults({
      totalSources: files.length,
      totalDeals: annotated.length,
      sources: sourcesMap,
      watchListAtFloor,
      lossLeaders,
      goodDeals,
      okayDeals: okayDeals.length,
      skipDeals: skipDeals.length,
      storeRanking
    });
    setProgress({ current: files.length, total: files.length, status: 'done' });
  };

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="p-5 rounded-2xl text-right" style={{
        background: 'linear-gradient(135deg, #0D4F3C 0%, #1a6b54 100%)',
        boxShadow: '0 4px 20px -8px rgba(13, 79, 60, 0.5)'
      }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Files size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-base" style={{ fontFamily: 'Reem Kufi, sans-serif' }}>
              ملخص الأسبوع الذهبي
            </div>
            <div className="text-white/70 text-[11px]">حلّل كل سكرين شوتس واتساب دفعة وحدة</div>
          </div>
        </div>
        <div className="text-white/85 text-xs leading-relaxed mb-3">
          اختر <strong>كل سكرين شوتس النشرات</strong> اللي وصلتك هذا الأسبوع من قنوات واتساب. سأحلّلها كلها وأبني لك ملخص ذهبي يقول لك بالضبط: وين تروح، وش تشتري.
        </div>

        <button onClick={() => fileRef.current?.click()} disabled={progress.status === 'processing'}
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ background: '#fff', color: '#0D4F3C' }}>
          <Upload size={14} /> اختر صور النشرات ({files.length} محدد)
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />

        {files.length > 0 && progress.status === 'idle' && (
          <button onClick={processAll}
            className="w-full mt-2 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98"
            style={{ background: '#D4A574', color: '#0D4F3C' }}>
            <Sparkles size={14} /> ابدأ تحليل {files.length} نشرة
          </button>
        )}

        {progress.status === 'processing' && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-white mb-1.5">
              <span>جاري التحليل...</span>
              <span className="font-bold">{progress.current} / {progress.total}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="h-full transition-all" style={{
                width: `${(progress.current / progress.total) * 100}%`,
                background: '#D4A574'
              }} />
            </div>
          </div>
        )}
      </div>

      {error && <ErrorBox message={error} />}

      {/* GOLDEN WEEK SUMMARY */}
      {results && (
        <div className="space-y-4">
          {/* Overview stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #0D4F3C, #1a6b54)' }}>
              <div className="text-white/70 text-[10px]">نشرات</div>
              <div className="text-white text-xl font-bold">{results.totalSources}</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #D4A574, #B8884F)' }}>
              <div className="text-white/80 text-[10px]">عروض</div>
              <div className="text-white text-xl font-bold">{results.totalDeals}</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #1a6b54, #0D4F3C)' }}>
              <div className="text-white/70 text-[10px]">متاجر</div>
              <div className="text-white text-xl font-bold">{Object.keys(results.sources).length}</div>
            </div>
          </div>

          {/* Watch List at Floor Price - HIGHEST PRIORITY */}
          {results.watchListAtFloor.length > 0 && (
            <section className="p-4 rounded-2xl relative overflow-hidden" style={{
              background: 'linear-gradient(135deg, #0D4F3C 0%, #1a6b54 100%)',
              boxShadow: '0 4px 20px -8px rgba(13, 79, 60, 0.5)'
            }}>
              <div className="absolute top-0 left-0 w-32 h-32 rounded-full opacity-10" style={{ background: '#D4A574', transform: 'translate(-30%, -30%)' }} />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Star size={18} className="text-[#D4A574]" fill="#D4A574" />
                  <div className="text-white font-bold text-base" style={{ fontFamily: 'Reem Kufi, sans-serif' }}>
                    🎯 منتجات قائمة المراقبة بسعر أرضي
                  </div>
                </div>
                <div className="text-[#D4A574] text-[11px] font-bold mb-2">
                  ⭐ {results.watchListAtFloor.length} منتج تشتريه دائماً، نزل لسعر أرضي الآن
                </div>
                <div className="space-y-1.5">
                  {results.watchListAtFloor.slice(0, 8).map((d, i) => (
                    <div key={i} className="p-2.5 rounded-lg flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-xs font-bold">{d.product}</div>
                        <div className="text-white/70 text-[10px]">{d.store}</div>
                      </div>
                      <div className="text-left">
                        <div className="text-[#D4A574] font-bold text-sm">{d.dealPrice} ر.س</div>
                        {d.floorPrice && <div className="text-white/60 text-[9px]">أرضي: {d.floorPrice}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Loss Leaders */}
          {results.lossLeaders.length > 0 && (
            <section>
              <h2 className="text-xs font-bold mb-2 text-[#0D4F3C]/70 tracking-wide flex items-center gap-1">
                <Fish size={12} /> منتجات الجذب (خصم 35%+)
              </h2>
              <div className="space-y-1.5">
                {results.lossLeaders.slice(0, 6).map((d, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-white flex items-center justify-between"
                    style={{ boxShadow: '0 1px 4px -1px rgba(13,79,60,0.1)', borderRight: '3px solid #8B3A3A' }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#1a1a1a] truncate">{d.product}</div>
                      <div className="text-[10px] text-[#0D4F3C]/60">{d.store}</div>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <div className="text-[#8B3A3A] font-bold text-xs">-{d.discountPct}%</div>
                      <div className="text-[10px] text-[#0D4F3C]/70">{d.dealPrice} ر.س</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Store Ranking - Where to go */}
          <section className="p-4 rounded-2xl bg-white" style={{ boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.15)' }}>
            <div className="font-bold text-sm text-[#0D4F3C] mb-3 flex items-center gap-1.5">
              <MapPin size={13} /> ترتيب المتاجر — وين تروح هذا الأسبوع
            </div>
            <div className="space-y-2">
              {results.storeRanking.map((s, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏪';
                return (
                  <div key={s.name} className="flex items-center gap-2 p-2 rounded-lg" style={{
                    background: i === 0 ? 'rgba(13, 79, 60, 0.08)' : 'rgba(13, 79, 60, 0.03)'
                  }}>
                    <div className="text-xl flex-shrink-0">{medal}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-[#1a1a1a]">{s.name || 'غير محدد'}</div>
                      <div className="text-[10px] text-[#0D4F3C]/60">
                        {s.dealCount} عرض · {s.topDeals.length} عرض ممتاز
                      </div>
                    </div>
                    {i === 0 && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#0D4F3C', color: '#fff' }}>
                        الأفضل
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-3 rounded-xl bg-white" style={{ boxShadow: '0 1px 4px -1px rgba(13,79,60,0.1)' }}>
              <div className="text-[10px] text-[#0D4F3C]/60">عروض جيدة</div>
              <div className="text-lg font-bold text-[#1a6b54]">{results.goodDeals.length}</div>
            </div>
            <div className="p-3 rounded-xl bg-white" style={{ boxShadow: '0 1px 4px -1px rgba(13,79,60,0.1)' }}>
              <div className="text-[10px] text-[#0D4F3C]/60">تجاهل (سعر مرتفع)</div>
              <div className="text-lg font-bold text-[#8B3A3A]">{results.skipDeals}</div>
            </div>
          </div>

          {/* Action recommendation */}
          <div className="p-4 rounded-2xl" style={{
            background: 'linear-gradient(135deg, #FFF8EC 0%, #F5EFE6 100%)',
            border: '1px solid rgba(212, 165, 116, 0.3)'
          }}>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={16} className="text-[#B8884F]" />
              <div className="font-bold text-sm text-[#0D4F3C]">خطة الأسبوع المقترحة</div>
            </div>
            <div className="text-xs text-[#1a1a1a]/85 leading-relaxed">
              {results.watchListAtFloor.length > 0 && (
                <div className="mb-1.5">
                  ✅ <strong>أولوية قصوى:</strong> اشترِ {results.watchListAtFloor.length} منتج من قائمة مراقبتك بسعرها الأرضي
                </div>
              )}
              {results.storeRanking[0] && (
                <div className="mb-1.5">
                  📍 <strong>المتجر الأهم:</strong> {results.storeRanking[0].name} ({results.storeRanking[0].topDeals.length} عرض ممتاز)
                </div>
              )}
              {results.lossLeaders.length > 0 && (
                <div>
                  🎯 <strong>منتجات جذب:</strong> {results.lossLeaders.length} منتج بخصم 35%+ (اشترِها فقط واخرج)
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// ============ SHELF SCANNER (camera in store) ============
function ShelfScanner({ data, update }) {
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: 'idle' });
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const camRef = useRef();
  const fileRef = useRef();

  const onFiles = (e) => {
    const fs = Array.from(e.target.files || []);
    setFiles(fs);
    setResults(null); setError(null); setAutoSaved(false);
    setProgress({ current: 0, total: 0, status: 'idle' });
  };

  const processAll = async () => {
    if (files.length === 0) return;
    setProgress({ current: 0, total: files.length, status: 'processing' });
    setError(null);

    const allProducts = [];
    let detectedStore = null;

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const meta = await extractPhotoMetadata(file);
        const photoDate = meta.date;
        const gpsLat = meta.lat;
        const gpsLng = meta.lng;
        const gpsCity = guessCityFromGPS(gpsLat, gpsLng);
        const base64 = await fileToBase64(file);
        const sys = `${SAUDI_KNOWLEDGE}

أنت ترى صورة من داخل سوبر ماركت سعودي (تاق سعر على الرف، صورة منتج، أو كلاهما).

استخرج كل المنتجات الظاهرة بصيغة JSON فقط:
{
  "store": "اسم المتجر إن تعرفت عليه من شعار/تاق/علامة (بنده، هايبر بنده، كارفور، لولو، التميمي، الدانوب، العثيم، إلخ) أو null",
  "storeConfidence": "high/medium/low/none",
  "products": [
    {
      "product": "اسم المنتج بالعربي مع البراند",
      "brand": "اسم البراند فقط",
      "price": رقم السعر الفعلي (السعر الحالي، مو المشطوب),
      "originalPrice": رقم السعر القديم إن كان فيه عرض، أو null,
      "unit": "kg/g/ml/l/قطعة/عبوة",
      "unitSize": رقم حجم العبوة,
      "isPromotion": true/false (إذا تاق العرض الأصفر/الأحمر ظاهر),
      "promotionType": "خصم نسبة/X بسعر Y/اشتر 1 احصل على 1/null"
    }
  ]
}

ملاحظات مهمة:
- التعرف على المتجر: ابحث عن شعار، اسم على التاق (مثل "هايبر بنده" على تاق السلمون)، نمط طباعة التاق
- نمط تاقات بنده: أصفر مع PROMOTION أحمر في الأسفل
- نمط تاقات العثيم: "سعر ثماري" بأخضر/أزرق
- نمط تاقات لولو: تاقات أصفر مع "each" بالإنجليزي + "للحبة" بالعربي
- الفرق بين تاق سعر عادي (أبيض) وتاق عرض (أصفر/أحمر/PROMOTION)
- إذا الصورة فيها 1 منتج فقط واضح، استخرجه. لا تخمّن منتجات غير ظاهرة.`;
        const res = await callClaude([{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: file.type, data: base64 }},
            { type: "text", text: "استخرج المنتجات والأسعار من هذه الصورة. JSON فقط." }
          ]
        }], sys, 2500);
        const parsed = parseJSON(res);
        if (parsed?.products) {
          // Detected store if confidence is high or medium
          if (parsed.store && (parsed.storeConfidence === 'high' || parsed.storeConfidence === 'medium')) {
            if (!detectedStore) detectedStore = parsed.store;
          }
          parsed.products.forEach(p => {
            allProducts.push({
              ...p,
              store: parsed.store || detectedStore || 'غير محدد',
              sourceIdx: i,
              photoDate,
              gpsLat, gpsLng, gpsCity
            });
          });
        }
      } catch (e) {
        console.warn('فشل في صورة', i, e);
      }
      setProgress({ current: i + 1, total: files.length, status: 'processing' });
    }

    if (allProducts.length === 0) {
      setError('ما قدرت أستخرج منتجات من الصور. تأكد من وضوح تاقات الأسعار.');
      setProgress({ current: 0, total: 0, status: 'idle' });
      return;
    }

    // Annotate with verdicts and recommendations
    const annotated = allProducts.map(p => {
      const key = normalizeProductName(p.product);
      const history = data.priceBook[key];
      const watched = (data.watchList || []).find(w => key.includes(w.key) || w.key.includes(key));

      let verdict = 'new', reason = 'منتج جديد سيُضاف لكتاب أسعارك';
      let cheaperStore = null, cheaperPrice = null, cheaperNote = null;
      let promoBenchmark = null;

      if (history?.prices?.length > 0) {
        // Use fair floor (regular prices only) for comparisons — NEVER promo prices.
        const fairFloor = calcFairFloorPrice(history.prices);
        const regularPrices = getRegularPrices(history.prices);

        // Find a fair cheaper store (non-promotional, different store, >5% savings)
        const fairCheaper = findFairCheaperStore(p.store, history.prices, p.price);
        if (fairCheaper) {
          cheaperStore = fairCheaper.store;
          cheaperPrice = fairCheaper.price;
          cheaperNote = null; // clean comparison
        }

        // Also check for fresh promo at other stores (benchmark only, with warning)
        const promoElsewhere = findFreshPromoAtOtherStore(p.store, history.prices, p.price);
        if (promoElsewhere && !fairCheaper) {
          // Only show promo reference if no clean fair-cheaper is available
          promoBenchmark = promoElsewhere;
        }

        if (fairFloor !== null) {
          // Compare against the fair floor, not absolute floor
          const pctVsFair = ((p.price - fairFloor) / fairFloor) * 100;
          const fairCheapest = regularPrices.reduce((min, x) => x.price < min.price ? x : min);

          if (p.price <= fairFloor * 1.03) {
            verdict = 'great';
            reason = `🟢 سعر ممتاز — قريب من السعر العادي الأرضي (${fairFloor} ر.س)`;
          } else if (p.price <= fairFloor * 1.12) {
            verdict = 'good';
            reason = `🟡 سعر جيد — أرضي عادي ${fairFloor} ر.س من ${fairCheapest.store}`;
          } else if (p.price <= fairFloor * 1.25) {
            verdict = 'okay';
            reason = `🟠 متوسط (+${pctVsFair.toFixed(0)}%) — أرخص سعر عادي من ${fairCheapest.store} بـ ${fairCheapest.price} ر.س`;
          } else {
            verdict = 'bad';
            reason = `🔴 غالي (+${pctVsFair.toFixed(0)}%) — السعر العادي الأرضي ${fairFloor} ر.س من ${fairCheapest.store}`;
          }
        } else if (history.prices.every(pr => pr.wasPromotion)) {
          // Edge case: we only have promo prices on record, no regular baseline
          verdict = 'unknown';
          reason = `⚠️ كل الأسعار السابقة كانت عروض مؤقتة — السعر العادي غير معروف بعد`;
        }
      } else if (p.isPromotion && p.originalPrice) {
        const discountPct = ((p.originalPrice - p.price) / p.originalPrice) * 100;
        if (discountPct >= 35) {
          verdict = 'great'; reason = `🟢 خصم ممتاز ${discountPct.toFixed(0)}% (منتج جديد، سيُضاف للكتاب)`;
        } else if (discountPct >= 20) {
          verdict = 'good'; reason = `🟡 خصم جيد ${discountPct.toFixed(0)}% (منتج جديد، سيُضاف للكتاب)`;
        }
      }

      return { ...p, verdict, reason, isWatched: !!watched, cheaperStore, cheaperPrice, cheaperNote, promoBenchmark };
    });

    // Group by store for summary
    const storeGroups = {};
    annotated.forEach(p => {
      if (!storeGroups[p.store]) storeGroups[p.store] = { count: 0, total: 0, deals: 0 };
      storeGroups[p.store].count++;
      storeGroups[p.store].total += p.price;
      if (p.isPromotion) storeGroups[p.store].deals++;
    });

    setResults({
      products: annotated,
      detectedStore,
      storeGroups,
      totalProducts: annotated.length,
      promotions: annotated.filter(p => p.isPromotion).length,
      betterDeals: annotated.filter(p => p.cheaperStore).length,
    });
    setProgress({ current: files.length, total: files.length, status: 'done' });
  };

  // Auto-save all to price book
  const saveAllToBook = async () => {
    if (!results?.products) return;
    const newBook = { ...data.priceBook };

    results.products.forEach(p => {
      if (!p.product || p.price <= 0) return;
      const key = normalizeProductName(p.product);
      const ex = newBook[key] || { name: p.product, prices: [], floorPrice: null };
      const photoDateStr = p.photoDate ? p.photoDate.split('T')[0] : new Date().toISOString().split('T')[0];
      // Location: AI's detection > store-city map > user default
      const aiLoc = p.location;
      const productLocation = (aiLoc && aiLoc !== 'unknown')
        ? aiLoc
        : getLocationFromStore(p.store, data.settings?.defaultCity || 'unknown');
      ex.prices = [{
        store: p.store || 'غير محدد',
        price: p.price,
        originalPrice: p.originalPrice || null, // pre-promo price for reference
        unit: p.unit || 'قطعة',
        unitSize: p.unitSize,
        date: photoDateStr,
        location: productLocation,
        gpsLat: p.gpsLat || null,
        gpsLng: p.gpsLng || null,
        gpsCity: p.gpsCity || null,
        wasPromotion: p.isPromotion || false,
        promotionType: p.promotionType || null // e.g. "3 for 10", "-30%", etc.
      }, ...ex.prices].slice(0, 50);
      // Compute three kinds of floor prices:
      //   floorPrice      = absolute cheapest ever (legacy, kept for compatibility)
      //   fairFloorPrice  = cheapest REGULAR price (what you actually pay)
      //   promoFloorPrice = cheapest PROMOTIONAL price (rare deal reference)
      ex.floorPrice = Math.min(...ex.prices.map(pr => pr.price));
      ex.fairFloorPrice = calcFairFloorPrice(ex.prices);
      ex.promoFloorPrice = calcPromoFloorPrice(ex.prices);
      ex.name = p.product;
      newBook[key] = ex;
    });

    await update({ priceBook: newBook });
    setAutoSaved(true);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl" style={{
        background: 'linear-gradient(135deg, #1a6b54 0%, #0D4F3C 100%)',
        boxShadow: '0 4px 20px -8px rgba(13, 79, 60, 0.5)'
      }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Camera size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">الكاميرا في السوق</div>
            <div className="text-white/70 text-[11px]">صوّر تاقات الأسعار، يكتشف المتجر تلقائياً</div>
          </div>
        </div>
        <div className="text-white/85 text-[11px] leading-relaxed mb-3">
          ارفع صور تاقات أو رفوف من السوق. الذكاء الاصطناعي راح يستخرج الأسعار، يكتشف اسم المتجر من التاق، ويقارنها بكتاب أسعارك ليقول لك: <strong>اشترِ هنا أو روح متجر آخر</strong>.
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <button onClick={() => camRef.current?.click()} disabled={progress.status === 'processing'}
            className="py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: '#fff', color: '#0D4F3C' }}>
            <Camera size={14} /> صوّر بالكاميرا
          </button>
          <input ref={camRef} type="file" accept="image/*" capture="environment" multiple onChange={onFiles} className="hidden" />

          <button onClick={() => fileRef.current?.click()} disabled={progress.status === 'processing'}
            className="py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            <Upload size={14} /> من المعرض ({files.length})
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />
        </div>

        {files.length > 0 && progress.status === 'idle' && (
          <button onClick={processAll}
            className="w-full mt-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: '#D4A574', color: '#0D4F3C' }}>
            <Sparkles size={14} /> ابدأ تحليل {files.length} {files.length === 1 ? 'صورة' : 'صور'}
          </button>
        )}

        {progress.status === 'processing' && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-white mb-1.5">
              <span>جاري التحليل...</span>
              <span className="font-bold">{progress.current} / {progress.total}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="h-full transition-all" style={{
                width: `${(progress.current / progress.total) * 100}%`,
                background: '#D4A574'
              }} />
            </div>
          </div>
        )}
      </div>

      {error && <ErrorBox message={error} />}

      {results && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="p-4 rounded-2xl bg-white" style={{ boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.15)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-sm text-[#0D4F3C]">📊 ملخص المسح</div>
              {results.detectedStore && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background: 'rgba(13, 79, 60, 0.1)', color: '#0D4F3C' }}>
                  📍 {results.detectedStore}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(13, 79, 60, 0.06)' }}>
                <div className="text-[10px] text-[#0D4F3C]/60">منتجات</div>
                <div className="text-lg font-bold text-[#0D4F3C]">{results.totalProducts}</div>
              </div>
              <div className="p-2 rounded-lg" style={{ background: 'rgba(212, 165, 116, 0.15)' }}>
                <div className="text-[10px] text-[#0D4F3C]/60">عروض</div>
                <div className="text-lg font-bold text-[#B8884F]">{results.promotions}</div>
              </div>
              <div className="p-2 rounded-lg" style={{ background: 'rgba(139, 58, 58, 0.1)' }}>
                <div className="text-[10px] text-[#0D4F3C]/60">أرخص بمكان آخر</div>
                <div className="text-lg font-bold text-[#8B3A3A]">{results.betterDeals}</div>
              </div>
            </div>

            {/* Auto-save button */}
            {!autoSaved ? (
              <button onClick={saveAllToBook}
                className="w-full mt-3 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                style={{ background: '#0D4F3C', color: '#fff' }}>
                <Save size={12} /> حفظ {results.totalProducts} منتج في كتاب الأسعار
              </button>
            ) : (
              <div className="mt-3 p-2 rounded-xl text-center text-xs flex items-center justify-center gap-2"
                style={{ background: 'rgba(37, 211, 102, 0.15)', color: '#0D4F3C' }}>
                <Check size={12} className="text-[#25D366]" strokeWidth={3} />
                <strong>تم الحفظ! </strong> {results.totalProducts} منتج أُضيف لكتاب أسعارك
              </div>
            )}
          </div>

          {/* Better deals alert */}
          {results.betterDeals > 0 && (
            <div className="p-3 rounded-2xl" style={{
              background: 'linear-gradient(135deg, #8B3A3A 0%, #B85450 100%)',
              boxShadow: '0 4px 16px -4px rgba(139, 58, 58, 0.4)'
            }}>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={14} className="text-white" />
                <div className="text-white font-bold text-sm">⚠️ تنبيه ذكي</div>
              </div>
              <div className="text-white/90 text-xs leading-relaxed">
                فيه <strong>{results.betterDeals} منتج</strong> اشتريته قبل من متجر آخر بسعر أرخص. شوف التوصيات تحت.
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="text-[10px] text-[#0D4F3C]/70 px-1 leading-relaxed">
            🟢 ممتاز · 🟡 جيد · 🟠 متوسط · 🔴 غالي · ⚪ جديد
          </div>

          {/* Products list */}
          <div className="space-y-2">
            {results.products.map((p, i) => (
              <ShelfProductCard key={i} product={p} priceBook={data.priceBook} update={() => {}} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ShelfProductCard({ product, priceBook, update }) {
  const colors = {
    great:   { bg: '#0D4F3C', text: '#fff', label: 'ممتاز' },
    good:    { bg: '#D4A574', text: '#fff', label: 'جيد' },
    okay:    { bg: '#FFA726', text: '#fff', label: 'متوسط' },
    bad:     { bg: '#8B3A3A', text: '#fff', label: 'تجاهل' },
    unknown: { bg: 'rgba(13,79,60,0.15)', text: '#0D4F3C', label: 'جديد' }
  };
  const c = colors[product.verdict];

  const addToBook = async () => {
    const key = normalizeProductName(product.product);
    const ex = priceBook[key] || { name: product.product, prices: [], floorPrice: null };
    ex.prices = [{ store: 'مسح رف', price: product.price, unit: product.unit, date: new Date().toISOString().split('T')[0] }, ...ex.prices].slice(0, 50);
    ex.floorPrice = Math.min(...ex.prices.map(p => p.price));
    await update({ priceBook: { ...priceBook, [key]: ex } });
  };

  return (
    <div className="p-3 rounded-xl bg-white relative" style={{
      boxShadow: '0 1px 8px -2px rgba(13, 79, 60, 0.1)',
      borderRight: `4px solid ${c.bg}`
    }}>
      {product.isWatched && (
        <div className="absolute top-1.5 left-2 text-[9px] font-bold text-[#D4A574] flex items-center gap-1">
          <Star size={9} fill="#D4A574" /> مراقَب
        </div>
      )}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-[#1a1a1a]">{product.product}</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <div className="text-lg font-bold text-[#0D4F3C]">{product.price} <span className="text-xs font-normal opacity-70">ر.س</span></div>
            {product.originalPrice && product.originalPrice > product.price && (
              <div className="text-[11px] text-[#0D4F3C]/50 line-through">{product.originalPrice}</div>
            )}
          </div>
          {product.store && product.store !== 'غير محدد' && (
            <div className="text-[10px] text-[#0D4F3C]/60 mt-0.5 flex items-center gap-1">
              <Store size={9} /> {product.store}
              {product.unit && product.unitSize && <span className="opacity-70">· {product.unitSize}{product.unit}</span>}
            </div>
          )}
        </div>
        <span className="px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap" style={{ background: c.bg, color: c.text }}>
          {c.label}
        </span>
      </div>

      <div className="text-[11px] text-[#1a1a1a]/70 leading-relaxed">{product.reason}</div>

      {/* Fair cheaper store — based on regular prices only */}
      {product.cheaperStore && product.cheaperPrice != null && (
        <div className="mt-2 p-2 rounded-lg flex items-center gap-2" style={{ background: 'rgba(139, 58, 58, 0.1)' }}>
          <div className="text-base">🚗</div>
          <div className="flex-1 text-[11px] leading-tight text-[#1a1a1a]">
            <strong className="text-[#8B3A3A]">السعر العادي أرخص في {product.cheaperStore}:</strong> <strong>{product.cheaperPrice} ر.س</strong>
            <span className="text-[#0D4F3C]/60"> (وفّر {(product.price - product.cheaperPrice).toFixed(2)} ر.س)</span>
          </div>
        </div>
      )}

      {/* Promo benchmark — with clear warning this was a limited-time offer */}
      {!product.cheaperStore && product.promoBenchmark && (
        <div className="mt-2 p-2 rounded-lg" style={{ background: 'rgba(212, 165, 116, 0.15)', border: '1px dashed rgba(212, 165, 116, 0.5)' }}>
          <div className="flex items-start gap-2">
            <div className="text-base">⚠️</div>
            <div className="flex-1 text-[11px] leading-tight text-[#1a1a1a]">
              <strong className="text-[#8B6914]">للعلم فقط:</strong> شُفت عرض مؤقت في <strong>{product.promoBenchmark.store}</strong> بـ <strong>{product.promoBenchmark.price} ر.س</strong>
              <span className="block text-[10px] text-[#8B6914]/80 mt-0.5">
                {product.promoBenchmark.age === 'fresh' ? '🟢 العرض جديد (أقل من أسبوعين) — قد يكون لسه شغال' :
                 product.promoBenchmark.age === 'recent' ? '🟡 العرض قديم نسبياً (أكثر من أسبوعين) — قد يكون انتهى' :
                 '🔴 العرض قديم — قد يكون انتهى من زمن'}
              </span>
              <span className="block text-[10px] text-[#0D4F3C]/60 mt-0.5">
                السعر العادي هناك قد يكون مختلف. تأكد قبل ما تروح.
              </span>
            </div>
          </div>
        </div>
      )}

      {product.verdict === 'unknown' && (
        <button onClick={addToBook} className="mt-1.5 text-[10px] text-[#0D4F3C] font-semibold flex items-center gap-1">
          <Plus size={10} /> أضف لكتاب الأسعار
        </button>
      )}
    </div>
  );
}

// ============ PRICE COMPARATOR (compare across delivery apps) ============
function PriceComparator({ data }) {
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const fileRef = useRef();

  const COMPARE_APPS = [
    { name: 'كيتا',         label: 'kita',       url: (q) => `https://www.kita.sa/search?q=${encodeURIComponent(q)}`,    color: '#FF6B00', desc: 'توصيل مجاني عادة' },
    { name: 'نينجا',        label: 'ninja',      url: (q) => `https://ananinja.com/sa/ar/search?q=${encodeURIComponent(q)}`, color: '#000',    desc: 'سريع 20-40 دقيقة' },
    { name: 'هنقرستيشن',    label: 'hungerstation', url: (q) => `https://hungerstation.com/sa-ar/search?q=${encodeURIComponent(q)}`, color: '#FFB100', desc: 'تنوع كبير' },
    { name: 'نعناع',        label: 'nana',       url: (q) => `https://nana.sa/search?q=${encodeURIComponent(q)}`,        color: '#00B894', desc: 'بقالة فقط' },
    { name: 'أمازون السعودية', label: 'amazon',  url: (q) => `https://www.amazon.sa/s?k=${encodeURIComponent(q)}`,       color: '#FF9900', desc: 'منتجات عامة' },
    { name: 'كارفور أونلاين', label: 'carrefour', url: (q) => `https://www.carrefourksa.com/mafsau/ar/search?keyword=${encodeURIComponent(q)}`, color: '#004E9F', desc: 'عروض المتجر' }
  ];

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError(null); setExtracted(null);
    try {
      const base64 = await fileToBase64(file);
      const sys = `${SAUDI_KNOWLEDGE}

أنت ترى لقطة شاشة من تطبيق توصيل (نينجا، كيتا، هنقرستيشن، إلخ). استخرج المنتجات الظاهرة مع أسعارها بصيغة JSON:
{
  "appName": "اسم التطبيق إن تعرفت عليه أو null",
  "products": [
    { "product": "اسم المنتج", "price": رقم, "originalPrice": رقم أو null, "unit": "الوحدة" }
  ]
}`;
      const res = await callClaude([{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: file.type, data: base64 }},
          { type: "text", text: "استخرج المنتجات والأسعار من لقطة الشاشة. JSON فقط." }
        ]
      }], sys, 2500);
      const parsed = parseJSON(res);
      if (!parsed?.products) throw new Error("ما قدرت أستخرج البيانات.");

      const annotated = parsed.products.map(p => {
        const key = normalizeProductName(p.product);
        const history = data.priceBook[key];
        let verdict = 'unknown', note = '';
        if (history?.floorPrice != null) {
          const diff = ((p.price - history.floorPrice) / history.floorPrice) * 100;
          if (p.price <= history.floorPrice * 1.05) {
            verdict = 'great'; note = `سعر ممتاز — أقل بـ ${Math.abs(diff).toFixed(0)}% من السعر الأرضي`;
          } else if (diff > 30) {
            verdict = 'bad'; note = `أعلى بـ ${diff.toFixed(0)}% من السعر الأرضي (${history.floorPrice} ر.س)`;
          } else {
            verdict = 'okay'; note = `أعلى بـ ${diff.toFixed(0)}% من السعر الأرضي`;
          }
        }
        return { ...p, verdict, note };
      });

      setExtracted({ ...parsed, products: annotated });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white" style={{ boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.15)' }}>
        <div className="text-xs font-bold text-[#0D4F3C] mb-2 flex items-center gap-1.5">
          <Search size={13} /> مساعد المقارنة
        </div>
        <div className="text-[11px] text-[#0D4F3C]/70 leading-relaxed mb-3">
          ابحث عن منتج في كل تطبيقات التوصيل بضغطة وحدة، أو ارفع لقطة شاشة من أي تطبيق وأقارن لك الأسعار بكتاب أسعارك.
        </div>

        {/* Search input */}
        <div className="flex gap-2 mb-3">
          <input value={productName} onChange={e => setProductName(e.target.value)}
            placeholder="مثلاً: حليب المراعي 2 لتر"
            className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(13, 79, 60, 0.06)', color: '#0D4F3C' }} />
        </div>

        {/* App buttons */}
        {productName.trim() && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {COMPARE_APPS.map(app => (
              <a key={app.label} href={app.url(productName)} target="_blank" rel="noopener noreferrer"
                className="p-2.5 rounded-xl text-right transition-all active:scale-95"
                style={{ background: '#fff', boxShadow: '0 1px 4px -1px rgba(13,79,60,0.1)', borderRight: `3px solid ${app.color}` }}>
                <div className="font-bold text-xs text-[#1a1a1a]">{app.name}</div>
                <div className="text-[10px] text-[#0D4F3C]/60">{app.desc}</div>
              </a>
            ))}
          </div>
        )}

        <div className="border-t border-[#0D4F3C]/10 pt-3 mt-3">
          <button onClick={() => fileRef.current?.click()} disabled={loading}
            className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            style={{ background: 'rgba(13, 79, 60, 0.08)', color: '#0D4F3C' }}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            ارفع سكرين شوت من تطبيق
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      {extracted && (
        <div className="space-y-2">
          {extracted.appName && (
            <div className="text-xs font-bold text-[#0D4F3C] px-1">من: {extracted.appName}</div>
          )}
          {extracted.products.map((p, i) => (
            <ShelfProductCard key={i} product={p} priceBook={data.priceBook} update={() => {}} />
          ))}
        </div>
      )}

      {/* Tip about delivery costs */}
      <div className="p-3 rounded-xl text-[11px] text-[#0D4F3C]/70 leading-relaxed flex items-start gap-2"
        style={{ background: 'rgba(212, 165, 116, 0.15)' }}>
        <Lightbulb size={12} className="text-[#B8884F] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#B8884F]">تذكير:</span> رسوم التوصيل مهمة! منتج بـ 20 ر.س + 12 ر.س توصيل = 32 ر.س، بينما من السوبر ماركت بـ 25 ر.س مباشرة قد يكون أوفر.
        </div>
      </div>
    </div>
  );
}


function FlyerScanner({ data, update }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const fileRef = useRef();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError(null); setExtracted(null);
    try {
      const parsed = await extractFlyerData(file, data.priceBook, data.watchList);
      const deals = parsed.deals.map(d => {
        const key = normalizeProductName(d.product);
        const history = data.priceBook[key];
        const watched = data.watchList.find(w => key.includes(w.key) || w.key.includes(key));
        let rec = 'neutral', note = 'منتج جديد';
        if (history?.floorPrice != null) {
          if (d.dealPrice <= history.floorPrice * 1.05) {
            rec = 'buy'; note = `سعر ممتاز — قريب من السعر الأرضي (${history.floorPrice} ر.س)`;
          } else if (d.dealPrice > history.floorPrice * 1.2) {
            rec = 'skip'; note = `تجاهل — سبق ووصل لـ ${history.floorPrice} ر.س`;
          } else {
            rec = 'okay'; note = `متوسط — السعر الأرضي ${history.floorPrice} ر.س`;
          }
        }
        return { ...d, recommendation: rec, note, isWatched: !!watched };
      });

      const now = Date.now();
      const newDeals = deals.map(d => ({
        ...d, store: parsed.store, timestamp: now,
        isWatchListMatch: d.isWatched && d.recommendation === 'buy'
      }));
      const updatedRecent = [...newDeals, ...data.recentDeals].slice(0, 200);
      await update({ recentDeals: updatedRecent });

      const matches = newDeals.filter(d => d.isWatchListMatch);
      if (matches.length > 0 && data.settings.notificationsEnabled) {
        sendNotif(`🎯 ${matches.length} عرض من قائمة مراقبتك!`,
          matches.slice(0, 3).map(m => `${m.product} بـ ${m.dealPrice} ر.س`).join(' • '));
      }

      setExtracted({ ...parsed, deals });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <div className="space-y-4">
      <UploadCard icon={Tag} title="مسح نشرة العروض" desc="صوّر النشرة وسأستخرج العروض وأقارنها بكتاب أسعارك"
        onClick={() => fileRef.current?.click()} loading={loading} />
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      {error && <ErrorBox message={error} />}
      {extracted && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="font-bold text-[#0D4F3C]">
              {extracted.store || 'العروض المستخرجة'}
              {extracted.validUntil && <span className="block text-[11px] font-normal text-[#0D4F3C]/60">حتى {extracted.validUntil}</span>}
            </div>
            <button onClick={() => setExtracted(null)} className="text-[#0D4F3C]/50 p-1"><X size={16} /></button>
          </div>
          {extracted.deals.map((d, i) => <DealCard key={i} deal={d} store={extracted.store} priceBook={data.priceBook} update={update} />)}
        </div>
      )}
    </div>
  );
}

function DealCard({ deal, store, priceBook, update }) {
  const styles = {
    buy:     { bg: '#0D4F3C', label: 'اشترِ الآن', text: '#fff' },
    okay:    { bg: '#D4A574', label: 'سعر متوسط', text: '#fff' },
    skip:    { bg: '#8B3A3A', label: 'تجاهل', text: '#fff' },
    neutral: { bg: 'rgba(13, 79, 60, 0.15)', label: 'جديد', text: '#0D4F3C' },
  };
  const s = styles[deal.recommendation];

  const addToBook = async () => {
    const key = normalizeProductName(deal.product);
    const existing = priceBook[key] || { name: deal.product, prices: [], floorPrice: null };
    const entry = {
      store: store || 'غير محدد', price: deal.dealPrice, unit: deal.unit,
      unitPrice: deal.unitPrice, date: new Date().toISOString().split('T')[0]
    };
    existing.prices = [entry, ...existing.prices].slice(0, 50);
    existing.floorPrice = Math.min(...existing.prices.map(p => p.price));
    await update({ priceBook: { ...priceBook, [key]: existing } });
  };

  return (
    <div className="p-3.5 rounded-2xl bg-white relative overflow-hidden" style={{ boxShadow: '0 1px 8px -2px rgba(13, 79, 60, 0.1)' }}>
      {deal.isWatched && (
        <div className="absolute top-1.5 left-2 text-[9px] font-bold text-[#D4A574] flex items-center gap-1">
          <Star size={9} fill="#D4A574" /> مراقَب
        </div>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-[#1a1a1a] leading-tight">{deal.product}</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold text-[#0D4F3C]">{deal.dealPrice} ر.س</span>
            {deal.originalPrice && <span className="text-xs text-[#1a1a1a]/40 line-through">{deal.originalPrice}</span>}
            {deal.discountPct > 0 && <span className="text-[10px] font-bold text-[#8B3A3A]">-{deal.discountPct}%</span>}
          </div>
          {deal.unitPrice && deal.unit && (
            <div className="text-[10px] text-[#0D4F3C]/60 mt-0.5 flex items-center gap-1">
              <span>⚖️</span> {deal.unitPrice} ر.س / {deal.unit}
            </div>
          )}
        </div>
        <span className="px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap" style={{ background: s.bg, color: s.text }}>
          {s.label}
        </span>
      </div>
      <div className="text-[11px] text-[#0D4F3C]/70 leading-relaxed">{deal.note}</div>
      <button onClick={addToBook} className="mt-2 text-[11px] text-[#0D4F3C] font-semibold flex items-center gap-1 active:opacity-60">
        <Plus size={11} /> أضف لكتاب الأسعار
      </button>
    </div>
  );
}

// ----- Receipt Scanner with REVIEW STEP -----
// ============ SAVINGS REPORT — motivational feedback after receipt save ============
function SavingsReportCard({ report, onClose }) {
  const netSavings = report.totalSaved - report.totalLost;
  const isPositive = netSavings > 0;
  const headline = isPositive
    ? `🎉 برافو! وفّرت ${netSavings.toFixed(2)} ر.س`
    : netSavings < 0
      ? `📊 الفرق: ${Math.abs(netSavings).toFixed(2)} ر.س فوق المتوسط`
      : `📋 تم حفظ الفاتورة`;

  return (
    <div className="p-4 rounded-2xl relative overflow-hidden" style={{
      background: isPositive
        ? 'linear-gradient(135deg, #0D4F3C 0%, #1a6b54 100%)'
        : 'linear-gradient(135deg, #B8884F 0%, #D4A574 100%)',
      boxShadow: '0 4px 20px -8px rgba(13, 79, 60, 0.5)'
    }}>
      <button onClick={onClose} className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.2)' }}>
        <X size={14} className="text-white" />
      </button>

      <div className="text-white font-bold text-base mb-2" style={{ fontFamily: 'Reem Kufi, sans-serif' }}>
        {headline}
      </div>

      {report.totalSaved > 0 && (
        <div className="mb-3">
          <div className="text-white/85 text-xs mb-2">
            💰 وفّرت <strong>{report.totalSaved.toFixed(2)} ر.س</strong> على {report.itemsWithSavings.length} منتج (مقارنة بالمتوسط في كتابك):
          </div>
          <div className="space-y-1">
            {report.itemsWithSavings.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] p-1.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.15)' }}>
                <div className="text-white truncate flex-1">{item.product}</div>
                <div className="text-[#D4A574] font-bold">-{item.saved.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.itemsCheaperElsewhere.length > 0 && (
        <div className="mb-3">
          <div className="text-white/85 text-xs mb-2">
            ⚠️ {report.itemsCheaperElsewhere.length} منتج أرخص بمكان آخر (للمرة القادمة):
          </div>
          <div className="space-y-1">
            {report.itemsCheaperElsewhere.slice(0, 4).map((item, i) => (
              <div key={i} className="text-[11px] p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <div className="text-white font-semibold truncate">{item.product}</div>
                <div className="text-white/80 text-[10px]">
                  {item.cheaperStore}: {item.cheaperPrice} ر.س (وفّر {item.lost.toFixed(2)})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.newProducts > 0 && (
        <div className="text-white/85 text-[11px] flex items-center gap-1">
          <Sparkles size={11} /> أُضيف {report.newProducts} منتج جديد لكتاب أسعارك
        </div>
      )}

      <div className="mt-3 text-[10px] text-white/70 text-center">
        كل فاتورة ترفعها = بيانات أكثر = توصيات أذكى المرة الجاية
      </div>
    </div>
  );
}

// ============ INFLATION TRACKER — show price changes over time ============
function InflationCard({ priceBook }) {
  const [view, setView] = useState('overview'); // overview | details

  // Calculate inflation per product (only those with 2+ data points spanning 1+ month)
  const productsWithInflation = useMemo(() => {
    return Object.entries(priceBook || {})
      .map(([key, data]) => {
        const inflation = calcInflation(data.prices);
        if (!inflation) return null;
        return { key, name: data.name, ...inflation };
      })
      .filter(x => x && Math.abs(parseFloat(x.totalChangePct)) > 1) // ignore < 1% noise
      .sort((a, b) => parseFloat(b.totalChangePct) - parseFloat(a.totalChangePct));
  }, [priceBook]);

  if (productsWithInflation.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-white text-center" style={{ boxShadow: '0 1px 8px -2px rgba(13, 79, 60, 0.1)' }}>
        <TrendingUp size={20} className="mx-auto text-[#0D4F3C]/40 mb-2" />
        <div className="text-xs text-[#0D4F3C]/70 leading-relaxed">
          لسا ما عندي بيانات كافية لحساب التضخم.<br />
          ارفع أسعار نفس المنتج بفترات مختلفة (شهر+) عشان أحلل لك.
        </div>
      </div>
    );
  }

  const avgInflation = productsWithInflation.reduce((s, p) => s + parseFloat(p.annualizedRate), 0) / productsWithInflation.length;
  const risingProducts = productsWithInflation.filter(p => parseFloat(p.totalChangePct) > 0);
  const fallingProducts = productsWithInflation.filter(p => parseFloat(p.totalChangePct) < 0);

  return (
    <div className="space-y-3">
      {/* Hero */}
      <div className="p-4 rounded-2xl relative overflow-hidden" style={{
        background: avgInflation > 0
          ? 'linear-gradient(135deg, #8B3A3A 0%, #B85450 100%)'
          : 'linear-gradient(135deg, #0D4F3C 0%, #1a6b54 100%)',
        boxShadow: '0 4px 20px -8px rgba(139, 58, 58, 0.4)'
      }}>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={16} className="text-white" />
          <div className="text-white font-bold text-sm" style={{ fontFamily: 'Reem Kufi, sans-serif' }}>
            مؤشر التضخم الشخصي
          </div>
        </div>
        <div className="text-white text-3xl font-bold mb-1">
          {avgInflation > 0 ? '+' : ''}{avgInflation.toFixed(1)}%
        </div>
        <div className="text-white/80 text-[11px]">معدل التغير السنوي بناءً على {productsWithInflation.length} منتج في كتابك</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-white text-center" style={{ boxShadow: '0 1px 4px -1px rgba(13,79,60,0.1)' }}>
          <div className="text-[10px] text-[#0D4F3C]/60">منتجات ارتفعت 📈</div>
          <div className="text-xl font-bold text-[#8B3A3A]">{risingProducts.length}</div>
        </div>
        <div className="p-3 rounded-xl bg-white text-center" style={{ boxShadow: '0 1px 4px -1px rgba(13,79,60,0.1)' }}>
          <div className="text-[10px] text-[#0D4F3C]/60">منتجات نزلت 📉</div>
          <div className="text-xl font-bold text-[#0D4F3C]">{fallingProducts.length}</div>
        </div>
      </div>

      {/* Top changes */}
      <div>
        <div className="text-xs font-bold text-[#0D4F3C]/70 mb-2 flex items-center gap-1">
          <ArrowUp size={10} /> أكثر منتجات ارتفعت
        </div>
        <div className="space-y-1.5">
          {risingProducts.slice(0, 5).map(p => (
            <div key={p.key} className="p-2.5 rounded-xl bg-white flex items-center justify-between"
              style={{ boxShadow: '0 1px 4px -1px rgba(13,79,60,0.1)', borderRight: '3px solid #8B3A3A' }}>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#1a1a1a] truncate">{p.name}</div>
                <div className="text-[10px] text-[#0D4F3C]/60">
                  {p.oldPrice} → {p.newPrice} ر.س (خلال {p.monthsDiff} شهر)
                </div>
              </div>
              <div className="text-[#8B3A3A] font-bold text-sm">+{p.totalChangePct}%</div>
            </div>
          ))}
        </div>
      </div>

      {fallingProducts.length > 0 && (
        <div>
          <div className="text-xs font-bold text-[#0D4F3C]/70 mb-2 flex items-center gap-1">
            <ArrowDown size={10} /> منتجات انخفضت (فرصة!)
          </div>
          <div className="space-y-1.5">
            {fallingProducts.slice(0, 5).map(p => (
              <div key={p.key} className="p-2.5 rounded-xl bg-white flex items-center justify-between"
                style={{ boxShadow: '0 1px 4px -1px rgba(13,79,60,0.1)', borderRight: '3px solid #0D4F3C' }}>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#1a1a1a] truncate">{p.name}</div>
                  <div className="text-[10px] text-[#0D4F3C]/60">
                    {p.oldPrice} → {p.newPrice} ر.س (خلال {p.monthsDiff} شهر)
                  </div>
                </div>
                <div className="text-[#0D4F3C] font-bold text-sm">{p.totalChangePct}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReceiptScanner({ data, update }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extracted, setExtracted] = useState(null); // raw extraction
  const [editing, setEditing] = useState(null);     // editable copy for review
  const [savingsReport, setSavingsReport] = useState(null); // motivational feedback
  const fileRef = useRef();

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError(null); setExtracted(null); setEditing(null); setSavingsReport(null);
    try {
      const meta = await extractPhotoMetadata(file);
      const photoDate = meta.date;
      const result = await extractReceiptData(file);
      // Use photo date if no date in receipt
      if (!result.date && photoDate) {
        result.date = photoDate.split('T')[0];
        result.photoDate = photoDate;
      }
      // Attach GPS meta (used on save to remember where receipt was scanned)
      result._gps = { lat: meta.lat, lng: meta.lng, city: guessCityFromGPS(meta.lat, meta.lng) };
      setExtracted(result);
      setEditing(JSON.parse(JSON.stringify(result))); // deep copy for editing
    } catch (e) { setError(e.message); }
    finally { setLoading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const updateField = (field, value) => setEditing(p => ({ ...p, [field]: value }));
  const updateItem = (i, field, value) => {
    setEditing(p => ({
      ...p,
      items: p.items.map((it, idx) => idx === i ? { ...it, [field]: field === 'price' || field === 'quantity' ? +value || 0 : value } : it)
    }));
  };
  const removeItem = (i) => setEditing(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const addItem = () => setEditing(p => ({ ...p, items: [...p.items, { product: '', price: 0, quantity: 1, unit: 'حبة' }] }));

  const saveAll = async () => {
    const newBook = { ...data.priceBook };

    // Calculate savings/loss vs price book BEFORE saving
    const savingsAnalysis = {
      totalSaved: 0,
      totalLost: 0,
      itemsWithSavings: [],
      itemsCheaperElsewhere: [],
      newProducts: 0,
      receiptDate: editing.date || new Date().toISOString().split('T')[0]
    };

    editing.items.forEach(item => {
      if (!item.product || item.price <= 0) return;
      const key = normalizeProductName(item.product);
      const history = data.priceBook[key];
      if (history?.prices?.length > 0) {
        // Compare current price to history avg + minimum
        const avgPrice = history.prices.reduce((s, p) => s + p.price, 0) / history.prices.length;
        const cheapest = history.prices.reduce((min, p) => p.price < min.price ? p : min);

        if (item.price < avgPrice * 0.95) {
          // Saved compared to average
          const saved = (avgPrice - item.price) * (item.quantity || 1);
          savingsAnalysis.totalSaved += saved;
          savingsAnalysis.itemsWithSavings.push({
            product: item.product,
            currentPrice: item.price,
            avgPrice: avgPrice,
            saved: saved
          });
        } else if (item.price > cheapest.price * 1.10 && cheapest.store !== editing.store) {
          // More expensive than another store
          const lost = (item.price - cheapest.price) * (item.quantity || 1);
          savingsAnalysis.totalLost += lost;
          savingsAnalysis.itemsCheaperElsewhere.push({
            product: item.product,
            currentPrice: item.price,
            currentStore: editing.store,
            cheaperPrice: cheapest.price,
            cheaperStore: cheapest.store,
            lost: lost
          });
        }
      } else {
        savingsAnalysis.newProducts++;
      }
    });

    // Now save to price book
    editing.items.forEach(item => {
      if (!item.product || item.price <= 0) return;
      const key = normalizeProductName(item.product);
      const ex = newBook[key] || { name: item.product, prices: [], floorPrice: null };
      ex.prices = [{
        store: editing.store || 'غير محدد', price: item.price, unit: item.unit,
        date: editing.date || new Date().toISOString().split('T')[0]
      }, ...ex.prices].slice(0, 50);
      ex.floorPrice = Math.min(...ex.prices.map(p => p.price));
      newBook[key] = ex;
    });

    // Add to spending log for budget tracking
    const receiptDate = editing.date ? new Date(editing.date).getTime() : Date.now();
    const total = editing.total || editing.items.reduce((s, it) => s + (it.price * (it.quantity || 1)), 0);
    const spendingEntry = {
      id: 'sp_' + Date.now(),
      store: editing.store || 'غير محدد',
      date: editing.date || new Date().toISOString().split('T')[0],
      timestamp: receiptDate,
      total,
      items: editing.items.filter(it => it.product && it.price > 0)
    };
    const newLog = [spendingEntry, ...(data.spendingLog || [])].slice(0, 500);

    await update({ priceBook: newBook, spendingLog: newLog });
    setExtracted(null); setEditing(null);
    setSavingsReport(savingsAnalysis); // Show motivational report
  };

  return (
    <div className="space-y-4">
      <UploadCard icon={Receipt} title="مسح فاتورة واحدة" desc="صوّر الفاتورة، راجع الاستخراج، ثم احفظ"
        onClick={() => fileRef.current?.click()} loading={loading} />
      <input ref={fileRef} type="file" accept="image/*" onChange={handle} className="hidden" />
      {error && <ErrorBox message={error} />}

      {/* Motivational savings report after save */}
      {savingsReport && (
        <SavingsReportCard report={savingsReport} onClose={() => setSavingsReport(null)} />
      )}

      {editing && (
        <ReviewPanel
          editing={editing}
          updateField={updateField}
          updateItem={updateItem}
          removeItem={removeItem}
          addItem={addItem}
          onSave={saveAll}
          onCancel={() => { setEditing(null); setExtracted(null); }}
        />
      )}
    </div>
  );
}

// ----- REVIEW PANEL (NEW: edit before saving) -----
function ReviewPanel({ editing, updateField, updateItem, removeItem, addItem, onSave, onCancel }) {
  const calcTotal = editing.items.reduce((s, it) => s + (it.price * (it.quantity || 1)), 0);

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: 'rgba(212, 165, 116, 0.2)' }}>
        <Edit3 size={14} className="text-[#B8884F] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#1a1a1a]/80 leading-relaxed">
          <span className="font-bold text-[#B8884F]">راجع قبل الحفظ.</span> الذكاء الاصطناعي يخطئ أحياناً في الأسماء أو الأسعار. عدّل اللي يحتاج، ثم احفظ.
        </div>
      </div>

      {/* Header info */}
      <div className="p-4 rounded-2xl bg-white space-y-2" style={{ boxShadow: '0 1px 8px -2px rgba(13, 79, 60, 0.1)' }}>
        <div>
          <div className="text-[10px] font-semibold text-[#0D4F3C]/70 mb-1">المتجر</div>
          <input value={editing.store || ''} onChange={e => updateField('store', e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm font-semibold outline-none"
            style={{ background: 'rgba(13, 79, 60, 0.06)', color: '#0D4F3C' }} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] font-semibold text-[#0D4F3C]/70 mb-1">التاريخ</div>
            <input value={editing.date || ''} onChange={e => updateField('date', e.target.value)}
              placeholder="YYYY-MM-DD"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: 'rgba(13, 79, 60, 0.06)' }} />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#0D4F3C]/70 mb-1">الإجمالي بالفاتورة</div>
            <input type="number" value={editing.total || 0} onChange={e => updateField('total', +e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none text-center font-bold"
              style={{ background: 'rgba(13, 79, 60, 0.06)' }} />
          </div>
        </div>
        <div className="text-[10px] text-[#0D4F3C]/60 text-center">
          مجموع الأسطر المحسوب: <span className="font-bold">{calcTotal.toFixed(2)} ر.س</span>
          {Math.abs(calcTotal - (editing.total || 0)) > 0.5 && (
            <span className="text-[#8B3A3A]"> ⚠️ مختلف عن الإجمالي بالفاتورة</span>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {editing.items.map((item, i) => (
          <ItemEditor key={i} item={item} onChange={(field, value) => updateItem(i, field, value)} onRemove={() => removeItem(i)} />
        ))}
      </div>

      <button onClick={addItem} className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
        style={{ background: 'rgba(13, 79, 60, 0.08)', color: '#0D4F3C' }}>
        <Plus size={14} /> أضف منتج يدوياً
      </button>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-semibold text-sm"
          style={{ background: 'rgba(139, 58, 58, 0.1)', color: '#8B3A3A' }}>
          إلغاء
        </button>
        <button onClick={onSave} className="flex-[2] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98"
          style={{ background: '#0D4F3C', color: '#F5EFE6', boxShadow: '0 4px 16px -4px rgba(13, 79, 60, 0.5)' }}>
          <Save size={14} /> احفظ {editing.items.length} منتج لكتاب الأسعار
        </button>
      </div>
    </div>
  );
}

function ItemEditor({ item, onChange, onRemove }) {
  return (
    <div className="p-3 rounded-xl bg-white" style={{ boxShadow: '0 1px 4px -1px rgba(13,79,60,0.1)' }}>
      <div className="flex items-start gap-2 mb-2">
        <input value={item.product || ''} onChange={e => onChange('product', e.target.value)}
          placeholder="اسم المنتج"
          className="flex-1 px-2 py-1.5 rounded-lg text-sm font-semibold outline-none"
          style={{ background: 'rgba(13, 79, 60, 0.06)', color: '#1a1a1a' }} />
        <button onClick={onRemove} className="p-1.5 rounded-lg" style={{ background: 'rgba(139, 58, 58, 0.1)', color: '#8B3A3A' }}>
          <Trash2 size={12} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <div>
          <div className="text-[9px] font-semibold text-[#0D4F3C]/60 mb-0.5">سعر الوحدة</div>
          <input type="number" step="0.01" value={item.price || 0} onChange={e => onChange('price', e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg text-xs outline-none text-center font-bold"
            style={{ background: 'rgba(13, 79, 60, 0.06)', color: '#0D4F3C' }} />
        </div>
        <div>
          <div className="text-[9px] font-semibold text-[#0D4F3C]/60 mb-0.5">الكمية</div>
          <input type="number" step="0.001" value={item.quantity || 1} onChange={e => onChange('quantity', e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg text-xs outline-none text-center"
            style={{ background: 'rgba(13, 79, 60, 0.06)' }} />
        </div>
        <div>
          <div className="text-[9px] font-semibold text-[#0D4F3C]/60 mb-0.5">الوحدة</div>
          <select value={item.unit || 'حبة'} onChange={e => onChange('unit', e.target.value)}
            className="w-full px-1.5 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: 'rgba(13, 79, 60, 0.06)' }}>
            <option>حبة</option>
            <option>كيلو</option>
            <option>لتر</option>
            <option>ربطة</option>
            <option>باكيت</option>
            <option>كرتون</option>
          </select>
        </div>
      </div>
      <div className="text-[10px] text-[#0D4F3C]/50 mt-1.5 text-left">
        إجمالي السطر: <span className="font-bold">{(item.price * (item.quantity || 1)).toFixed(2)} ر.س</span>
      </div>
    </div>
  );
}

// ----- Batch Receipt Scanner with REVIEW for watch list -----
function BatchReceiptScanner({ data, update }) {
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: 'idle' });
  const [pendingWatchList, setPendingWatchList] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const onFiles = (e) => {
    const fs = Array.from(e.target.files || []);
    setFiles(fs);
    setPendingWatchList(null); setError(null);
    setProgress({ current: 0, total: 0, status: 'idle' });
  };

  const processAll = async () => {
    if (files.length === 0) return;
    setProgress({ current: 0, total: files.length, status: 'processing' });
    setError(null);
    const allItems = [];
    const newBook = { ...data.priceBook };

    for (let i = 0; i < files.length; i++) {
      try {
        const r = await extractReceiptData(files[i]);
        r.items.forEach(item => {
          if (!item.product || item.price <= 0) return;
          allItems.push({ ...item, store: r.store, date: r.date });
          const key = normalizeProductName(item.product);
          const ex = newBook[key] || { name: item.product, prices: [], floorPrice: null };
          ex.prices = [{
            store: r.store || 'غير محدد', price: item.price, unit: item.unit,
            date: r.date || new Date().toISOString().split('T')[0]
          }, ...ex.prices].slice(0, 50);
          ex.floorPrice = Math.min(...ex.prices.map(p => p.price));
          newBook[key] = ex;
        });
      } catch (e) { console.warn('فشل في فاتورة', i, e); }
      setProgress({ current: i + 1, total: files.length, status: 'processing' });
    }

    const freq = {};
    allItems.forEach(item => {
      const key = normalizeProductName(item.product);
      if (!freq[key]) freq[key] = { key, name: item.product, count: 0, totalPrice: 0, prices: [], stores: new Set() };
      freq[key].count++;
      freq[key].totalPrice += item.price;
      freq[key].prices.push(item.price);
      freq[key].stores.add(item.store || '');
    });
    const watchList = Object.values(freq)
      .filter(w => w.count >= 2)
      .map(w => ({
        key: w.key, name: w.name, count: w.count,
        avgPrice: +(w.totalPrice / w.count).toFixed(2),
        minPrice: Math.min(...w.prices),
        storeCount: w.stores.size,
        keep: true // for review checkbox
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    // Save price book immediately, but show watch list for review
    await update({ priceBook: newBook });
    setProgress({ current: files.length, total: files.length, status: 'review' });
    setPendingWatchList({ items: watchList, totalItems: allItems.length });
  };

  const updateWatchItem = (i, field, value) => {
    setPendingWatchList(p => ({
      ...p,
      items: p.items.map((it, idx) => idx === i ? { ...it, [field]: value } : it)
    }));
  };

  const confirmWatchList = async () => {
    const finalList = pendingWatchList.items
      .filter(w => w.keep)
      .map(({ keep, ...rest }) => rest);
    await update({ watchList: finalList });
    setPendingWatchList(null);
    setFiles([]);
    setProgress({ current: 0, total: 0, status: 'done' });
  };

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl text-right" style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F9F4EB 100%)',
        boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.15)',
        border: '2px dashed rgba(13, 79, 60, 0.2)'
      }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#0D4F3C' }}>
            <Files size={18} className="text-white" />
          </div>
          <div className="font-bold text-[#0D4F3C]">رفع فواتير الشهر الماضي</div>
        </div>
        <div className="text-xs text-[#0D4F3C]/70 leading-relaxed mb-3">
          ارفع كل فواتير الشهر دفعة واحدة. سأحلّلها كلها، ثم أعرض لك قائمة المراقبة المقترحة لتراجعها قبل الحفظ.
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={progress.status === 'processing'}
          className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          style={{ background: 'rgba(13, 79, 60, 0.08)', color: '#0D4F3C' }}>
          <Upload size={14} /> اختر صور الفواتير ({files.length} محدد)
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />

        {files.length > 0 && progress.status === 'idle' && (
          <button onClick={processAll}
            className="w-full mt-2 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98"
            style={{ background: '#0D4F3C', color: '#F5EFE6' }}>
            <Sparkles size={14} /> ابدأ التحليل ({files.length} فاتورة)
          </button>
        )}

        {progress.status === 'processing' && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-[#0D4F3C] mb-1.5">
              <span>جاري المعالجة...</span>
              <span className="font-bold">{progress.current} / {progress.total}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(13, 79, 60, 0.1)' }}>
              <div className="h-full transition-all" style={{
                width: `${(progress.current / progress.total) * 100}%`,
                background: 'linear-gradient(90deg, #0D4F3C, #1a6b54)'
              }} />
            </div>
          </div>
        )}
      </div>

      {error && <ErrorBox message={error} />}

      {pendingWatchList && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, #0D4F3C 0%, #1a6b54 100%)' }}>
            <div className="text-[#D4A574] text-[11px] font-semibold mb-1">📋 راجع قائمة المراقبة المقترحة</div>
            <div className="text-white text-base font-bold">
              {pendingWatchList.items.filter(w => w.keep).length} من {pendingWatchList.items.length} منتج
            </div>
            <div className="text-white/80 text-[11px] mt-1">شيل المنتجات اللي ما تبيها، ثم اضغط حفظ</div>
          </div>

          <div className="space-y-1.5">
            {pendingWatchList.items.map((w, i) => (
              <label key={i} className="p-3 rounded-xl bg-white flex items-center gap-3 cursor-pointer"
                style={{ boxShadow: '0 1px 4px -1px rgba(13,79,60,0.1)', opacity: w.keep ? 1 : 0.5 }}>
                <input type="checkbox" checked={w.keep} onChange={e => updateWatchItem(i, 'keep', e.target.checked)}
                  className="w-4 h-4 accent-[#0D4F3C]" />
                <input value={w.name} onChange={e => updateWatchItem(i, 'name', e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm font-semibold text-[#1a1a1a]" />
                <div className="text-left text-[10px] text-[#0D4F3C]/70 whitespace-nowrap">
                  <div>{w.count}× · {w.minPrice} ر.س</div>
                </div>
              </label>
            ))}
          </div>

          <button onClick={confirmWatchList}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98"
            style={{ background: '#0D4F3C', color: '#F5EFE6', boxShadow: '0 4px 16px -4px rgba(13, 79, 60, 0.5)' }}>
            <Save size={14} /> احفظ قائمة المراقبة
          </button>
        </div>
      )}
    </div>
  );
}

function DealCalculator({ settings }) {
  const [type, setType] = useState('bogo');
  const [vals, setVals] = useState({ buy: 2, free: 1, percent: 30, originalPrice: 10, bundlePrice: 25, quantity: 3, distance: 10, savings: 30 });
  const set = (k, v) => setVals(p => ({ ...p, [k]: +v || 0 }));

  let real = 0;
  if (type === 'bogo') real = calcRealDiscount('bogo', vals);
  if (type === 'percent') real = vals.percent;
  if (type === 'bundle') real = calcRealDiscount('bundle', vals);

  const trip = calcTripROI(vals.savings, vals.distance, settings);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white" style={{ boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.15)' }}>
        <div className="text-xs font-bold text-[#0D4F3C] mb-3 flex items-center gap-1.5">
          <Calculator size={13} /> رياضيات العروض الحقيقية
        </div>
        <div className="flex gap-1.5 mb-3 p-1 rounded-xl" style={{ background: 'rgba(13, 79, 60, 0.06)' }}>
          {[{id:'bogo',label:'اشتر X+Y'},{id:'percent',label:'خصم %'},{id:'bundle',label:'باقة'}].map(o => (
            <button key={o.id} onClick={() => setType(o.id)} className="flex-1 py-1.5 text-[10px] font-semibold rounded-lg"
              style={type===o.id?{background:'#0D4F3C',color:'#fff'}:{color:'#0D4F3C'}}>{o.label}</button>
          ))}
        </div>
        {type === 'bogo' && (
          <div className="grid grid-cols-2 gap-2">
            <FieldNum label="اشترِ" value={vals.buy} onChange={v => set('buy', v)} />
            <FieldNum label="مجاني" value={vals.free} onChange={v => set('free', v)} />
          </div>
        )}
        {type === 'percent' && (
          <FieldNum label="نسبة الخصم %" value={vals.percent} onChange={v => set('percent', v)} />
        )}
        {type === 'bundle' && (
          <div className="grid grid-cols-3 gap-2">
            <FieldNum label="السعر الأصلي" value={vals.originalPrice} onChange={v => set('originalPrice', v)} />
            <FieldNum label="سعر الباقة" value={vals.bundlePrice} onChange={v => set('bundlePrice', v)} />
            <FieldNum label="عدد الباقة" value={vals.quantity} onChange={v => set('quantity', v)} />
          </div>
        )}
        <div className="mt-4 p-3 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #D4A574, #B8884F)' }}>
          <div className="text-white/80 text-[10px] font-semibold">الخصم الحقيقي</div>
          <div className="text-white text-3xl font-bold">{real.toFixed(1)}%</div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white" style={{ boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.15)' }}>
        <div className="text-xs font-bold text-[#0D4F3C] mb-3 flex items-center gap-1.5">
          ⛽ هل يستاهل أروح المتجر؟
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FieldNum label="المسافة (كم)" value={vals.distance} onChange={v => set('distance', v)} />
          <FieldNum label="التوفير المتوقع (ر.س)" value={vals.savings} onChange={v => set('savings', v)} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg text-center" style={{ background: 'rgba(13, 79, 60, 0.06)' }}>
            <div className="text-[10px] text-[#0D4F3C]/60">تكلفة الوقود</div>
            <div className="font-bold text-[#0D4F3C]">{trip.fuelCost.toFixed(1)} ر.س</div>
          </div>
          <div className="p-2.5 rounded-lg text-center" style={{ background: trip.worthIt ? 'rgba(13, 79, 60, 0.15)' : 'rgba(139, 58, 58, 0.1)' }}>
            <div className="text-[10px] text-[#0D4F3C]/60">صافي التوفير</div>
            <div className="font-bold" style={{ color: trip.worthIt ? '#0D4F3C' : '#8B3A3A' }}>{trip.netSavings.toFixed(1)} ر.س</div>
          </div>
        </div>
        <div className="mt-2 text-center text-xs font-bold" style={{ color: trip.worthIt ? '#0D4F3C' : '#8B3A3A' }}>
          {trip.worthIt ? '✓ يستاهل الذهاب' : '✗ التوفير ضعيف، فضّل اللي قريب'}
        </div>
      </div>
    </div>
  );
}

function FieldNum({ label, value, onChange }) {
  return (
    <div>
      <div className="text-[10px] text-[#0D4F3C]/70 font-semibold mb-1">{label}</div>
      <input type="number" value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm font-semibold outline-none text-center"
        style={{ background: 'rgba(13, 79, 60, 0.06)', color: '#0D4F3C' }} />
    </div>
  );
}

// ============ BOOK TAB ============
function BookTab({ data, update }) {
  const [search, setSearch] = useState('');
  const [view, setView] = useState('watch');
  const entries = Object.entries(data.priceBook).sort((a, b) => b[1].prices.length - a[1].prices.length);
  const filtered = search ? entries.filter(([k, v]) => v.name.includes(search)) : entries;

  const remove = async (key) => {
    const nb = { ...data.priceBook };
    delete nb[key];
    await update({ priceBook: nb });
  };

  return (
    <div className="pt-4 space-y-3">
      <div className="flex gap-1 p-1 rounded-2xl overflow-x-auto" style={{ background: 'rgba(13, 79, 60, 0.08)', scrollbarWidth: 'none' }}>
        <button onClick={() => setView('watch')} className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap px-2"
          style={view==='watch'?{background:'#FFFFFF',color:'#0D4F3C',boxShadow:'0 1px 4px -1px rgba(13,79,60,0.15)'}:{color:'#0D4F3C',opacity:0.6}}>
          <Star size={12} /> مراقبة ({data.watchList.length})
        </button>
        <button onClick={() => setView('all')} className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap px-2"
          style={view==='all'?{background:'#FFFFFF',color:'#0D4F3C',boxShadow:'0 1px 4px -1px rgba(13,79,60,0.15)'}:{color:'#0D4F3C',opacity:0.6}}>
          <BookOpen size={12} /> الكل ({entries.length})
        </button>
        <button onClick={() => setView('inflation')} className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap px-2"
          style={view==='inflation'?{background:'#FFFFFF',color:'#0D4F3C',boxShadow:'0 1px 4px -1px rgba(13,79,60,0.15)'}:{color:'#0D4F3C',opacity:0.6}}>
          <TrendingUp size={12} /> التضخم
        </button>
      </div>

      {view === 'inflation' && <InflationCard priceBook={data.priceBook} />}

      {view === 'watch' && (
        <div className="space-y-2">
          {data.watchList.length === 0 ? (
            <div className="pt-8 text-center">
              <Star size={40} className="mx-auto text-[#0D4F3C]/30 mb-2" />
              <div className="font-bold text-[#0D4F3C] text-sm mb-1">قائمة المراقبة فارغة</div>
              <div className="text-xs text-[#0D4F3C]/60 px-8 leading-relaxed">
                اذهب إلى "مسح" → "فواتير" وارفع فواتير الشهر الماضي. سأبني لك قائمة بأهم منتجاتك.
              </div>
            </div>
          ) : (
            <>
              <div className="text-[11px] text-[#0D4F3C]/60 px-1 leading-relaxed">
                ⭐ هذي المنتجات الـ{data.watchList.length} اللي تشتريها أكثر شي. أي نشرة تمسحها، سأنبهك إذا واحد منها نزل لسعر أرضي.
              </div>
              {data.watchList.map((w, i) => (
                <div key={i} className="p-3 rounded-xl bg-white" style={{ boxShadow: '0 1px 4px -1px rgba(13,79,60,0.1)', borderRight: '3px solid #D4A574' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-[#1a1a1a]">{w.name}</div>
                      <div className="text-[10px] text-[#0D4F3C]/60 mt-0.5">اشتريته {w.count} مرة · في {w.storeCount} متجر</div>
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] text-[#0D4F3C]/60">أرخص سعر دفعته</div>
                      <div className="font-bold text-[#0D4F3C]">{w.minPrice} ر.س</div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {view === 'all' && (
        <>
          <div className="relative">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0D4F3C]/40" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث في كتاب أسعارك..."
              className="w-full pr-9 pl-3 py-2.5 rounded-xl text-sm bg-white outline-none"
              style={{ boxShadow: '0 1px 4px -2px rgba(13, 79, 60, 0.1)' }} />
          </div>
          {entries.length === 0 ? (
            <div className="pt-8 text-center">
              <BookOpen size={40} className="mx-auto text-[#0D4F3C]/30 mb-2" />
              <div className="font-bold text-[#0D4F3C] text-sm mb-1">كتابك فاضي</div>
              <div className="text-xs text-[#0D4F3C]/60 px-8 leading-relaxed">ارفع فاتورة أو نشرة وستبدأ تتراكم بياناتك</div>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(([key, item]) => {
                const latest = item.prices[0];
                const cheapest = item.prices.find(p => p.price === item.floorPrice);
                const prediction = predictPrice(item.prices);
                const predColors = {
                  buy_now: { bg: 'rgba(13, 79, 60, 0.15)',  text: '#0D4F3C', label: 'اشترِ الآن' },
                  good:    { bg: 'rgba(13, 79, 60, 0.10)',  text: '#1a6b54', label: 'سعر جيد' },
                  okay:    { bg: 'rgba(212, 165, 116, 0.2)', text: '#B8884F', label: 'متوسط' },
                  wait:    { bg: 'rgba(139, 58, 58, 0.15)',  text: '#8B3A3A', label: 'انتظر' },
                  stable:  { bg: 'rgba(13, 79, 60, 0.08)',  text: '#0D4F3C', label: 'مستقر' },
                  unknown: { bg: 'rgba(13, 79, 60, 0.05)',  text: '#0D4F3C/60', label: '—' }
                };
                const pc = predColors[prediction.recommendation];
                return (
                  <div key={key} className="p-3.5 rounded-2xl bg-white" style={{ boxShadow: '0 1px 8px -2px rgba(13, 79, 60, 0.1)' }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-bold text-sm text-[#1a1a1a] flex-1">{item.name}</div>
                      <button onClick={() => remove(key)} className="text-[#0D4F3C]/30 p-0.5"><Trash2 size={13} /></button>
                    </div>
                    {/* Two-floor display: fair (regular) + promo separately */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div className="p-2 rounded-lg" style={{ background: 'rgba(13, 79, 60, 0.06)' }}>
                        <div className="text-[10px] text-[#0D4F3C]/60 mb-0.5 flex items-center gap-1">
                          <TrendingDown size={10} /> سعر عادي أرضي
                        </div>
                        <div className="font-bold text-[#0D4F3C]">
                          {item.fairFloorPrice != null ? `${item.fairFloorPrice} ر.س` : '—'}
                        </div>
                        {item.fairFloorPrice != null && (() => {
                          const fr = getRegularPrices(item.prices);
                          const ch = fr.length > 0 ? fr.reduce((m, x) => x.price < m.price ? x : m) : null;
                          return ch ? <div className="text-[10px] text-[#0D4F3C]/50">{ch.store}</div> : null;
                        })()}
                      </div>
                      <div className="p-2 rounded-lg" style={{ background: 'rgba(212, 165, 116, 0.15)' }}>
                        <div className="text-[10px] text-[#0D4F3C]/60 mb-0.5">آخر سعر</div>
                        <div className="font-bold text-[#1a1a1a] flex items-center gap-1">
                          {latest.price} ر.س
                          {latest.wasPromotion && <span className="bg-yellow-200 text-yellow-900 px-1 rounded text-[9px]">عرض</span>}
                        </div>
                        <div className="text-[10px] text-[#0D4F3C]/50">{latest.store} · {latest.date}</div>
                      </div>
                    </div>

                    {/* Promo floor note — only shown if different from fair floor */}
                    {item.promoFloorPrice != null && item.promoFloorPrice !== item.fairFloorPrice && (
                      <div className="mb-2 p-2 rounded-lg text-[11px] flex items-center gap-1.5" style={{ background: 'rgba(212, 165, 116, 0.1)' }}>
                        <span className="text-sm">🎯</span>
                        <span className="text-[#8B6914]">
                          أقل عرض مؤقت شفته: <strong>{item.promoFloorPrice} ر.س</strong>
                          <span className="text-[10px] text-[#8B6914]/70"> (احفظه كمرجع للعرض الجاي)</span>
                        </span>
                      </div>
                    )}

                    {/* Price prediction */}
                    {prediction.recommendation !== 'unknown' && (
                      <div className="p-2 rounded-lg flex items-center gap-2" style={{ background: pc.bg }}>
                        <Sparkles size={11} style={{ color: pc.text }} />
                        <div className="flex-1 text-[11px] leading-snug" style={{ color: pc.text }}>
                          {prediction.reason}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============ HELPER PAGE (standalone — opens from shared link) ============
// "العاملة" mode: each tap sends WhatsApp to the wife instantly, with a smart link to review
function HelperPage({ payload }) {
  const { items = [], wifeNumber = '', husbandNumber = '', ownerName = 'البيت' } = payload;
  const [tappedIds, setTappedIds] = useState([]);

  const sendToWife = (item) => {
    const num = (wifeNumber || '').replace(/\D/g, '');

    // Build a review link for the wife — it will open a "review screen"
    // The link includes ALL items + which one was tapped + husband number for forwarding
    const reviewPayload = {
      mode: 'review',
      tappedItem: { id: item.id, name: item.name, image: item.image },
      allItems: items.map(it => ({ id: it.id, name: it.name, image: it.image })),
      husbandNumber,
      ownerName
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(reviewPayload))));
    const reviewUrl = `${window.location.origin}${window.location.pathname}#review=${encoded}`;

    const msg = encodeURIComponent(
      `🛒 خلص: *${item.name}*\n\n` +
      `للمراجعة وإضافة منتجات أخرى:\n${reviewUrl}\n\n` +
      `— ${ownerName}`
    );

    if (num) {
      window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    }

    // Visual feedback
    setTappedIds(p => [...p, item.id]);
    setTimeout(() => setTappedIds(p => p.filter(id => id !== item.id)), 4000);
  };

  return (
    <div dir="rtl" className="min-h-screen" style={{
      background: 'linear-gradient(180deg, #F5EFE6 0%, #EDE4D3 100%)',
      fontFamily: '"IBM Plex Sans Arabic", "Tajawal", system-ui, sans-serif'
    }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Reem+Kufi:wght@500;600;700&display=swap" rel="stylesheet" />

      {/* Big simple header */}
      <header className="px-5 pt-6 pb-4 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
          style={{ background: '#0D4F3C', boxShadow: '0 6px 20px -6px rgba(13, 79, 60, 0.5)' }}>
          <Heart size={26} className="text-white" />
        </div>
        <h1 style={{ fontFamily: 'Reem Kufi, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#0D4F3C' }}>
          منتجات {ownerName}
        </h1>
        <p className="text-xs text-[#0D4F3C]/70 mt-1">اضغط على صورة الشيء اللي خلص</p>
      </header>

      <main className="px-4 pb-20">
        {items.length === 0 ? (
          <div className="pt-8 text-center text-sm text-[#0D4F3C]/60">ما فيه منتجات</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map(item => {
              const isTapped = tappedIds.includes(item.id);
              return (
                <button key={item.id} onClick={() => sendToWife(item)}
                  className="aspect-square rounded-2xl overflow-hidden relative transition-all active:scale-95"
                  style={{
                    background: '#FFFFFF',
                    boxShadow: isTapped
                      ? '0 0 0 4px #25D366, 0 4px 16px -4px rgba(37, 211, 102, 0.5)'
                      : '0 2px 12px -4px rgba(13, 79, 60, 0.2)'
                  }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(13, 79, 60, 0.08)' }}>
                      <Package size={36} className="text-[#0D4F3C]/30" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }}>
                    <div className="text-white text-sm font-bold text-center leading-tight">{item.name}</div>
                  </div>
                  {isTapped && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center"
                      style={{ background: 'rgba(37, 211, 102, 0.92)' }}>
                      <Check size={56} strokeWidth={3} className="text-white mb-2" />
                      <div className="text-white text-base font-bold">تم الإرسال!</div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 rounded-2xl text-center" style={{ background: 'rgba(212, 165, 116, 0.15)' }}>
          <MessageCircle size={20} className="mx-auto text-[#B8884F] mb-2" />
          <div className="text-xs text-[#1a1a1a]/80 leading-relaxed">
            لما تضغطين على صورة، يفتح <strong>واتساب</strong> برسالة جاهزة للزوجة.<br />
            بس اضغطي <strong>إرسال</strong> في واتساب.
          </div>
        </div>
      </main>
    </div>
  );
}

// ============ WIFE REVIEW PAGE (standalone — opens from WhatsApp link) ============
// "الزوجة" mode: review the maid's request, add more items, decide to forward to husband or buy herself
function WifeReviewPage({ payload }) {
  const { tappedItem, allItems = [], husbandNumber = '', ownerName = 'البيت' } = payload;

  // Items the wife has confirmed (starts with the maid's tapped item)
  const [confirmedIds, setConfirmedIds] = useState([tappedItem?.id].filter(Boolean));
  const [notes, setNotes] = useState({});
  const [showNotes, setShowNotes] = useState({});

  const toggleConfirm = (itemId) => {
    setConfirmedIds(p => p.includes(itemId) ? p.filter(id => id !== itemId) : [...p, itemId]);
  };

  const setNote = (itemId, text) => setNotes(p => ({ ...p, [itemId]: text }));

  const buildList = () => {
    const lines = [`🛒 *قائمة مشتريات ${ownerName}*`, ''];
    const confirmed = allItems.filter(it => confirmedIds.includes(it.id));
    confirmed.forEach((it, i) => {
      const note = notes[it.id]?.trim();
      lines.push(`${i + 1}. ${it.name}${note ? ` _(${note})_` : ''}`);
    });
    lines.push('', `📊 المجموع: ${confirmed.length} منتج`);
    lines.push('— من تطبيق مَرْكَز المقاضي');
    return lines.join('\n');
  };

  const sendToHusband = () => {
    if (confirmedIds.length === 0) {
      alert('اختاري منتج واحد على الأقل');
      return;
    }
    const num = (husbandNumber || '').replace(/\D/g, '');
    const msg = encodeURIComponent(buildList());
    if (num) {
      window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    }
  };

  const buyMyself = async () => {
    if (confirmedIds.length === 0) {
      alert('اختاري منتج واحد على الأقل');
      return;
    }
    const text = buildList();
    try {
      await navigator.clipboard.writeText(text);
      alert('✓ نُسخت القائمة! استخدميها وأنت تتسوّقين.');
    } catch {
      alert(text);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen" style={{
      background: 'linear-gradient(180deg, #F5EFE6 0%, #EDE4D3 100%)',
      fontFamily: '"IBM Plex Sans Arabic", "Tajawal", system-ui, sans-serif'
    }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Reem+Kufi:wght@500;600;700&display=swap" rel="stylesheet" />

      <header className="px-5 pt-6 pb-4">
        <div className="text-center mb-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-2"
            style={{ background: '#D4A574', boxShadow: '0 4px 16px -4px rgba(212, 165, 116, 0.5)' }}>
            <CheckCircle2 size={22} className="text-white" />
          </div>
          <h1 style={{ fontFamily: 'Reem Kufi, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: '#0D4F3C' }}>
            مراجعة الناقص
          </h1>
          <p className="text-xs text-[#0D4F3C]/70 mt-1">
            العاملة قالت إن <strong>{tappedItem?.name || 'منتج'}</strong> خلص. اختاري المنتجات المؤكدة:
          </p>
        </div>
      </header>

      <main className="px-4 pb-32">
        <div className="space-y-2">
          {allItems.map(item => {
            const isConfirmed = confirmedIds.includes(item.id);
            const wasJustTapped = item.id === tappedItem?.id;
            return (
              <div key={item.id}
                className="rounded-2xl bg-white overflow-hidden transition-all"
                style={{
                  boxShadow: isConfirmed
                    ? '0 0 0 2px #0D4F3C, 0 2px 12px -4px rgba(13, 79, 60, 0.2)'
                    : '0 1px 8px -2px rgba(13, 79, 60, 0.1)'
                }}>
                <button onClick={() => toggleConfirm(item.id)}
                  className="w-full p-3 flex items-center gap-3 transition-all active:bg-black/5">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(13, 79, 60, 0.08)' }}>
                      <Package size={24} className="text-[#0D4F3C]/40" />
                    </div>
                  )}
                  <div className="flex-1 text-right min-w-0">
                    <div className="font-bold text-sm text-[#1a1a1a]">{item.name}</div>
                    {wasJustTapped && (
                      <div className="text-[10px] text-[#B8884F] font-bold mt-0.5">✨ العاملة ضغطت عليه</div>
                    )}
                    {notes[item.id] && (
                      <div className="text-[11px] text-[#0D4F3C]/70 mt-1 italic">📝 {notes[item.id]}</div>
                    )}
                  </div>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: isConfirmed ? '#0D4F3C' : 'rgba(13, 79, 60, 0.1)' }}>
                    {isConfirmed && <Check size={16} className="text-white" strokeWidth={3} />}
                  </div>
                </button>

                {isConfirmed && (
                  <div className="px-3 pb-3 -mt-1">
                    {showNotes[item.id] ? (
                      <input value={notes[item.id] || ''}
                        onChange={e => setNote(item.id, e.target.value)}
                        onBlur={() => { if (!notes[item.id]) setShowNotes(p => ({ ...p, [item.id]: false })); }}
                        placeholder="مثلاً: نوع معين، حجم، براند..."
                        autoFocus
                        className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                        style={{ background: 'rgba(13, 79, 60, 0.06)', color: '#0D4F3C' }} />
                    ) : (
                      <button onClick={() => setShowNotes(p => ({ ...p, [item.id]: true }))}
                        className="text-[11px] text-[#0D4F3C]/60 font-semibold flex items-center gap-1">
                        <Plus size={10} /> إضافة ملاحظة (نوع، براند...)
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 rounded-xl text-center" style={{ background: 'rgba(13, 79, 60, 0.08)' }}>
          <div className="text-xs text-[#0D4F3C]/70">
            ✓ المؤكّد: <strong className="text-[#0D4F3C]">{confirmedIds.length}</strong> من أصل {allItems.length}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 z-50" style={{
        background: 'linear-gradient(to top, #F5EFE6 70%, transparent)'
      }}>
        <div className="space-y-2">
          <button onClick={sendToHusband} disabled={confirmedIds.length === 0}
            className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: '#25D366', color: '#fff', boxShadow: '0 6px 20px -6px rgba(37, 211, 102, 0.5)' }}>
            <MessageCircle size={16} />
            أرسلي للزوج عبر واتساب ({confirmedIds.length})
          </button>
          <button onClick={buyMyself} disabled={confirmedIds.length === 0}
            className="w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'rgba(13, 79, 60, 0.1)', color: '#0D4F3C' }}>
            <ShoppingCart size={14} />
            سأشتري بنفسي (نسخ القائمة)
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ SHARE SHEET — generate link and QR for helper ============
function ShareWithHelperSheet({ data, onClose }) {
  const [ownerName, setOwnerName] = useState('البيت');
  const [stripImages, setStripImages] = useState(false);
  const items = data.householdItems || [];
  const wifeNumber    = data.settings.whatsappNumber || '';
  const husbandNumber = data.settings.husbandNumber || '';

  // Build payload for URL — passed to Helper page (used by maid)
  const payload = {
    items: items.map(it => ({
      id: it.id,
      name: it.name,
      image: stripImages ? null : it.image
    })),
    wifeNumber,        // العاملة ترسل لرقم الزوجة
    husbandNumber,     // الزوجة ترسل لرقم الزوج (يدخل في الرابط الذكي)
    ownerName
  };
  const json = JSON.stringify(payload);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#helper=${encoded}`
    : '';
  const urlSize = url.length;

  const qrSize = 280;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(url)}&margin=10`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert('تم نسخ الرابط ✓');
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('تم نسخ الرابط ✓');
    }
  };

  const shareLink = async () => {
    const text = `افتحي هذا الرابط على الآيباد، وكل ما يخلص شي اضغطي عليه:\n\n${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'منتجات البيت', text, url });
      } catch (e) { /* cancelled */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div onClick={e => e.stopPropagation()} className="absolute bottom-0 left-0 right-0 max-h-[92vh] overflow-y-auto rounded-t-3xl p-5"
        style={{ background: '#F5EFE6' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-[#0D4F3C]" />
            <h2 className="font-bold text-lg text-[#0D4F3C]" style={{ fontFamily: 'Reem Kufi, sans-serif' }}>
              مشاركة شاشة العاملة
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(13,79,60,0.1)' }}>
            <X size={16} className="text-[#0D4F3C]" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white text-center" style={{ boxShadow: '0 1px 8px -2px rgba(13, 79, 60, 0.1)' }}>
            <Package size={32} className="mx-auto text-[#0D4F3C]/30 mb-2" />
            <div className="text-sm font-bold text-[#0D4F3C] mb-1">ما فيه منتجات للمشاركة</div>
            <div className="text-xs text-[#0D4F3C]/60">أضف منتجات أولاً من تبويب "خلص"</div>
          </div>
        ) : (
          <>
            {/* Setup status */}
            <div className="p-3 rounded-xl mb-3 space-y-1.5" style={{
              background: (!wifeNumber || !husbandNumber) ? 'rgba(212, 165, 116, 0.2)' : 'rgba(13, 79, 60, 0.05)'
            }}>
              <div className="text-xs font-bold text-[#0D4F3C] mb-1">الإعداد:</div>
              <div className="flex items-center gap-2 text-[11px]">
                {wifeNumber ? <Check size={12} className="text-[#0D4F3C]" /> : <AlertCircle size={12} className="text-[#B8884F]" />}
                <span className="text-[#1a1a1a]/80">رقم الزوجة (العاملة ترسل له): <strong>{wifeNumber || '— غير مضبوط —'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                {husbandNumber ? <Check size={12} className="text-[#0D4F3C]" /> : <AlertCircle size={12} className="text-[#B8884F]" />}
                <span className="text-[#1a1a1a]/80">رقم الزوج (الزوجة ترسل له): <strong>{husbandNumber || '— غير مضبوط —'}</strong></span>
              </div>
              {(!wifeNumber || !husbandNumber) && (
                <div className="text-[10px] text-[#B8884F] font-semibold mt-2">
                  ⚠️ يفضّل تضبط الأرقام من ⚙️ الإعدادات قبل المشاركة
                </div>
              )}
            </div>

            {/* Owner name */}
            <div className="p-4 rounded-2xl bg-white mb-3" style={{ boxShadow: '0 1px 8px -2px rgba(13, 79, 60, 0.1)' }}>
              <label className="block text-xs font-bold text-[#0D4F3C] mb-2">اسم البيت (يظهر في الرسائل)</label>
              <input value={ownerName} onChange={e => setOwnerName(e.target.value)}
                placeholder="البيت"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'rgba(13, 79, 60, 0.06)', color: '#0D4F3C' }} />
            </div>

            {/* QR Code */}
            <div className="p-5 rounded-2xl bg-white mb-3 text-center" style={{ boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.15)' }}>
              <div className="text-xs font-bold text-[#0D4F3C] mb-3 flex items-center justify-center gap-1.5">
                <QrCode size={13} /> امسحي هذا الرمز من الآيباد (المطبخ)
              </div>
              <div className="inline-block p-3 bg-white rounded-2xl" style={{ border: '2px solid #0D4F3C' }}>
                <img src={qrUrl} alt="QR Code" width={qrSize} height={qrSize} style={{ display: 'block' }} />
              </div>
              <div className="text-[10px] text-[#0D4F3C]/60 mt-3 leading-relaxed">
                افتح كاميرا الآيباد → وجّهها للرمز → اضغط الإشعار اللي يطلع
              </div>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button onClick={shareLink}
                className="py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: '#25D366', color: '#fff' }}>
                <MessageCircle size={14} /> مشاركة بواتساب
              </button>
              <button onClick={copyLink}
                className="py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: '#0D4F3C', color: '#fff' }}>
                <Copy size={14} /> نسخ الرابط
              </button>
            </div>

            {/* Image strip option */}
            <div className="p-3 rounded-xl bg-white mb-3" style={{ boxShadow: '0 1px 4px -1px rgba(13, 79, 60, 0.1)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#0D4F3C]">رابط بدون صور</div>
                  <div className="text-[10px] text-[#0D4F3C]/60">للروابط الأقصر (أيقونات بدلاً من الصور)</div>
                </div>
                <button onClick={() => setStripImages(!stripImages)} className="w-12 h-6 rounded-full transition-all relative"
                  style={{ background: stripImages ? '#0D4F3C' : 'rgba(13,79,60,0.2)' }}>
                  <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
                    style={{ [stripImages ? 'left' : 'right']: '2px' }} />
                </button>
              </div>
            </div>

            {/* URL info */}
            <div className="text-[10px] text-[#0D4F3C]/60 text-center leading-relaxed">
              📊 حجم الرابط: {(urlSize / 1024).toFixed(1)} كيلوبايت ({items.length} منتج
              {!stripImages && items.some(it => it.image) ? ' بالصور' : ' بدون صور'})
              {urlSize > 8000 && (
                <div className="text-[#8B3A3A] font-bold mt-1">⚠️ الرابط طويل، فعّل "بدون صور" لمزيد من المنتجات</div>
              )}
            </div>

            {/* How it works - the new flow */}
            <div className="mt-4 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, #FFF8EC 0%, #F5EFE6 100%)', border: '1px solid rgba(212, 165, 116, 0.3)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Smartphone size={14} className="text-[#B8884F]" />
                <div className="font-bold text-sm text-[#0D4F3C]">التدفق الكامل (3 أجهزة)</div>
              </div>
              <ol className="text-[11px] text-[#1a1a1a]/80 leading-relaxed space-y-2 mr-1">
                <li><strong className="text-[#0D4F3C]">1️⃣ الآيباد (المطبخ):</strong> العاملة تضغط على صورة → يفتح واتساب لرقم الزوجة فوراً</li>
                <li><strong className="text-[#D4A574]">2️⃣ جوال الزوجة:</strong> تستلم الرسالة، تفتح الرابط الذكي، تراجع وتأكد المنتجات + تضيف ملاحظات</li>
                <li><strong className="text-[#1a6b54]">3️⃣ الزوجة تقرر:</strong>
                  <br />• <strong>أرسلي للزوج</strong> — يفتح واتساب على رقم الزوج بقائمة منظّمة
                  <br />• أو <strong>أشتري بنفسي</strong> — تنسخ القائمة وتروح المتجر</li>
                <li><strong className="text-[#0D4F3C]">4️⃣ الزوج:</strong> يستلم القائمة المؤكدة فقط (مو كل ضغطة من العاملة)</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============ HOUSEHOLD ITEMS TAB ("خلص!" - Photo grid for household helper) ============
function HouseholdTab({ data, update }) {
  const [view, setView] = useState('grid');       // grid | manage | alerts
  const [adding, setAdding] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const items = data.householdItems || [];
  const alerts = data.pendingAlerts || [];

  // When household helper taps a photo
  const markFinished = async (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Check if already in pending alerts (increment count instead of duplicating)
    const existingIdx = alerts.findIndex(a => a.itemId === itemId);
    let newAlerts;
    if (existingIdx >= 0) {
      newAlerts = alerts.map((a, i) => i === existingIdx
        ? { ...a, count: a.count + 1, lastTapped: Date.now() }
        : a);
    } else {
      newAlerts = [...alerts, {
        itemId, name: item.name, image: item.image,
        count: 1, firstTapped: Date.now(), lastTapped: Date.now()
      }];
    }
    await update({ pendingAlerts: newAlerts });

    // In-app notification
    if (data.settings.notificationsEnabled) {
      sendNotif(`🛒 خلص: ${item.name}`, `اضغط الجرس لرؤية كل اللي خلص`);
    }
  };

  if (view === 'manage' || adding) {
    return <HouseholdManage data={data} update={update}
      onClose={() => { setView('grid'); setAdding(false); }} startAdding={adding} />;
  }

  if (view === 'alerts' || alerts.length > 0 && view === 'grid' && items.length > 0) {
    // Auto-show alerts when there are pending ones (but only if grid was the implicit choice)
    // Don't auto-redirect; show inline banner instead
  }

  return (
    <div className="pt-4">
      {/* Alerts banner */}
      {alerts.length > 0 && (
        <AlertsBanner alerts={alerts} settings={data.settings}
          onClear={async () => await update({ pendingAlerts: [] })}
          onClearOne={async (id) => await update({ pendingAlerts: alerts.filter(a => a.itemId !== id) })} />
      )}

      {/* Header with manage button */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="font-bold text-[#0D4F3C]" style={{ fontFamily: 'Reem Kufi, sans-serif', fontSize: '1.2rem' }}>
            وش خلص؟
          </h2>
          <p className="text-[10px] text-[#0D4F3C]/60 mt-0.5">اضغط على صورة المنتج اللي خلص</p>
        </div>
        <div className="flex gap-1.5">
          {items.length > 0 && (
            <button onClick={() => setShowShare(true)}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1"
              style={{ background: '#25D366', color: '#fff' }}>
              <Share2 size={11} /> مشاركة
            </button>
          )}
          <button onClick={() => setView('manage')}
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1"
            style={{ background: 'rgba(13, 79, 60, 0.08)', color: '#0D4F3C' }}>
            <Edit3 size={11} /> إدارة
          </button>
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="pt-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white mx-auto mb-3 flex items-center justify-center"
            style={{ boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.15)' }}>
            <ImageIcon size={32} className="text-[#0D4F3C]/30" />
          </div>
          <div className="font-bold text-[#0D4F3C] text-sm mb-1">ما فيه منتجات بعد</div>
          <div className="text-xs text-[#0D4F3C]/60 px-8 leading-relaxed mb-4">
            أضف صور للمنتجات اللي تخلص بسرعة (توست، حليب، خبز...). العاملة بتضغط على الصورة لما يخلص الشي ويوصلك تنبيه.
          </div>
          <button onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm"
            style={{ background: '#0D4F3C', color: '#F5EFE6' }}>
            <Plus size={14} /> أضف أول منتج
          </button>
        </div>
      ) : (
        <>
          {/* Photo grid */}
          <div className="grid grid-cols-2 gap-3">
            {items.map(item => (
              <PhotoCard key={item.id} item={item} onTap={() => markFinished(item.id)}
                isPending={alerts.some(a => a.itemId === item.id)} />
            ))}
            {/* Add button as last grid item */}
            <button onClick={() => setAdding(true)}
              className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-all active:scale-95"
              style={{
                background: 'rgba(13, 79, 60, 0.05)',
                borderColor: 'rgba(13, 79, 60, 0.25)',
                color: '#0D4F3C'
              }}>
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <Plus size={20} />
              </div>
              <div className="text-xs font-semibold">أضف منتج</div>
            </button>
          </div>

          {/* Helper note */}
          <div className="mt-4 p-3 rounded-xl text-[11px] text-[#0D4F3C]/70 leading-relaxed flex items-start gap-2"
            style={{ background: 'rgba(212, 165, 116, 0.15)' }}>
            <Lightbulb size={12} className="text-[#B8884F] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#B8884F]">للعاملة:</span> اضغط على صورة المنتج اللي خلص. ممكن تضغط أكثر من مرة لو محتاج كميتين.
            </div>
          </div>
        </>
      )}

      {showShare && <ShareWithHelperSheet data={data} onClose={() => setShowShare(false)} />}
    </div>
  );
}

// ----- Photo Card (the big tappable image) -----
function PhotoCard({ item, onTap, isPending }) {
  const [tapped, setTapped] = useState(false);

  const handleTap = () => {
    setTapped(true);
    onTap();
    setTimeout(() => setTapped(false), 800);
  };

  return (
    <button onClick={handleTap}
      className="aspect-square rounded-2xl overflow-hidden relative transition-all active:scale-95"
      style={{
        background: '#FFFFFF',
        boxShadow: isPending
          ? '0 0 0 3px #D4A574, 0 4px 16px -4px rgba(212, 165, 116, 0.5)'
          : '0 2px 12px -4px rgba(13, 79, 60, 0.2)'
      }}>
      {/* Image */}
      {item.image ? (
        <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(13, 79, 60, 0.08)' }}>
          <Package size={32} className="text-[#0D4F3C]/30" />
        </div>
      )}

      {/* Name overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-2"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }}>
        <div className="text-white text-xs font-bold text-center leading-tight">{item.name}</div>
      </div>

      {/* Pending badge */}
      {isPending && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: '#D4A574', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
          <Check size={14} className="text-[#0D4F3C]" strokeWidth={3} />
        </div>
      )}

      {/* Tap feedback */}
      {tapped && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(13, 79, 60, 0.85)', animation: 'fadeOut 0.8s ease-out' }}>
          <div className="text-white text-center">
            <Check size={48} strokeWidth={3} className="mx-auto mb-1" />
            <div className="text-sm font-bold">تم!</div>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeOut { 0% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; } }`}</style>
    </button>
  );
}

// ----- Alerts Banner -----
function AlertsBanner({ alerts, settings, onClear, onClearOne }) {
  const [showDetails, setShowDetails] = useState(false);

  // Build WhatsApp message
  const buildMessage = () => {
    const lines = ['🛒 منتجات خلصت من البيت:', ''];
    alerts.forEach(a => {
      lines.push(`• ${a.name}${a.count > 1 ? ` (×${a.count})` : ''}`);
    });
    lines.push('', 'من تطبيق مَرْكَز المقاضي');
    return encodeURIComponent(lines.join('\n'));
  };

  const openWhatsApp = () => {
    const num = (settings.whatsappNumber || '').replace(/\D/g, '');
    if (num) {
      window.open(`https://wa.me/${num}?text=${buildMessage()}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${buildMessage()}`, '_blank');
    }
  };

  return (
    <div className="mb-4 rounded-2xl overflow-hidden" style={{
      background: 'linear-gradient(135deg, #8B3A3A 0%, #B85450 100%)',
      boxShadow: '0 4px 20px -4px rgba(139, 58, 58, 0.5)'
    }}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bell size={14} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">منتجات خلصت!</div>
              <div className="text-white/80 text-[11px]">{alerts.length} منتج بحاجة إلى شراء</div>
            </div>
          </div>
          <button onClick={() => setShowDetails(!showDetails)}
            className="text-white/80 text-[11px] font-semibold underline">
            {showDetails ? 'إخفاء' : 'تفاصيل'}
          </button>
        </div>

        {showDetails && (
          <div className="space-y-1.5 mb-3 mt-3 max-h-48 overflow-y-auto">
            {alerts.map(a => (
              <div key={a.itemId} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {a.image && <img src={a.image} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />}
                  <div className="text-white text-xs font-semibold truncate">{a.name}</div>
                  {a.count > 1 && (
                    <span className="text-[10px] px-1.5 rounded-full bg-[#D4A574] text-[#0D4F3C] font-bold">×{a.count}</span>
                  )}
                </div>
                <button onClick={() => onClearOne(a.itemId)} className="text-white/60 p-1">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={openWhatsApp}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all active:scale-98"
            style={{ background: '#25D366', color: '#fff' }}>
            <MessageCircle size={14} />
            إرسال واتساب
          </button>
          <button onClick={onClear}
            className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all active:scale-98"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            <Check size={12} /> اشتريتها
          </button>
        </div>
      </div>
    </div>
  );
}

// ----- Manage / Add household items -----
function HouseholdManage({ data, update, onClose, startAdding }) {
  const [adding, setAdding] = useState(startAdding);
  const items = data.householdItems || [];

  const removeItem = async (id) => {
    if (!confirm('حذف هذا المنتج من القائمة؟')) return;
    const newItems = items.filter(i => i.id !== id);
    const newAlerts = (data.pendingAlerts || []).filter(a => a.itemId !== id);
    await update({ householdItems: newItems, pendingAlerts: newAlerts });
  };

  if (adding) {
    return <AddHouseholdItem data={data} update={update}
      onClose={() => { setAdding(false); onClose(); }}
      onBack={() => setAdding(false)} />;
  }

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onClose} className="flex items-center gap-1 text-[#0D4F3C] font-semibold text-sm">
          <X size={16} /> إغلاق
        </button>
        <h2 className="font-bold text-[#0D4F3C]" style={{ fontFamily: 'Reem Kufi, sans-serif' }}>
          إدارة المنتجات
        </h2>
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold"
          style={{ background: '#0D4F3C', color: '#fff' }}>
          <Plus size={11} /> إضافة
        </button>
      </div>

      {items.length === 0 ? (
        <div className="pt-8 text-center text-xs text-[#0D4F3C]/60">
          ما فيه منتجات بعد
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="p-3 rounded-xl bg-white flex items-center gap-3"
              style={{ boxShadow: '0 1px 4px -1px rgba(13,79,60,0.1)' }}>
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ background: 'rgba(13, 79, 60, 0.08)' }}>
                  <Package size={20} className="text-[#0D4F3C]/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-[#1a1a1a]">{item.name}</div>
                <div className="text-[10px] text-[#0D4F3C]/60 mt-0.5">
                  أُضيف {new Date(item.createdAt).toLocaleDateString('ar-SA')}
                </div>
              </div>
              <button onClick={() => removeItem(item.id)} className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(139, 58, 58, 0.1)', color: '#8B3A3A' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ----- Add new household item (with photo upload OR camera capture) -----
function AddHouseholdItem({ data, update, onClose, onBack }) {
  const [name, setName] = useState('');
  const [image, setImage] = useState(null); // base64 data URL
  const [error, setError] = useState(null);
  const fileRef = useRef();
  const camRef = useRef();

  const handleFile = async (e, source) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to data URL and downscale for storage efficiency
    try {
      const dataUrl = await downscaleImage(file, 400);
      setImage(dataUrl);
      setError(null);
    } catch (err) {
      setError('فشل في معالجة الصورة');
    }
  };

  const save = async () => {
    if (!name.trim()) { setError('اكتب اسم المنتج'); return; }
    if (!image) { setError('أضف صورة للمنتج'); return; }

    const newItem = {
      id: 'h_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      name: name.trim(),
      image,
      createdAt: Date.now()
    };
    const newItems = [...(data.householdItems || []), newItem];
    await update({ householdItems: newItems });
    onBack();
  };

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1 text-[#0D4F3C] font-semibold text-sm">
          <X size={16} /> إلغاء
        </button>
        <h2 className="font-bold text-[#0D4F3C]" style={{ fontFamily: 'Reem Kufi, sans-serif' }}>
          منتج جديد
        </h2>
        <div className="w-12" />
      </div>

      {/* Image preview / picker */}
      <div className="mb-4">
        <div className="relative aspect-square rounded-2xl overflow-hidden mb-3"
          style={{ background: image ? 'transparent' : 'rgba(13, 79, 60, 0.05)', border: '2px dashed rgba(13, 79, 60, 0.25)' }}>
          {image ? (
            <>
              <img src={image} alt="معاينة" className="absolute inset-0 w-full h-full object-cover" />
              <button onClick={() => setImage(null)}
                className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                <X size={14} />
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#0D4F3C]/40">
              <ImageIcon size={48} className="mb-2" />
              <div className="text-xs">اختر طريقة لإضافة صورة</div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => camRef.current?.click()}
            className="py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-98"
            style={{ background: '#0D4F3C', color: '#F5EFE6' }}>
            <Camera size={16} /> صوّر بالكاميرا
          </button>
          <input ref={camRef} type="file" accept="image/*" capture="environment"
            onChange={(e) => handleFile(e, 'camera')} className="hidden" />

          <button onClick={() => fileRef.current?.click()}
            className="py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-98"
            style={{ background: 'rgba(13, 79, 60, 0.08)', color: '#0D4F3C' }}>
            <Upload size={16} /> من المعرض
          </button>
          <input ref={fileRef} type="file" accept="image/*"
            onChange={(e) => handleFile(e, 'gallery')} className="hidden" />
        </div>
      </div>

      {/* Name */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-[#0D4F3C] mb-2">اسم المنتج</label>
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="مثلاً: توست أبيض"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(13, 79, 60, 0.06)', color: '#0D4F3C' }} />
      </div>

      {error && <ErrorBox message={error} />}

      <button onClick={save}
        className="w-full mt-4 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
        style={{ background: '#0D4F3C', color: '#F5EFE6', boxShadow: '0 4px 16px -4px rgba(13, 79, 60, 0.5)' }}>
        <Save size={14} /> حفظ المنتج
      </button>
    </div>
  );
}

// Helper: downscale image to max width while keeping aspect ratio, return as data URL
async function downscaleImage(file, maxWidth) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        let w = img.width, h = img.height;
        if (w > maxWidth) { w = maxWidth; h = w / ratio; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============ INVENTORY TAB ============
function InventoryTab({ data, update }) {
  const [newItem, setNewItem] = useState('');
  const items = Object.entries(data.inventory);

  const add = async () => {
    if (!newItem.trim()) return;
    const key = normalizeProductName(newItem);
    const inv = { ...data.inventory };
    if (inv[key]) inv[key].quantity += 1;
    else inv[key] = { name: newItem, quantity: 1, lastUpdated: Date.now() };
    await update({ inventory: inv });
    setNewItem('');
  };

  const updateQty = async (key, delta) => {
    const inv = { ...data.inventory };
    if (!inv[key]) return;
    inv[key].quantity = Math.max(0, inv[key].quantity + delta);
    inv[key].lastUpdated = Date.now();
    if (inv[key].quantity === 0) delete inv[key];
    await update({ inventory: inv });
  };

  return (
    <div className="pt-4 space-y-4">
      <div className="p-4 rounded-2xl bg-white" style={{ boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.15)' }}>
        <div className="text-xs font-bold text-[#0D4F3C] mb-2 flex items-center gap-1.5">
          <Package size={13} /> مخزون البيت
        </div>
        <div className="text-[11px] text-[#0D4F3C]/70 mb-3 leading-relaxed">
          سجّل وش عندك في البيت، عشان ما تشتري مكرر. القائمة الذكية بتتجاهل المنتجات اللي مخزونك منها كافٍ.
        </div>
        <div className="flex gap-2">
          <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="مثلاً: أرز بسمتي 5 كيلو"
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(13, 79, 60, 0.06)' }} />
          <button onClick={add} className="px-4 rounded-xl font-bold text-sm flex items-center justify-center" style={{ background: '#0D4F3C', color: '#fff' }}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="pt-6 text-center">
          <Package size={40} className="mx-auto text-[#0D4F3C]/30 mb-2" />
          <div className="text-xs text-[#0D4F3C]/60 px-8 leading-relaxed">ابدأ بإضافة المنتجات اللي عندك في البيت حالياً</div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.sort((a,b) => b[1].lastUpdated - a[1].lastUpdated).map(([key, item]) => (
            <div key={key} className="p-3 rounded-xl bg-white flex items-center justify-between" style={{ boxShadow: '0 1px 4px -1px rgba(13,79,60,0.1)' }}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#1a1a1a]">{item.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(key, -1)} className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(139, 58, 58, 0.1)', color: '#8B3A3A' }}><Minus size={12} /></button>
                <div className="font-bold text-[#0D4F3C] min-w-[24px] text-center">{item.quantity}</div>
                <button onClick={() => updateQty(key, 1)} className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(13, 79, 60, 0.1)', color: '#0D4F3C' }}><Plus size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ WHATSAPP SUBSCRIPTIONS — get offers via WhatsApp channels ============
function WhatsAppSubscriptions({ setTab }) {
  const [showSearch, setShowSearch] = useState(false);

  // Saudi supermarkets with verified WhatsApp Business presence
  const STORES_WHATSAPP = [
    {
      name: 'كارفور',
      icon: '🛒',
      color: '#004E9F',
      searchTerm: 'Carrefour Saudi',
      verified: true,
      hint: 'يرسلون نشرات أسبوعية بالعروض',
      flyerUrl: 'https://www.carrefourksa.com/mafsau/ar/n/c/clp_carrefouroffers'
    },
    {
      name: 'لولو',
      icon: '🏬',
      color: '#E30613',
      searchTerm: 'LuLu Hypermarket KSA',
      verified: true,
      hint: 'مساعد "سالم" الذكي للعروض والمساعدة',
      flyerUrl: 'https://www.luluhypermarket.com/ar-sa/promotions'
    },
    {
      name: 'بنده',
      icon: '🐼',
      color: '#00A859',
      searchTerm: 'Panda Saudi Arabia',
      verified: true,
      hint: 'عروض هايبر بنده وبنده الأسبوعية',
      flyerUrl: 'https://panda.com.sa/ar-sa/offers'
    },
    {
      name: 'العثيم',
      icon: '🏪',
      color: '#E60012',
      searchTerm: 'Othaim Markets',
      verified: false,
      hint: 'عروض أسبوعية وعروض الطازج',
      flyerUrl: 'https://www.othaimmarkets.com.sa/ar/offers'
    },
    {
      name: 'التميمي',
      icon: '🥩',
      color: '#003B71',
      searchTerm: 'Tamimi Markets',
      verified: false,
      hint: 'عروض المنتجات الطازجة',
      flyerUrl: 'https://shop.tamimimarkets.com/ar/offers'
    },
    {
      name: 'الدانوب',
      icon: '🍞',
      color: '#D4A017',
      searchTerm: 'Danube Saudi',
      verified: false,
      hint: 'عروض المخبوزات والحلويات',
      flyerUrl: 'https://www.danubeco.com/ar/offers'
    }
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-[#0D4F3C]/70 tracking-wide flex items-center gap-1.5">
          <MessageCircle size={12} /> اشتراكات واتساب الرسمية
        </h2>
        <div className="text-[10px] text-[#25D366] font-bold">⚡ أسرع طريقة</div>
      </div>

      {/* Intro */}
      <div className="p-3 rounded-xl mb-3" style={{ background: 'rgba(37, 211, 102, 0.08)', border: '1px solid rgba(37, 211, 102, 0.2)' }}>
        <div className="text-xs text-[#1a1a1a]/85 leading-relaxed">
          معظم السوبرماركت السعودية عندها قنوات واتساب رسمية ترسل نشرات العروض مباشرة. <strong>تشترك مرة، تجيك العروض على واتساب، تأخذ سكرين شوت، ترفعها للتطبيق.</strong>
        </div>
      </div>

      {/* Stores grid */}
      <div className="space-y-2">
        {STORES_WHATSAPP.map(store => (
          <div key={store.name} className="p-3 rounded-2xl bg-white"
            style={{ boxShadow: '0 1px 8px -2px rgba(13, 79, 60, 0.1)', borderRight: `3px solid ${store.color}` }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl flex-shrink-0">{store.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <div className="font-bold text-sm text-[#1a1a1a]">{store.name}</div>
                  {store.verified && (
                    <span className="text-[9px] font-bold px-1.5 rounded-full flex items-center gap-0.5"
                      style={{ background: 'rgba(37, 211, 102, 0.15)', color: '#25D366' }}>
                      <Check size={8} strokeWidth={3} /> موثّق
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#0D4F3C]/70 mt-0.5">{store.hint}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a href={store.flyerUrl} target="_blank" rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
                style={{ background: store.color, color: '#fff' }}>
                <ExternalLink size={11} />
                فتح كل العروض
              </a>
              <button onClick={() => setShowSearch(store.searchTerm)}
                className="px-3 py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
                style={{ background: '#25D366', color: '#fff' }}>
                <MessageCircle size={11} />
                اشترك واتساب
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* How-to modal */}
      {showSearch && (
        <SubscribeHowToModal storeName={showSearch} onClose={() => setShowSearch(false)} setTab={setTab} />
      )}

      {/* Workflow tip */}
      <div className="mt-3 p-3 rounded-xl text-[11px] text-[#0D4F3C]/80 leading-relaxed flex items-start gap-2"
        style={{ background: 'rgba(212, 165, 116, 0.15)' }}>
        <Lightbulb size={12} className="text-[#B8884F] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#B8884F]">نصيحة ذهبية:</span> اشترك في 2-3 متاجر فقط (مو كلهم)، عشان واتساب ما يصير زحمة. اختر المتاجر اللي تتعامل معها فعلياً.
        </div>
      </div>
    </section>
  );
}

// Modal showing how to subscribe to a store's WhatsApp
function SubscribeHowToModal({ storeName, onClose, setTab }) {
  // Generate a search URL for finding the store on WhatsApp/Google
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(storeName + ' WhatsApp official channel Saudi')}`;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div onClick={e => e.stopPropagation()} className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-3xl p-5"
        style={{ background: '#F5EFE6' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} style={{ color: '#25D366' }} />
            <h2 className="font-bold text-lg text-[#0D4F3C]" style={{ fontFamily: 'Reem Kufi, sans-serif' }}>
              كيف تشترك في {storeName.replace(' Saudi', '').replace('Markets', '').replace('Hypermarket', '').replace('KSA', '')}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(13,79,60,0.1)' }}>
            <X size={16} className="text-[#0D4F3C]" />
          </button>
        </div>

        {/* Steps */}
        <div className="p-4 rounded-2xl bg-white mb-3" style={{ boxShadow: '0 1px 8px -2px rgba(13, 79, 60, 0.1)' }}>
          <div className="text-xs font-bold text-[#0D4F3C] mb-3">الخطوات (دقيقة واحدة):</div>
          <ol className="space-y-3 text-xs text-[#1a1a1a]/90 leading-relaxed">
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                style={{ background: '#25D366', color: '#fff' }}>1</div>
              <div>
                <strong>افتح واتساب</strong> على جوالك
              </div>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                style={{ background: '#25D366', color: '#fff' }}>2</div>
              <div>
                اضغط على تبويب <strong>"التحديثات"</strong> (Updates) في الأسفل
              </div>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                style={{ background: '#25D366', color: '#fff' }}>3</div>
              <div>
                اضغط على <strong>"اكتشف القنوات"</strong> أو على أيقونة 🔍 في قسم القنوات
              </div>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                style={{ background: '#25D366', color: '#fff' }}>4</div>
              <div>
                ابحث عن: <code className="bg-[#0D4F3C]/10 px-2 py-0.5 rounded font-bold text-[#0D4F3C]" style={{ direction: 'ltr', display: 'inline-block' }}>{storeName}</code>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                style={{ background: '#25D366', color: '#fff' }}>5</div>
              <div>
                اختر القناة <strong>الموثّقة</strong> (✓ زرقاء) واضغط <strong>"متابعة"</strong>
              </div>
            </li>
          </ol>
        </div>

        {/* Search via Google fallback */}
        <a href={searchUrl} target="_blank" rel="noopener noreferrer"
          className="block p-3 rounded-xl mb-3 text-center font-semibold text-xs transition-all active:scale-98"
          style={{ background: 'rgba(13, 79, 60, 0.08)', color: '#0D4F3C' }}>
          🔎 ابحث في جوجل عن قناتهم الرسمية (لو ما لقيتها في واتساب)
        </a>

        {/* What to do when offer arrives */}
        <div className="p-4 rounded-2xl mb-3" style={{
          background: 'linear-gradient(135deg, #FFF8EC 0%, #F5EFE6 100%)',
          border: '1px solid rgba(212, 165, 116, 0.3)'
        }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-[#B8884F]" />
            <div className="font-bold text-sm text-[#0D4F3C]">لما يجيك عرض على واتساب:</div>
          </div>
          <ol className="text-xs text-[#1a1a1a]/85 leading-relaxed space-y-1.5 mr-3">
            <li>1. خذ <strong>سكرين شوت</strong> للعرض</li>
            <li>2. ارجع للتطبيق → <strong>"مسح" → "نشرة"</strong></li>
            <li>3. ارفع السكرين شوت</li>
            <li>4. الذكاء الاصطناعي يستخرج العروض ويقارنها بكتاب أسعارك</li>
          </ol>
          <button onClick={() => { onClose(); setTab('scan'); }}
            className="mt-3 w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
            style={{ background: '#0D4F3C', color: '#fff' }}>
            <Tag size={12} /> افتح "مسح النشرة" الآن
          </button>
        </div>

        {/* Important note */}
        <div className="p-3 rounded-xl text-[11px] text-[#0D4F3C]/80 leading-relaxed flex items-start gap-2"
          style={{ background: 'rgba(139, 58, 58, 0.08)' }}>
          <AlertCircle size={12} className="text-[#8B3A3A] flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#8B3A3A]">ملاحظة:</strong> القنوات الرسمية فقط (✓ زرقاء). فيه قنوات وهمية تسرق بيانات وترسل إعلانات مزعجة — تجنّبها.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ FLYERS TAB - Weekly flyer aggregators + direct store links ============
function FlyersTab({ region, setTab }) {
  // Flyer aggregators (the big 3)
  const AGGREGATORS_FULL = [
    {
      name: 'ClicFlyer',
      arabicName: 'كليك فلاير',
      url: 'https://www.clicflyer.com/sa/riyadh',
      altUrl: 'https://www.clicflyer.com/sa/dammam',
      description: 'أكبر مجمّع لنشرات العروض في السعودية',
      icon: '📰',
      color: '#0066CC',
      specialty: 'كل النشرات، كل المتاجر، كل أسبوع'
    },
    {
      name: 'فستق',
      arabicName: 'Fustog',
      url: 'https://fustog.app',
      description: 'مقارنة أسعار فورية بين المتاجر',
      icon: '🥜',
      color: '#D4A574',
      specialty: 'مقارنة منتج واحد بين عدة متاجر'
    },
    {
      name: 'قوتي',
      arabicName: 'Qooty',
      url: 'https://qooty.net',
      description: 'تنبيهات أسعار في الخلفية + مسح باركود',
      icon: '🔔',
      color: '#8B3A3A',
      specialty: 'تتبع منتج معين وتنبيه لما ينزل سعره'
    }
  ];

  // Direct flyer pages for each major Saudi supermarket
  const DIRECT_FLYERS = [
    {
      name: 'بنده',
      offersUrl: 'https://panda.com.sa/ar-sa/offers',
      siteUrl: 'https://panda.com.sa',
      color: '#00A859',
      regions: ['riyadh', 'eastern']
    },
    {
      name: 'لولو',
      offersUrl: 'https://www.luluhypermarket.com/ar-sa/promotions',
      siteUrl: 'https://www.luluhypermarket.com/ar-sa',
      color: '#E30613',
      regions: ['riyadh', 'eastern']
    },
    {
      name: 'التميمي',
      offersUrl: 'https://shop.tamimimarkets.com/ar/offers',
      siteUrl: 'https://shop.tamimimarkets.com',
      color: '#003B71',
      regions: ['riyadh', 'eastern']
    },
    {
      name: 'كارفور',
      offersUrl: 'https://www.carrefourksa.com/mafsau/ar/c/F1550000',
      siteUrl: 'https://www.carrefourksa.com',
      color: '#004E9F',
      regions: ['riyadh', 'eastern']
    },
    {
      name: 'العثيم',
      offersUrl: 'https://www.othaimmarkets.com.sa/ar/offers',
      siteUrl: 'https://www.othaimmarkets.com.sa',
      color: '#E60012',
      regions: ['riyadh', 'eastern']
    },
    {
      name: 'الدانوب',
      offersUrl: 'https://www.danubeco.com/ar/offers',
      siteUrl: 'https://www.danubeco.com',
      color: '#D4A017',
      regions: ['riyadh', 'eastern']
    },
    {
      name: 'نستو',
      offersUrl: 'https://www.nestoksa.com/offers',
      siteUrl: 'https://www.nestoksa.com',
      color: '#F37021',
      regions: ['eastern']
    },
    {
      name: 'هايبر الوفاء',
      offersUrl: 'https://www.clicflyer.com/sa/riyadh/alwafa-hyper',
      siteUrl: '',
      color: '#E91E63',
      regions: ['riyadh']
    },
    {
      name: 'شونه',
      offersUrl: 'https://www.clicflyer.com/sa/riyadh',
      siteUrl: '',
      color: '#6B4423',
      regions: ['riyadh']
    }
  ];

  const stores = DIRECT_FLYERS.filter(s => s.regions.includes(region));

  return (
    <div className="pt-4 space-y-5">
      {/* Hero: How to use flyers with the app */}
      <section className="p-4 rounded-2xl relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0D4F3C 0%, #1a6b54 100%)',
        boxShadow: '0 4px 20px -8px rgba(13, 79, 60, 0.4)'
      }}>
        <div className="absolute top-0 left-0 w-32 h-32 rounded-full opacity-10" style={{ background: '#D4A574', transform: 'translate(-30%, -30%)' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xl">📰</div>
            <div className="text-white font-bold text-base" style={{ fontFamily: 'Reem Kufi, sans-serif' }}>
              اصطد العروض الأسبوعية
            </div>
          </div>
          <div className="text-white/85 text-xs leading-relaxed">
            افتح نشرة أي متجر، خذ سكرين شوت، ارجع للتطبيق وارفعه في "مسح → نشرة" — سأستخرج كل العروض وأقول لك <strong>اشترِ أو تجاهل</strong> بناءً على كتاب أسعارك.
          </div>
          <button onClick={() => setTab('scan')}
            className="mt-3 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
            style={{ background: '#D4A574', color: '#0D4F3C' }}>
            <Tag size={12} /> افتح "مسح النشرة" الآن
          </button>
        </div>
      </section>

      {/* WhatsApp Channels Subscription Section - NEW */}
      <WhatsAppSubscriptions setTab={setTab} />

      {/* Aggregators section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-[#0D4F3C]/70 tracking-wide">مجمّعات النشرات (كل المتاجر)</h2>
          <div className="text-[10px] text-[#D4A574] font-bold">✨ يفضّل تبدأ من هنا</div>
        </div>
        <div className="space-y-2">
          {AGGREGATORS_FULL.map(agg => (
            <a key={agg.name} href={agg.url} target="_blank" rel="noopener noreferrer"
              className="block p-4 rounded-2xl transition-all active:scale-98"
              style={{
                background: '#FFFFFF',
                boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.15)',
                borderRight: `4px solid ${agg.color}`
              }}>
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">{agg.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <div className="font-bold text-base text-[#1a1a1a]" style={{ fontFamily: 'Reem Kufi, sans-serif' }}>
                      {agg.name}
                    </div>
                    <div className="text-[10px] text-[#0D4F3C]/50">{agg.arabicName}</div>
                  </div>
                  <div className="text-xs text-[#0D4F3C]/80 leading-relaxed">{agg.description}</div>
                  <div className="text-[10px] text-[#B8884F] font-semibold mt-1.5 flex items-center gap-1">
                    <Sparkles size={10} /> {agg.specialty}
                  </div>
                </div>
                <ExternalLink size={16} className="text-[#0D4F3C]/40 flex-shrink-0 mt-1" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Direct store flyers */}
      <section>
        <h2 className="text-xs font-bold mb-3 text-[#0D4F3C]/70 tracking-wide">
          مباشرة من كل متجر · {region === 'riyadh' ? 'الرياض' : 'الشرقية'}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {stores.map(s => (
            <a key={s.name} href={s.offersUrl} target="_blank" rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl p-4 transition-all active:scale-95"
              style={{
                background: '#FFFFFF',
                boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.15), inset 0 0 0 1px rgba(13, 79, 60, 0.06)'
              }}>
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10"
                style={{ background: s.color, transform: 'translate(30%, -30%)' }} />
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base mb-2"
                  style={{ background: s.color, fontFamily: 'Reem Kufi, sans-serif' }}>
                  {s.name.charAt(0)}
                </div>
                <div className="font-bold text-[#1a1a1a] text-sm">{s.name}</div>
                <div className="flex items-center gap-1 text-[10px] text-[#B8884F] font-semibold mt-1">
                  <Tag size={9} /> عروض هذا الأسبوع
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Workflow guide */}
      <section className="p-4 rounded-2xl" style={{
        background: 'linear-gradient(135deg, #FFF8EC 0%, #F5EFE6 100%)',
        border: '1px solid rgba(212, 165, 116, 0.3)'
      }}>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={16} className="text-[#B8884F]" />
          <div className="font-bold text-sm text-[#0D4F3C]">كيف تستفيد من النشرات (الطريقة الذكية)</div>
        </div>
        <ol className="text-xs text-[#1a1a1a]/80 leading-relaxed space-y-2 mr-3">
          <li>
            <strong className="text-[#0D4F3C]">1️⃣ افتح ClicFlyer</strong> — أسهل طريقة ترى كل نشرات الأسبوع
          </li>
          <li>
            <strong className="text-[#0D4F3C]">2️⃣ خذ سكرين شوت</strong> للصفحات اللي فيها منتجات تهمك
          </li>
          <li>
            <strong className="text-[#0D4F3C]">3️⃣ ارجع للتطبيق → "مسح" → "نشرة"</strong> — ارفع السكرين شوت
          </li>
          <li>
            <strong className="text-[#0D4F3C]">4️⃣ الذكاء الاصطناعي يستخرج العروض</strong> ويقارنها بكتاب أسعارك
          </li>
          <li>
            <strong className="text-[#0D4F3C]">5️⃣ تشوف فوراً:</strong> 🟢 اشترِ الآن / 🔴 تجاهل (مب أرخص من السعر الأرضي)
          </li>
        </ol>
        <div className="mt-3 text-[10px] text-[#0D4F3C]/60 leading-relaxed">
          ⚡ مع الوقت، كتاب أسعارك يصير أذكى، والتوصيات تصير أدق. ما فيه خيار أفضل من البيانات الشخصية.
        </div>
      </section>

      {/* Advanced: Quick access to scan */}
      <button onClick={() => setTab('scan')}
        className="w-full p-4 rounded-2xl text-right transition-all active:scale-98"
        style={{ background: 'linear-gradient(135deg, #D4A574 0%, #B8884F 100%)', boxShadow: '0 4px 20px -8px rgba(184, 136, 79, 0.5)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Tag size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="text-white font-bold text-sm">ارفع نشرة الآن</div>
            <div className="text-white/85 text-xs mt-0.5 leading-relaxed">
              عندك سكرين شوت؟ افتح "مسح → نشرة" مباشرة
            </div>
          </div>
          <div className="text-white/60">←</div>
        </div>
      </button>
    </div>
  );
}

// ============ MAP TAB - Golden Route + Single Product Map + Golden Hour ============
function MapTab({ data, update, region }) {
  const [view, setView] = useState('route'); // route | search | hours

  return (
    <div className="pt-4">
      <div className="flex gap-1.5 mb-4 p-1 rounded-2xl" style={{ background: 'rgba(13, 79, 60, 0.08)' }}>
        {[
          { id: 'route',  label: 'المسار الذهبي', icon: MapPin },
          { id: 'search', label: 'بحث منتج',     icon: Search },
          { id: 'hours',  label: 'ساعة الذهب',   icon: Sunrise },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold transition-all"
            style={view === t.id
              ? { background: '#FFFFFF', color: '#0D4F3C', boxShadow: '0 1px 4px -1px rgba(13,79,60,0.15)' }
              : { color: '#0D4F3C', opacity: 0.6 }
            }>
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {view === 'route'  && <GoldenRoute data={data} region={region} />}
      {view === 'search' && <ProductSearchMap data={data} region={region} />}
      {view === 'hours'  && <GoldenHours region={region} />}
    </div>
  );
}

// ----- GOLDEN ROUTE: optimal multi-store shopping path -----
function GoldenRoute({ data, region }) {
  const [needs, setNeeds] = useState('');
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState(null);
  const [error, setError] = useState(null);

  const generate = async () => {
    if (!needs.trim()) return;
    setLoading(true); setError(null); setRoute(null);
    try {
      const bookSummary = Object.values(data.priceBook).slice(0, 80).map(it => ({
        name: it.name,
        floor: it.floorPrice,
        cheapestStore: it.prices.find(p => p.price === it.floorPrice)?.store
      }));
      const recentDeals = (data.recentDeals || []).slice(0, 30).map(d => ({
        name: d.product, store: d.store, price: d.dealPrice, discount: d.discountPct
      }));
      const sys = `أنت مستشار تسوّق سعودي. خطّط مسار تسوّق ذكي يقلل المسافات والتكلفة.

أرجع JSON فقط:
{
  "stops": [
    {
      "store": "اسم المتجر",
      "order": 1,
      "items": [{"product":"...","price":رقم,"reason":"لماذا هنا"}],
      "subtotal": رقم,
      "estimatedMinutes": رقم وقت متوقع داخل المتجر
    }
  ],
  "totalEstimate": رقم,
  "estimatedSavings": رقم vs شراء كل شي من متجر واحد,
  "totalMinutes": رقم وقت كل الرحلة بما فيها التنقل,
  "tips": ["نصيحة 1", "نصيحة 2"]
}

اجعل عدد المتاجر بين 2-3 (أكثر من ذلك يستهلك وقت ووقود). رتّب حسب الجغرافيا المنطقية في ${region === 'riyadh' ? 'الرياض' : 'الشرقية'}.`;
      const userMsg = `احتياجاتي:\n${needs}\n\nبيانات أسعاري:\n${JSON.stringify(bookSummary)}\n\nالعروض الحالية:\n${JSON.stringify(recentDeals)}`;
      const res = await callClaude([{ role: "user", content: userMsg }], sys, 3000);
      const parsed = parseJSON(res);
      if (!parsed) throw new Error("ما قدرت أولّد المسار. جرّب مرة ثانية.");
      setRoute(parsed);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white" style={{ boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.15)' }}>
        <div className="text-xs font-bold text-[#0D4F3C] mb-2 flex items-center gap-1.5">
          <MapPin size={13} /> المسار الذهبي
        </div>
        <div className="text-[11px] text-[#0D4F3C]/70 leading-relaxed mb-3">
          اكتب احتياجاتك، سأبني لك مسار تسوّق محسّن: 2-3 متاجر فقط، مرتبة حسب الجغرافيا، مع توفير حقيقي.
        </div>
        <textarea value={needs} onChange={e => setNeeds(e.target.value)}
          placeholder="مثلاً:&#10;- أرز 5 كجم&#10;- لحم بقري&#10;- خضار&#10;- ألبان وأجبان"
          rows={5}
          className="w-full p-3 rounded-xl text-sm outline-none resize-none mb-2"
          style={{ background: 'rgba(13, 79, 60, 0.05)', fontFamily: 'inherit' }} />
        <button onClick={generate} disabled={loading || !needs.trim()}
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: '#0D4F3C', color: '#F5EFE6' }}>
          {loading ? <><Loader2 size={14} className="animate-spin" /> تخطيط...</> : <><Sparkles size={14} /> خطّط المسار</>}
        </button>
      </div>

      {error && <ErrorBox message={error} />}

      {route && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #0D4F3C, #1a6b54)' }}>
              <div className="text-white/70 text-[10px]">الإجمالي</div>
              <div className="text-white text-lg font-bold">{route.totalEstimate}</div>
              <div className="text-white/70 text-[9px]">ر.س</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #D4A574, #B8884F)' }}>
              <div className="text-white/80 text-[10px]">توفير</div>
              <div className="text-white text-lg font-bold">{route.estimatedSavings}</div>
              <div className="text-white/80 text-[9px]">ر.س</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #1a6b54, #0D4F3C)' }}>
              <div className="text-white/70 text-[10px]">الوقت</div>
              <div className="text-white text-lg font-bold">{route.totalMinutes}</div>
              <div className="text-white/70 text-[9px]">دقيقة</div>
            </div>
          </div>

          {/* Stops */}
          {route.stops.map((stop, i) => (
            <div key={i} className="relative">
              {/* Connector line */}
              {i < route.stops.length - 1 && (
                <div className="absolute right-5 top-12 bottom-[-12px] w-0.5" style={{ background: 'rgba(13, 79, 60, 0.2)' }} />
              )}
              <div className="p-4 rounded-2xl bg-white relative" style={{ boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.15)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: '#0D4F3C', color: '#fff' }}>
                    {stop.order}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-[#0D4F3C]">{stop.store}</div>
                    <div className="text-[10px] text-[#0D4F3C]/60">~{stop.estimatedMinutes} دقيقة داخل المتجر · {stop.subtotal} ر.س</div>
                  </div>
                  <a href={`https://www.google.com/maps/search/${encodeURIComponent(stop.store + ' ' + (region === 'riyadh' ? 'الرياض' : 'الشرقية'))}`}
                    target="_blank" rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-1"
                    style={{ background: 'rgba(13, 79, 60, 0.08)', color: '#0D4F3C' }}>
                    <MapPin size={10} /> خريطة
                  </a>
                </div>
                <div className="space-y-1.5 mr-12">
                  {stop.items.map((it, j) => (
                    <div key={j} className="text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#1a1a1a] font-medium">{it.product}</span>
                        <span className="text-[#0D4F3C] font-semibold">{it.price} ر.س</span>
                      </div>
                      {it.reason && <div className="text-[10px] text-[#0D4F3C]/60 mt-0.5">{it.reason}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {route.tips?.length > 0 && (
            <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(212, 165, 116, 0.15)' }}>
              <div className="font-bold text-[#0D4F3C] mb-1 flex items-center gap-1"><Lightbulb size={11} /> نصائح</div>
              {route.tips.map((tip, i) => (
                <div key={i} className="text-[#1a1a1a]/80 leading-relaxed mt-1">• {tip}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ----- PRODUCT SEARCH MAP: find cheapest store for one product -----
function ProductSearchMap({ data, region }) {
  const [search, setSearch] = useState('');
  const filtered = search
    ? Object.entries(data.priceBook).filter(([k, v]) => v.name.includes(search))
    : Object.entries(data.priceBook).sort((a, b) => b[1].prices.length - a[1].prices.length).slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-white" style={{ boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.15)' }}>
        <div className="text-xs font-bold text-[#0D4F3C] mb-2 flex items-center gap-1.5">
          <Search size={13} /> ابحث عن أرخص متجر لمنتج
        </div>
        <div className="relative">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0D4F3C]/40" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="مثلاً: حليب، أرز، دجاج..."
            className="w-full pr-9 pl-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'rgba(13, 79, 60, 0.06)' }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="pt-8 text-center text-xs text-[#0D4F3C]/60">
          ما فيه نتائج. تحتاج تبني كتاب أسعارك أولاً.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(([key, item]) => (
            <ProductPriceMap key={key} item={item} region={region} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductPriceMap({ item, region }) {
  // Group prices by store, find min per store
  const byStore = {};
  item.prices.forEach(p => {
    if (!byStore[p.store] || p.price < byStore[p.store]) byStore[p.store] = p.price;
  });
  const sorted = Object.entries(byStore).sort((a, b) => a[1] - b[1]);
  const cheapest = sorted[0];
  const mostExpensive = sorted[sorted.length - 1];
  const savings = sorted.length > 1 ? mostExpensive[1] - cheapest[1] : 0;

  return (
    <div className="p-4 rounded-2xl bg-white" style={{ boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.1)' }}>
      <div className="font-bold text-sm text-[#1a1a1a] mb-3">{item.name}</div>
      {savings > 0 && (
        <div className="text-[11px] text-[#0D4F3C]/70 mb-2 leading-relaxed">
          💰 توفير {savings.toFixed(2)} ر.س لو اشتريت من {cheapest[0]} بدلاً من {mostExpensive[0]}
        </div>
      )}
      <div className="space-y-1.5">
        {sorted.map(([store, price], i) => {
          const pct = ((price - cheapest[1]) / cheapest[1]) * 100;
          const color = i === 0 ? '#0D4F3C' : pct > 20 ? '#8B3A3A' : pct > 10 ? '#D4A574' : '#1a6b54';
          return (
            <a key={store} href={`https://www.google.com/maps/search/${encodeURIComponent(store + ' ' + (region === 'riyadh' ? 'الرياض' : 'الشرقية'))}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-2.5 rounded-xl transition-all active:scale-98"
              style={{ background: i === 0 ? 'rgba(13, 79, 60, 0.08)' : 'rgba(13, 79, 60, 0.03)' }}>
              <div className="flex items-center gap-2 flex-1">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <div className="text-sm font-semibold text-[#1a1a1a]">{store}</div>
                {i === 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#0D4F3C', color: '#fff' }}>الأرخص</span>}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-bold" style={{ color }}>{price} ر.س</div>
                {i > 0 && <div className="text-[10px] text-[#8B3A3A]">+{pct.toFixed(0)}%</div>}
                <MapPin size={12} className="text-[#0D4F3C]/40" />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ----- GOLDEN HOURS: best times to shop for discounts -----
function GoldenHours({ region }) {
  const goldenHours = [
    { store: 'دانوب',     items: 'مخبوزات وحلويات', time: 'بعد العصر (4-6 م)', discount: '30-50%', icon: '🥖', notes: 'تخفيضات قبل انتهاء اليوم' },
    { store: 'العثيم',    items: 'لحوم ودواجن طازجة', time: 'قبل المغرب', discount: '20-40%', icon: '🍖', notes: 'لحوم اليوم بأسعار مخفّضة' },
    { store: 'بنده',      items: 'خضار وفواكه',   time: 'الصباح الباكر (6-9 ص)', discount: 'الأطزج',   icon: '🥬', notes: 'وصول يومي طازج' },
    { store: 'لولو',      items: 'منتجات الخبز',   time: 'بعد العشاء',           discount: '25-50%', icon: '🥐', notes: 'تخفيض المخبوزات قرب الإغلاق' },
    { store: 'كارفور',    items: 'منتجات قرب انتهاء الصلاحية', time: 'الأسبوع الأخير من الشهر', discount: '40-70%', icon: '🏷️', notes: 'بحث عن ركن "تخفيضات اليوم"' },
    { store: 'التميمي',   items: 'الأسماك الطازجة',  time: 'الصباح (الثلاثاء والجمعة)', discount: 'الأطزج', icon: '🐟', notes: 'أيام الوصول الجديد' },
    { store: 'هايبر بنده', items: 'كل الأقسام',    time: 'الخميس صباحاً', discount: 'بداية عروض الأسبوع', icon: '🛒', notes: 'بداية النشرة الأسبوعية الجديدة' },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl" style={{
        background: 'linear-gradient(135deg, #D4A574 0%, #B8884F 100%)',
        boxShadow: '0 4px 20px -8px rgba(184, 136, 79, 0.5)'
      }}>
        <div className="flex items-center gap-2 mb-2">
          <Sunrise size={16} className="text-white" />
          <div className="text-white font-bold text-sm">ساعة الذهب</div>
        </div>
        <div className="text-white/90 text-xs leading-relaxed">
          أوقات معينة في كل متجر فيها تخفيضات على المنتجات الطازجة. هذي معرفة جماعية مبنية على الملاحظة، قد تختلف حسب الفرع.
        </div>
      </div>

      <div className="space-y-2">
        {goldenHours.map((h, i) => (
          <div key={i} className="p-3.5 rounded-2xl bg-white flex items-start gap-3" style={{ boxShadow: '0 1px 8px -2px rgba(13, 79, 60, 0.1)' }}>
            <div className="text-3xl flex-shrink-0">{h.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <div className="font-bold text-sm text-[#0D4F3C]">{h.store}</div>
                <div className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(212, 165, 116, 0.2)', color: '#B8884F' }}>
                  {h.discount}
                </div>
              </div>
              <div className="text-xs text-[#1a1a1a] font-medium">{h.items}</div>
              <div className="text-[11px] text-[#0D4F3C]/70 mt-0.5">⏰ {h.time}</div>
              <div className="text-[10px] text-[#0D4F3C]/60 mt-1 leading-relaxed">{h.notes}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-xl text-[11px] text-[#0D4F3C]/70 leading-relaxed flex items-start gap-2"
        style={{ background: 'rgba(13, 79, 60, 0.05)' }}>
        <Lightbulb size={12} className="text-[#B8884F] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#B8884F]">نصيحة:</span> اتصل بفرعك المفضل واسأل: "متى ينزل عندكم تخفيض على المخبوزات/اللحوم؟" — كل فرع له روتين خاص.
        </div>
      </div>
    </div>
  );
}

// ============ SMART LIST TAB ============
function SmartListTab({ data }) {
  const [need, setNeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const generate = async () => {
    if (!need.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const bookSummary = Object.values(data.priceBook).slice(0, 60).map(it => ({
        name: it.name, floor: it.floorPrice,
        cheapestStore: it.prices.find(p => p.price === it.floorPrice)?.store
      }));
      const watchSummary = data.watchList.slice(0, 25).map(w => ({ name: w.name, minPrice: w.minPrice }));
      const inv = Object.values(data.inventory).map(i => `${i.name} (${i.quantity})`);
      const recentDeals = data.recentDeals.slice(0, 30).map(d => ({ name: d.product, store: d.store, price: d.dealPrice, discount: d.discountPct }));

      const sys = `أنت مستشار تسوّق ذكي في السعودية. خصائص خاصة:
1. تجاهل أي منتج موجود في المخزون بكمية كافية واذكره في skippedFromInventory.
2. اقترح بدائل ذكية إذا منتج المستخدم المعتاد سعره أعلى من بديل مخفّض في العروض الحالية.
3. وزّع على أرخص متجر لكل منتج حسب البيانات.

أرجع JSON فقط:
{
  "byStore": [{"store":"...","items":[{"product":"...","expectedPrice":رقم,"reason":"السبب","substitution":"بديل مقترح أو null"}],"subtotal":رقم}],
  "skippedFromInventory": ["منتجات تجاهلتها لأنها في المخزون"],
  "tips": ["نصيحة 1","نصيحة 2","نصيحة 3"],
  "estimatedTotal": رقم,
  "estimatedSavings": رقم
}`;
      const userMsg = `احتياجاتي:\n${need}\n\nالمخزون عندي:\n${JSON.stringify(inv)}\n\nقائمة المراقبة:\n${JSON.stringify(watchSummary)}\n\nكتاب أسعاري:\n${JSON.stringify(bookSummary)}\n\nالعروض الحالية:\n${JSON.stringify(recentDeals)}`;
      const res = await callClaude([{ role: "user", content: userMsg }], sys);
      const parsed = parseJSON(res);
      if (!parsed) throw new Error("ما قدرت أولّد قائمة. جرب مرة ثانية.");
      setResult(parsed);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="pt-4 space-y-4">
      <div className="p-4 rounded-2xl bg-white" style={{ boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.15)' }}>
        <label className="block text-xs font-bold text-[#0D4F3C] mb-2">احتياجاتك هذا الأسبوع</label>
        <textarea value={need} onChange={e => setNeed(e.target.value)}
          placeholder="مثال:&#10;- أرز بسمتي 5 كيلو&#10;- زيت دوار الشمس 2 لتر&#10;- حليب 4 لتر&#10;- دجاج كامل&#10;- خضار للأسبوع"
          rows={5}
          className="w-full p-3 rounded-xl text-sm outline-none resize-none"
          style={{ background: 'rgba(13, 79, 60, 0.05)', fontFamily: 'inherit' }} />
        <button onClick={generate} disabled={loading || !need.trim()}
          className="w-full mt-3 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          style={{ background: '#0D4F3C', color: '#F5EFE6' }}>
          {loading ? <><Loader2 size={14} className="animate-spin" /> تحليل...</> : <><Sparkles size={14} /> ولّد القائمة</>}
        </button>
        <div className="mt-2 text-[10px] text-[#0D4F3C]/60">
          ✓ تأخذ بالاعتبار: مخزونك، قائمة المراقبة، كتاب الأسعار، والعروض الأخيرة، وتقترح بدائل
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, #0D4F3C 0%, #1a6b54 100%)' }}>
            <div className="text-[#D4A574] text-[11px] font-semibold mb-1">التقدير</div>
            <div className="text-white text-3xl font-bold">{result.estimatedTotal} <span className="text-sm font-normal opacity-70">ر.س</span></div>
            {result.estimatedSavings > 0 && <div className="text-[#D4A574] text-xs mt-1">توفير ~{result.estimatedSavings} ر.س</div>}
          </div>

          {result.skippedFromInventory?.length > 0 && (
            <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(212, 165, 116, 0.15)' }}>
              <div className="font-bold text-[#0D4F3C] mb-1 flex items-center gap-1"><Package size={11} /> تم تجاهلها (موجودة في مخزونك)</div>
              <div className="text-[#1a1a1a]/70">{result.skippedFromInventory.join('، ')}</div>
            </div>
          )}

          {result.byStore.map((s, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-white" style={{ boxShadow: '0 1px 8px -2px rgba(13, 79, 60, 0.1)' }}>
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#0D4F3C]/10">
                <div className="font-bold text-[#0D4F3C]">{s.store}</div>
                <div className="text-sm font-bold text-[#1a1a1a]">{s.subtotal} ر.س</div>
              </div>
              <div className="space-y-2">
                {s.items.map((it, j) => (
                  <div key={j} className="text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#1a1a1a] font-medium">{it.product}</span>
                      <span className="text-[#0D4F3C] font-semibold">{it.expectedPrice} ر.س</span>
                    </div>
                    {it.reason && <div className="text-[10px] text-[#0D4F3C]/60 mt-0.5">{it.reason}</div>}
                    {it.substitution && <div className="text-[10px] text-[#B8884F] mt-0.5">🔄 بديل مقترح: {it.substitution}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {result.tips?.length > 0 && (
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(212, 165, 116, 0.15)' }}>
              <div className="text-xs font-bold text-[#0D4F3C] mb-2 flex items-center gap-1"><Lightbulb size={12} /> نصائح مخصصة</div>
              {result.tips.map((tip, i) => (
                <div key={i} className="text-xs text-[#1a1a1a]/80 leading-relaxed mt-1.5">• {tip}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ SETTINGS SHEET ============
function SettingsSheet({ data, update, onClose }) {
  const [s, setS] = useState(data.settings);
  const [notifStatus, setNotifStatus] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');

  const save = async () => {
    await update({ settings: s });
    onClose();
  };

  const toggleNotifs = async () => {
    if (s.notificationsEnabled) {
      setS({ ...s, notificationsEnabled: false });
    } else {
      const perm = await requestNotifPermission();
      setNotifStatus(perm);
      if (perm === 'granted') {
        setS({ ...s, notificationsEnabled: true });
        sendNotif('🛒 مرحباً!', 'سأنبهك لما يطلع منتج من قائمة مراقبتك بسعر أرضي');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div onClick={e => e.stopPropagation()} className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-3xl p-5"
        style={{ background: '#F5EFE6' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-[#0D4F3C]" />
            <h2 className="font-bold text-lg text-[#0D4F3C]" style={{ fontFamily: 'Reem Kufi, sans-serif' }}>الإعدادات</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(13,79,60,0.1)' }}>
            <X size={16} className="text-[#0D4F3C]" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white mb-3" style={{ boxShadow: '0 1px 8px -2px rgba(13, 79, 60, 0.1)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-sm text-[#0D4F3C] flex items-center gap-2">
              {s.notificationsEnabled ? <Bell size={14} /> : <BellOff size={14} />} التنبيهات
            </div>
            <button onClick={toggleNotifs} className="w-12 h-6 rounded-full transition-all relative"
              style={{ background: s.notificationsEnabled ? '#0D4F3C' : 'rgba(13,79,60,0.2)' }}>
              <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
                style={{ [s.notificationsEnabled ? 'left' : 'right']: '2px' }} />
            </button>
          </div>
          <div className="text-[11px] text-[#0D4F3C]/70 leading-relaxed">
            {notifStatus === 'denied' && '⚠️ التنبيهات معطّلة من المتصفح. فعّلها من إعدادات المتصفح.'}
            {notifStatus === 'unsupported' && '⚠️ متصفحك ما يدعم التنبيهات.'}
            {notifStatus !== 'denied' && notifStatus !== 'unsupported' && (
              <>
                تنبيهات داخل المتصفح فقط — لما تمسح نشرة فيها منتج من قائمة مراقبتك بسعر أرضي.
                <div className="mt-2 p-2 rounded-lg text-[10px]" style={{ background: 'rgba(212, 165, 116, 0.15)' }}>
                  💡 للتنبيهات في الخلفية (حتى لو التطبيق مغلق)، نزّل تطبيق <strong>قوتي</strong>.
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white mb-3" style={{ boxShadow: '0 1px 8px -2px rgba(13, 79, 60, 0.1)' }}>
          <div className="font-bold text-sm text-[#0D4F3C] mb-3 flex items-center gap-2">
            <MessageCircle size={14} /> أرقام التواصل (3 أجهزة)
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-[#0D4F3C] mb-1">
                👩 رقم الزوجة (الوسيط)
              </label>
              <input value={s.whatsappNumber || ''} onChange={e => setS({ ...s, whatsappNumber: e.target.value })}
                placeholder="9665XXXXXXXX"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: 'rgba(13, 79, 60, 0.06)', color: '#0D4F3C', direction: 'ltr', textAlign: 'right' }} />
              <div className="text-[10px] text-[#0D4F3C]/60 mt-1">العاملة ترسل لها لما تضغط على صورة</div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#0D4F3C] mb-1">
                👨 رقم الزوج/الأب
              </label>
              <input value={s.husbandNumber || ''} onChange={e => setS({ ...s, husbandNumber: e.target.value })}
                placeholder="9665XXXXXXXX"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: 'rgba(212, 165, 116, 0.15)', color: '#0D4F3C', direction: 'ltr', textAlign: 'right' }} />
              <div className="text-[10px] text-[#0D4F3C]/60 mt-1">الزوجة ترسل له القائمة المؤكدة بعد المراجعة</div>
            </div>
          </div>

          <div className="mt-3 p-2.5 rounded-lg text-[10px] text-[#0D4F3C]/70 leading-relaxed" style={{ background: 'rgba(13, 79, 60, 0.04)' }}>
            💡 <strong>التدفق:</strong> العاملة (الآيباد) ← الزوجة (للمراجعة) ← الزوج (القائمة النهائية)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white mb-3" style={{ boxShadow: '0 1px 8px -2px rgba(13, 79, 60, 0.1)' }}>
          <div className="font-bold text-sm text-[#0D4F3C] mb-3 flex items-center gap-2">⛽ حاسبة الوقود</div>
          <div className="grid grid-cols-2 gap-2">
            <FieldNum label="سعر اللتر (ر.س)" value={s.fuelPricePerLiter} onChange={v => setS({ ...s, fuelPricePerLiter: v })} />
            <FieldNum label="كم/لتر" value={s.kmPerLiter} onChange={v => setS({ ...s, kmPerLiter: v })} />
          </div>
          <div className="mt-2 text-[10px] text-[#0D4F3C]/60">يستخدم في حسبة "هل يستاهل أروح؟" في تبويب الحاسبة.</div>
        </div>

        <button onClick={save} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: '#0D4F3C', color: '#fff' }}>
          حفظ
        </button>
      </div>
    </div>
  );
}

// ============ SHARED ============
function UploadCard({ icon: Icon, title, desc, onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="w-full p-5 rounded-2xl text-right transition-all active:scale-98 disabled:opacity-60"
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F9F4EB 100%)',
        boxShadow: '0 2px 12px -4px rgba(13, 79, 60, 0.15)',
        border: '2px dashed rgba(13, 79, 60, 0.2)'
      }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#0D4F3C' }}>
          {loading ? <Loader2 size={18} className="text-white animate-spin" /> : <Icon size={18} className="text-white" />}
        </div>
        <div className="font-bold text-[#0D4F3C]">{title}</div>
      </div>
      <div className="text-xs text-[#0D4F3C]/70 leading-relaxed">{desc}</div>
      <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0D4F3C]">
        <Upload size={12} /> {loading ? 'جاري المعالجة...' : 'اختر صورة'}
      </div>
    </button>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: 'rgba(139, 58, 58, 0.1)' }}>
      <AlertCircle size={14} className="text-[#8B3A3A] flex-shrink-0 mt-0.5" />
      <div className="text-xs text-[#8B3A3A]">{message}</div>
    </div>
  );
}
