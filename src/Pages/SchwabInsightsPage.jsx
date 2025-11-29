import React from 'react';
import { Page } from '../components/Page';
import SchwabInsights from './SchwabInsights';
import EnrichSymbolsButton from '../components/EnrichSymbolsButton.jsx';

export default function SchwabInsightsPage() {
  return (
    <Page title="Schwab Insights" subtitle="Portfolio analytics and performance metrics">
      <div className="flex flex-col gap-6">
        <div className="p-4 rounded-lg border border-border bg-surface shadow-sm">
          <h2 className="text-lg font-semibold mb-2 text-default">Data Hygiene Actions</h2>
          <p className="text-sm text-muted mb-3">Use these maintenance tools to enrich security metadata for cleaner position displays.</p>
          <EnrichSymbolsButton />
        </div>
        <div className="card">
          <div className="card-content">
            <SchwabInsights />
          </div>
        </div>
      </div>
    </Page>
  );
}
