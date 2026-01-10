import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import * as ButtonModule from "@/components/ui/button"

export const AlertDialog = AlertDialogPrimitive.Root

type OverlayProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay> & {
  className?: string
}

export const AlertDialogOverlay = React.forwardRef<any, OverlayProps>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName || "AlertDialogOverlay"

type ContentProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content> & {
  className?: string
}

export const AlertDialogContent = React.forwardRef<any, ContentProps>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPrimitive.Portal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName || "AlertDialogContent"

type DivProps = React.HTMLAttributes<HTMLDivElement> & { className?: string }

export const AlertDialogHeader = ({ className, ...props }: DivProps) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

export const AlertDialogFooter = ({ className, ...props }: DivProps) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

type TitleProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title> & { className?: string }

export const AlertDialogTitle = React.forwardRef<any, TitleProps>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName || "AlertDialogTitle"

type DescriptionProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description> & { className?: string }

export const AlertDialogDescription = React.forwardRef<any, DescriptionProps>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName || "AlertDialogDescription"

type ActionProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action> & { className?: string }

export const AlertDialogAction = React.forwardRef<any, ActionProps>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action ref={ref} className={cn((ButtonModule as any).buttonVariants(), className)} {...props} />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName || "AlertDialogAction"

type CancelProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel> & { className?: string }

export const AlertDialogCancel = React.forwardRef<any, CancelProps>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn((ButtonModule as any).buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className)}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName || "AlertDialogCancel"
