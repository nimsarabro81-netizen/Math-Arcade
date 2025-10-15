
"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const ballVariants = cva(
  "relative border-4 flex items-center justify-center cursor-pointer transition-all duration-300 ease-out",
  {
    variants: {
      type: {
        positive: "border-red-500 bg-red-500/10",
        negative: "border-blue-500 bg-blue-500/10",
      },
      size: {
        full: "w-14 h-14 md:w-16 md:h-16",
        half: "w-14 h-7 md:w-16 md:h-8 overflow-hidden"
      },
      selected: {
        true: "ring-4 ring-offset-2 ring-accent scale-110 shadow-lg",
        false: "hover:scale-105",
      },
      state: {
        entering: "animate-ball-in",
        idle: "",
        exiting: "animate-ball-out",
      }
    },
    compoundVariants: [
        {
            type: "positive",
            size: "full",
            className: "rounded-full"
        },
        {
            type: "positive",
            size: "half",
            className: "rounded-t-full"
        },
        {
            type: "negative",
            size: "full",
            className: "rounded-lg"
        },
        {
            type: "negative",
            size: "half",
            className: "rounded-t-lg"
        }
    ],
    defaultVariants: {
      type: "positive",
      selected: false,
      state: "entering",
      size: "full"
    },
  }
);

export interface BallProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof ballVariants> {}

export function Ball({ className, type, selected, state, size, ...props }: BallProps) {
  return (
    <div
      className={cn(ballVariants({ type, selected, state, size }), className)}
      {...props}
      aria-selected={selected}
    >
      <div className={cn(
          "transition-colors", 
          type === 'positive' ? 'bg-red-500' : 'bg-blue-500',
          size === 'full' ? 'w-4 h-4 rounded-full' : 'w-4 h-2 rounded-t-full'
        )}></div>
    </div>
  );
}
