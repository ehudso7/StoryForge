import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Zap,
  LineChart,
  Shield,
  Star,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from "lucide-react"

const features = [
  {
    icon: BookOpen,
    title: "Intelligent Scene Editor",
    description:
      "Write with a powerful editor that provides real-time feedback and suggestions to improve your storytelling.",
  },
  {
    icon: LineChart,
    title: "UWQES Quality Scoring",
    description:
      "Get instant quality metrics with our Universal Writing Quality Evaluation System, analyzing 9 key dimensions of excellence.",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Analytics",
    description:
      "Track word count, pacing, dialogue balance, and more with comprehensive writing analytics.",
  },
  {
    icon: Zap,
    title: "AI-Powered Insights",
    description:
      "Leverage advanced AI to identify areas for improvement and elevate your prose to professional standards.",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    description:
      "Your stories are yours alone. We employ enterprise-grade security to protect your creative work.",
  },
  {
    icon: Star,
    title: "Export & Publish",
    description:
      "Export your finished work in multiple formats, ready for publishing or submission.",
  },
]

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Published Author",
    content:
      "StoryForge's quality metrics transformed my writing. The UWQES system helped me identify weak points I never noticed before.",
    rating: 5,
  },
  {
    name: "James Rodriguez",
    role: "Creative Writing Professor",
    content:
      "I recommend StoryForge to all my students. The real-time feedback is invaluable for developing strong writing fundamentals.",
    rating: 5,
  },
  {
    name: "Emily Chen",
    role: "Aspiring Novelist",
    content:
      "The scene editor and analytics have made my writing process so much more efficient. I've completed my first draft in record time!",
    rating: 5,
  },
]

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for trying out StoryForge",
    features: [
      "1 project",
      "10 scenes per project",
      "Basic quality metrics",
      "5 AI analyses per month",
    ],
    cta: "Start Free",
    href: "/auth/signin",
    popular: false,
  },
  {
    name: "Starter",
    price: "$9",
    description: "For serious writers",
    features: [
      "5 projects",
      "Unlimited scenes",
      "Full quality metrics",
      "50 AI analyses per month",
      "Export to multiple formats",
    ],
    cta: "Start Free Trial",
    href: "/auth/signin",
    popular: true,
  },
  {
    name: "Pro",
    price: "$29",
    description: "For professional authors",
    features: [
      "Unlimited projects",
      "Unlimited scenes",
      "Advanced analytics",
      "500 AI analyses per month",
      "Priority support",
      "API access",
    ],
    cta: "Start Free Trial",
    href: "/auth/signin",
    popular: false,
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4" variant="secondary">
              <Zap className="mr-1 h-3 w-3" />
              Powered by UWQES v1.0
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Elevate Your Storytelling with{" "}
              <span className="text-primary">AI-Powered Quality Metrics</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Write better stories with real-time quality analysis, intelligent
              feedback, and the revolutionary Universal Writing Quality Evaluation
              System.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/signin">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/test-excellence">Try Excellence Engine</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Write Excellence
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features designed to help writers of all levels craft
              compelling, high-quality stories.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-2">
                <CardHeader>
                  <feature.icon className="mb-2 h-10 w-10 text-primary" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="border-y bg-muted/50 py-20 md:py-32">
        <div className="container">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Trusted by Writers Worldwide
            </h2>
            <p className="text-lg text-muted-foreground">
              See what authors are saying about StoryForge
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name}>
                <CardHeader>
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <CardDescription className="text-base">
                    {testimonial.content}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32">
        <div className="container">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose the plan that fits your writing goals. All plans include a
              14-day free trial.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={
                  tier.popular
                    ? "relative border-primary shadow-lg"
                    : "border-2"
                }
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    {tier.price !== "$0" && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant={tier.popular ? "default" : "outline"}
                    className="w-full"
                  >
                    <Link href={tier.href}>{tier.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-gradient-to-b from-background to-primary/5 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Transform Your Writing?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of writers using StoryForge to craft better stories.
              Start your free trial today.
            </p>
            <Button size="lg" asChild>
              <Link href="/auth/signin">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
