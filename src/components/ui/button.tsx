import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-white transition-all-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 ripple",
  {
    variants: {
      variant: {
        default: "bg-royal-600 text-white hover:bg-royal-700 shadow-md hover:shadow-lg hover:-translate-y-0.5",
        destructive:
          "bg-burgundy-600 text-white hover:bg-burgundy-700 shadow-md hover:shadow-lg hover:-translate-y-0.5",
        outline:
          "border border-primary-300 bg-white hover:bg-primary-50 hover:text-primary-900 hover:shadow-md hover:-translate-y-0.5",
        secondary:
          "bg-primary-100 text-primary-900 hover:bg-primary-200 hover:shadow-md hover:-translate-y-0.5",
        ghost: "hover:bg-primary-100 hover:text-primary-900",
        link: "text-royal-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }