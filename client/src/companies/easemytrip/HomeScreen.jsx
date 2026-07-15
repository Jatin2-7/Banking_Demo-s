import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import EmtHomeDashboard from './components/EmtHomeDashboard.jsx';
import ForexCashScreen from './forex/ForexCashScreen.jsx';
import ForexSuccessScreen from './forex/ForexSuccessScreen.jsx';
import VisaHomeScreen from './visa/VisaHomeScreen.jsx';
import VisaDestinationScreen from './visa/VisaDestinationScreen.jsx';
import VisaDateModal from './visa/VisaDateModal.jsx';
import VisaWizardScreen from './visa/VisaWizardScreen.jsx';
import VisaSuccessScreen from './visa/VisaSuccessScreen.jsx';
import AirportHomeScreen from './airport/AirportHomeScreen.jsx';
import AirportSelectScreen from './airport/AirportSelectScreen.jsx';
import DutyFreeScreen from './airport/DutyFreeScreen.jsx';
import DutyFreeProductsScreen from './airport/DutyFreeProductsScreen.jsx';
import DutyFreeOrderSuccessScreen from './airport/DutyFreeOrderSuccessScreen.jsx';
import LoanAguiPanel from '../../components/LoanAguiPanel.jsx';
import DemoPanel from '../../components/DemoPanel.jsx';
import { useCompanyAgents } from '../../shared/lib/companyAgents.js';
import { DEFAULT_LANG } from '../../i18n/strings.js';
import { resolveEmtNavigation, inferEmtDestination } from './lib/navigation.js';
import {
  parseForexVoiceInput,
  parseForexLandingVoice,
  parseForexIntent,
} from './lib/forexInputParser.js';
import { parseVisaVoiceInput } from './lib/visaInputParser.js';
import { parseAirportVoiceInput } from './lib/airportInputParser.js';
import {
  INITIAL_FOREX_FORM,
  formToAgentState,
  agentStateToFormPatch,
  generateOrderRef,
  recalcForexAmounts,
} from './forex/forexJourney.js';
import {
  INITIAL_VISA_FORM,
  formToVisaAgentState,
  visaAgentStateToFormPatch,
  generateVisaRef,
  formatVisaDate,
  VISA_STEPS,
  stepIndex,
} from './visa/visaJourney.js';
import {
  INITIAL_AIRPORT_FORM,
  formToAirportAgentState,
  airportAgentStateToFormPatch,
  FRAGRANCE_PRODUCTS,
  buildCartAddedReply,
  generateDutyFreeOrderRef,
  getProductById,
} from './airport/airportJourney.js';

const VISA_VIEWS = ['visa_home', 'visa_destination', 'visa_wizard', 'visa_success'];
const FOREX_FORM_VIEWS = ['forex_form', 'forex_success'];
const AIRPORT_VIEWS = [
  'airport_home',
  'airport_select',
  'duty_free',
  'duty_free_products',
  'duty_free_success',
];

