import * as React from "react"
import { cn } from "@/lib/utils"

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & { className?: string }

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return <div className={cn("animate-pulse rounded-md bg-primary/10", className)} {...props} />
}

Skeleton.displayName = "Skeleton"

export default Skeleton
