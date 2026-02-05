import React from "react";
import { cn } from "@/lib/utils";

interface InvisibleScrollAreaProps {
  className?: string;
  children: React.ReactNode;
}

const InvisibleScrollArea = React.forwardRef<HTMLDivElement, InvisibleScrollAreaProps>(
  ({ className, children }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          className
        )}
      >
        {children}
      </div>
    );
  }
);

InvisibleScrollArea.displayName = "InvisibleScrollArea";

export default InvisibleScrollArea;
