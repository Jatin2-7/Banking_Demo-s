import React, { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { IncredLoanHeader, IncredSubHeader } from '../components/IncredHeader.jsx';
import IncredProgressBar from '../components/IncredProgressBar.jsx';
import IncredConfirmModal from '../components/IncredConfirmModal.jsx';
import {
  FieldLabel,
  TextInput,
  DobInputs,
  GenderRadio,
  SelectField,
  CheckboxRow,
  OrangeButton,
  PersonIcon,
  PinIcon,
  PanIcon,
  BriefcaseIcon,
  BuildingIcon,
  EmailIcon,
  RupeeIcon,
  RingIcon,
  HouseIcon,
} from '../components/IncredFormFields.jsx';
import {
  INITIAL_FORM,
  GENDER_OPTIONS,
  EMPLOYMENT_TYPES,
  MARITAL_OPTIONS,
  RESIDENCE_OPTIONS,
  PURPOSE_OPTIONS,
  COMPANY_OPTIONS,
  progressSegment,
  formatDobDisplay,
  formatDobLong,
  generateApplicationRef,
} from './incredJourney.js';
import { INCRED } from '../theme.js';

function MoneyBagIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
      <ellipse cx="55" cy="88" rx="35" ry="6" fill="#E8E8E8" />
      <path d="M35 35c0-12 8-20 20-20s20 8 20 20v45H35V35z" fill="#C4956A" />
      <path d="M40 35c0-8 6-14 15-14s15 6 15 14" stroke="#A67C52" strokeWidth="2" fill="none" />
      <text x="55" y="62" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">
        ₹
      </text>
      <circle cx="88" cy="72" r="8" fill="#FFD700" stroke="#E6C200" strokeWidth="1" />
      <circle cx="96" cy="78" r="6" fill="#FFD700" stroke="#E6C200" strokeWidth="1" />
      <circle cx="92" cy="84" r="5" fill="#FFD700" stroke="#E6C200" strokeWidth="1" />
    </svg>
  );
}

