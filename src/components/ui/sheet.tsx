import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
import { useSwipeToClose } from "@/hooks/useSwipeToClose"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-[9999] bg-black/50 backdrop-blur-md data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> {
  side?: "top" | "bottom" | "left" | "right"
  showHandle?: boolean
  enableSwipeToClose?: boolean
  onOpenChange?: (open: boolean) => void
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "bottom", className, children, showHandle = true, enableSwipeToClose = true, onOpenChange, ...props }, ref) => {
  
  const handleClose = React.useCallback(() => {
    onOpenChange?.(false)
  }, [onOpenChange])

  const { elementRef, isDragging } = useSwipeToClose({
    onClose: handleClose,
    enabled: enableSwipeToClose && side === "bottom",
    threshold: 100
  })

  const contentRef = React.useCallback((node: HTMLDivElement) => {
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
    if (elementRef) {
      elementRef.current = node
    }
  }, [ref, elementRef])

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={contentRef}
        className={cn(
          "fixed z-[9999] gap-4 bg-white shadow-2xl transition-all duration-300 ease-out",
          side === "bottom" && "inset-x-0 bottom-0 border-t border-primary-200 rounded-t-3xl data-[state=open]:animate-slide-up data-[state=closed]:animate-slide-down",
          side === "top" && "inset-x-0 top-0 border-b border-primary-200 rounded-b-3xl data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out",
          side === "left" && "inset-y-0 left-0 h-full w-3/4 border-r border-primary-200 max-w-sm data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out",
          side === "right" && "inset-y-0 right-0 h-full w-3/4 border-l border-primary-200 max-w-sm data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out",
          isDragging && "!transition-none",
          className
        )}
        {...props}
      >
        {showHandle && side === "bottom" && (
          <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-primary-300 rounded-full" />
          </div>
        )}
        <div className={cn("px-6", side === "bottom" && !showHandle && "pt-6", side === "bottom" && showHandle && "pb-6")}>
          {children}
        </div>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
})
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-primary-900", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-primary-600", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}