import { DESTINATIONS, detectVisaCountry, getNextVisaPrompt } from '../visa/visaJourney.js';

function appendNext(reply, form, patch = {}) {
  const merged = { ...form, ...patch };
  const next = getNextVisaPrompt(merged);
  if (!next) return reply;
  if (reply && reply.includes(next)) return reply;
  return reply ? `${reply} ${next}` : next;
}

function countryLabel(id) {
  return DESTINATIONS.find((d) => d.id === id)?.name || id;
}

export function parseVisaVoiceInput(phase, text, form) {
  const t = String(text).toLowerCase().trim();
  const effectivePhase = phase || form.phase || 'home';
  const country = detectVisaCountry(text);

  if (country) {
    return {
      handled: true,
      action: 'search_destination',
      patch: { destination: country, searchQuery: country, phase: 'destination' },
      reply: appendNext(`Opening ${countryLabel(country)} visa.`, {
        ...form,
        destination: country,
        phase: 'destination',
      }),
    };
  }

  if (
    /\bvisa\b|apply\s*for\s*visa|visa\s*application|open\s*visa|want\s*(a\s*)?visa|need\s*(a\s*)?visa/.test(
      t,
    )
  ) {
    if (!form.destination) {
      if (effectivePhase === 'home' && !form.destination) {
        return {
          handled: true,
          action: 'open_visa',
          reply: 'Which country visa do you need? Singapore, Dubai, or Thailand?',
        };
      }
      return { handled: true, reply: getNextVisaPrompt(form) };
    }
  }

  if (/search|find|look\s*for/.test(t) && t.length > 6) {
    const dest = DESTINATIONS.find((d) => t.includes(d.name.toLowerCase()));
    if (dest) {
      return {
        handled: true,
        patch: { destination: dest.id, searchQuery: dest.name, phase: 'destination' },
        action: 'search_destination',
        reply: appendNext(`Opening ${dest.name} visa.`, {
          ...form,
          destination: dest.id,
          phase: 'destination',
        }),
      };
    }
  }

  if (/start\s*application|begin\s*application|apply\s*now|start\s*visa/.test(t)) {
    return {
      handled: true,
      action: 'start_application',
      reply: appendNext('Starting visa application.', { ...form, showDateModal: true }),
    };
  }

  if (/\b(proceed|continue|next)\b/.test(t)) {
    if (form.showDateModal || /date/.test(t)) {
      const dayMatch = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?/);
      const day = dayMatch ? parseInt(dayMatch[1], 10) : 15;
      return {
        handled: true,
        patch: { departureDate: String(day) },
        action: 'proceed_date',
        reply: appendNext(`Date set to ${day} July.`, {
          ...form,
          departureDate: String(day),
          phase: 'wizard',
          currentStep: 'upload_picture',
        }),
      };
    }
    if (form.phase === 'wizard') {
      if (form.currentStep === 'upload_picture' && !form.photoUploaded) {
        return {
          handled: true,
          patch: { photoUploaded: true },
          action: 'next_step',
          reply: appendNext('Photo uploaded.', {
            ...form,
            photoUploaded: true,
            currentStep: 'scan_passport',
          }),
        };
      }
      if (form.currentStep === 'scan_passport' && !form.passportScanned) {
        return {
          handled: true,
          patch: { passportScanned: true },
          action: 'next_step',
          reply: appendNext('Passport scanned.', {
            ...form,
            passportScanned: true,
            currentStep: 'traveller_details',
          }),
        };
      }
      if (form.currentStep === 'upload_picture' && form.photoUploaded) {
        return {
          handled: true,
          action: 'next_step',
          reply: appendNext('Moving to passport scan.', { ...form, currentStep: 'scan_passport' }),
        };
      }
      if (form.currentStep === 'scan_passport' && form.passportScanned) {
        return {
          handled: true,
          action: 'next_step',
          reply: appendNext('Moving to traveller details.', {
            ...form,
            currentStep: 'traveller_details',
          }),
        };
      }
      return { handled: true, action: 'next_step', reply: 'Continuing.' };
    }
    if (form.phase === 'destination') {
      return {
        handled: true,
        action: 'start_application',
        reply: appendNext('Opening date selection.', { ...form, showDateModal: true }),
      };
    }
  }

  if (/select\s*date|pick\s*date|departure\s*date|\d{1,2}(?:st|nd|rd|th)?\s*(?:july|jul)/.test(t)) {
    const dayMatch = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?/);
    const day = dayMatch ? parseInt(dayMatch[1], 10) : 15;
    return {
      handled: true,
      patch: { departureDate: String(day) },
      action: 'proceed_date',
      reply: appendNext(`Date set to ${day} July 2026.`, {
        ...form,
        departureDate: String(day),
        phase: 'wizard',
        currentStep: 'upload_picture',
      }),
    };
  }

  if (/upload\s*photo|take\s*photo|add\s*photo|photo\s*done/.test(t)) {
    const merged = { ...form, photoUploaded: true };
    const action = form.currentStep === 'upload_picture' ? 'next_step' : null;
    return {
      handled: true,
      patch: { photoUploaded: true },
      action,
      reply: appendNext('Photo uploaded.', {
        ...merged,
        currentStep: action ? 'scan_passport' : form.currentStep,
      }),
    };
  }

  if (/scan\s*passport|passport\s*scan|read\s*passport|passport\s*done/.test(t)) {
    const merged = { ...form, passportScanned: true };
    const action = form.currentStep === 'scan_passport' ? 'next_step' : null;
    return {
      handled: true,
      patch: { passportScanned: true },
      action,
      reply: appendNext('Passport scanned.', {
        ...merged,
        currentStep: action ? 'traveller_details' : form.currentStep,
      }),
    };
  }

  if (/submit|confirm|finish|complete/.test(t)) {
    return {
      handled: true,
      action: 'submit_application',
      reply: 'Submitting your visa application.',
    };
  }

  if (/tourist|business|transit/.test(t)) {
    const type = t.includes('business')
      ? 'Business'
      : t.includes('transit')
        ? 'Transit'
        : 'Tourist';
    return { handled: true, patch: { visaType: type }, reply: `Visa type set to ${type}.` };
  }

  if (/\b(\d+)\s*days?\b/.test(t)) {
    const m = t.match(/\b(\d+)\s*days?\b/);
    return { handled: true, patch: { duration: m[1] }, reply: `Duration set to ${m[1]} days.` };
  }

  if (/single\s*entry|multiple\s*entry/.test(t)) {
    const entry = t.includes('multiple') ? 'Multiple' : 'Single';
    return { handled: true, patch: { entryType: entry }, reply: `Entry type set to ${entry}.` };
  }

  const travMatch = t.match(/(\d+)\s*travell?ers?|add\s*(\d+)/);
  if (travMatch) {
    const n = parseInt(travMatch[1] || travMatch[2], 10);
    return { handled: true, patch: { travellers: n }, reply: `Travellers set to ${n}.` };
  }

  if (/fill|demo|sample/.test(t)) {
    return {
      handled: true,
      patch: {
        travellerName: 'Rahul Sharma',
        travellerPassport: 'P1234567',
        travellerDob: '15/08/1990',
        photoUploaded: true,
        passportScanned: true,
      },
      reply: 'Filled demo traveller details. Say submit to finish.',
    };
  }

  const nameMatch = text.match(/(?:name is|my name is|i am)\s+([a-z\s]+)/i);
  if (nameMatch) {
    return {
      handled: true,
      patch: { travellerName: nameMatch[1].trim() },
      reply: appendNext('Name updated.', { ...form, travellerName: nameMatch[1].trim() }),
    };
  }

  const passportMatch = text.match(/(?:passport|passport number)\s*(?:is\s*)?([a-z0-9]+)/i);
  if (passportMatch) {
    return {
      handled: true,
      patch: { travellerPassport: passportMatch[1].toUpperCase() },
      reply: appendNext('Passport number updated.', {
        ...form,
        travellerPassport: passportMatch[1].toUpperCase(),
      }),
    };
  }

  return { handled: false };
}

export function inferVisaDestination(text) {
  const t = String(text).toLowerCase();
  if (detectVisaCountry(text)) return 'visa_destination';
  if (/\bvisa\b|visa\s*application|apply\s*for\s*visa/.test(t)) return 'visa';
  return null;
}
