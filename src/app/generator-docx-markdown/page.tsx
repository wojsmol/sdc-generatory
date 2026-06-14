"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { AppLayout } from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { generateId } from "@/lib/fileUtils"

const schema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany."),
  description: z.string().min(1, "Opis jest wymagany."),
  sidebar_label: z.string().min(1, "Etykieta w menu jest wymagana."),
  sidebar_position: z.string(),
  keywords: z.string(),
  opracowanie: z.string(),
})

type MetaValues = z.infer<typeof schema>

const defaultMeta: MetaValues = {
  title: "", description: "", sidebar_label: "", sidebar_position: "999", keywords: "", opracowanie: "",
}

function splitKeywords(text: string) {
  return text.split(/\r?\n/).map(k => k.trim()).filter(Boolean)
}

function unescapeMarkdown(input: string): string {
  return input
    // Usuń zbędne backslashe przed znakami które mammoth escapuje niepotrzebnie
    .replace(/\\([!"#$%&'()+,\-./:;<=>?@[\\\]^{|}~])/g, '$1')
    // Napraw \_ wokół tekstu → _tekst_
    .replace(/\\_([^_]+)\\_/g, '_$1_')
    // Napraw \* poza początkiem linii (listy)
    .replace(/(?<!^[ \t]*)\\\*/gm, '*')
}

function applyCleanup(input: string, cleanupEmpty: boolean, normalizeHeadings: boolean) {
  let md = unescapeMarkdown(input)
  if (cleanupEmpty) md = md.replace(/\n{3,}/g, "\n\n")
  if (normalizeHeadings) {
    md = md.replace(/^###\s+/gm, "## ")
    md = md.replace(/^##\s+/gm, "# ")
  }
  return md
}

function buildFrontmatter(meta: MetaValues, filenameBase: string) {
  const id = generateId(meta.title || filenameBase)
  const kw = splitKeywords(meta.keywords)
  return [
    "---",
    `id: ${id}`,
    `title: ${meta.title}`,
    `description: ${meta.description}`,
    `sidebar_label: ${meta.sidebar_label}`,
    `sidebar_position: ${meta.sidebar_position || "999"}`,
    "keywords:",
    ...(kw.length ? kw.map(k => `  - ${k}`) : ["  - dostępność cyfrowa"]),
    `opracowanie: ${meta.opracowanie || ""}`,
    "---",
    "",
  ].join("\n")
}

export default function GeneratorDocxMarkdown() {
  const [markdown, setMarkdown] = useState("")
  const [originalMarkdown, setOriginalMarkdown] = useState("")
  const [filenameBase, setFilenameBase] = useState("converted")
  const [loading, setLoading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [cleanupEmpty, setCleanupEmpty] = useState(true)
  const [normalizeHeadings, setNormalizeHeadings] = useState(true)

  const form = useForm<MetaValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultMeta,
  })

  const meta = form.watch()
  const previewContent = buildFrontmatter(meta, filenameBase) + markdown

  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const base = file.name.replace(/\.docx$/i, "") || "converted"
    setFilenameBase(base)
    setLoading(true)
    setUploadError("")
    setUploadSuccess(false)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mammoth = (await import("mammoth")) as any
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToMarkdown({ arrayBuffer })
      const raw = result.value || ""
      setOriginalMarkdown(raw)
      setMarkdown(applyCleanup(raw, cleanupEmpty, normalizeHeadings))
      setUploadSuccess(true)
      if (!meta.title) {
        form.setValue("title", base)
        form.setValue("sidebar_label", base)
      }
    } catch {
      setUploadError("Nie udało się przetworzyć pliku DOCX.")
    } finally {
      setLoading(false)
    }
  }

  const handleApplyOptions = () => {
    setMarkdown(applyCleanup(markdown || originalMarkdown, cleanupEmpty, normalizeHeadings))
  }

  const handleDownload = form.handleSubmit((data) => {
    if (!markdown.trim()) { alert("Brak treści Markdown. Prześlij plik DOCX lub wpisz treść."); return }
    const id = generateId(data.title)
    const full = buildFrontmatter(data, filenameBase) + markdown
    const blob = new Blob([full], { type: "text/markdown;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${id || filenameBase}.md`
    a.click()
  })

  const handleDownloadZip = form.handleSubmit(async (data) => {
    if (!markdown.trim()) { alert("Brak treści Markdown. Prześlij plik DOCX lub wpisz treść."); return }
    const JSZip = (await import("jszip")).default
    const id = generateId(data.title)
    const full = buildFrontmatter(data, filenameBase) + markdown
    const zip = new JSZip()
    zip.file(`${id || filenameBase}.md`, full)
    const blob = await zip.generateAsync({ type: "blob" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${id || filenameBase}.zip`
    a.click()
  })

  return (
    <AppLayout
      title="Generator Markdown z pliku DOCX"
      description="Prześlij plik DOCX, uzupełnij metadane, a następnie pobierz gotowy plik Markdown lub archiwum ZIP."
    >
      <Form {...form}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEWA KOLUMNA */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>1. Prześlij plik DOCX</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label htmlFor="docx-upload" className="text-sm font-medium text-gray-700 mb-1 block">
                    Plik Word (.docx)
                  </label>
                  <Input
                    id="docx-upload"
                    type="file"
                    accept=".docx"
                    onChange={handleDocxUpload}
                    disabled={loading}
                    aria-describedby="docx-status"
                  />
                </div>
                <div id="docx-status" aria-live="polite" aria-atomic="true">
                  {loading && <p className="text-sm text-gray-500">Konwertuję plik…</p>}
                  {uploadError && <Alert variant="destructive"><AlertDescription>{uploadError}</AlertDescription></Alert>}
                  {uploadSuccess && !loading && <Alert variant="success"><AlertDescription>✓ Plik przekonwertowany pomyślnie.</AlertDescription></Alert>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>2. Metadane frontmatter</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tytuł (title) <span aria-hidden="true">*</span><span className="sr-only">(wymagane)</span></FormLabel>
                    <FormControl><Input placeholder="Tytuł dokumentu" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opis (description) <span aria-hidden="true">*</span><span className="sr-only">(wymagane)</span></FormLabel>
                    <FormControl><Textarea rows={3} placeholder="Krótki opis zawartości dokumentu (150–200 znaków)" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="sidebar_label" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etykieta w menu (sidebar_label) <span aria-hidden="true">*</span><span className="sr-only">(wymagane)</span></FormLabel>
                    <FormControl><Input placeholder="Tekst wyświetlany w menu bocznym" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="sidebar_position" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pozycja w menu (sidebar_position)</FormLabel>
                    <FormControl><Input type="number" min="1" {...field} /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="keywords" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Słowa kluczowe (keywords)</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder={"Wpisz po jednym słowie / frazie w każdej linii.\nNp:\nWCAG\ndostępność cyfrowa"} {...field} />
                    </FormControl>
                    <FormDescription>Zostaną zapisane jako tablica YAML.</FormDescription>
                  </FormItem>
                )} />

                <FormField control={form.control} name="opracowanie" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opracowanie</FormLabel>
                    <FormControl><Input placeholder="Autor/ka, zespół, instytucja" {...field} /></FormControl>
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>3. Opcje przetwarzania</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="cleanupEmpty"
                    checked={cleanupEmpty}
                    onCheckedChange={v => setCleanupEmpty(!!v)}
                    aria-describedby="cleanupEmpty-desc"
                  />
                  <div>
                    <label htmlFor="cleanupEmpty" className="text-sm font-medium cursor-pointer">
                      Usuń nadmiarowe puste linie
                    </label>
                    <p id="cleanupEmpty-desc" className="text-xs text-gray-500">Redukuje potrójne i większe odstępy do podwójnych</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="normalizeHeadings"
                    checked={normalizeHeadings}
                    onCheckedChange={v => setNormalizeHeadings(!!v)}
                    aria-describedby="normalizeHeadings-desc"
                  />
                  <div>
                    <label htmlFor="normalizeHeadings" className="text-sm font-medium cursor-pointer">
                      Ujednolić poziomy nagłówków
                    </label>
                    <p id="normalizeHeadings-desc" className="text-xs text-gray-500">Przesuwa H3→H2, H2→H1</p>
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleApplyOptions}>
                  Zastosuj opcje do edytora
                </Button>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button type="button" onClick={handleDownload}>↓ Pobierz Markdown (.md)</Button>
              <Button type="button" variant="outline" onClick={handleDownloadZip}>↓ Pobierz ZIP</Button>
            </div>
          </div>

          {/* PRAWA KOLUMNA */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Edytor i podgląd</CardTitle></CardHeader>
              <CardContent>
                <Tabs defaultValue="editor">
                  <TabsList aria-label="Widok edytora">
                    <TabsTrigger value="editor">Edytor Markdown</TabsTrigger>
                    <TabsTrigger value="preview">Podgląd pliku</TabsTrigger>
                  </TabsList>

                  <TabsContent value="editor">
                    <label htmlFor="markdown-editor" className="sr-only">Edytor Markdown</label>
                    <Textarea
                      id="markdown-editor"
                      value={markdown}
                      onChange={e => setMarkdown(e.target.value)}
                      className="font-mono text-xs mt-3"
                      style={{ minHeight: "300px" }}
                      placeholder="Treść pojawi się po wgraniu pliku DOCX…"
                      spellCheck={false}
                    />
                  </TabsContent>

                  <TabsContent value="preview">
                    <p className="text-xs text-gray-500 mt-3 mb-2" id="preview-desc">
                      Tak będzie wyglądała zawartość pliku (frontmatter + Markdown).
                    </p>
                    <pre
                      tabIndex={0}
                      aria-label="Podgląd wynikowego pliku Markdown z frontmatterem"
                      aria-describedby="preview-desc"
                      className="bg-gray-900 text-green-300 p-4 rounded-lg text-xs whitespace-pre-wrap overflow-x-auto font-mono leading-relaxed max-h-[500px] overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {previewContent || "— brak zawartości —"}
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </Form>
    </AppLayout>
  )
}
