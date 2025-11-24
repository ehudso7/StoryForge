import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface QualityScoreBadgeProps {
  score: number
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

function getScoreColor(score: number) {
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800"
  if (score >= 80) return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/50 border-green-200 dark:border-green-800"
  if (score >= 70) return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800"
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800"
  if (score >= 50) return "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800"
  return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/50 border-red-200 dark:border-red-800"
}

function getScoreLabel(score: number) {
  if (score >= 90) return "Excellent"
  if (score >= 80) return "Very Good"
  if (score >= 70) return "Good"
  if (score >= 60) return "Fair"
  if (score >= 50) return "Below Average"
  return "Needs Improvement"
}

function getScoreDescription(score: number) {
  if (score >= 90) return "Outstanding quality with exceptional writing"
  if (score >= 80) return "High quality with strong writing fundamentals"
  if (score >= 70) return "Good quality with solid writing"
  if (score >= 60) return "Acceptable quality with room for improvement"
  if (score >= 50) return "Below average quality requiring attention"
  return "Significant improvement needed"
}

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-0.5",
  lg: "text-base px-3 py-1",
}

export function QualityScoreBadge({
  score,
  showLabel = false,
  size = "md",
  className,
}: QualityScoreBadgeProps) {
  const colorClass = getScoreColor(score)
  const label = getScoreLabel(score)
  const description = getScoreDescription(score)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "font-semibold",
              colorClass,
              sizeClasses[size],
              className
            )}
          >
            <span className="font-mono">{score.toFixed(1)}</span>
            {showLabel && <span className="ml-1.5">• {label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
            <p className="text-xs text-muted-foreground">
              UWQES Score: {score.toFixed(2)}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
