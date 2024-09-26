import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  label?: string;
  showValue?: boolean;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, label, showValue = false, ...props }, ref) => (
  <div className={cn("space-y-2", className)}>
    {label && <div className="text-sm font-medium text-gray-300">{label}</div>}
    <SliderPrimitive.Root
      ref={ref}
      className="relative flex w-full touch-none select-none items-center"
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-700">
        <SliderPrimitive.Range className="absolute h-full bg-orange-500" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-orange-500 bg-gray-200 ring-offset-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
    {showValue && (
      <div className="text-sm text-gray-400">
        Value: {props.value?.[0] ?? props.defaultValue?.[0]}
      </div>
    )}
  </div>
));

Slider.displayName = "Slider";

export { Slider };
