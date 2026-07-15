import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ArmChatHeader from './components/ArmChatHeader.jsx';
import ArmChatMessages from './components/ArmChatMessages.jsx';
import ArmQuickOptions, { ArmListOptions } from './components/ArmQuickOptions.jsx';
import ArmDigitInput, { ArmEmailInput, ArmFriendForm } from './components/ArmFormInputs.jsx';
import ArmSuccessCard from './components/ArmSuccessCard.jsx';
import ArmVoiceBar, { ArmListeningOverlay } from './components/ArmVoiceBar.jsx';
import {
  animateDigitFill,
  fieldIdForStep,
  parseSpokenDigitsLive,
  stepDigitLength,
} from './armLiveFill.js';
import { useLiveTranscript } from '../../../hooks/useLiveTranscript.js';
import {
  INITIAL_FORM,
  STEP_ORDER,
  displayUserAnswer,
  fieldForStep,
  getNextStep,
  getStepConfig,
} from './armJourney.js';
import { isValidEmail, isValidPhone, parseStepInput, quickOptionDisplay, cleanSpeechText, parseFriendNameFromSpeech } from './armInputParser.js';
import { useElevenSpeech } from '../../../hooks/useElevenSpeech.js';
import { useSpeech } from '../../../hooks/useSpeech.js';
import { ELEVENLABS_STT_ENABLED } from '../../../config/voiceBackend.js';
import { speakViaCartesia } from '../../../lib/cartesiaTts.js';