/** EaseMyTrip demo — home + forex + visa + airport journeys with voice concierge. */
export default function EasemytripHomeScreen() {
  const agents = useCompanyAgents();
  const [lang, setLang] = useState(DEFAULT_LANG);
  const [voiceAssistMode, setVoiceAssistMode] = useState(true);
  const [view, setView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('home');
  const [forexForm, setForexForm] = useState({ ...INITIAL_FOREX_FORM });
  const [visaForm, setVisaForm] = useState({ ...INITIAL_VISA_FORM });
  const [airportForm, setAirportForm] = useState({ ...INITIAL_AIRPORT_FORM });
  const [aiOpen, setAiOpen] = useState(false);
  const [gestureListen, setGestureListen] = useState(false);
  const [aiPrimer, setAiPrimer] = useState(null);
  const [panelKey, setPanelKey] = useState(0);
  const [selectedDateDay, setSelectedDateDay] = useState(15);

  const forexRef = useRef(forexForm);
  const visaRef = useRef(visaForm);
  const airportRef = useRef(airportForm);
  forexRef.current = forexForm;
  visaRef.current = visaForm;
  airportRef.current = airportForm;
  const forexToolHandlerRef = useRef(null);
  const visaToolHandlerRef = useRef(null);
  const airportToolHandlerRef = useRef(null);
  const pendingForexOpenRef = useRef(null);
  const pendingAirportProductsRef = useRef(null);
  const pendingVisaDestinationRef = useRef(null);

  useEffect(() => {
    setPanelKey((k) => k + 1);
  }, [voiceAssistMode]);

  const openAssistant = useCallback((opts = {}) => {
    setAiOpen(true);
    if (opts.gestureListen) setGestureListen(true);
    setAiPrimer(opts.primer ?? null);
  }, []);

  const goHome = useCallback(() => {
    setView('dashboard');
    setActiveTab('home');
    setForexForm({ ...INITIAL_FOREX_FORM });
    setVisaForm({ ...INITIAL_VISA_FORM });
    setAirportForm({ ...INITIAL_AIRPORT_FORM });
    setAiOpen(false);
    setAiPrimer(null);
  }, []);

  const openForexForm = useCallback(
    (partner = 'globalpay', patch = {}, opts = {}) => {
      setForexForm(() => {
        const base = { ...INITIAL_FOREX_FORM, partner, ...patch };
        return { ...base, ...recalcForexAmounts(base, patch) };
      });
      setView('forex_form');
      if (voiceAssistMode || opts.openVoice)
        setTimeout(() => openAssistant({ gestureListen: true }), 400);
    },
    [voiceAssistMode, openAssistant],
  );

  const openVisaHome = useCallback(
    (opts = {}) => {
      setVisaForm({ ...INITIAL_VISA_FORM, phase: 'home' });
      setView('visa_home');
      if (voiceAssistMode || opts.openVoice)
        setTimeout(() => openAssistant({ gestureListen: true }), 400);
    },
    [voiceAssistMode, openAssistant],
  );

  const openVisaDestination = useCallback(
    (destinationId = 'singapore', opts = {}) => {
      setVisaForm((prev) => ({
        ...prev,
        phase: 'destination',
        destination: destinationId,
        searchQuery: destinationId,
      }));
      setView('visa_destination');
      if (voiceAssistMode || opts.openVoice)
        setTimeout(() => openAssistant({ gestureListen: true }), 400);
    },
    [voiceAssistMode, openAssistant],
  );

  const openAirportHome = useCallback(
    (opts = {}) => {
      setAirportForm({ ...INITIAL_AIRPORT_FORM, phase: 'home' });
      setView('airport_home');
      if (voiceAssistMode || opts.openVoice)
        setTimeout(() => openAssistant({ gestureListen: true }), 400);
    },
    [voiceAssistMode, openAssistant],
  );

  const openAirportSelect = useCallback(
    (opts = {}) => {
      setAirportForm((prev) => ({ ...prev, phase: 'select' }));
      setView('airport_select');
      if (voiceAssistMode || opts.openVoice)
        setTimeout(() => openAssistant({ gestureListen: true }), 400);
    },
    [voiceAssistMode, openAssistant],
  );

  const openDutyFree = useCallback(
    (opts = {}) => {
      setAirportForm((prev) => ({ ...prev, phase: 'duty_free', activeNavTab: 'duty_free' }));
      setView('duty_free');
      if (voiceAssistMode || opts.openVoice)
        setTimeout(() => openAssistant({ gestureListen: true }), 400);
    },
    [voiceAssistMode, openAssistant],
  );

  const openDutyFreeProducts = useCallback(
    (patch = {}, opts = {}) => {
      setAirportForm((prev) => ({
        ...prev,
        ...patch,
        phase: 'products',
        category: patch.category || 'fragrances',
        activeNavTab: 'duty_free',
      }));
      setView('duty_free_products');
      if (voiceAssistMode || opts.openVoice)
        setTimeout(() => openAssistant({ gestureListen: true }), 400);
    },
    [voiceAssistMode, openAssistant],
  );

  const handleNavigate = useCallback(
    (destination) => {
      const nav = resolveEmtNavigation(destination);
      if (nav.view === 'forex_landing' || nav.view === 'forex_form')
        return openForexForm('globalpay', {}, { openVoice: true });
      if (nav.view === 'visa_home') return openVisaHome({ openVoice: true });
      if (nav.view === 'visa_destination')
        return openVisaDestination(nav.destination || 'singapore', { openVoice: true });
      if (nav.view === 'visa_wizard') {
        setVisaForm((prev) => ({ ...prev, phase: 'wizard', currentStep: 'upload_picture' }));
        setView('visa_wizard');
        return;
      }
      if (nav.view === 'airport_home') return openAirportHome({ openVoice: true });
      if (nav.view === 'airport_select') return openAirportSelect({ openVoice: true });
      if (nav.view === 'duty_free') return openDutyFree({ openVoice: true });
      if (nav.view === 'duty_free_products') {
        return openDutyFreeProducts(
          { category: nav.category || 'fragrances', airport: 'mumbai' },
          { openVoice: true },
        );
      }
      if (nav.tab) setActiveTab(nav.tab);
      setView('dashboard');
    },
    [
      openForexForm,
      openVisaHome,
      openVisaDestination,
      openAirportHome,
      openAirportSelect,
      openDutyFree,
      openDutyFreeProducts,
    ],
  );

  const handleServiceTap = useCallback(
    (serviceId) => {
      if (serviceId === 'forex_cash') return openForexForm('globalpay', {}, { openVoice: true });
      if (serviceId === 'visa') return openVisaHome({ openVoice: true });
      if (serviceId === 'airport') return openAirportHome({ openVoice: true });
      if (serviceId === 'flights' || serviceId === 'hotels') {
        setActiveTab('home');
        setView('dashboard');
        openAssistant({ gestureListen: true, primer: `Customer tapped ${serviceId}.` });
      }
    },
    [openForexForm, openVisaHome, openAirportHome, openAssistant],
  );

  const applyForexPatch = useCallback((patch) => {
    if (!patch || !Object.keys(patch).length) return;
    setForexForm((prev) => {
      const amounts = recalcForexAmounts(prev, patch);
      return { ...prev, ...amounts };
    });
  }, []);

  const applyVisaPatch = useCallback((patch) => {
    if (!patch || !Object.keys(patch).length) return;
    setVisaForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyAirportPatch = useCallback((patch) => {
    if (!patch || !Object.keys(patch).length) return;
    setAirportForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleAirportSelect = useCallback((airportId) => {
    setAirportForm((prev) => ({
      ...prev,
      airport: airportId,
      terminal: airportId === 'mumbai' ? 'T2' : 'T1',
      phase: 'duty_free',
    }));
    setView('duty_free');
  }, []);

  const handleAddToCart = useCallback((product, { announce = true } = {}) => {
    const p = typeof product === 'string' ? getProductById(product) : product;
    if (!p) return;
    const reply = buildCartAddedReply(p);
    setAirportForm((prev) => ({
      ...prev,
      cartCount: prev.cartCount + 1,
      cartItems: [...(prev.cartItems || []), p.id],
      lastAddedProductId: p.id,
      phase: 'cart_prompt',
    }));
    if (announce) {
      setAiOpen(true);
      setAiPrimer(`Customer added "${p.name}" to cart. Say exactly: "${reply}"`);
      setGestureListen(true);
    }
    return reply;
  }, []);

  const handlePlaceDutyFreeOrder = useCallback(() => {
    setAirportForm((prev) => ({
      ...prev,
      phase: 'success',
      orderRef: prev.orderRef || generateDutyFreeOrderRef(),
    }));
    setView('duty_free_success');
    setAiOpen(false);
    setAiPrimer(null);
  }, []);

  const handleShopMore = useCallback(() => {
    setAirportForm((prev) => ({ ...prev, phase: 'products' }));
    if (view !== 'duty_free_products') openDutyFreeProducts({ category: 'fragrances' });
  }, [view, openDutyFreeProducts]);

  const handleAirportAgentAction = useCallback(
    (btn) => {
      if (btn === 'book_duty_free') openAirportSelect();
      else if (btn === 'select_airport') openDutyFree();
      else if (btn === 'open_fragrances') openDutyFreeProducts({ category: 'fragrances' });
      else if (btn === 'apply_price_filter') {
        const max = airportRef.current.priceFilterMax;
        if (max) openDutyFreeProducts({ priceFilterMax: max, category: 'fragrances' });
        else openDutyFreeProducts({ category: 'fragrances' });
      } else if (btn === 'clear_filters')
        applyAirportPatch({ priceFilterMax: null, searchQuery: '' });
      else if (btn === 'add_to_cart')
        handleAddToCart(getProductById(airportRef.current.lastAddedProductId));
      else if (btn === 'place_order') handlePlaceDutyFreeOrder();
      else if (btn === 'shop_more') handleShopMore();
      else if (btn === 'back_to_home') goHome();
    },
    [
      openAirportSelect,
      openDutyFree,
      openDutyFreeProducts,
      applyAirportPatch,
      handleAddToCart,
      handlePlaceDutyFreeOrder,
      handleShopMore,
      goHome,
    ],
  );

  const processAirportVoice = useCallback(
    (text) => {
      const parsed = parseAirportVoiceInput(text, airportRef.current);
      if (!parsed.handled) return false;
      if (parsed.action === 'open_airport') {
        openAirportHome();
        return parsed.reply;
      }
      if (parsed.action === 'open_duty_free') {
        if (airportRef.current.airport) openDutyFree();
        else openAirportSelect();
        return parsed.reply;
      }
      if (parsed.action === 'open_perfumes') {
        const patch = {
          airport: 'mumbai',
          terminal: 'T2',
          category: 'fragrances',
          ...(parsed.patch || {}),
        };
        openDutyFreeProducts(patch);
        return parsed.reply;
      }
      if (parsed.action === 'filter_price') {
        const patch = parsed.patch || {};
        if (AIRPORT_VIEWS.includes(view) && view === 'duty_free_products') {
          applyAirportPatch(patch);
        } else {
          openDutyFreeProducts({
            airport: 'mumbai',
            terminal: 'T2',
            category: 'fragrances',
            ...patch,
          });
        }
        return parsed.reply;
      }
      if (parsed.action === 'select_airport') {
        if (parsed.patch) applyAirportPatch(parsed.patch);
        openDutyFree();
        return parsed.reply;
      }
      if (parsed.action === 'add_product') {
        if (parsed.product) {
          handleAddToCart(parsed.product, { announce: false });
          return parsed.reply;
        }
        const q = parsed.query?.toLowerCase() || '';
        const match = FRAGRANCE_PRODUCTS.find(
          (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q),
        );
        if (match) {
          handleAddToCart(match, { announce: false });
          return buildCartAddedReply(match);
        }
        if (!AIRPORT_VIEWS.includes(view)) {
          openDutyFreeProducts({ searchQuery: parsed.query, category: 'fragrances' });
        } else {
          applyAirportPatch({ searchQuery: parsed.query });
        }
        return parsed.reply;
      }
      if (parsed.action === 'place_order') {
        if (airportRef.current.cartCount < 1) {
          return 'Your cart is empty. Please add an item first.';
        }
        handlePlaceDutyFreeOrder();
        return parsed.reply;
      }
      if (parsed.action === 'shop_more') {
        handleShopMore();
        return parsed.reply;
      }
      if (parsed.patch) applyAirportPatch(parsed.patch);
      return parsed.reply || 'Updated.';
    },
    [
      view,
      openAirportHome,
      openAirportSelect,
      openDutyFree,
      openDutyFreeProducts,
      applyAirportPatch,
      handleAddToCart,
      handlePlaceDutyFreeOrder,
      handleShopMore,
    ],
  );

  const handleStartVisaApplication = useCallback(() => {
    setVisaForm((prev) => ({ ...prev, showDateModal: true }));
    setSelectedDateDay(15);
  }, []);

  const handleProceedDate = useCallback(() => {
    const label = formatVisaDate(selectedDateDay, 6, 2026);
    setVisaForm((prev) => ({
      ...prev,
      showDateModal: false,
      phase: 'wizard',
      currentStep: 'upload_picture',
      departureDate: String(selectedDateDay),
      departureDateLabel: label,
    }));
    setView('visa_wizard');
  }, [selectedDateDay]);

  const handleVisaNextStep = useCallback(() => {
    setVisaForm((prev) => {
      const idx = stepIndex(prev.currentStep);
      const next = VISA_STEPS[Math.min(idx + 1, VISA_STEPS.length - 1)];
      return { ...prev, currentStep: next };
    });
  }, []);

  const handleVisaSubmit = useCallback(() => {
    setVisaForm((prev) => ({ ...prev, phase: 'success', applicationRef: generateVisaRef() }));
    setView('visa_success');
    setAiOpen(false);
  }, []);

  const handleVisaAgentAction = useCallback(
    (btn) => {
      if (btn === 'start_application') handleStartVisaApplication();
      else if (btn === 'proceed_date') handleProceedDate();
      else if (btn === 'upload_photo') applyVisaPatch({ photoUploaded: true });
      else if (btn === 'scan_passport') applyVisaPatch({ passportScanned: true });
      else if (btn === 'next_step') handleVisaNextStep();
      else if (btn === 'submit_application') handleVisaSubmit();
      else if (btn === 'search') {
        const q = visaRef.current.searchQuery || 'singapore';
        openVisaDestination(
          q.includes('dubai') ? 'dubai' : q.includes('thai') ? 'thailand' : 'singapore',
        );
      } else if (btn === 'back_to_home') goHome();
    },
    [
      handleStartVisaApplication,
      handleProceedDate,
      applyVisaPatch,
      handleVisaNextStep,
      handleVisaSubmit,
      openVisaDestination,
      goHome,
    ],
  );

  const processVisaVoice = useCallback(
    (text, { deferNav = false } = {}) => {
      const phase =
        view === 'visa_home'
          ? 'home'
          : view === 'visa_destination'
            ? 'destination'
            : view === 'visa_wizard'
              ? 'wizard'
              : visaRef.current.phase;
      const parsed = parseVisaVoiceInput(phase, text, visaRef.current);
      if (!parsed.handled) return false;

      if (parsed.action === 'open_visa') {
        if (deferNav && view === 'dashboard') {
          return { reply: parsed.reply, deferNavigate: { destination: 'visa_home' } };
        }
        openVisaHome();
        return parsed.reply;
      }

      if (parsed.action === 'search_destination') {
        const id = parsed.patch?.destination || 'singapore';
        if (parsed.patch) applyVisaPatch(parsed.patch);
        if (deferNav && !VISA_VIEWS.includes(view)) {
          pendingVisaDestinationRef.current = id;
          return { reply: parsed.reply, deferNavigate: { destination: 'visa_destination' } };
        }
        openVisaDestination(id);
        return parsed.reply;
      }

      if (parsed.action === 'start_application') {
        handleStartVisaApplication();
        return parsed.reply;
      }
      if (parsed.action === 'proceed_date') {
        if (parsed.patch?.departureDate)
          setSelectedDateDay(parseInt(parsed.patch.departureDate, 10));
        handleProceedDate();
        return parsed.reply;
      }
      if (parsed.action === 'next_step') {
        if (parsed.patch) applyVisaPatch(parsed.patch);
        handleVisaNextStep();
        return parsed.reply;
      }
      if (parsed.action === 'submit_application') {
        applyVisaPatch({
          travellerName: visaRef.current.travellerName || 'Rahul Sharma',
          travellerPassport: visaRef.current.travellerPassport || 'P1234567',
          photoUploaded: true,
          passportScanned: true,
        });
        setTimeout(() => handleVisaSubmit(), 0);
        return parsed.reply || 'Your visa application has been submitted.';
      }
      if (parsed.patch) applyVisaPatch(parsed.patch);
      return parsed.reply || 'Updated.';
    },
    [
      view,
      openVisaHome,
      openVisaDestination,
      applyVisaPatch,
      handleStartVisaApplication,
      handleProceedDate,
      handleVisaNextStep,
      handleVisaSubmit,
    ],
  );

  const handleOrderNow = useCallback(() => {
    setForexForm((p) => ({ ...p, phase: 'success', orderRef: generateOrderRef() }));
    setView('forex_success');
    setAiOpen(false);
  }, []);

  const processForexVoice = useCallback(
    (text) => {
      const parsed = parseForexVoiceInput(forexRef.current.phase, text, forexRef.current);
      if (!parsed.handled) return false;

      if (parsed.action === 'complete_order' || parsed.action === 'order_now') {
        handleOrderNow();
        return parsed.reply || 'Your forex order is complete.';
      }

      if (parsed.patch) applyForexPatch(parsed.patch);
      return parsed.reply || 'Updated.';
    },
    [applyForexPatch, handleOrderNow],
  );

  const openForexFormWithData = useCallback(
    (partner = 'globalpay', patch = {}) => {
      openForexForm(partner, patch);
    },
    [openForexForm],
  );

  const processForexLandingVoice = useCallback(
    (text, { deferNav = false } = {}) => {
      const intent = parseForexIntent(text);
      if (intent) {
        const data = { partner: 'globalpay', patch: intent.patch || {} };
        if (deferNav) {
          pendingForexOpenRef.current = data;
          return { reply: intent.reply, deferNavigate: { destination: 'forex_form' } };
        }
        openForexFormWithData(data.partner, data.patch);
        return intent.reply;
      }
      const parsed = parseForexLandingVoice(text);
      if (!parsed.handled) return false;
      const data = {
        partner: parsed.partner || 'globalpay',
        patch: parsed.patch || {},
        formAction: parsed.formAction,
      };
      if (deferNav) {
        pendingForexOpenRef.current = data;
        return { reply: parsed.reply, deferNavigate: { destination: 'forex_form' } };
      }
      openForexFormWithData(data.partner, data.patch);
      if (parsed.formAction === 'complete_order' || parsed.formAction === 'order_now') {
        setTimeout(() => handleOrderNow(), 0);
      }
      return parsed.reply;
    },
    [openForexFormWithData, handleOrderNow],
  );

  const handleAgentFormChange = useCallback(
    (next) => {
      const nav = next?.navigate_to;
      if (nav?.destination) {
        if (nav.destination === 'visa_home') return openVisaHome();
        if (nav.destination === 'visa_destination')
          return openVisaDestination(visaRef.current.destination || 'singapore');
        if (nav.destination === 'visa_wizard') {
          setView('visa_wizard');
          applyVisaPatch({ phase: 'wizard' });
          return;
        }
        if (nav.destination === 'airport_home') return openAirportHome();
        if (nav.destination === 'airport_select') return openAirportSelect();
        if (nav.destination === 'airport_duty_free') return openDutyFree();
        if (nav.destination === 'airport_products') {
          return openDutyFreeProducts({
            category: 'fragrances',
            priceFilterMax: airportRef.current.priceFilterMax,
          });
        }
        if (nav.destination === 'home') return goHome();
        if (nav.destination === 'forex_form') return openForexForm('globalpay');
        handleNavigate(nav.destination);
        return;
      }
      if (next?.__action?.button) {
        if (AIRPORT_VIEWS.includes(view)) {
          handleAirportAgentAction(next.__action.button);
          return;
        }
        if (VISA_VIEWS.includes(view) || visaRef.current.phase) {
          handleVisaAgentAction(next.__action.button);
          return;
        }
        if (FOREX_FORM_VIEWS.includes(view)) {
          const btn = next.__action.button;
          if (btn === 'order_now' || btn === 'proceed' || btn === 'confirm_order') handleOrderNow();
          else if (btn === 'back_to_home') goHome();
        }
        return;
      }
      if (AIRPORT_VIEWS.includes(view)) applyAirportPatch(airportAgentStateToFormPatch(next));
      else if (VISA_VIEWS.includes(view)) applyVisaPatch(visaAgentStateToFormPatch(next));
      else if (FOREX_FORM_VIEWS.includes(view)) applyForexPatch(agentStateToFormPatch(next));
    },
    [
      view,
      handleNavigate,
      goHome,
      openVisaHome,
      openVisaDestination,
      openAirportHome,
      openAirportSelect,
      openDutyFree,
      openDutyFreeProducts,
      openForexForm,
      applyVisaPatch,
      applyAirportPatch,
      applyForexPatch,
      handleVisaAgentAction,
      handleAirportAgentAction,
      handleOrderNow,
    ],
  );

  const handleAgentToolCall = useCallback(
    (name, args) => {
      if (name === 'navigate_to' && args?.destination) {
        if (args.destination === 'forex_form' && pendingForexOpenRef.current) {
          const p = pendingForexOpenRef.current;
          pendingForexOpenRef.current = null;
          openForexFormWithData(p.partner, p.patch);
          if (p.formAction === 'complete_order' || p.formAction === 'order_now')
            setTimeout(() => handleOrderNow(), 0);
          return;
        }
        if (args.destination === 'airport_perfumes' && pendingAirportProductsRef.current) {
          const patch = pendingAirportProductsRef.current;
          pendingAirportProductsRef.current = null;
          openDutyFreeProducts(patch);
          return;
        }
        if (args.destination === 'visa_destination' && pendingVisaDestinationRef.current) {
          const id = pendingVisaDestinationRef.current;
          pendingVisaDestinationRef.current = null;
          openVisaDestination(id);
          return;
        }
        handleNavigate(args.destination);
        return;
      }
      if (AIRPORT_VIEWS.includes(view)) airportToolHandlerRef.current?.(name, args);
      else if (VISA_VIEWS.includes(view)) visaToolHandlerRef.current?.(name, args);
      else if (view === 'forex_form') forexToolHandlerRef.current?.(name, args);
    },
    [
      handleNavigate,
      view,
      openForexFormWithData,
      openDutyFreeProducts,
      openVisaDestination,
      handleOrderNow,
    ],
  );

  const NAV_REPLY_LABELS = {
    forex_cash: 'Opening your forex order.',
    forex_form: 'Opening your forex order.',
    visa: 'Which country visa do you need? Singapore, Dubai, or Thailand?',
    visa_destination: 'Opening visa destination.',
    airport_services: 'Opening Airport Services.',
    airport_perfumes: 'Opening duty-free fragrances.',
    flights: 'Flights coming soon.',
    hotels: 'Hotels coming soon.',
    bookings: 'Opening your bookings.',
    wallet: 'Opening wallet.',
    profile: 'Opening profile.',
    home: 'Taking you back to home.',
  };

  const handleVoiceUserMessage = useCallback(
    (text) => {
      const forexIntent = parseForexIntent(text);
      const airportIntent = /airport|duty|perfume|fragrance|cologne|scent|under\s*\d/i.test(text);
      if (AIRPORT_VIEWS.includes(view) || airportIntent) {
        const r = processAirportVoice(text);
        if (r !== false) return r;
      }
      const visaIntent =
        /\bvisa\b|visa\s*application|apply\s*for\s*visa|singapore\s*visa|dubai\s*visa|thailand\s*visa/i.test(
          text,
        );
      if (VISA_VIEWS.includes(view) || visaIntent) {
        const r = processVisaVoice(text, { deferNav: view === 'dashboard' });
        if (r !== false) return r;
      }
      if (forexIntent || FOREX_FORM_VIEWS.includes(view)) {
        if (view === 'dashboard' || !FOREX_FORM_VIEWS.includes(view)) {
          const r = processForexLandingVoice(text, { deferNav: true });
          if (r !== false) return r;
        }
        const r = processForexVoice(text);
        if (r !== false) return r;
      }
      const dest = inferEmtDestination(text);
      if (dest && dest !== 'visa') {
        if (dest === 'airport_perfumes') {
          const priceMatch = text.match(/under\s*(\d[\d,]*)/i);
          const patch = { category: 'fragrances', airport: 'mumbai', terminal: 'T2' };
          if (priceMatch) patch.priceFilterMax = parseInt(priceMatch[1].replace(/,/g, ''), 10);
          pendingAirportProductsRef.current = patch;
          return {
            reply: patch.priceFilterMax
              ? `Showing perfumes under ₹${patch.priceFilterMax.toLocaleString('en-IN')}.`
              : 'Opening duty-free fragrances.',
            deferNavigate: { destination: 'airport_perfumes' },
          };
        }
        const reply = NAV_REPLY_LABELS[dest] || 'Redirecting now.';
        return { reply, deferNavigate: { destination: dest } };
      }
      return false;
    },
    [view, processAirportVoice, processVisaVoice, processForexLandingVoice, processForexVoice],
  );

  const handleAfterAssistantReply = useCallback(
    (userText) => {
      const airportIntent = /airport|duty|perfume|fragrance|cologne|scent|under\s*\d/i.test(
        userText,
      );
      if (AIRPORT_VIEWS.includes(view) || airportIntent) processAirportVoice(userText);
      else if (VISA_VIEWS.includes(view)) processVisaVoice(userText);
      else if (FOREX_FORM_VIEWS.includes(view)) processForexVoice(userText);
      else if (parseForexIntent(userText)) processForexLandingVoice(userText);
      else {
        const dest = inferEmtDestination(userText);
        if (dest === 'airport_perfumes') {
          const priceMatch = userText.match(/under\s*(\d[\d,]*)/i);
          const patch = { category: 'fragrances', airport: 'mumbai', terminal: 'T2' };
          if (priceMatch) patch.priceFilterMax = parseInt(priceMatch[1].replace(/,/g, ''), 10);
          openDutyFreeProducts(patch);
        } else if (dest) handleNavigate(dest);
      }
    },
    [
      view,
      processAirportVoice,
      processVisaVoice,
      processForexLandingVoice,
      processForexVoice,
      handleNavigate,
      openDutyFreeProducts,
    ],
  );

  const isForexFormJourney = FOREX_FORM_VIEWS.includes(view);
  const isVisaJourney = VISA_VIEWS.includes(view);
  const isAirportJourney = AIRPORT_VIEWS.includes(view);
  const isJourney = isForexFormJourney || isVisaJourney || isAirportJourney;

  const agentId = isAirportJourney
    ? agents.airport
    : isVisaJourney
      ? agents.visa
      : isForexFormJourney
        ? agents.forex || agents.loanLos
        : agents.home;

  const agentState = useMemo(() => {
    if (isAirportJourney) {
      const phase =
        view === 'airport_home'
          ? 'home'
          : view === 'airport_select'
            ? 'select'
            : view === 'duty_free'
              ? 'duty_free'
              : view === 'duty_free_success'
                ? 'success'
                : airportForm.phase === 'cart_prompt'
                  ? 'cart_prompt'
                  : 'products';
      return formToAirportAgentState({ ...airportForm, phase });
    }
    if (isVisaJourney)
      return formToVisaAgentState({
        ...visaForm,
        phase:
          view === 'visa_home'
            ? 'home'
            : view === 'visa_destination'
              ? 'destination'
              : visaForm.phase,
      });
    if (isForexFormJourney) return formToAgentState(forexForm);
    return { activeTab, view };
  }, [
    isAirportJourney,
    isVisaJourney,
    isForexFormJourney,
    airportForm,
    visaForm,
    forexForm,
    activeTab,
    view,
  ]);

  const homeGreeting = 'Namaste! Welcome to EaseMyTrip.';
  const forexGreeting = 'Tell me your city, currency, and amount — or say order now when ready.';
  const visaGreeting = 'Which country visa do you need? Singapore, Dubai, or Thailand?';
  const airportGreeting = 'Airport services assistant is ready.';

  const showVisaDateModal = view === 'visa_destination' && visaForm.showDateModal;

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-white">
      <AnimatePresence mode="wait">
        {view === 'dashboard' && (
          <motion.div
            key="dash"
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <EmtHomeDashboard
              activeTab={activeTab}
              onTabChange={(tab) => {
                if (tab === 'voice') {
                  openAssistant({ gestureListen: true });
                  return;
                }
                setActiveTab(tab);
              }}
              onServiceTap={handleServiceTap}
              onMicTap={() => openAssistant({ gestureListen: true })}
            />
          </motion.div>
        )}

        {view === 'forex_form' && (
          <motion.div
            key="forex-form"
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ForexCashScreen
              form={forexForm}
              onChange={applyForexPatch}
              onBack={goHome}
              onOrderNow={handleOrderNow}
              onRegisterToolHandler={(fn) => {
                forexToolHandlerRef.current = fn;
              }}
            />
          </motion.div>
        )}

        {view === 'forex_success' && (
          <motion.div
            key="forex-success"
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ForexSuccessScreen
              form={forexForm}
              onBackHome={goHome}
              onNewOrder={() => openForexForm(forexForm.partner)}
            />
          </motion.div>
        )}

        {view === 'visa_home' && (
          <motion.div
            key="visa-home"
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <VisaHomeScreen
              form={visaForm}
              onChange={applyVisaPatch}
              onBack={goHome}
              onSelectDestination={(id) => openVisaDestination(id)}
              onSearch={() =>
                openVisaDestination(visaForm.searchQuery?.includes('dubai') ? 'dubai' : 'singapore')
              }
            />
          </motion.div>
        )}

        {view === 'visa_destination' && (
          <motion.div
            key="visa-dest"
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <VisaDestinationScreen
              form={visaForm}
              onChange={applyVisaPatch}
              onBack={() => setView('visa_home')}
              onStartApplication={handleStartVisaApplication}
            />
          </motion.div>
        )}

        {view === 'visa_wizard' && (
          <motion.div
            key="visa-wizard"
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <VisaWizardScreen
              form={visaForm}
              onChange={applyVisaPatch}
              onBack={() => setView('visa_destination')}
              onNextStep={handleVisaNextStep}
              onSubmit={handleVisaSubmit}
              onRegisterToolHandler={(fn) => {
                visaToolHandlerRef.current = fn;
              }}
            />
          </motion.div>
        )}

        {view === 'visa_success' && (
          <motion.div
            key="visa-success"
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <VisaSuccessScreen
              form={visaForm}
              onBackHome={goHome}
              onTrackApplication={() => {
                setActiveTab('bookings');
                goHome();
              }}
            />
          </motion.div>
        )}

        {view === 'airport_home' && (
          <motion.div
            key="airport-home"
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AirportHomeScreen
              onBack={goHome}
              onDutyFree={openAirportSelect}
              onMeetGreet={() =>
                openAssistant({
                  gestureListen: true,
                  primer: 'Customer tapped Meet & Greet. Explain service.',
                })
              }
            />
          </motion.div>
        )}

        {view === 'airport_select' && (
          <motion.div
            key="airport-select"
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AirportSelectScreen
              onBack={() => setView('airport_home')}
              onSelect={handleAirportSelect}
            />
          </motion.div>
        )}

        {view === 'duty_free' && (
          <motion.div
            key="duty-free"
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <DutyFreeScreen
              form={airportForm}
              onChange={applyAirportPatch}
              onBack={() => setView('airport_select')}
              onOpenFragrances={() => openDutyFreeProducts({ category: 'fragrances' })}
              onOpenCategory={(catId) =>
                openDutyFreeProducts({ category: catId === 'beauty' ? 'fragrances' : catId })
              }
            />
          </motion.div>
        )}

        {view === 'duty_free_products' && (
          <motion.div
            key="duty-free-products"
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <DutyFreeProductsScreen
              form={airportForm}
              onChange={applyAirportPatch}
              onBack={() => setView('duty_free')}
              onAddToCart={handleAddToCart}
            />
          </motion.div>
        )}

        {view === 'duty_free_success' && (
          <motion.div
            key="duty-free-success"
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <DutyFreeOrderSuccessScreen
              form={airportForm}
              onBackHome={goHome}
              onShopAgain={() => {
                setAirportForm({ ...INITIAL_AIRPORT_FORM, phase: 'products' });
                openDutyFreeProducts({ category: 'fragrances' });
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {showVisaDateModal && (
        <VisaDateModal
          selectedDay={selectedDateDay}
          onSelect={setSelectedDateDay}
          onClose={() => applyVisaPatch({ showDateModal: false })}
          onProceed={handleProceedDate}
        />
      )}

      <LoanAguiPanel
        key={`emt-ai-${panelKey}-${voiceAssistMode ? 'assist' : 'chat'}`}
        agentId={agentId}
        open={aiOpen}
        onClose={() => {
          setAiOpen(false);
          setAiPrimer(null);
        }}
        onAutoHide={() => setAiOpen(false)}
        formValues={agentState}
        onFormChange={handleAgentFormChange}
        onToolCall={handleAgentToolCall}
        onUserMessage={handleVoiceUserMessage}
        onAfterAssistantReply={handleAfterAssistantReply}
        directHandledReply={isJourney}
        voiceAssist={voiceAssistMode}
        handsFree={voiceAssistMode}
        overlayPeek={isJourney}
        gestureListen={gestureListen}
        onGestureListenHandled={() => setGestureListen(false)}
        primer={aiPrimer}
        greeting={
          isForexFormJourney
            ? forexGreeting
            : isAirportJourney
              ? airportGreeting
              : isVisaJourney
                ? visaGreeting
                : homeGreeting
        }
        assistTitle={
          isForexFormJourney
            ? 'EaseMyTrip Forex Assistant'
            : isAirportJourney
              ? 'EaseMyTrip Airport Assistant'
              : isVisaJourney
                ? 'EaseMyTrip Visa Assistant'
                : 'EaseMyTrip Assistant'
        }
        assistHint={
          voiceAssistMode
            ? 'Hands-free — speak after I finish. Form fills live.'
            : 'Voice or text — your choice'
        }
        showReasoning={view === 'dashboard'}
        dockClassName={
          view === 'dashboard' ? 'bottom-[5.5rem] left-3 right-3' : 'bottom-0 left-0 right-0'
        }
        lang={lang}
      />

      <DemoPanel
        onChangeLang={setLang}
        voiceAssistMode={voiceAssistMode}
        onVoiceAssistModeChange={setVoiceAssistMode}
        onVoiceCommandModeChange={() => {}}
      />
    </div>
  );
}
