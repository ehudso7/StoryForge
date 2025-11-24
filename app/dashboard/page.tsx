"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Plus, TrendingUp, FileText, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProjectCard } from "@/components/project-card"
import { UsageMeter } from "@/components/usage-meter"
import { LoadingPage } from "@/components/loading-spinner"
import { toast } from "sonner"

interface Project {
  id: string
  title: string
  description?: string
  coverImage?: string
  sceneCount: number
  wordCount: number
  targetWordCount: number
  lastModified: Date
  status: "draft" | "in_progress" | "completed"
}

interface DashboardStats {
  totalProjects: number
  totalWords: number
  totalScenes: number
  averageQualityScore: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect to sign in if not authenticated
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Fetch projects
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects")
      if (!response.ok) {
        throw new Error("Failed to fetch projects")
      }
      return response.json()
    },
    enabled: !!session,
  })

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats")
      if (!response.ok) {
        throw new Error("Failed to fetch stats")
      }
      return response.json()
    },
    enabled: !!session,
  })

  // Fetch usage data
  const { data: usage } = useQuery({
    queryKey: ["usage"],
    queryFn: async () => {
      const response = await fetch("/api/usage")
      if (!response.ok) {
        throw new Error("Failed to fetch usage")
      }
      return response.json()
    },
    enabled: !!session,
  })

  const handleDeleteProject = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Failed to delete project")
      }
      toast.success("Project deleted successfully")
      // Refetch projects
    } catch (error) {
      toast.error("Failed to delete project")
    }
  }

  const handleArchiveProject = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}/archive`, {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error("Failed to archive project")
      }
      toast.success("Project archived successfully")
      // Refetch projects
    } catch (error) {
      toast.error("Failed to archive project")
    }
  }

  if (status === "loading" || projectsLoading) {
    return <LoadingPage title="Loading dashboard..." />
  }

  if (!session) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user?.name || "Writer"}!
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalProjects || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active writing projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Words</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.totalWords || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Words written across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scenes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalScenes || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Scenes created and edited
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Quality</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageQualityScore?.toFixed(1) || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Average UWQES score
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Projects Grid */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Your Projects</h2>
          </div>

          {projects && projects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  {...project}
                  onDelete={handleDeleteProject}
                  onArchive={handleArchiveProject}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardHeader className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <CardTitle className="mt-4">No projects yet</CardTitle>
                <CardDescription>
                  Create your first project to start writing
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button asChild>
                  <Link href="/projects/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Usage Meter */}
          {usage && (
            <UsageMeter
              tier={usage.tier || "free"}
              usage={{
                projects: {
                  current: usage.projects?.current || 0,
                  limit: usage.projects?.limit || 1,
                },
                scenes: {
                  current: usage.scenes?.current || 0,
                  limit: usage.scenes?.limit || 10,
                },
                analyses: {
                  current: usage.analyses?.current || 0,
                  limit: usage.analyses?.limit || 5,
                },
                apiCalls: {
                  current: usage.apiCalls?.current || 0,
                  limit: usage.apiCalls?.limit || 100,
                },
              }}
            />
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <Link href="/projects/new">Create New Project</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/test-excellence">Test Excellence Engine</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/profile">Manage Subscription</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
