import { AppLayout } from "@/components/AppLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const tools = [
  {
    href: "/generator-zalecen",
    title: "Generator zaleceń",
    description: "Utwórz plik .mdx z zaleceniem lub dezyderatem dla Księgi Zaleceń SDC. Zawiera walidację języka neutralnego i eksport ZIP.",
    badge: "MDX",
    badgeVariant: "default" as const,
    emoji: "📋",
  },
  {
    href: "/generator-dobrej-praktyki",
    title: "Generator dobrej praktyki",
    description: "Opisz dobrą praktykę organizacji w ustrukturyzowanym pliku MDX. Walidacja długości opisu (500–1500 znaków).",
    badge: "MDX",
    badgeVariant: "secondary" as const,
    emoji: "✅",
  },
  {
    href: "/generator-docx-markdown",
    title: "Generator Markdown z DOCX",
    description: "Przekonwertuj plik Word (.docx) do Markdown i dodaj frontmatter Docusaurus. Pobierz .md lub .zip.",
    badge: "DOCX → MD",
    badgeVariant: "outline" as const,
    emoji: "📄",
  },
]

export default function Home() {
  return (
    <AppLayout
      title="Generatory dokumentów"
      description="Wybierz narzędzie, aby wygenerować dokument zgodny ze standardami SDC."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="group">
            <Card className="h-full transition-shadow hover:shadow-md hover:border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-3xl">{tool.emoji}</span>
                  <Badge variant={tool.badgeVariant}>{tool.badge}</Badge>
                </div>
                <CardTitle className="text-base mt-2">{tool.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppLayout>
  )
}
