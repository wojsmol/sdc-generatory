import * as React from "react"
import { cn } from "@/lib/utils"

export interface FieldsetProps {
  legend: string
  children: React.ReactNode
  className?: string
}

export const Fieldset = ({ legend, children, className }: FieldsetProps) => (
  <fieldset className={cn("border border-gray-200 rounded-lg p-4", className)}>
    <legend className="text-sm font-semibold px-2 text-primary">{legend}</legend>
    <div className="space-y-4 mt-2">{children}</div>
  </fieldset>
)
