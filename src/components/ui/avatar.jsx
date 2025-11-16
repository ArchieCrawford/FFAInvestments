import React from 'react'

export const Avatar = ({ children, className = "", ...props }) => (
  <div className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full ${className}`} {...props}>
    {children}
  </div>
)

export const AvatarFallback = ({ children, className = "", ...props }) => (
  <span className={`flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600 ${className}`} {...props}>
    {children}
  </span>
)