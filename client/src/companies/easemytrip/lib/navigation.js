/** EaseMyTrip navigation — speech + agent destination → UI view. */

export function resolveEmtNavigation(destination, _context = '') {
  const d = String(destination || '').toLowerCase().replace(/-/g, '_');
  if (d === 'forex_cash' || d === 'forex' || d === 'forex_cash_cards' || d === 'forex_cards') {
    return { view: 'forex_form' };
  }
  if (d === 'forex_form' || d === 'forex_booking' || d === 'globalpay' || d === 'book_forex') {
    return { view: 'forex_form' };
  }
  if (d === 'visa' || d === 'visa_application' || d === 'apply_visa' || d === 'visa_home') {
    return { view: 'visa_home' };
  }
  if (d === 'visa_destination' || d === 'singapore_visa' || d === 'search_visa') {
    return { view: 'visa_destination', destination: 'singapore' };
  }
  if (d === 'visa_wizard' || d === 'start_visa_application') {
    return { view: 'visa_wizard' };
  }
  if (d === 'airport_home' || d === 'airport_services' || d === 'airport') {
    return { view: 'airport_home' };
  }
  if (d === 'airport_select' || d === 'choose_airport') {
    return { view: 'airport_select' };
  }
  if (d === 'airport_duty_free' || d === 'duty_free') {
    return { view: 'duty_free' };
  }
  if (d === 'airport_products' || d === 'airport_perfumes' || d === 'fragrances' || d === 'perfumes') {
    return { view: 'duty_free_products', category: 'fragrances' };
  }
  if (d === 'flights' || d === 'flight_booking') return { view: 'dashboard', tab: 'home', highlight: 'flights' };
  if (d === 'hotels' || d === 'hotel_booking') return { view: 'dashboard', tab: 'home', highlight: 'hotels' };
  if (d === 'bookings' || d === 'my_bookings') return { view: 'dashboard', tab: 'bookings' };
  if (d === 'wallet') return { view: 'dashboard', tab: 'wallet' };
  if (d === 'profile') return { view: 'dashboard', tab: 'profile' };
  if (d === 'home' || d === 'dashboard') return { view: 'dashboard', tab: 'home' };
  return { view: 'dashboard', tab: 'home' };
}

export function inferEmtDestination(text = '') {
  const t = String(text).toLowerCase();
  if (/forex|currency\s*exchange|foreign\s*exchange|global\s*pay|money\s*transfer|forex\s*cash/.test(t)) return 'forex_form';
  if (/\bvisa\b|visa\s*application|apply\s*for\s*visa|singapore\s*visa|dubai\s*visa/.test(t)) return 'visa';
  if (/purchase|buy|shop|want|need|looking/.test(t) && /perfume|fragrance|cologne|scent/.test(t)) return 'airport_perfumes';
  if (/perfume|fragrance|cologne|scent|duty\s*free|duty-free|airport\s*service/.test(t)) return 'airport_perfumes';
  if (/airport\s*service|duty\s*free|duty-free|airport\s*shopping/.test(t)) return 'airport_services';
  if (/\bflights?\b|book\s*a?\s*flight|air\s*ticket/.test(t)) return 'flights';
  if (/\bhotels?\b|book\s*a?\s*hotel|hotel\s*room/.test(t)) return 'hotels';
  if (/\bbookings?\b|my\s*trips|my\s*bookings/.test(t)) return 'bookings';
  if (/\bwallet\b/.test(t)) return 'wallet';
  if (/\bprofile\b|my\s*account/.test(t)) return 'profile';
  if (/go\s*home|back\s*home|dashboard/.test(t)) return 'home';
  return null;
}
