"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricsDisplay } from "@/components/metrics-display"
import { QualityScoreBadge } from "@/components/quality-score-badge"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, BookOpen } from "lucide-react"
import { toast } from "sonner"

interface AnalysisResult {
  qualityScore: number
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
  suggestions: string[]
}

const sampleTexts = {
  excellent: `The gun lay on the table between them, catching the amber light from the streetlamp outside. Sarah's fingers drummed against the wood—three beats, pause, three beats—while Marcus pretended to study the rain-streaked window.\n\n"We don't have to do this," she said.\n\nHe turned then, and she saw the answer in his eyes before he spoke. The Marcus she'd known—the one who'd taught her to sail, who'd bandaged her scraped knees, who'd walked her down the aisle—that Marcus was gone. In his place sat a stranger wearing her brother's face.\n\n"Yes," he said quietly. "We do."`,
  poor: `There was a gun on the table. Sarah was sitting there and so was Marcus. It was raining outside. She felt very nervous. He seemed sad. They had to make a very important decision about something bad that happened. She didn't want to do it but knew they probably had to. He agreed with her.`,
}

export default function TestExcellencePage() {
  const [text, setText] = React.useState("")
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [result, setResult] = React.useState<AnalysisResult | null>(null)

  const handleAnalyze = async () => {
    if (text.trim().length < 100) {
      toast.error("Please enter at least 100 characters for analysis")
      return
    }

    setIsAnalyzing(true)
    setResult(null)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to analyze text")
      }

      const data = await response.json()
      setResult(data)
      toast.success("Analysis complete!")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to analyze text"
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const loadSample = (type: "excellent" | "poor") => {
    setText(sampleTexts[type])
    setResult(null)
  }

  const wordCount = text.trim().split(/\s+/).filter((w) => w.length > 0).length

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="mr-1 h-3 w-3" />
            UWQES Excellence Engine
          </Badge>
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Test the Excellence Engine
        </h1>
        <p className="text-lg text-muted-foreground">
          Experience our revolutionary Universal Writing Quality Evaluation System.
          Paste your text below to get instant quality metrics and improvement
          suggestions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Text</CardTitle>
              <CardDescription>
                Enter at least 100 characters for meaningful analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-input">Text to Analyze</Label>
                <Textarea
                  id="text-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your writing here..."
                  className="min-h-[300px] font-serif text-base leading-relaxed"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{wordCount} words</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadSample("excellent")}
                      className="hover:text-foreground transition-colors"
                    >
                      Load excellent sample
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => loadSample("poor")}
                      className="hover:text-foreground transition-colors"
                    >
                      Load poor sample
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || wordCount < 20}
                size="lg"
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze Quality
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          {result && (
            <Tabs defaultValue="metrics" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="metrics">Quality Metrics</TabsTrigger>
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              </TabsList>

              <TabsContent value="metrics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Overall Quality Score</CardTitle>
                        <CardDescription>
                          Based on 9 key writing dimensions
                        </CardDescription>
                      </div>
                      <QualityScoreBadge
                        score={result.qualityScore}
                        showLabel
                        size="lg"
                      />
                    </div>
                  </CardHeader>
                </Card>

                <MetricsDisplay metrics={result.metrics} />
              </TabsContent>

              <TabsContent value="suggestions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Improvement Suggestions</CardTitle>
                    <CardDescription>
                      AI-powered recommendations to elevate your writing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {result.suggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About UWQES</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                The Universal Writing Quality Evaluation System (UWQES) analyzes
                your writing across 9 key dimensions:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Wordiness & Conciseness</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Active Voice Usage</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Readability Score</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Adverb Frequency</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Sentence Variety</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Dialogue Balance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Show vs Tell Ratio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Pacing Analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Emotional Impact</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-base">Unlock Full Power</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign up to save your projects, track progress over time, and get
                unlimited quality analyses.
              </p>
              <Button className="w-full" asChild>
                <a href="/auth/signin">Get Started Free</a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tips for Best Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Use at least 200-300 words for accurate analysis</p>
              <p>• Include dialogue and narrative for comprehensive metrics</p>
              <p>• Try different writing styles to see how scores change</p>
              <p>• Compare before/after revisions to track improvement</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
