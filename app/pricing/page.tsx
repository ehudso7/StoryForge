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
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Zap, HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out StoryForge",
    features: [
      { text: "1 project", tooltip: "Create and manage one writing project" },
      { text: "10 scenes per project", tooltip: "Up to 10 scenes in your project" },
      { text: "Basic quality metrics", tooltip: "Essential UWQES scores" },
      { text: "5 AI analyses per month", tooltip: "5 scene quality analyses monthly" },
      { text: "Export to TXT", tooltip: "Download your work as text files" },
    ],
    cta: "Start Free",
    href: "/auth/signin",
    popular: false,
    highlight: false,
  },
  {
    name: "Starter",
    price: "$9",
    period: "per month",
    description: "For serious writers",
    features: [
      { text: "5 projects", tooltip: "Create up to 5 writing projects" },
      { text: "Unlimited scenes", tooltip: "No limit on scenes per project" },
      { text: "Full quality metrics", tooltip: "Complete UWQES analysis" },
      { text: "50 AI analyses per month", tooltip: "50 scene quality analyses monthly" },
      { text: "Export to multiple formats", tooltip: "TXT, DOCX, PDF export" },
      { text: "Email support", tooltip: "Get help via email" },
      { text: "Version history (7 days)", tooltip: "7-day scene revision history" },
    ],
    cta: "Start Free Trial",
    href: "/auth/signin",
    popular: true,
    highlight: true,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "For professional authors",
    features: [
      { text: "Unlimited projects", tooltip: "Create as many projects as you need" },
      { text: "Unlimited scenes", tooltip: "No limit on scenes per project" },
      { text: "Advanced analytics", tooltip: "Deep insights and trends" },
      { text: "500 AI analyses per month", tooltip: "500 scene quality analyses monthly" },
      { text: "Priority AI processing", tooltip: "Faster analysis results" },
      { text: "All export formats", tooltip: "TXT, DOCX, PDF, EPUB, and more" },
      { text: "Priority email & chat support", tooltip: "Fastest response times" },
      { text: "Version history (30 days)", tooltip: "30-day scene revision history" },
      { text: "API access", tooltip: "Integrate with your tools" },
      { text: "Team collaboration (coming soon)", tooltip: "Share projects with others" },
    ],
    cta: "Start Free Trial",
    href: "/auth/signin",
    popular: false,
    highlight: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    description: "For teams and organizations",
    features: [
      { text: "Everything in Pro", tooltip: "All Pro features included" },
      { text: "Unlimited AI analyses", tooltip: "No monthly limits" },
      { text: "Custom integrations", tooltip: "Tailored to your workflow" },
      { text: "Dedicated account manager", tooltip: "Personal support contact" },
      { text: "Custom training & onboarding", tooltip: "Team training sessions" },
      { text: "SLA guarantee", tooltip: "Service level agreements" },
      { text: "Advanced security & compliance", tooltip: "SOC 2, HIPAA, etc." },
      { text: "Self-hosted option", tooltip: "Deploy on your infrastructure" },
    ],
    cta: "Contact Sales",
    href: "/contact",
    popular: false,
    highlight: false,
  },
]

const faqs = [
  {
    question: "What is the UWQES scoring system?",
    answer:
      "UWQES (Universal Writing Quality Evaluation System) is our proprietary AI-powered system that analyzes your writing across 9 key dimensions including wordiness, active voice, readability, and emotional impact to provide an objective quality score.",
  },
  {
    question: "Can I change plans at any time?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, and downgrades take effect at the end of your billing period.",
  },
  {
    question: "What happens if I exceed my AI analysis limit?",
    answer:
      "If you exceed your monthly AI analysis limit, you can either wait until the next billing cycle or upgrade to a higher tier to continue analyzing your scenes.",
  },
  {
    question: "Is my writing data secure?",
    answer:
      "Absolutely. We use enterprise-grade encryption and security measures to protect your work. Your stories are private and will never be shared or used for training AI models without your explicit consent.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We offer a 14-day free trial for all paid plans. If you're not satisfied within the first 14 days of a paid subscription, we'll provide a full refund.",
  },
  {
    question: "Can I export my projects?",
    answer:
      "Yes! All plans include export functionality. Free users can export to TXT, while paid plans support multiple formats including DOCX, PDF, and EPUB.",
  },
]

export default function PricingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-muted-foreground">
              Choose the plan that fits your writing goals. All paid plans include
              a 14-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-4">
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                className={
                  tier.highlight
                    ? "relative border-primary shadow-lg lg:scale-105"
                    : "border-2"
                }
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">
                      <Zap className="mr-1 h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    {tier.period !== "forever" && (
                      <span className="text-muted-foreground">
                        {" "}
                        / {tier.period}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Button
                    asChild
                    variant={tier.highlight ? "default" : "outline"}
                    className="w-full"
                    size="lg"
                  >
                    <Link href={tier.href}>{tier.cta}</Link>
                  </Button>

                  <Separator />

                  <TooltipProvider>
                    <ul className="space-y-3">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-sm">{feature.text}</span>
                            {feature.tooltip && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs text-sm">
                                    {feature.tooltip}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </TooltipProvider>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              All plans include core features: UWQES quality scoring, scene
              editor, word count tracking, and more.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Still have questions?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Our team is here to help. Contact us for more information about our
              plans and features.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/test-excellence">Try Excellence Engine</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
