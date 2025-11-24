import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricsDisplayProps {
  metrics: {
    wordiness: number
    passiveVoice: number
    readability: number
    adverbUsage: number
    sentenceVariety: number
    dialogueBalance: number
    showNotTell: number
    pacing: number
    emotionalImpact: number
  }
  className?: string
}

interface MetricItemProps {
  label: string
  value: number
  description: string
  ideal?: string
}

function getMetricColor(value: number) {
  if (value >= 80) return "text-emerald-600 dark:text-emerald-400"
  if (value >= 60) return "text-green-600 dark:text-green-400"
  if (value >= 40) return "text-yellow-600 dark:text-yellow-400"
  if (value >= 20) return "text-orange-600 dark:text-orange-400"
  return "text-red-600 dark:text-red-400"
}

function getProgressColor(value: number) {
  if (value >= 80) return "bg-emerald-500"
  if (value >= 60) return "bg-green-500"
  if (value >= 40) return "bg-yellow-500"
  if (value >= 20) return "bg-orange-500"
  return "bg-red-500"
}

function MetricItem({ label, value, description, ideal }: MetricItemProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{description}</p>
                {ideal && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ideal: {ideal}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className={cn("text-sm font-bold", getMetricColor(value))}>
          {value.toFixed(0)}
        </span>
      </div>
      <div className="relative">
        <Progress value={value} className="h-2" />
        <div
          className={cn(
            "absolute inset-0 h-2 rounded-full transition-all",
            getProgressColor(value)
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export function MetricsDisplay({ metrics, className }: MetricsDisplayProps) {
  const metricsData = [
    {
      label: "Wordiness",
      value: metrics.wordiness,
      description: "Measures conciseness and economy of language. Higher scores indicate more direct, impactful writing.",
      ideal: "60-80",
    },
    {
      label: "Passive Voice",
      value: metrics.passiveVoice,
      description: "Evaluates active vs. passive voice usage. Higher scores mean more active, engaging prose.",
      ideal: "70-90",
    },
    {
      label: "Readability",
      value: metrics.readability,
      description: "Assesses text complexity and ease of reading. Balances accessibility with sophistication.",
      ideal: "60-80",
    },
    {
      label: "Adverb Usage",
      value: metrics.adverbUsage,
      description: "Tracks adverb frequency. Higher scores indicate stronger verbs and more vivid descriptions.",
      ideal: "65-85",
    },
    {
      label: "Sentence Variety",
      value: metrics.sentenceVariety,
      description: "Measures variation in sentence structure and length. Variety creates engaging rhythm.",
      ideal: "70-90",
    },
    {
      label: "Dialogue Balance",
      value: metrics.dialogueBalance,
      description: "Evaluates the balance between dialogue and narrative. Proper balance maintains pace.",
      ideal: "60-80",
    },
    {
      label: "Show vs Tell",
      value: metrics.showNotTell,
      description: "Measures showing through action/detail vs. telling. Higher scores indicate more immersive writing.",
      ideal: "65-85",
    },
    {
      label: "Pacing",
      value: metrics.pacing,
      description: "Analyzes story momentum and scene progression. Good pacing keeps readers engaged.",
      ideal: "60-85",
    },
    {
      label: "Emotional Impact",
      value: metrics.emotionalImpact,
      description: "Assesses emotional resonance and character depth. Strong emotions create memorable stories.",
      ideal: "70-90",
    },
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Writing Metrics</CardTitle>
          <Badge variant="secondary">UWQES v1.0</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {metricsData.map((metric) => (
            <MetricItem key={metric.label} {...metric} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
