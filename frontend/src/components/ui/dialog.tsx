"use client";

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const Dialog = ({ open, onOpenChange, children }: { open: boolean, onOpenChange: (open: boolean) => void, children: React.ReactNode }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-lg border bg-background p-6 shadow-lg sm:rounded-lg">
        {children}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  )
}

const DialogContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("flex flex-col space-y-4", className)}>{children}</div>
)

const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col space-y-1.5 text-center sm:text-left">{children}</div>
)

const DialogFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">{children}</div>
)

const DialogTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold leading-none tracking-tight">{children}</h2>
)

const DialogDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground">{children}</p>
)

export { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }
