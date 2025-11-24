"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LoadingPage } from "@/components/loading-spinner"
import { toast } from "sonner"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

const projectSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  genre: z.string().optional(),
  targetWordCount: z
    .number()
    .min(1000, "Target word count must be at least 1,000")
    .max(1000000, "Target word count must be less than 1,000,000")
    .default(80000),
  status: z.enum(["draft", "in_progress", "completed"]).default("draft"),
})

type ProjectFormData = z.infer<typeof projectSchema>

const genres = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Thriller",
  "Romance",
  "Horror",
  "Literary Fiction",
  "Historical Fiction",
  "Contemporary",
  "Young Adult",
  "Other",
]

export default function NewProjectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Redirect to sign in if not authenticated
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      targetWordCount: 80000,
      status: "draft",
    },
  })

  const selectedGenre = watch("genre")
  const selectedStatus = watch("status")

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create project")
      }

      const project = await response.json()
      toast.success("Project created successfully!")
      router.push(`/projects/${project.id}`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create project"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "loading") {
    return <LoadingPage title="Loading..." />
  }

  if (!session) {
    return null
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-muted-foreground">
          Start a new writing project and begin crafting your story
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Provide basic information about your writing project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Project Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="My Awesome Novel"
                {...register("title")}
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="A brief description of your project..."
                {...register("description")}
                rows={4}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Genre */}
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select
                value={selectedGenre}
                onValueChange={(value) => setValue("genre", value)}
              >
                <SelectTrigger id="genre">
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Word Count */}
            <div className="space-y-2">
              <Label htmlFor="targetWordCount">Target Word Count</Label>
              <Input
                id="targetWordCount"
                type="number"
                {...register("targetWordCount", {
                  valueAsNumber: true,
                })}
                aria-invalid={!!errors.targetWordCount}
              />
              {errors.targetWordCount && (
                <p className="text-sm text-destructive">
                  {errors.targetWordCount.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Set your word count goal for this project
              </p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setValue("status", value as "draft" | "in_progress" | "completed")
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
