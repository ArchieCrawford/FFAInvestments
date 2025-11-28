import React from "react";

export function Page({ title, subtitle, actions, children }) {
  return (
    <div className="min-h-screen bg-bg text-default">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            {title && (
              <h1 className="text-lg font-semibold tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs text-muted">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </header>

        {children}
      </div>
    </div>
  );
}
