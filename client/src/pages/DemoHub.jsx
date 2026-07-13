import React from 'react';
import { Link } from 'react-router-dom';
import { getCompaniesForHub } from '../companies/registry.js';

const STATUS_LABELS = {
  active: { text: 'Ready', className: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30' },
  wip: { text: 'In progress', className: 'bg-amber-500/15 text-amber-300 ring-amber-500/30' },
  legacy: { text: 'Legacy', className: 'bg-slate-500/15 text-slate-300 ring-slate-500/30' },
};

const PLATFORM_LABELS = {
  mobile: 'Mobile',
  web: 'Web',
};

function CompanyCard({ company }) {
  const status = STATUS_LABELS[company.status] ?? STATUS_LABELS.wip;
  const primary = company.theme?.primary ?? '#334155';

  return (
    <Link
      to={`/${company.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 transition hover:bg-white/8 hover:ring-white/20"
    >
      <div className="h-2" style={{ background: primary }} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white group-hover:text-white">
              {company.name}
            </h2>
            <p className="mt-0.5 text-sm text-white/50">{company.shortName}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${status.className}`}
          >
            {status.text}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-white/60">{company.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xs font-medium text-white/40">
            {PLATFORM_LABELS[company.platform] ?? company.platform} demo
          </span>
          <span className="text-sm font-semibold text-white/70 group-hover:text-white">
            Open →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function DemoHub() {
  const companies = getCompaniesForHub();

  return (
    <div className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/40">
            SilverSuits Demo Platform
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Company Demos</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/55">
            One project, many fintech demos. Pick a company to open its isolated demo at{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-white/80">
              /{'{company}'}
            </code>
            .
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <CompanyCard key={company.slug} company={company} />
          ))}
        </div>

        <footer className="mt-12 rounded-xl bg-white/5 px-5 py-4 text-sm text-white/45 ring-1 ring-white/10">
          <p>
            <strong className="text-white/70">Adding a new company:</strong> create{' '}
            <code className="text-white/60">client/src/companies/{'{slug}'}/config.js</code>, register
            it in <code className="text-white/60">companies/registry.js</code>, then build UI from
            screenshots in that folder.
          </p>
        </footer>
      </div>
    </div>
  );
}