function msgId() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function ArmJourneyScreen({
  onClose,
  voiceAssist = false,
  voicePanelOpen = false,
  lang = 'en',
  form: formProp,
  onFormChange,
  onRegisterToolHandler,
  onRegisterArmApi,
  onLiveFeedChange,
  loanProduct = 'two_wheeler',
}) {
  const [localForm, setLocalForm] = useState(INITIAL_FORM);
  const form = formProp ?? localForm;
  const [step, setStep] = useState(form.journeyStep || 'terms');
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [draftAadhaar, setDraftAadhaar] = useState('');
  const [draftOtp, setDraftOtp] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [liveSpoken, setLiveSpoken] = useState('');
  const [isLiveFilling, setIsLiveFilling] = useState(false);

  const liveTranscript = useLiveTranscript({
    enabled: voicePanelOpen && voiceAssist && step === 'aadhaar_number',
    lang: String(lang || 'en').startsWith('hi') ? 'hi-IN' : 'en-IN',
  });

  const chatEndRef = useRef(null);
  const formRef = useRef(form);
  const stepRef = useRef(step);
  const initializedRef = useRef(false);

  formRef.current = form;
  stepRef.current = step;

  const patchForm = useCallback(
    (patch) => {
      const merge = (prev) => {
        const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
        formRef.current = next;
        return next;
      };
      if (formProp) {
        onFormChange?.(merge(formRef.current));
      } else {
        setLocalForm(merge);
      }
    },
    [formProp, onFormChange],
  );

  const stepConfig = useMemo(() => getStepConfig(step, form), [step, form]);
  const isAadhaarDigitStep = step === 'aadhaar_number';
  const showLiveFeed = voicePanelOpen && voiceAssist && isAadhaarDigitStep;

  const liveFeedPayload = useMemo(() => {
    if (!showLiveFeed) return null;
    return {
      active: true,
      label: 'AADHAAR · LIVE DATA FEED',
      spokenText: liveSpoken || liveTranscript,
      digits: draftAadhaar,
      length: 12,
      groups: [4, 4, 4],
    };
  }, [showLiveFeed, liveSpoken, liveTranscript, draftAadhaar]);

  useEffect(() => {
    onLiveFeedChange?.(liveFeedPayload);
    return () => onLiveFeedChange?.(null);
  }, [liveFeedPayload, onLiveFeedChange]);

  const setDraftForStep = useCallback((stepId, val) => {
    if (stepId === 'aadhaar_number') setDraftAadhaar(val);
    else if (stepId === 'aadhaar_otp' || stepId === 'email_otp') setDraftOtp(val);
    else if (stepId === 'family_mobile') setDraftPhone(val);
  }, []);

  const liveFillFromSpeech = useCallback(
    (text) => {
      if (stepRef.current !== 'aadhaar_number') return;
      const digits = parseSpokenDigitsLive(text, 12);
      if (!digits) return;
      setLiveSpoken(text);
      setDraftAadhaar(digits);
      patchForm({ aadhaarNumber: digits });
    },
    [patchForm],
  );

  useEffect(() => {
    if (step !== 'aadhaar_number' || !liveTranscript) return;
    liveFillFromSpeech(liveTranscript);
  }, [liveTranscript, liveFillFromSpeech, step]);

  const elevenSpeech = useElevenSpeech({ lang: 'en-IN' });
  const browserSpeech = useSpeech({ lang });
  const useEleven = ELEVENLABS_STT_ENABLED && elevenSpeech.supported;
  const listening = useEleven ? elevenSpeech.listening : browserSpeech.listening;

  const appendMessage = useCallback((role, content) => {
    setMessages((prev) => [...prev, { id: msgId(), role, content }]);
  }, []);

  const speakAi = useCallback((text) => {
    if (!text || !voiceAssist) return;
    speakViaCartesia(text, { lang }).catch(() => {});
  }, [voiceAssist, lang]);

  const advanceToStep = useCallback(
    (nextStep, userDisplay) => {
      const prevStep = stepRef.current;
      const cfg = getStepConfig(nextStep, formRef.current);
      if (userDisplay) appendMessage('user', userDisplay);

      stepRef.current = nextStep;
      setStep(nextStep);
      patchForm({ journeyStep: nextStep });
      setFieldError('');
      setTextInput('');
      setDraftOtp('');
      setLiveSpoken('');

      if (prevStep === 'aadhaar_number' && nextStep !== 'aadhaar_number') {
        setDraftAadhaar('');
        onLiveFeedChange?.(null);
      }
      if (nextStep === 'aadhaar_otp') {
        setDraftOtp('');
        patchForm({ aadhaarOtp: '' });
      }
      if (nextStep === 'email_otp') {
        setDraftOtp('');
        patchForm({ emailOtp: '' });
      }

      if (cfg?.messages) {
        cfg.messages.forEach((m, i) => {
          appendMessage('assistant', m);
          if (i === cfg.messages.length - 1) speakAi(m);
        });
      }
    },
    [appendMessage, speakAi, patchForm, onLiveFeedChange],
  );

  const submitAnswer = useCallback(
    (rawValue, displayValue) => {
      const currentStep = stepRef.current;
      const field = fieldForStep(currentStep);
      const value = rawValue;
      const display = displayValue || value;

      if (currentStep === 'friend_details') {
        const name = formRef.current.friendName?.trim();
        const mobile = formRef.current.friendMobile;
        if (!name) {
          setFieldError('Please enter friend\'s full name.');
          return;
        }
        if (!isValidPhone(mobile)) {
          setFieldError('Enter a valid 10-digit mobile number starting with 6–9.');
          return;
        }
        patchForm({ friendName: name, friendMobile: mobile, journeyStep: 'success' });
        appendMessage('user', name);
        setTimeout(() => advanceToStep('success'), 400);
        return;
      }

      const { next, error } = getNextStep(currentStep, field, value, formRef.current);
      if (error) {
        setFieldError(error);
        return;
      }

      if (field) {
        patchForm({ [field]: value });
      }

      advanceToStep(next, display);
    },
    [advanceToStep, appendMessage, patchForm],
  );

  const handleParsedInput = useCallback(
    (parsed) => {
      if (parsed.partial) {
        patchForm(parsed.partial);
      }
      if (!parsed.ok) {
        setFieldError(parsed.error || 'Invalid input.');
        return;
      }
      submitAnswer(parsed.value, parsed.display || parsed.value);
    },
    [submitAnswer],
  );

  const handleQuickSelect = useCallback(
    (value, label) => {
      submitAnswer(value, label);
    },
    [submitAnswer],
  );

  /** Apply parsed voice/text to the background journey (instant step update). */
  const applyUserInput = useCallback(
    (text, { withVoiceReply = true } = {}) => {
      const current = stepRef.current;
      const raw = cleanSpeechText(text);
      if (!raw) return { handled: false, synced: false };

      if (current === 'aadhaar_number') {
        liveFillFromSpeech(raw);
      }

      if (current === 'friend_details') {
        const friendName = parseFriendNameFromSpeech(raw);
        if (friendName) patchForm({ friendName });
        const phoneMatch = raw.match(/\b([6-9]\d{9})\b/);
        if (phoneMatch?.[1]) patchForm({ friendMobile: phoneMatch[1] });
      }

      const cfg = getStepConfig(current, formRef.current);
      const options = cfg?.quickOptions || cfg?.listOptions || [];
      for (const opt of options) {
        const label = String(opt.label || '').toLowerCase();
        const r = raw.toLowerCase();
        if (r === label || r.includes(label) || label.includes(r)) {
          submitAnswer(opt.value, opt.label);
          const next = getNextStep(current, fieldForStep(current), opt.value, formRef.current).next;
          const nextCfg = getStepConfig(next, formRef.current);
          return {
            handled: withVoiceReply,
            synced: true,
            reply: withVoiceReply ? nextCfg?.messages?.[0] || 'Got it.' : undefined,
          };
        }
      }

      const parsed = parseStepInput(current, raw, formRef.current);
      if (!parsed.ok) {
        if (parsed.partial) {
          patchForm(parsed.partial);
          if (current === 'friend_details' && parsed.partial.friendName) {
            appendMessage('user', parsed.partial.friendName);
          }
          return {
            handled: withVoiceReply,
            synced: true,
            reply: withVoiceReply ? parsed.error || 'Got it — please continue.' : undefined,
          };
        }
        return { handled: false, synced: false };
      }

      if (parsed.partial) {
        patchForm(parsed.partial);
      }

      const field = fieldForStep(current);
      const { next, error } = getNextStep(current, field, parsed.value, formRef.current);
      if (error) {
        setFieldError(error);
        return {
          handled: withVoiceReply,
          synced: true,
          reply: withVoiceReply ? error : undefined,
        };
      }

      submitAnswer(parsed.value, parsed.display || parsed.value);

      if (current === 'aadhaar_number') {
        setLiveSpoken('');
        onLiveFeedChange?.(null);
      }

      const nextCfg = getStepConfig(next, formRef.current);
      return {
        handled: withVoiceReply,
        synced: true,
        reply: withVoiceReply ? nextCfg?.messages?.[0] || 'Thank you!' : undefined,
      };
    },
    [liveFillFromSpeech, patchForm, submitAnswer, onLiveFeedChange, appendMessage],
  );

  const handleUserInput = useCallback(
    (text) => {
      const result = applyUserInput(text, { withVoiceReply: true });
      if (result.handled) return { handled: true, reply: result.reply };
      return { handled: false };
    },
    [applyUserInput],
  );

  const syncUserInput = useCallback(
    (text) => {
      applyUserInput(text, { withVoiceReply: false });
    },
    [applyUserInput],
  );

  const handleTextSend = useCallback(() => {
    const text = textInput.trim();
    if (!text) return;

    const cfg = getStepConfig(stepRef.current);
    if (cfg?.inputType === 'quick' || cfg?.inputType === 'list') {
      handleParsedInput(parseStepInput(stepRef.current, text, formRef.current));
      return;
    }

    handleParsedInput(parseStepInput(stepRef.current, text, formRef.current));
  }, [textInput, handleParsedInput]);

  const handleMicTap = useCallback(() => {
    if (listening) {
      if (useEleven) elevenSpeech.stop();
      else browserSpeech.stop();
      return;
    }

    const onFinal = (transcript) => {
      const t = String(transcript || '').trim();
      if (!t) return;
      setTextInput(t);

      const current = stepRef.current;
      const cfg = getStepConfig(current);

      if (cfg?.inputType === 'aadhaar') {
        const parsed = parseStepInput('aadhaar_number', t);
        if (parsed.ok) {
          setDraftAadhaar(parsed.value);
          submitAnswer(parsed.value, parsed.display);
        } else setFieldError(parsed.error);
        return;
      }
      if (cfg?.inputType === 'otp6') {
        const parsed = parseStepInput(current, t);
        if (parsed.ok) {
          setDraftOtp(parsed.value);
          submitAnswer(parsed.value, parsed.display);
        } else setFieldError(parsed.error);
        return;
      }
      if (cfg?.inputType === 'phone10') {
        const parsed = parseStepInput('family_mobile', t);
        if (parsed.ok) {
          setDraftPhone(parsed.value);
          submitAnswer(parsed.value, parsed.display);
        } else setFieldError(parsed.error);
        return;
      }
      if (cfg?.inputType === 'email') {
        const parsed = parseStepInput('email', t);
        if (parsed.ok) {
          setDraftEmail(parsed.value);
          patchForm({ email: parsed.value });
          appendMessage('user', displayUserAnswer('email', parsed.value));
          advanceToStep('email_otp');
        } else setFieldError(parsed.error);
        return;
      }

      handleParsedInput(parseStepInput(current, t, formRef.current));
    };

    if (useEleven) elevenSpeech.start(onFinal);
    else browserSpeech.start(onFinal);
  }, [
    listening,
    useEleven,
    elevenSpeech,
    browserSpeech,
    handleParsedInput,
    submitAnswer,
    appendMessage,
    patchForm,
  ]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    const cfg = getStepConfig('terms');
    cfg?.messages?.forEach((m, i) => {
      setTimeout(() => appendMessage('assistant', m), i * 150);
    });
  }, [appendMessage]);

  useEffect(() => {
    if (!form.journeyStep || form.journeyStep === step) return;
    const formIdx = STEP_ORDER.indexOf(form.journeyStep);
    const stepIdx = STEP_ORDER.indexOf(step);
    // Only sync forward — never roll local step back when parent form is briefly stale.
    if (formIdx > stepIdx) {
      setStep(form.journeyStep);
    }
  }, [form.journeyStep, step]);

  useEffect(() => {
    if (step === 'aadhaar_number' && form.aadhaarNumber) {
      setDraftAadhaar(form.aadhaarNumber);
    }
    if (step === 'aadhaar_otp' && form.aadhaarOtp?.length === 6) {
      const aadhaarPrefix = String(form.aadhaarNumber || '').replace(/\D/g, '').slice(0, 6);
      if (form.aadhaarOtp !== aadhaarPrefix) {
        setDraftOtp(form.aadhaarOtp);
      }
    }
    if (step === 'email_otp' && form.emailOtp?.length === 6) {
      setDraftOtp(form.emailOtp);
    }
    if (step === 'family_mobile' && form.familyMobile) {
      setDraftPhone(form.familyMobile);
    }
    if (step === 'email' && form.email) {
      setDraftEmail(form.email);
    }
  }, [step, form.aadhaarNumber, form.aadhaarOtp, form.emailOtp, form.familyMobile, form.email]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step]);

  const handleAadhaarComplete = (val) => {
    setDraftAadhaar(val);
    if (val.length === 12) {
      const parsed = parseStepInput('aadhaar_number', val);
      if (parsed.ok) {
        onLiveFeedChange?.(null);
        submitAnswer(parsed.value, parsed.display);
      } else setFieldError(parsed.error);
    }
  };

  const handleOtpComplete = (val) => {
    setDraftOtp(val);
    if (val.length === 6) {
      submitAnswer(val, val);
    }
  };

  const handlePhoneComplete = (val) => {
    setDraftPhone(val);
    if (val.length === 10 && isValidPhone(val)) {
      submitAnswer(val, val);
    } else if (val.length === 10) {
      setFieldError('Please tell me their mobile number.');
    }
  };

  const handleEmailSubmit = () => {
    const email = draftEmail.trim();
    if (!isValidEmail(email)) {
      setFieldError('What is your email address? I\'ll send an OTP to verify it.');
      return;
    }
    patchForm({ email });
    appendMessage('user', displayUserAnswer('email', email));
    advanceToStep('email_otp');
  };

  const handleFriendSubmit = () => {
    submitAnswer(form.friendName, form.friendName);
  };

  const handleAgentToolCall = useCallback(
    async (name, args) => {
      if (name === 'set_field' && args?.field_id && args?.value != null) {
        const fid = args.field_id;
        const val = String(args.value).replace(/\D/g, '');
        const isDigitField =
          fid === 'aadhaarNumber' ||
          fid === 'aadhaarOtp' ||
          fid === 'emailOtp' ||
          fid === 'familyMobile' ||
          fid === 'friendMobile';

        if (isDigitField && val.length > 1) {
          setIsLiveFilling(true);
          const stepForField =
            fid === 'aadhaarNumber'
              ? 'aadhaar_number'
              : fid === 'aadhaarOtp'
                ? 'aadhaar_otp'
                : fid === 'emailOtp'
                  ? 'email_otp'
                  : fid === 'friendMobile'
                    ? 'friend_details'
                    : 'family_mobile';
          await animateDigitFill((partial) => {
            setDraftForStep(stepForField, partial);
            patchForm({ [fid]: partial });
          }, val);
          setIsLiveFilling(false);
        } else {
          patchForm({ [fid]: fid === 'friendName' ? String(args.value).trim() : val || args.value });
          if (fid === 'aadhaarNumber') setDraftAadhaar(val || args.value);
          if (fid === 'aadhaarOtp' || fid === 'emailOtp') setDraftOtp(val || args.value);
          if (fid === 'familyMobile') setDraftPhone(val || args.value);
          if (fid === 'friendMobile') patchForm({ friendMobile: val || args.value });
        }
      }
      if (name === 'select_option' && args?.value) {
        const label = quickOptionDisplay(stepRef.current, args.value, getStepConfig(stepRef.current));
        submitAnswer(args.value, label);
      }
      if (name === 'submit_step') {
        const current = stepRef.current;
        const cfg = getStepConfig(current);
        if (cfg?.inputType === 'aadhaar' && draftAadhaar.length === 12) {
          submitAnswer(draftAadhaar, draftAadhaar);
        } else if (cfg?.inputType === 'otp6' && draftOtp.length === 6) {
          submitAnswer(draftOtp, draftOtp);
        } else if (cfg?.inputType === 'phone10' && isValidPhone(draftPhone)) {
          submitAnswer(draftPhone, draftPhone);
        } else if (cfg?.inputType === 'email' && isValidEmail(draftEmail)) {
          handleEmailSubmit();
        } else if (cfg?.inputType === 'friend_form') {
          handleFriendSubmit();
        }
      }
    },
    [patchForm, submitAnswer, draftAadhaar, draftOtp, draftPhone, draftEmail, handleEmailSubmit, handleFriendSubmit, setDraftForStep],
  );

  useEffect(() => {
    onRegisterToolHandler?.(handleAgentToolCall);
    return () => onRegisterToolHandler?.(null);
  }, [handleAgentToolCall, onRegisterToolHandler]);

  useEffect(() => {
    onRegisterArmApi?.({
      liveFillFromSpeech,
      getStep: () => stepRef.current,
      handleUserInput,
      syncUserInput,
    });
    return () => onRegisterArmApi?.(null);
  }, [liveFillFromSpeech, handleUserInput, syncUserInput, onRegisterArmApi]);

  const showQuick = stepConfig?.inputType === 'quick' && stepConfig?.quickOptions;
  const showList = stepConfig?.inputType === 'list' && stepConfig?.listOptions;
  const isSuccess = step === 'success';

  const draftValue =
    step === 'aadhaar_number'
      ? draftAadhaar
      : step === 'aadhaar_otp' || step === 'email_otp'
        ? draftOtp
        : step === 'family_mobile'
          ? draftPhone
          : '';

  const highlightIndex = draftValue.length;

  const currentStepFooter = !isSuccess ? (
    <>
      {showQuick && (
        <ArmQuickOptions
          options={stepConfig.quickOptions}
          onSelect={handleQuickSelect}
          helpText={stepConfig.helpText}
          embedded
        />
      )}

      {showList && (
        <ArmListOptions
          options={stepConfig.listOptions}
          onSelect={handleQuickSelect}
          helpText={stepConfig.helpText}
          embedded
        />
      )}

      {stepConfig?.inputType === 'aadhaar' && (
        <ArmDigitInput
          length={12}
          value={draftAadhaar}
          onChange={handleAadhaarComplete}
          label={stepConfig.inputLabel}
          groups={[4, 4, 4]}
          error={fieldError}
          highlightIndex={highlightIndex}
          readOnly={isLiveFilling}
          embedded
        />
      )}

      {stepConfig?.inputType === 'otp6' && (
        <ArmDigitInput
          length={6}
          value={draftOtp}
          onChange={handleOtpComplete}
          label={stepConfig.inputLabel}
          error={fieldError}
          highlightIndex={highlightIndex}
          readOnly={isLiveFilling}
          embedded
        />
      )}

      {stepConfig?.inputType === 'phone10' && (
        <ArmDigitInput
          length={10}
          value={draftPhone}
          onChange={handlePhoneComplete}
          label={stepConfig.inputLabel}
          groups={[5, 5]}
          error={fieldError}
          highlightIndex={highlightIndex}
          readOnly={isLiveFilling}
          embedded
        />
      )}

      {stepConfig?.inputType === 'email' && (
        <ArmEmailInput
          value={draftEmail}
          onChange={(v) => { setDraftEmail(v); setFieldError(''); }}
          onSubmit={handleEmailSubmit}
          error={fieldError}
          label={stepConfig.inputLabel}
          embedded
        />
      )}

      {stepConfig?.inputType === 'friend_form' && (
        <ArmFriendForm
          name={form.friendName}
          mobile={form.friendMobile}
          onNameChange={(v) => patchForm({ friendName: v })}
          onMobileChange={(v) => patchForm({ friendMobile: v })}
          onSubmit={handleFriendSubmit}
          error={fieldError}
          label={stepConfig.inputLabel}
        />
      )}

      {!showQuick && !showList && stepConfig?.helpText && stepConfig?.inputType !== 'success' && (
        <div className="flex overflow-hidden rounded-lg border border-kb-border bg-white">
          <div className="w-1 shrink-0 bg-kb-yellow" />
          <p className="px-3 py-2.5 text-[12px] text-kb-ink/80">{stepConfig.helpText}</p>
        </div>
      )}
    </>
  ) : null;

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-kb-page">
      <ArmChatHeader onClose={onClose} />

      <div
        className={`min-h-0 flex-1 overflow-y-auto no-scrollbar ${voicePanelOpen ? 'pb-[min(38vh,300px)]' : ''}`}
      >
        <ArmChatMessages messages={messages} chatEndRef={chatEndRef} footer={currentStepFooter} />

        {isSuccess && <ArmSuccessCard />}
      </div>

      {!voicePanelOpen && <ArmListeningOverlay visible={listening} />}

      {!voicePanelOpen && (
        <ArmVoiceBar
          textInput={textInput}
          onTextChange={setTextInput}
          onSend={handleTextSend}
          onMicTap={handleMicTap}
          listening={listening}
          voiceHint={stepConfig?.voiceHint}
          showTextInput={!['aadhaar', 'otp6', 'phone10', 'email', 'friend_form'].includes(stepConfig?.inputType)}
          disabled={isSuccess}
        />
      )}
    </div>
  );
}
