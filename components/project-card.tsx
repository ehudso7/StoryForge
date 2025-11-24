"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { MoreVertical, FileText, Clock } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface ProjectCardProps {
  id: string
  title: string
  description?: string
  coverImage?: string
  sceneCount: number
  wordCount: number
  targetWordCount?: number
  lastModified: Date
  status: "draft" | "in_progress" | "completed"
  onDelete?: (id: string) => void
  onArchive?: (id: string) => void
}

const statusColors = {
  draft: "secondary",
  in_progress: "default",
  completed: "outline",
} as const

export function ProjectCard({
  id,
  title,
  description,
  coverImage,
  sceneCount,
  wordCount,
  targetWordCount = 80000,
  lastModified,
  status,
  onDelete,
  onArchive,
}: ProjectCardProps) {
  const progress = (wordCount / targetWordCount) * 100

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      {/* Cover Image */}
      <Link href={`/projects/${id}`}>
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
      </Link>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href={`/projects/${id}`}>
              <CardTitle className="line-clamp-1 hover:underline">
                {title}
              </CardTitle>
            </Link>
            {description && (
              <CardDescription className="mt-1.5 line-clamp-2">
                {description}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/projects/${id}`}>Open</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/projects/${id}/editor`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onArchive && (
                <DropdownMenuItem onClick={() => onArchive(id)}>
                  Archive
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(id)}
                  className="text-destructive focus:text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {wordCount.toLocaleString()} / {targetWordCount.toLocaleString()} words
            </span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2" />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{sceneCount} scenes</span>
          </div>
          <Badge variant={statusColors[status]}>
            {status.replace("_", " ")}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-3">
        <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Updated {formatDistanceToNow(lastModified, { addSuffix: true })}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
