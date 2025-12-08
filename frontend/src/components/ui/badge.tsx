import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-sm",
        outline: "text-foreground border-2 hover:bg-muted",
        success: "border-transparent bg-success text-success-foreground hover:bg-success/80 shadow-sm",
        warning: "border-transparent bg-warning text-warning-foreground hover:bg-warning/80 shadow-sm",
        accent: "border-transparent bg-accent text-accent-foreground hover:bg-accent/80 shadow-lime-glow",
        urban: "border-transparent bg-urban-blue text-white hover:bg-urban-indigo shadow-sm",
        "urban-outline": "border-2 border-urban-blue text-urban-blue hover:bg-urban-blue/10",
        "lime-outline": "border-2 border-accent text-accent hover:bg-accent/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
