"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const ballVariants = cva(
  "relative w-14 h-14 md:w-16 md:h-16 border-4 flex items-center justify-center cursor-pointer transition-all duration-300 ease-out",
  {
    variants: {
      type: {
        positive: "border-red-500 bg-red-500/10 rounded-full",
        negative: "border-blue-500 bg-blue-500/10 rounded-lg",
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
    defaultVariants: {
      type: "positive",
      selected: false,
      state: "entering",
    },
  }
);

export interface BallProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof ballVariants> {}

export function Ball({ className, type, selected, state, ...props }: BallProps) {
  return (
    <div
      className={cn(ballVariants({ type, selected, state }), className)}
      {...props}
      aria-selected={selected}
    >
      <span className="sr-only">{type} ball</span>
    </div>
  );
}
