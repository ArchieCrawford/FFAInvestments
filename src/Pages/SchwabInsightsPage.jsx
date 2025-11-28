import React from 'react';
import { Page } from '../components/Page';
import SchwabInsights from './SchwabInsights';

export default function SchwabInsightsPage() {
  return (
    <Page title="Schwab Insights" subtitle="Portfolio analytics and performance metrics">
      <div className="card">
        <div className="card-content">
          <SchwabInsights />
        </div>
      </div>
    </Page>
  );
}
