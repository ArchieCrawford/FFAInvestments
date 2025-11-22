import React from 'react';

export default function AdminEducation() {
  return (
    <div className="app-page">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="app-heading-lg">Education Management</h2>
        <button className="app-btn app-btn-primary app-btn-pill">+ Add Lesson</button>
      </div>
      
      <div className="app-card">
        <div className="app-card-header">
          <p className="app-card-title">Educational Content</p>
          <p className="app-card-subtitle">Build lessons, workshops, and tutorials</p>
        </div>
        <div className="app-card-content">
          <p className="app-text-muted">
            No educational content created yet. Start building your investment education library.
          </p>
        </div>
      </div>
    </div>
  );
}