function SuccessIllustration() {
  return (
    <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
      <div className="absolute inset-0 rounded-full opacity-20" style={{ backgroundColor: INCRED.green }} />
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full"
        style={{ backgroundColor: INCRED.green }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function EmploymentCard({ type, selected, onSelect }) {
  const isSalaried = type.id === 'salaried';
  return (
    <button
      type="button"
      onClick={() => onSelect(type.id)}
      className="flex flex-1 flex-col items-center rounded-xl border-2 p-3 press transition-colors"
      style={{
        borderColor: selected ? INCRED.orange : INCRED.border,
        backgroundColor: selected ? '#FFF8F3' : 'white',
      }}
    >
      <div className="mb-2 flex h-16 w-16 items-center justify-center">
        {isSalaried ? (
          <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="18" r="10" fill="#FFD4B8" />
            <rect x="18" y="30" width="28" height="24" rx="4" fill="#888" />
            <rect x="38" y="38" width="14" height="10" rx="2" fill="#8B6914" />
          </svg>
        ) : (
          <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="16" r="9" fill="#FFD4B8" />
            <rect x="14" y="28" width="36" height="22" rx="3" fill="#666" />
            <rect x="20" y="34" width="24" height="14" rx="1" fill="#4A90D9" />
          </svg>
        )}
      </div>
      <span className="text-[13px] font-semibold" style={{ color: selected ? INCRED.orange : INCRED.muted }}>
        {type.label}
      </span>
    </button>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366" className="inline">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export { INITIAL_FORM };

export default function IncredPersonalLoanScreen({
  form,
  onFormChange,
  onClose,
  onRegisterToolHandler,
  onRegisterApi,
  voicePanelOpen = false,
}) {
  const set = useCallback(
    (patch) => onFormChange((prev) => ({ ...prev, ...patch })),
    [onFormChange],
  );

  const progress = useMemo(() => progressSegment(form.phase), [form.phase]);
  const dobHint = formatDobDisplay(form.dobDay, form.dobMonth, form.dobYear);

  const advancePhase = useCallback(
    (next) => {
      if (next === 'success') {
        set({ phase: 'success', applicationRef: generateApplicationRef(), confirmModal: null });
      } else {
        set({ phase: next, confirmModal: null });
      }
    },
    [set],
  );

  const handleProceedLogin = () => {
    advancePhase('basic_details');
  };

  const handleProceedBasic = () => {
    set({ confirmModal: 'basic' });
  };

  const handleConfirmBasic = () => {
    advancePhase('employment');
  };

  const handleProceedEmployment = () => {
    set({ confirmModal: 'employment' });
  };

  const handleConfirmEmployment = () => {
    advancePhase('eligibility');
  };

  const handleProceedEligibility = () => {
    advancePhase('success');
  };

  const handleBack = () => {
    if (form.phase === 'login_info') onClose();
    else if (form.phase === 'basic_details') advancePhase('login_info');
    else if (form.phase === 'employment') advancePhase('basic_details');
    else if (form.phase === 'eligibility') advancePhase('employment');
    else if (form.phase === 'success') onClose();
    else onClose();
  };

  const toolHandler = useCallback(
    (name, args) => {
      if (name === 'set_field') {
        const field = args.field;
        const value = args.value;
        const patch = {};
        const map = {
          pan: 'pan',
          full_name: 'fullName',
          dob_day: 'dobDay',
          dob_month: 'dobMonth',
          dob_year: 'dobYear',
          gender: 'gender',
          pincode: 'pincode',
          employment_type: 'employmentType',
          net_monthly_income: 'netMonthlyIncome',
          company_name: 'companyName',
          marital_status: 'maritalStatus',
          residence_type: 'residenceType',
          email: 'email',
          purpose: 'purpose',
        };
        const key = map[field] || field;
        if (field === 'dob_day' || field === 'dob_month' || field === 'dob_year') {
          const month = field === 'dob_month' ? value : form.dobMonth;
          const year = field === 'dob_year' ? value : form.dobYear;
          const m = parseInt(String(month), 10);
          const y = parseInt(String(year), 10);
          if (month && (m < 1 || m > 12)) return;
          if (year && (y < 1940 || y > 2010)) return;
        }
        patch[key] = value;
        set(patch);
      } else if (name === 'select_option') {
        const map = {
          employment_type: 'employmentType',
          marital_status: 'maritalStatus',
          residence_type: 'residenceType',
          gender: 'gender',
          purpose: 'purpose',
          company_name: 'companyName',
        };
        const key = map[args.field] || args.field;
        set({ [key]: args.value });
      } else if (name === 'click_button') {
        const btn = args.button;
        if (btn === 'proceed') {
          if (form.phase === 'login_info') handleProceedLogin();
          else if (form.phase === 'basic_details') handleProceedBasic();
          else if (form.phase === 'employment') handleProceedEmployment();
          else if (form.phase === 'eligibility') handleProceedEligibility();
        } else if (btn === 'confirm_yes') {
          if (form.confirmModal === 'basic') handleConfirmBasic();
          else if (form.confirmModal === 'employment') handleConfirmEmployment();
        } else if (btn === 'edit_details') {
          set({ confirmModal: null });
        } else if (btn === 'back_to_home') {
          onClose();
        }
      } else if (name === 'navigate_phase') {
        if (args.phase) set({ phase: args.phase, confirmModal: null });
      }
    },
    [form.phase, form.confirmModal, set, onClose],
  );

  React.useEffect(() => {
    onRegisterToolHandler?.(toolHandler);
  }, [toolHandler, onRegisterToolHandler]);

  React.useEffect(() => {
    onRegisterApi?.({
      handleUserInput: () => ({ handled: false }),
    });
  }, [onRegisterApi]);

  const numOnly = (v, max) => v.replace(/\D/g, '').slice(0, max);
  const panOnly = (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="absolute inset-0 z-20 flex flex-col bg-white"
    >
      {form.phase !== 'success' && (
        <IncredLoanHeader onBack={handleBack} onHome={onClose} showHome />
      )}

      {form.phase !== 'success' && (
        <IncredProgressBar login={progress.login} basic={progress.basic} offer={progress.offer} />
      )}

      <div className={`relative flex-1 overflow-y-auto no-scrollbar ${voicePanelOpen ? 'pb-36' : 'pb-28'}`}>
        {form.phase === 'login_info' && (
          <div className="px-4 pt-4">
            <h2 className="mb-4 text-[16px] font-bold text-incred-ink">Enter details to check your eligibility</h2>

            <div className="mb-4">
              <FieldLabel>PAN card number</FieldLabel>
              <TextInput
                icon={<PanIcon />}
                placeholder="e.g. BDBPJ1234F"
                value={form.pan}
                onChange={(e) => set({ pan: panOnly(e.target.value) })}
              />
            </div>

            <div className="mb-4">
              <FieldLabel>Full name as per PAN card</FieldLabel>
              <TextInput
                icon={<PersonIcon />}
                placeholder="e.g. John Doe"
                value={form.fullName}
                onChange={(e) => set({ fullName: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <FieldLabel>Date of birth (dd-mm-yyyy)</FieldLabel>
              <DobInputs
                day={form.dobDay}
                month={form.dobMonth}
                year={form.dobYear}
                onDay={(e) => set({ dobDay: numOnly(e.target.value, 2) })}
                onMonth={(e) => set({ dobMonth: numOnly(e.target.value, 2) })}
                onYear={(e) => set({ dobYear: numOnly(e.target.value, 4) })}
                hint={dobHint ? `${dobHint}` : ''}
              />
            </div>

            <div className="mb-4">
              <FieldLabel>Gender</FieldLabel>
              <GenderRadio value={form.gender} onChange={(v) => set({ gender: v })} options={GENDER_OPTIONS} />
            </div>

            <div className="mb-4">
              <FieldLabel>Pincode</FieldLabel>
              <TextInput
                icon={<PinIcon />}
                placeholder="e.g. 123456"
                value={form.pincode}
                onChange={(e) => set({ pincode: numOnly(e.target.value, 6) })}
                inputMode="numeric"
              />
            </div>
          </div>
        )}

        {form.phase === 'basic_details' && (
          <div className="px-4 pt-4">
            <div className="mb-4">
              <FieldLabel>Full name as per PAN card</FieldLabel>
              <TextInput
                icon={<PersonIcon />}
                placeholder="e.g. John Doe"
                value={form.fullName}
                onChange={(e) => set({ fullName: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <FieldLabel>Date of birth (dd-mm-yyyy)</FieldLabel>
              <DobInputs
                day={form.dobDay}
                month={form.dobMonth}
                year={form.dobYear}
                onDay={(e) => set({ dobDay: numOnly(e.target.value, 2) })}
                onMonth={(e) => set({ dobMonth: numOnly(e.target.value, 2) })}
                onYear={(e) => set({ dobYear: numOnly(e.target.value, 4) })}
                hint={dobHint ? `${dobHint}` : ''}
              />
            </div>

            <div className="mb-4">
              <FieldLabel>Gender</FieldLabel>
              <GenderRadio value={form.gender} onChange={(v) => set({ gender: v })} options={GENDER_OPTIONS} />
            </div>

            <div className="mb-4">
              <FieldLabel>Pincode</FieldLabel>
              <TextInput
                icon={<PinIcon />}
                placeholder="e.g. 123456"
                value={form.pincode}
                onChange={(e) => set({ pincode: numOnly(e.target.value, 6) })}
                inputMode="numeric"
              />
            </div>

            <div className="mb-4 space-y-3">
              <CheckboxRow checked={form.ndncConsent} onChange={(v) => set({ ndncConsent: v })}>
                I, hereby authorise InCred to contact me via Calls overriding my registry on the NDNC/NCPR.
              </CheckboxRow>
              <CheckboxRow checked={form.smsConsent} onChange={(v) => set({ smsConsent: v })}>
                <span>
                  I agree to receive updates via SMS &amp; <WhatsAppIcon /> Whatsapp.
                </span>
              </CheckboxRow>
            </div>
          </div>
        )}

        {form.phase === 'employment' && (
          <div className="px-4 pt-4">
            <h2 className="mb-4 text-[16px] font-bold text-incred-ink">Enter employment details</h2>

            <div className="mb-4">
              <FieldLabel help={false}>Employment type</FieldLabel>
              <div className="flex gap-3">
                {EMPLOYMENT_TYPES.map((t) => (
                  <EmploymentCard
                    key={t.id}
                    type={t}
                    selected={form.employmentType === t.id}
                    onSelect={(id) => set({ employmentType: id })}
                  />
                ))}
              </div>
            </div>

            <div className="mb-4">
              <FieldLabel>Net monthly income</FieldLabel>
              <TextInput
                icon={<BriefcaseIcon />}
                placeholder="e.g. 30000"
                value={form.netMonthlyIncome}
                onChange={(e) => set({ netMonthlyIncome: numOnly(e.target.value, 8) })}
                inputMode="numeric"
              />
            </div>

            <div className="mb-4">
              <FieldLabel>Company name</FieldLabel>
              <SelectField
                icon={<BuildingIcon />}
                placeholder="Click here to select"
                value={form.companyName}
                options={COMPANY_OPTIONS}
                onChange={(v) => set({ companyName: v })}
              />
            </div>
          </div>
        )}

        {form.phase === 'eligibility' && (
          <div className="px-4 pt-4">
            <h2 className="mb-4 text-[16px] font-bold text-incred-ink">Enter details to check your eligibility</h2>

            <div className="mb-4">
              <FieldLabel>Marital status</FieldLabel>
              <SelectField
                icon={<RingIcon />}
                placeholder="Click here to select"
                value={form.maritalStatus}
                options={MARITAL_OPTIONS}
                onChange={(v) => set({ maritalStatus: v })}
              />
            </div>

            <div className="mb-4">
              <FieldLabel>Current residence type</FieldLabel>
              <SelectField
                icon={<HouseIcon />}
                placeholder="Click here to select"
                value={form.residenceType}
                options={RESIDENCE_OPTIONS}
                onChange={(v) => set({ residenceType: v })}
              />
            </div>

            <div className="mb-4">
              <FieldLabel>Email Id</FieldLabel>
              <TextInput
                icon={<EmailIcon />}
                placeholder="loremipsum@gmail.com"
                value={form.email}
                onChange={(e) => set({ email: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <FieldLabel>Purpose</FieldLabel>
              <SelectField
                icon={<RupeeIcon />}
                placeholder="Click here to select"
                value={form.purpose}
                options={PURPOSE_OPTIONS}
                onChange={(v) => set({ purpose: v })}
              />
            </div>
          </div>
        )}

        {form.phase === 'success' && (
          <div className="flex min-h-full flex-col">
            <div className="border-b border-incred-border px-4 py-3">
              <IncredSubHeader onBack={onClose} onHome={onClose} showHome={false} />
            </div>
            <div className="flex flex-1 flex-col items-center px-6 pt-10 text-center">
              <SuccessIllustration />
              <h2 className="mt-6 text-[22px] font-bold text-incred-ink">Application Submitted!</h2>
              <p className="mt-3 text-[14px] leading-relaxed text-incred-muted">
                Your personal loan application has been successfully submitted for review. We will get back to you
                shortly.
              </p>

              <div className="mt-6 w-full rounded-2xl p-5 text-left" style={{ backgroundColor: INCRED.peach }}>
                <p className="text-[14px] font-bold text-incred-ink">What happens next?</p>
                <p className="mt-2 text-[13px] leading-relaxed text-incred-ink">
                  Application Reference:{' '}
                  <span className="font-bold">{form.applicationRef || generateApplicationRef()}</span>
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-incred-muted">
                  Our team is reviewing your documents. You can track your application status in the InCred mobile
                  app. Approval typically takes 24–48 hours.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      {form.phase === 'login_info' && (
        <div className="absolute inset-x-0 bottom-0 border-t border-incred-border bg-white px-4 py-4">
          <OrangeButton onClick={handleProceedLogin}>Proceed</OrangeButton>
        </div>
      )}

      {form.phase === 'basic_details' && (
        <div className="absolute inset-x-0 bottom-0 border-t border-incred-border bg-white px-4 py-4">
          <OrangeButton onClick={handleProceedBasic}>Proceed</OrangeButton>
        </div>
      )}

      {form.phase === 'employment' && (
        <div className="absolute inset-x-0 bottom-0 flex gap-3 border-t border-incred-border bg-white px-4 py-4">
          <OrangeButton outline onClick={() => advancePhase('basic_details')} className="flex-1">
            Go Back
          </OrangeButton>
          <OrangeButton onClick={handleProceedEmployment} className="flex-1">
            Proceed
          </OrangeButton>
        </div>
      )}

      {form.phase === 'eligibility' && (
        <div className="absolute inset-x-0 bottom-0 border-t border-incred-border bg-white px-4 py-4">
          <OrangeButton onClick={handleProceedEligibility}>Proceed</OrangeButton>
        </div>
      )}

      {form.phase === 'success' && (
        <div className="shrink-0 border-t border-incred-border bg-white px-4 py-4">
          <OrangeButton onClick={onClose}>Back to Home</OrangeButton>
        </div>
      )}

      {/* Confirmation modals */}
      <IncredConfirmModal
        open={form.confirmModal === 'basic'}
        title="Please confirm your details"
        rows={[
          { label: 'PAN Card', value: form.pan || '—' },
          { label: 'Date of birth', value: formatDobLong(form.dobDay, form.dobMonth, form.dobYear) || '—' },
          { label: 'Pincode', value: form.pincode || '—' },
        ]}
        onClose={() => set({ confirmModal: null })}
        onEdit={() => set({ confirmModal: null })}
        onConfirm={handleConfirmBasic}
      />

      <IncredConfirmModal
        open={form.confirmModal === 'employment'}
        title="Please confirm your details"
        subtitle="You will not be able to edit this again"
        rows={[
          { label: 'Employment type', value: form.employmentType === 'salaried' ? 'Salaried' : 'Business' },
          { label: 'Company name', value: form.companyName || '—' },
          {
            label: 'Net Monthly Income',
            value: form.netMonthlyIncome ? `₹${Number(form.netMonthlyIncome).toLocaleString('en-IN')}` : '—',
          },
        ]}
        checkboxes={[
          { id: 'ckyc', checked: form.ckycConsent, label: 'I authorize InCred to fetch my KYC data from CKYC registry.' },
          { id: 'credit', checked: form.creditReportConsent, label: 'I authorize InCred to fetch my detailed credit report.' },
          { id: 'household', checked: form.householdIncomeConsent, label: 'I confirm that my household income is more than 3 lakhs per year' },
        ]}
        onClose={() => set({ confirmModal: null })}
        onEdit={() => set({ confirmModal: null })}
        onConfirm={handleConfirmEmployment}
      />
    </motion.div>
  );
}

export function IncredWelcomeScreen({ onApply }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <MoneyBagIllustration />
      <h2 className="mt-6 text-[20px] font-bold text-incred-ink">Welcome to InCred!</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-incred-muted">
        One stop solution for all your personal loan needs.
        <br />
        Click on &apos;Apply now&apos; &amp; get yours today.
      </p>
      <button
        type="button"
        onClick={onApply}
        className="press mt-8 rounded-lg px-10 py-3.5 text-[15px] font-bold text-white"
        style={{ backgroundColor: INCRED.orange }}
      >
        Apply now
      </button>
    </div>
  );
}
