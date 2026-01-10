"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

// Export Radix primitives (use `any` for compatibility with possible API shape differences)
export const Collapsible = CollapsiblePrimitive.Root
export const CollapsibleTrigger: any = (CollapsiblePrimitive as any).Trigger || (CollapsiblePrimitive as any).CollapsibleTrigger
export const CollapsibleContent: any = (CollapsiblePrimitive as any).Content || (CollapsiblePrimitive as any).CollapsibleContent

