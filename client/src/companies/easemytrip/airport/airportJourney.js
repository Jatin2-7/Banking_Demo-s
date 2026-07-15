/** EaseMyTrip Airport Services / Duty-Free journey */

export const AIRPORTS = [
  {
    id: 'mumbai',
    name: 'Mumbai',
    fullName: 'Chhatrapati Shivaji Maharaj International Airport',
    terminal: 'T2',
    type: 'International',
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #4a7ab0 100%)',
  },
  {
    id: 'amritsar',
    name: 'Amritsar',
    fullName: 'Shri Guru Ram Das Jee International Airport',
    terminal: 'T1',
    type: 'International',
    gradient: 'linear-gradient(135deg, #5d4e37 0%, #8b7355 50%, #c4a574 100%)',
  },
];

export const DUTY_FREE_CATEGORIES = [
  { id: 'hot_deals', label: 'Hot Deals', emoji: '🔥' },
  { id: 'beauty', label: 'Beauty', emoji: '💄' },
  { id: 'electronics', label: 'Electronics', emoji: '📱' },
  { id: 'online_exclusive', label: 'Online Exclusive', emoji: '✨' },
  { id: 'confectionery', label: 'Confectionery', emoji: '🍫' },
  { id: 'liquor', label: 'Liquor', emoji: '🥃', locked: true },
  { id: 'combos', label: 'Combos', emoji: '📦' },
  { id: 'brand_boutique', label: 'Brand Boutique', emoji: '🏷️' },
  { id: 'watches', label: 'Watches', emoji: '⌚' },
  { id: 'view_all', label: 'View All', emoji: '▦' },
];

export const FRAGRANCE_PRODUCTS = [
  { id: 'ck-eternity-amber', name: 'Calvin Klein Eternity Amber Essence Parfum Intense, 30ml', price: 2828, original: 4190, discount: 10, brand: 'Calvin Klein', color: '#2C1810' },
  { id: 'polo-blue', name: 'Polo Blue Eau De Toilette 75ml', price: 4504, original: 7150, discount: 10, brand: 'Ralph Lauren', color: '#1A3A5C' },
  { id: 'hugo-scent', name: 'Hugo Boss The Scent Eau de Toilette, 50ML', price: 4286, original: 6350, discount: 10, brand: 'Hugo Boss', color: '#8B4513' },
  { id: 'kenzo-homme-60', name: 'Kenzo Homme EDT Relift, 60ML', price: 4826, original: 7150, discount: 10, brand: 'Kenzo', color: '#2E8B57' },
  { id: 'hugo-bottled', name: 'Hugo Boss Bottled Elixir Parfum Intense For Him 50ml', price: 5055, original: 7490, discount: 10, brand: 'Hugo Boss', color: '#DAA520' },
  { id: 'davidoff-cool', name: 'Davidoff Coolwater for Women 50ml EDT Sp', price: 3890, original: 5800, discount: 10, brand: 'Davidoff', color: '#4682B4' },
  { id: 'ck-everyone', name: 'Calvin Klein Everyone EDP 50ml', price: 3650, original: 5400, discount: 10, brand: 'Calvin Klein', color: '#708090' },
  { id: 'flowerbomb', name: 'Viktor & Rolf Flowerbomb EDP 100ml', price: 8284, original: 13150, discount: 10, brand: 'Viktor & Rolf', color: '#FF69B4' },
  { id: 'kenzo-homme-100', name: 'Kenzo Eau Kenzo Homme Relift, 100ML', price: 6513, original: 9650, discount: 10, brand: 'Kenzo', color: '#228B22' },
  { id: 'kenzo-amour', name: 'Kenzo Amour Fuchsia Edition EDP, 100ML', price: 7526, original: 11150, discount: 10, brand: 'Kenzo', color: '#FF1493' },
  { id: 'burberry', name: 'Burberry Signatures Hawthorn Bloom Eau De Parfum', price: 15248, original: 22590, discount: 10, brand: 'Burberry', color: '#98D8C8' },
  { id: 'armani-acqua', name: 'Armani Acqua di Gioia EDP 100 ml', price: 7452, original: 11040, discount: 10, brand: 'Armani', color: '#90EE90' },
  { id: 'valentino', name: 'Valentino Born in Roma Donna Yellow Dream EDP', price: 9756, original: 14450, discount: 10, brand: 'Valentino', color: '#FFD700' },
  { id: 'estee-lauder', name: 'Estée Lauder Revitalizing Supreme+ Youth Power Eye Balm', price: 5231, original: 7750, discount: 10, brand: 'Estée Lauder', color: '#F5DEB3' },
  { id: 'flower-ikebana', name: 'Flower Ikebana By Kenzo, 40ML', price: 5771, original: 8550, discount: 10, brand: 'Kenzo', color: '#DDA0DD' },
];

