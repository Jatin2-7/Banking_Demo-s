/** Voice input parser for Airport Services / Duty-Free journey */

import { buildCartAddedReply, FRAGRANCE_PRODUCTS } from '../airport/airportJourney.js';

function findProduct(query) {
  const q = String(query || '').toLowerCase();
  return FRAGRANCE_PRODUCTS.find(
    (p) =>
      p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.id.includes(q),
  );
}

export function parseAirportVoiceInput(text, form) {
  const t = String(text).toLowerCase().trim();

  if (form.phase === 'cart_prompt' || form.cartCount > 0) {
    if (
      /place\s*(the\s*)?order|checkout|confirm\s*order|proceed\s*to\s*pay|order\s*now|complete\s*order/.test(
        t,
      )
    ) {
      return {
        handled: true,
        action: 'place_order',
        reply: 'Your duty-free order has been placed.',
      };
    }
    if (
      /shop\s*more|continue\s*shopping|add\s*more|browse\s*more|more\s*items|keep\s*shopping/.test(
        t,
      )
    ) {
      return {
        handled: true,
        action: 'shop_more',
        reply: 'Sure, keep browsing. Tap ADD on any product you like.',
      };
    }
  }

  if (/airport\s*service|duty\s*free|duty-free|airport\s*shopping/.test(t)) {
    return { handled: true, action: 'open_airport', reply: 'Opening Airport Services.' };
  }

  if (
    /purchase|buy|shop\s*for|want|need|looking\s*for|show\s*me/.test(t) &&
    /perfume|fragrance|cologne|scent/.test(t)
  ) {
    const priceMatch = t.match(/under\s*(\d[\d,]*)\s*(?:rs|rupees?|₹)?/);
    const patch = { category: 'fragrances', searchQuery: '' };
    let reply = 'Opening fragrances — navigating to duty-free perfumes.';
    if (priceMatch) {
      const max = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      patch.priceFilterMax = max;
      reply = `Showing perfumes under ₹${max.toLocaleString('en-IN')}.`;
    }
    return { handled: true, action: 'open_perfumes', patch, reply };
  }

  if (/perfume|fragrance|cologne/.test(t)) {
    const priceMatch = t.match(/under\s*(\d[\d,]*)/);
    const patch = { category: 'fragrances' };
    if (priceMatch) {
      patch.priceFilterMax = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      return {
        handled: true,
        action: 'filter_price',
        patch,
        reply: `Filtering perfumes under ₹${patch.priceFilterMax.toLocaleString('en-IN')}.`,
      };
    }
    return { handled: true, action: 'open_perfumes', patch, reply: 'Opening fragrances section.' };
  }

  if (/under\s*(\d[\d,]*)\s*(?:rs|rupees?|₹)?/.test(t)) {
    const m = t.match(/under\s*(\d[\d,]*)/);
    const max = parseInt(m[1].replace(/,/g, ''), 10);
    return {
      handled: true,
      action: 'filter_price',
      patch: { priceFilterMax: max },
      reply: `Applied filter: under ₹${max.toLocaleString('en-IN')}.`,
    };
  }

  if (/\bmumbai\b/.test(t)) {
    return {
      handled: true,
      patch: { airport: 'mumbai', terminal: 'T2' },
      action: 'select_airport',
      reply: 'Selected Mumbai airport.',
    };
  }
  if (/\bamritsar\b/.test(t)) {
    return {
      handled: true,
      patch: { airport: 'amritsar', terminal: 'T1' },
      action: 'select_airport',
      reply: 'Selected Amritsar airport.',
    };
  }

  if (/duty\s*free|book\s*now|start\s*shopping/.test(t)) {
    return { handled: true, action: 'open_duty_free', reply: 'Opening duty-free shopping.' };
  }

  if (/collect\s*at\s*arrival|arrival/.test(t)) {
    return {
      handled: true,
      patch: { collectionType: 'arrival' },
      reply: 'Set to collect at arrival.',
    };
  }
  if (/collect\s*at\s*departure|departure/.test(t)) {
    return {
      handled: true,
      patch: { collectionType: 'departure' },
      reply: 'Set to collect at departure.',
    };
  }

  if (/clear\s*filter|show\s*all|remove\s*filter/.test(t)) {
    return {
      handled: true,
      patch: { priceFilterMax: null, searchQuery: '' },
      reply: 'Filters cleared.',
    };
  }

  if (/add\s+(.+)/.test(t)) {
    const m = t.match(/add\s+(.+)/);
    const product = findProduct(m[1].trim());
    if (product) {
      return {
        handled: true,
        action: 'add_product',
        product,
        reply: buildCartAddedReply(product),
      };
    }
    return {
      handled: true,
      action: 'add_product',
      query: m[1].trim(),
      reply: `Searching for ${m[1]}.`,
    };
  }

  if (/calvin|hugo|kenzo|polo|davidoff|armani|burberry|valentino/.test(t)) {
    const brand = t.includes('calvin')
      ? 'calvin'
      : t.includes('hugo')
        ? 'hugo'
        : t.includes('kenzo')
          ? 'kenzo'
          : t.includes('polo')
            ? 'polo'
            : t.includes('davidoff')
              ? 'davidoff'
              : t.includes('burberry')
                ? 'burberry'
                : t.includes('valentino')
                  ? 'valentino'
                  : 'armani';
    const product = findProduct(brand);
    if (product && /add|select|choose|want|buy|purchase|this|that/.test(t)) {
      return {
        handled: true,
        action: 'add_product',
        product,
        reply: buildCartAddedReply(product),
      };
    }
    return {
      handled: true,
      patch: { searchQuery: brand },
      action: 'open_perfumes',
      reply: `Searching for ${brand} fragrances.`,
    };
  }

  return { handled: false };
}

export function inferAirportDestination(text) {
  const t = String(text).toLowerCase();
  if (/airport|duty\s*free|duty-free/.test(t)) return 'airport_services';
  if (/perfume|fragrance/.test(t)) return 'airport_perfumes';
  return null;
}
