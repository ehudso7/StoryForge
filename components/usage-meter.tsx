import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Zap } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface UsageMeterProps {
  tier: "free" | "starter" | "pro" | "enterprise"
  usage: {
    projects: { current: number; limit: number }
    scenes: { current: number; limit: number }
    analyses: { current: number; limit: number }
    apiCalls: { current: number; limit: number }
  }
  className?: string
}

function getUsageColor(percentage: number) {
  if (percentage >= 90) return "bg-red-500"
  if (percentage >= 75) return "bg-orange-500"
  if (percentage >= 50) return "bg-yellow-500"
  return "bg-green-500"
}

function getUsageTextColor(percentage: number) {
  if (percentage >= 90) return "text-red-600 dark:text-red-400"
  if (percentage >= 75) return "text-orange-600 dark:text-orange-400"
  if (percentage >= 50) return "text-yellow-600 dark:text-yellow-400"
  return "text-green-600 dark:text-green-400"
}

interface UsageItemProps {
  label: string
  current: number
  limit: number
  unit: string
}

function UsageItem({ label, current, limit, unit }: UsageItemProps) {
  const percentage = (current / limit) * 100
  const isUnlimited = limit === -1

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={cn("text-sm font-semibold", getUsageTextColor(percentage))}>
          {isUnlimited ? (
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              Unlimited
            </span>
          ) : (
            `${current.toLocaleString()} / ${limit.toLocaleString()} ${unit}`
          )}
        </span>
      </div>
      {!isUnlimited && (
        <div className="relative">
          <Progress value={percentage} className="h-2" />
          <div
            className={cn(
              "absolute inset-0 h-2 rounded-full transition-all",
              getUsageColor(percentage)
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

const tierColors = {
  free: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  starter: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  pro: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
}

export function UsageMeter({ tier, usage, className }: UsageMeterProps) {
  const totalPercentage =
    usage.projects.limit === -1
      ? 0
      : ((usage.projects.current / usage.projects.limit +
          usage.scenes.current / usage.scenes.limit +
          usage.analyses.current / usage.analyses.limit +
          usage.apiCalls.current / usage.apiCalls.limit) /
          4) *
        100

  const isNearingLimit = totalPercentage >= 75 && usage.projects.limit !== -1
  const hasExceededLimit = totalPercentage >= 100

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Usage & Limits</CardTitle>
          <Badge className={tierColors[tier]}>
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <UsageItem
            label="Projects"
            current={usage.projects.current}
            limit={usage.projects.limit}
            unit="projects"
          />
          <UsageItem
            label="Scenes"
            current={usage.scenes.current}
            limit={usage.scenes.limit}
            unit="scenes"
          />
          <UsageItem
            label="Quality Analyses"
            current={usage.analyses.current}
            limit={usage.analyses.limit}
            unit="analyses"
          />
          <UsageItem
            label="API Calls"
            current={usage.apiCalls.current}
            limit={usage.apiCalls.limit}
            unit="calls"
          />
        </div>

        {isNearingLimit && (
          <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950/50">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {hasExceededLimit
                  ? "Limit Reached"
                  : "Approaching Usage Limit"}
              </p>
              <p className="text-xs text-orange-600/80 dark:text-orange-400/80">
                {hasExceededLimit
                  ? "You've reached your plan limits. Upgrade to continue."
                  : "Consider upgrading your plan to avoid interruptions."}
              </p>
            </div>
          </div>
        )}

        {tier === "free" && (
          <Button asChild className="w-full">
            <Link href="/pricing">
              <Zap className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
