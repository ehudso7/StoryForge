import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  text?: string
  className?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
}

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
}

export function LoadingSpinner({
  size = "md",
  text,
  className,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
    >
      <Loader2
        className={cn("animate-spin text-primary", sizeClasses[size])}
        aria-label="Loading"
      />
      {text && (
        <p
          className={cn(
            "text-muted-foreground font-medium",
            textSizeClasses[size]
          )}
        >
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return spinner
}

export function LoadingCard({ title = "Loading..." }: { title?: string }) {
  return (
    <div className="rounded-lg border bg-card p-8">
      <LoadingSpinner size="lg" text={title} />
    </div>
  )
}

export function LoadingPage({ title = "Loading..." }: { title?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingSpinner size="xl" text={title} />
    </div>
  )
}
