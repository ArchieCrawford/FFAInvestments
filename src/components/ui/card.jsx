import React from 'react'

export const Card = ({ children, className = "", ...props }) => (
  <div className={`app-card ${className}`} {...props}>
    {children}
  </div>
)

export const CardHeader = ({ children, className = "", ...props }) => (
  <div className={`app-card-header ${className}`} {...props}>
    {children}
  </div>
)

export const CardTitle = ({ children, className = "", ...props }) => (
  <h3 className={`app-card-title ${className}`} {...props}>
    {children}
  </h3>
)

export const CardContent = ({ children, className = "", ...props }) => (
  <div className={`app-card-content ${className}`} {...props}>
    {children}
  </div>
)