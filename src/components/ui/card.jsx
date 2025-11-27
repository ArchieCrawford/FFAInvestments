import React from 'react'

// Semantic Card components. Legacy app-card* classes removed.
export const Card = ({ children, className = "", ...props }) => (
  <div className={`card p-4 ${className}`.trim()} {...props}>
    {children}
  </div>
)

export const CardHeader = ({ children, className = "", ...props }) => (
  <div className={`border-b border-border mb-3 pb-2 flex items-center justify-between ${className}`.trim()} {...props}>
    {children}
  </div>
)

export const CardTitle = ({ children, className = "", ...props }) => (
  <h3 className={`text-lg font-semibold text-default ${className}`.trim()} {...props}>
    {children}
  </h3>
)

export const CardContent = ({ children, className = "", ...props }) => (
  <div className={`mt-2 ${className}`.trim()} {...props}>
    {children}
  </div>
)