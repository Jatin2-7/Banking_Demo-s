import React from 'react';
import { PreOrderPill, ProductCard } from './AirportShell.jsx';
import {
  FRAGRANCE_PRODUCTS,
  PRODUCT_FILTERS,
  filterProducts,
  getAirport,
  formatPrice,
} from './airportJourney.js';
import { EMT } from '../theme.js';

export default function DutyFreeProductsScreen({ form, onChange, onBack, onAddToCart }) {
  const airport = getAirport(form.airport);
  const products = filterProducts(FRAGRANCE_PRODUCTS, {
    priceFilterMax: form.priceFilterMax,
    searchQuery: form.searchQuery,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <header className="shrink-0 text-white" style={{ backgroundColor: '#1A8ADB' }}>
        <div className="flex items-center gap-2 px-3 py-3">
          <button type="button" onClick={onBack} className="press">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-[15px] font-semibold">Airport Services</span>
        </div>
      </header>

      <div className="shrink-0 border-b border-emt-borderLight bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="press flex h-8 w-8 items-center justify-center rounded-full border border-emt-border">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" className="flex items-center gap-1 text-[13px] font-semibold text-emt-ink press">
            Fragrances
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" />
            </svg>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <PreOrderPill />
            <button type="button" className="press text-emt-muted">🔍</button>
            <button type="button" className="press relative">
              🛍️
              {form.cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">
                  {form.cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <button
          type="button"
          className="mt-2 w-full rounded-lg px-3 py-2 text-left text-[11px] font-medium press"
          style={{ backgroundColor: '#E8F3FF', color: EMT.brandBlue }}
        >
          {airport.name} - Terminal {airport.terminal}, {form.collectionType === 'arrival' ? 'Arrival' : 'Departure'} ▾
        </button>
      </div>

      <div
        className="shrink-0 px-4 py-3"
        style={{ background: 'linear-gradient(90deg, #F8BBD9 0%, #E91E63 100%)' }}
      >
        <p className="text-[12px] font-bold text-white">Get up to 10% off on pre-orders.</p>
        <p className="text-[8px] text-white/80">T&C apply</p>
      </div>

      {form.priceFilterMax && (
        <div className="shrink-0 flex items-center justify-between bg-amber-50 px-4 py-2">
          <span className="text-[11px] font-medium text-amber-800">
            Showing perfumes under {formatPrice(form.priceFilterMax)}
          </span>
          <button
            type="button"
            onClick={() => onChange({ priceFilterMax: null })}
            className="text-[11px] font-semibold text-amber-900 press"
          >
            Clear ✕
          </button>
        </div>
      )}

      <div className="shrink-0 flex gap-2 overflow-x-auto border-b border-emt-borderLight px-3 py-2">
        {PRODUCT_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className="shrink-0 rounded-full border border-emt-border px-3 py-1 text-[10px] font-medium text-emt-ink press"
          >
            {f}{f === 'Sort' ? ' ▾' : ''}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
            <p className="text-[14px] font-semibold text-emt-ink">No products found</p>
            <p className="mt-2 text-[12px] text-emt-muted">
              Try adjusting your price filter or search query.
            </p>
            <button
              type="button"
              onClick={() => onChange({ priceFilterMax: null, searchQuery: '' })}
              className="mt-4 text-[12px] font-semibold press"
              style={{ color: EMT.brandBlue }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={onAddToCart} />
            ))}
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-4 px-4 pb-6">
            <div className="rounded-xl p-3" style={{ backgroundColor: '#F3E8FF' }}>
              <p className="flex items-center gap-1 text-[12px] font-bold text-emt-ink">
                📈 Trending Products
              </p>
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {FRAGRANCE_PRODUCTS.slice(0, 3).map((p) => (
                  <div key={p.id} className="shrink-0 rounded-lg bg-white p-2 shadow-sm">
                    <div className="h-16 w-10 rounded" style={{ backgroundColor: `${p.color}40` }} />
                    <p className="mt-1 max-w-[5rem] truncate text-[8px] font-medium">{p.brand}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
