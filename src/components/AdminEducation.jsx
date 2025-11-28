import React from 'react';
import { Page } from './Page';
import { Plus } from 'lucide-react';

export default function AdminEducation() {
  const actions = (
    <button className="btn-primary flex items-center gap-2">
      <Plus className="w-4 h-4" />
      Add Lesson
    </button>
  );

  return (
    <Page
      title="Education Management"
      actions={actions}
    >
      <div className="card p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-default mb-2">Educational Content</h3>
          <p className="text-sm text-muted">Build lessons, workshops, and tutorials</p>
        </div>
        <p className="text-muted">
          No educational content created yet. Start building your investment education library.
        </p>
      </div>
    </Page>
  );
}
