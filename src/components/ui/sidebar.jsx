import React from 'react'

export const Sidebar = ({ children, ...props }) => (
  <div className="flex h-screen bg-bg" {...props}>
    {children}
  </div>
)

export const SidebarProvider = ({ children, ...props }) => (
  <div {...props}>
    {children}
  </div>
)

export const SidebarContent = ({ children, ...props }) => (
  <div className="w-64 bg-surface border-r border-border flex flex-col" {...props}>
    {children}
  </div>
)

export const SidebarHeader = ({ children, ...props }) => (
  <div className="p-4 border-b border-border" {...props}>
    {children}
  </div>
)

export const SidebarGroup = ({ children, ...props }) => (
  <div className="flex-1 overflow-y-auto" {...props}>
    {children}
  </div>
)

export const SidebarGroupContent = ({ children, ...props }) => (
  <div {...props}>
    {children}
  </div>
)

export const SidebarGroupLabel = ({ children, ...props }) => (
  <div className="px-4 py-2 text-sm font-medium text-muted uppercase tracking-wider" {...props}>
    {children}
  </div>
)

export const SidebarMenu = ({ children, ...props }) => (
  <div className="space-y-1 px-2" {...props}>
    {children}
  </div>
)

export const SidebarMenuItem = ({ children, ...props }) => (
  <div {...props}>
    {children}
  </div>
)

export const SidebarMenuButton = ({ children, className = "", ...props }) => (
  <button 
    className={`w-full flex items-center px-2 py-2 text-sm font-medium text-default rounded-md hover:bg-primary-soft transition-colors ${className}`} 
    {...props}
  >
    {children}
  </button>
)

export const SidebarFooter = ({ children, ...props }) => (
  <div className="p-4 border-t border-border" {...props}>
    {children}
  </div>
)

export const SidebarTrigger = ({ ...props }) => (
  <button className="p-2 text-default" {...props}>
    <span className="sr-only">Toggle sidebar</span>
    ☰
  </button>
)