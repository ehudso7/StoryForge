"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Plus, ArrowLeft, Edit, Trash2, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { QualityScoreBadge } from "@/components/quality-score-badge"
import { LoadingPage } from "@/components/loading-spinner"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Scene {
  id: string
  title: string
  content: string
  wordCount: number
  qualityScore?: number
  createdAt: Date
  updatedAt: Date
}

interface Project {
  id: string
  title: string
  description?: string
  genre?: string
  targetWordCount: number
  wordCount: number
  status: "draft" | "in_progress" | "completed"
  scenes: Scene[]
  averageQualityScore?: number
  createdAt: Date
  updatedAt: Date
}

export default function ProjectDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const queryClient = useQueryClient()

  // Redirect to sign in if not authenticated
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Fetch project
  const { data: project, isLoading } = useQuery<Project>({
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

  const handleDeleteScene = async (sceneId: string) => {
    if (!confirm("Are you sure you want to delete this scene?")) {
      return
    }

    try {
      const response = await fetch(`/api/scenes/${sceneId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete scene")
      }
      toast.success("Scene deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
    } catch (error) {
      toast.error("Failed to delete scene")
    }
  }

  if (status === "loading" || isLoading) {
    return <LoadingPage title="Loading project..." />
  }

  if (!session || !project) {
    return null
  }

  const progress = project.targetWordCount > 0
    ? (project.wordCount / project.targetWordCount) * 100
    : 0

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {project.title}
              </h1>
              {project.averageQualityScore && (
                <QualityScoreBadge
                  score={project.averageQualityScore}
                  showLabel
                  size="lg"
                />
              )}
            </div>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {project.genre && <Badge variant="secondary">{project.genre}</Badge>}
              <span>•</span>
              <span>
                Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href={`/projects/${projectId}/editor`}>
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit project</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scenes List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Scenes</CardTitle>
                  <CardDescription>
                    {project.scenes.length} scene
                    {project.scenes.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <Button asChild>
                  <Link href={`/projects/${projectId}/editor`}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Scene
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {project.scenes.length > 0 ? (
                <div className="space-y-4">
                  {project.scenes.map((scene, index) => (
                    <div key={scene.id}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-1">
                          <Link
                            href={`/projects/${projectId}/editor?scene=${scene.id}`}
                            className="font-medium hover:underline"
                          >
                            {scene.title || `Scene ${index + 1}`}
                          </Link>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{scene.wordCount.toLocaleString()} words</span>
                            {scene.qualityScore && (
                              <>
                                <span>•</span>
                                <QualityScoreBadge
                                  score={scene.qualityScore}
                                  size="sm"
                                />
                              </>
                            )}
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(scene.updatedAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link href={`/projects/${projectId}/editor?scene=${scene.id}`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteScene(scene.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                      {index < project.scenes.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    No scenes yet. Create your first scene to start writing.
                  </p>
                  <Button asChild>
                    <Link href={`/projects/${projectId}/editor`}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Scene
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Writing Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Word Count</span>
                  <span className="font-medium">
                    {project.wordCount.toLocaleString()} /{" "}
                    {project.targetWordCount.toLocaleString()}
                  </span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {Math.round(progress)}% complete
                </p>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Scenes</span>
                  <span className="font-medium">{project.scenes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Scene Length</span>
                  <span className="font-medium">
                    {project.scenes.length > 0
                      ? Math.round(
                          project.wordCount / project.scenes.length
                        ).toLocaleString()
                      : 0}{" "}
                    words
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="secondary">
                    {project.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quality Metrics */}
          {project.averageQualityScore && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-1">
                      {project.averageQualityScore.toFixed(1)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Average UWQES Score
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/projects/${projectId}/editor`}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Detailed Metrics
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
