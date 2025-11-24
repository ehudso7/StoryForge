"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SceneEditorProps {
  value: string
  onChange: (value: string) => void
  sceneTitle?: string
  onTitleChange?: (title: string) => void
  className?: string
  placeholder?: string
  minHeight?: string
}

export function SceneEditor({
  value,
  onChange,
  sceneTitle = "",
  onTitleChange,
  className,
  placeholder = "Start writing your scene...",
  minHeight = "500px",
}: SceneEditorProps) {
  const [wordCount, setWordCount] = React.useState(0)
  const [charCount, setCharCount] = React.useState(0)
  const [sentenceCount, setSentenceCount] = React.useState(0)
  const [paragraphCount, setParagraphCount] = React.useState(0)

  React.useEffect(() => {
    // Calculate word count
    const words = value.trim().split(/\s+/).filter((word) => word.length > 0)
    setWordCount(words.length)

    // Calculate character count (excluding spaces)
    setCharCount(value.replace(/\s/g, "").length)

    // Calculate sentence count (simple approach)
    const sentences = value.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    setSentenceCount(sentences.length)

    // Calculate paragraph count
    const paragraphs = value
      .split(/\n\n+/)
      .filter((p) => p.trim().length > 0)
    setParagraphCount(paragraphs.length)
  }, [value])

  return (
    <div className={cn("space-y-4", className)}>
      {/* Scene Title Input */}
      {onTitleChange !== undefined && (
        <div className="space-y-2">
          <Label htmlFor="scene-title">Scene Title</Label>
          <input
            id="scene-title"
            type="text"
            value={sceneTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter scene title..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      )}

      {/* Editor */}
      <div className="space-y-2">
        <Label htmlFor="scene-content">Scene Content</Label>
        <Textarea
          id="scene-content"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="font-serif text-base leading-relaxed resize-none"
          style={{ minHeight }}
        />
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Writing Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold">{wordCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Words</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{charCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Characters</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{sentenceCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Sentences</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{paragraphCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Paragraphs</p>
            </div>
          </div>

          {/* Additional Stats */}
          {wordCount > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">
                Avg. {Math.round(wordCount / Math.max(sentenceCount, 1))} words/sentence
              </Badge>
              <Badge variant="secondary">
                Avg. {Math.round(charCount / Math.max(wordCount, 1))} chars/word
              </Badge>
              <Badge variant="secondary">
                ~{Math.ceil(wordCount / 250)} min read
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
