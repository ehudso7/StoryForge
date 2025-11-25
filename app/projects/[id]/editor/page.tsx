"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { ArrowLeft, Save, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SceneEditor } from "@/components/scene-editor"
import { MetricsDisplay } from "@/components/metrics-display"
import { QualityScoreBadge } from "@/components/quality-score-badge"
import { LoadingPage } from "@/components/loading-spinner"
import { toast } from "sonner"

interface Scene {
  id: string
  title: string
  content: string
  wordCount: number
  qualityScore?: number
  metrics?: {
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
}

interface Project {
  id: string
  title: string
}

export default function EditorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const sceneId = searchParams.get("scene")
  const queryClient = useQueryClient()

  const [sceneTitle, setSceneTitle] = React.useState("")
  const [sceneContent, setSceneContent] = React.useState("")
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)

  // Redirect to sign in if not authenticated
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Fetch project
  const { data: project } = useQuery<Project>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch project")
      }
      return response.json()
    },
    enabled: !!session && !!projectId,
  })

  // Fetch scene if editing
  const { data: scene, isLoading } = useQuery<Scene>({
    queryKey: ["scene", sceneId],
    queryFn: async () => {
      const response = await fetch(`/api/scenes/${sceneId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch scene")
      }
      return response.json()
    },
    enabled: !!session && !!sceneId,
  })

  // Load scene data when fetched
  React.useEffect(() => {
    if (scene) {
      setSceneTitle(scene.title)
      setSceneContent(scene.content)
      setHasUnsavedChanges(false)
    }
  }, [scene])

  // Track changes
  React.useEffect(() => {
    if (scene) {
      const changed =
        sceneTitle !== scene.title || sceneContent !== scene.content
      setHasUnsavedChanges(changed)
    }
  }, [sceneTitle, sceneContent, scene])

  // Save scene mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = sceneId
        ? `/api/scenes/${sceneId}`
        : `/api/projects/${projectId}/scenes`
      const method = sceneId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: sceneTitle,
          content: sceneContent,
          projectId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to save scene")
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast.success("Scene saved successfully!")
      setHasUnsavedChanges(false)
      if (!sceneId) {
        // Navigate to the newly created scene
        router.push(`/projects/${projectId}/editor?scene=${data.id}`)
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to save scene"
      )
    },
  })

  // Analyze scene
  const handleAnalyze = async () => {
    if (!sceneId) {
      toast.error("Please save your scene before analyzing")
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch(`/api/scenes/${sceneId}/analyze`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to analyze scene")
      }

      const data = await response.json()
      toast.success("Scene analyzed successfully!")
      await queryClient.invalidateQueries({ queryKey: ["scene", sceneId] })
    } catch (error) {
      toast.error("Failed to analyze scene")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Auto-save
  React.useEffect(() => {
    if (!hasUnsavedChanges) return

    const timer = setTimeout(() => {
      if (hasUnsavedChanges && sceneContent.length > 0) {
        saveMutation.mutate()
      }
    }, 5000) // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(timer)
  }, [hasUnsavedChanges, sceneContent, saveMutation])

  if (status === "loading" || (sceneId && isLoading)) {
    return <LoadingPage title="Loading editor..." />
  }

  if (!session) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {sceneId ? "Edit Scene" : "New Scene"}
            </h1>
            {project && (
              <p className="text-muted-foreground">
                Writing in: {project.title}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!hasUnsavedChanges || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleAnalyze}
              disabled={!sceneId || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-600 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-400">
            You have unsaved changes. Changes will auto-save in 5 seconds.
          </div>
        )}
      </div>

      <Tabs defaultValue="editor" className="space-y-6">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="metrics" disabled={!scene?.metrics}>
            Quality Metrics
            {scene?.qualityScore && (
              <QualityScoreBadge
                score={scene.qualityScore}
                size="sm"
                className="ml-2"
              />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          <SceneEditor
            value={sceneContent}
            onChange={setSceneContent}
            sceneTitle={sceneTitle}
            onTitleChange={setSceneTitle}
            minHeight="600px"
          />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          {scene?.metrics ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Overall Quality Score</CardTitle>
                      <CardDescription>
                        UWQES (Universal Writing Quality Evaluation System)
                      </CardDescription>
                    </div>
                    {scene.qualityScore && (
                      <QualityScoreBadge
                        score={scene.qualityScore}
                        showLabel
                        size="lg"
                      />
                    )}
                  </div>
                </CardHeader>
              </Card>

              <MetricsDisplay metrics={scene.metrics} />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Metrics Available</CardTitle>
                <CardDescription>
                  Click "Analyze" to generate quality metrics for this scene
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleAnalyze} disabled={!sceneId || isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Scene
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
