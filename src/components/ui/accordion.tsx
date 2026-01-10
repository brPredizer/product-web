import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export const Accordion = AccordionPrimitive.Root

type ItemProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> & {
  className?: string
}

export const AccordionItem = React.forwardRef<any, ItemProps>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn("border-b", className)} {...props} />
))
AccordionItem.displayName = "AccordionItem"

type TriggerProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
  className?: string
  children?: React.ReactNode
}

export const AccordionTrigger = React.forwardRef<any, TriggerProps>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}>
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName || "AccordionTrigger"

type ContentProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> & {
  className?: string
  children?: React.ReactNode
}

export const AccordionContent = React.forwardRef<any, ContentProps>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}>
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName || "AccordionContent"
