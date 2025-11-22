import React from 'react';

export default function AdminEducation() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Education Management</h2>
        <button className="app-btn app-btn-primary">+ Add Lesson</button>
      </div>
      
      <div className="task-box">
        <h5 className="mb-3">Educational Content</h5>
        <p className="text-muted">No educational content created yet. Start building your investment education library.</p>
      </div>
    </>
  );
}