"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"
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
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UsageMeter } from "@/components/usage-meter"
import { LoadingPage } from "@/components/loading-spinner"
import { toast } from "sonner"
import { Loader2, CreditCard, User, Settings, Zap } from "lucide-react"
import { format } from "date-fns"

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface UserProfile {
  id: string
  name: string
  email: string
  image?: string
  createdAt: Date
}

interface Subscription {
  tier: "free" | "starter" | "pro" | "enterprise"
  status: "active" | "canceled" | "past_due"
  currentPeriodEnd?: Date
  cancelAtPeriodEnd?: boolean
}

interface Usage {
  tier: "free" | "starter" | "pro" | "enterprise"
  projects: { current: number; limit: number }
  scenes: { current: number; limit: number }
  analyses: { current: number; limit: number }
  apiCalls: { current: number; limit: number }
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = React.useState(false)

  // Redirect to sign in if not authenticated
  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await fetch("/api/user/profile")
      if (!response.ok) {
        throw new Error("Failed to fetch profile")
      }
      return response.json()
    },
    enabled: !!session,
  })

  // Fetch subscription
  const { data: subscription } = useQuery<Subscription>({
    queryKey: ["subscription"],
    queryFn: async () => {
      const response = await fetch("/api/user/subscription")
      if (!response.ok) {
        throw new Error("Failed to fetch subscription")
      }
      return response.json()
    },
    enabled: !!session,
  })

  // Fetch usage
  const { data: usage } = useQuery<Usage>({
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? {
          name: profile.name,
          email: profile.email,
        }
      : undefined,
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update profile")
      }

      return response.json()
    },
    onSuccess: async () => {
      toast.success("Profile updated successfully!")
      await update()
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      )
    },
  })

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data)
  }

  const handleManageSubscription = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/user/subscription/manage", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to create portal session")
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      toast.error("Failed to open billing portal")
      setIsUpdating(false)
    }
  }

  if (status === "loading" || profileLoading) {
    return <LoadingPage title="Loading profile..." />
  }

  if (!session || !profile) {
    return null
  }

  const tierColors = {
    free: "secondary",
    starter: "default",
    pro: "default",
    enterprise: "default",
  } as const

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and subscription
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="mr-2 h-4 w-4" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="usage">
            <Zap className="mr-2 h-4 w-4" />
            Usage
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile picture
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.image || ""} alt={profile.name} />
                  <AvatarFallback className="text-lg">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Profile Picture</p>
                  <p className="text-sm text-muted-foreground">
                    Managed through your OAuth provider
                  </p>
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    disabled={updateProfileMutation.isPending}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    disabled={updateProfileMutation.isPending}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  Member since{" "}
                  {format(new Date(profile.createdAt), "MMMM d, yyyy")}
                </div>

                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {subscription && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold capitalize">
                          {subscription.tier}
                        </h3>
                        <Badge variant={tierColors[subscription.tier]}>
                          {subscription.status}
                        </Badge>
                      </div>
                      {subscription.currentPeriodEnd && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {subscription.cancelAtPeriodEnd
                            ? "Cancels on"
                            : "Renews on"}{" "}
                          {format(
                            new Date(subscription.currentPeriodEnd),
                            "MMMM d, yyyy"
                          )}
                        </p>
                      )}
                    </div>
                    {subscription.tier !== "free" && (
                      <Button
                        onClick={handleManageSubscription}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Settings className="mr-2 h-4 w-4" />
                            Manage Billing
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {subscription.tier === "free" && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Upgrade to unlock more features and increase your limits
                        </p>
                        <Button asChild>
                          <Link href="/pricing">
                            <Zap className="mr-2 h-4 w-4" />
                            View Plans
                          </Link>
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          {usage && (
            <UsageMeter
              tier={usage.tier}
              usage={{
                projects: usage.projects,
                scenes: usage.scenes,
                analyses: usage.analyses,
                apiCalls: usage.apiCalls,
              }}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Upgrade Your Plan</CardTitle>
              <CardDescription>
                Need more capacity? Upgrade to a higher tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/pricing">
                  View All Plans
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