export const PRODUCT_FILTERS = ['Sort', 'Skin Care', 'Travel Accessories', 'Exclusive', 'Toiletries'];

export const INITIAL_AIRPORT_FORM = {
  phase: 'home',
  airport: 'mumbai',
  terminal: 'T2',
  collectionType: 'arrival',
  category: 'fragrances',
  searchQuery: '',
  priceFilterMax: null,
  cartCount: 0,
  cartItems: [],
  lastAddedProductId: null,
  orderRef: '',
  activeNavTab: 'duty_free',
};

export function generateDutyFreeOrderRef() {
  return `DF${Date.now().toString().slice(-8)}`;
}

export function getProductById(id) {
  return FRAGRANCE_PRODUCTS.find((p) => p.id === id);
}

export function getCartTotal(cartItems = []) {
  return cartItems.reduce((sum, id) => sum + (getProductById(id)?.price || 0), 0);
}

export function getNextAirportPrompt(form) {
  if (form.phase === 'cart_prompt') {
    return 'Would you like to shop more or place the order?';
  }
  return null;
}

export function buildCartAddedReply(product) {
  const label = product?.brand || product?.name?.split(',')[0] || 'item';
  return `Added ${label} to your cart. Would you like to shop more or place the order?`;
}

export function filterProducts(products, { priceFilterMax, searchQuery } = {}) {
  let list = [...products];
  if (priceFilterMax != null && priceFilterMax > 0) {
    list = list.filter((p) => p.price <= priceFilterMax);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(
      (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q),
    );
  }
  return list;
}

export function formatPrice(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

export function formToAirportAgentState(form) {
  const lastProduct = form.lastAddedProductId ? getProductById(form.lastAddedProductId) : null;
  return {
    phase: form.phase,
    airport: form.airport,
    terminal: form.terminal,
    collection_type: form.collectionType,
    category: form.category,
    search_query: form.searchQuery,
    price_filter_max: form.priceFilterMax != null ? String(form.priceFilterMax) : '',
    cart_count: String(form.cartCount),
    cart_items: (form.cartItems || []).join(','),
    last_added_product: lastProduct?.name || '',
    order_ref: form.orderRef || '',
    active_nav_tab: form.activeNavTab,
    next_prompt: getNextAirportPrompt(form) || '',
  };
}

export function airportAgentStateToFormPatch(patch) {
  const map = {
    phase: 'phase',
    airport: 'airport',
    terminal: 'terminal',
    collection_type: 'collectionType',
    category: 'category',
    search_query: 'searchQuery',
    price_filter_max: 'priceFilterMax',
    cart_count: 'cartCount',
    cart_items: 'cartItems',
    order_ref: 'orderRef',
    active_nav_tab: 'activeNavTab',
  };
  const out = {};
  for (const [k, v] of Object.entries(patch)) {
    const key = map[k] || k;
    if (key === 'priceFilterMax') out[key] = v === '' || v == null ? null : parseInt(v, 10);
    else if (key === 'cartCount') out[key] = parseInt(v, 10) || 0;
    else if (key === 'cartItems') out[key] = String(v || '').split(',').filter(Boolean);
    else out[key] = v;
  }
  return out;
}

export function getAirport(id) {
  return AIRPORTS.find((a) => a.id === id) || AIRPORTS[0];
}
