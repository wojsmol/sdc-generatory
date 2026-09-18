"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AlertTriangle, X } from "lucide-react"

import { AppLayout, MdxPreview } from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateId, linesToList, analyzeNeutralLanguage, validateFiles } from "@/lib/fileUtils"

const STORAGE_KEY = "zalecenieForm"

function formatDate(date: Date): string {
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }) + " r."
}

function keywordsToArray(text: string): string[] {
  return text.split(/[\n,]+/).map(k => k.trim()).filter(Boolean)
}

const schema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany."),
  sidebar_label: z.string(),
  description: z.string(),
  keywords: z.string(),
  cel: z.string().min(1, "Cel zalecenia jest wymagany."),
  zalecenie: z.string().min(1, "Treść zalecenia jest wymagana."),
  rekomendacje: z.string(),
  uzasadnienie: z.string(),
  podstawyPrawne: z.string(),
  zrodla: z.string(),
  powiazania: z.string(),
  autor: z.string().min(1, "Autor/ka opracowania jest wymagana."),
  wspolpraca: z.string(),
  data_zgloszenia: z.string().min(1, "Data zgłoszenia jest wymagana."),
})

type FormValues = z.infer<typeof schema>

const today = formatDate(new Date())

const defaultValues: FormValues = {
  title: "", sidebar_label: "", description: "", keywords: "", cel: "", zalecenie: "",
  rekomendacje: "", uzasadnienie: "", podstawyPrawne: "",
  zrodla: "", powiazania: "", autor: "",
  wspolpraca: "", data_zgloszenia: today,
}

function generateMdx(form: FormValues, files: File[]) {
  const id = generateId(form.title || "zalecenie")
  const heading = "Zalecenie"
  const kw = keywordsToArray(form.keywords)
  const kwInline = kw.length ? `[${kw.join(",")}]` : "[dostępność cyfrowa]"

  return `---
id: ${id}
title: ${form.title}
description: ${form.description}
sidebar_label: ${form.sidebar_label || form.title}
sidebar_position: 0
keywords: ${kwInline}
tags: ${kwInline}
opracowanie: ${form.autor}
wspolpraca: ${form.wspolpraca}
data_zgloszenia: ${form.data_zgloszenia}
ostatnia_aktualizacja: ${form.data_zgloszenia}
wersja_robocza: true
---

# ${heading}: ${form.title}

## 1. Cel zalecenia
${form.cel || "_Brak opisu celu._"}

## 2. Zalecenie
${form.zalecenie}

## 3. Rekomendacje
${linesToList(form.rekomendacje, "_Brak rekomendacji._")}

## 4. Uzasadnienie
${form.uzasadnienie || "_Brak uzasadnienia._"}

## 5. Podstawy prawne
${linesToList(form.podstawyPrawne, "_Brak podstaw prawnych._")}

## 6. Źródła i opracowania
${linesToList(form.zrodla, "_Brak źródeł._")}

## 7. Powiązania z innymi dokumentami Sieci
${linesToList(form.powiazania, "_Brak powiązań._")}

## 8. Załączniki
${files.length ? files.map(f => "- " + f.name).join("\n") : "_Brak załączników._"}
`
}

function LanguageWarnings({ warnings }: { warnings: string[] }) {
  return (
    <div aria-live="polite" aria-atomic="true">
      {warnings.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            <ul className="space-y-1 list-none p-0">
              {warnings.map((w, i) => <li key={i}>• {w}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default function GeneratorZalecen() {
  const [files, setFiles] = useState<File[]>([])
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const values = form.watch()
  const mdx = generateMdx(values, files)
  const zalecenieWarnings = analyzeNeutralLanguage(values.zalecenie)
  const rekomendacjeWarnings = analyzeNeutralLanguage(values.rekomendacje)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { form.reset({ ...defaultValues, ...JSON.parse(saved) }) } catch { }
    }
  }, [])

  useEffect(() => {
    const sub = form.watch(v => localStorage.setItem(STORAGE_KEY, JSON.stringify(v)))
    return () => sub.unsubscribe()
  }, [form])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { validFiles, errors } = validateFiles(Array.from(e.target.files || []))
    setFileErrors(prev => ({ ...prev, ...errors }))
    setFiles(prev => [...prev, ...validFiles])
    e.target.value = ""
  }

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name))
    setFileErrors(prev => { const c = { ...prev }; delete c[`file:${name}`]; return c })
  }

  const onSubmit = async (data: FormValues) => {
    const JSZip = (await import("jszip")).default
    const id = generateId(data.title)
    const zip = new JSZip()
    zip.file(`${id}.mdx`, mdx)
    files.forEach(f => zip.file(f.name, f))
    const blob = await zip.generateAsync({ type: "blob" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${id}.zip`
    a.click()
  }

  return (
    <AppLayout
      title="Generator zaleceń"
      description="Formularz generuje plik .mdx zgodny z Księgą Zaleceń Sieci Dostępności Cyfrowej."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">

          {/* DANE DOKUMENTU */}
          <Card>
            <CardHeader>
              <CardTitle>Dane dokumentu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tytuł <span aria-hidden="true">*</span><span className="sr-only">(wymagane)</span></FormLabel>
                      <FormControl><Input autoComplete="off" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="sidebar_label" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Krótki tytuł</FormLabel>
                      <FormDescription>Etykieta w menu bocznym (sidebar_label). Jeśli puste, użyty zostanie tytuł.</FormDescription>
                      <FormControl><Input autoComplete="off" {...field} /></FormControl>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opis</FormLabel>
                      <FormDescription>Krótki opis zalecenia (description). Widoczny w wynikach wyszukiwania i podglądach.</FormDescription>
                      <FormControl><Textarea rows={2} {...field} /></FormControl>
                    </FormItem>
                  )} />



                  <FormField control={form.control} name="keywords" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Słowa kluczowe</FormLabel>
                      <FormDescription>Wpisz słowa oddzielone przecinkami lub każde w nowej linii. Zostaną użyte jako keywords i tags.</FormDescription>
                      <FormControl>
                        <Textarea rows={3} placeholder={"dostępność cyfrowa\nzarządzanie\nWCAG"} {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>

                <div className="space-y-4">
                  <FormField control={form.control} name="autor" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Autor/ka opracowania <span aria-hidden="true">*</span><span className="sr-only">(wymagane)</span></FormLabel>
                      <FormControl><Input autoComplete="name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="wspolpraca" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Współpraca</FormLabel>
                      <FormDescription>Imiona i nazwiska współautorów oddzielone przecinkami</FormDescription>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="data_zgloszenia" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data zgłoszenia <span aria-hidden="true">*</span><span className="sr-only">(wymagane)</span></FormLabel>
                      <FormDescription>Format: 6 września 2026 r.</FormDescription>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                </div>
              </div>
            </CardContent>
          </Card>

          {/* TREŚĆ ZALECENIA */}
          <Card>
            <CardHeader>
              <CardTitle>Treść zalecenia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              <FormField control={form.control} name="cel" render={({ field }) => (
                <FormItem>
                  <FormLabel>1. Cel zalecenia <span aria-hidden="true">*</span><span className="sr-only">(wymagane)</span></FormLabel>
                  <FormDescription>
                    Wskaż problem organizacyjny związany z zarządzaniem zapewnianiem dostępności cyfrowej, który ma rozwiązać zalecenie. Skup się na istniejącej luce lub nieskuteczności – bez opisywania sposobu rozwiązania.
                  </FormDescription>
                  <FormControl><Textarea rows={4} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Separator />

              <FormField control={form.control} name="zalecenie" render={({ field }) => (
                <FormItem>
                  <FormLabel>2. Zalecenie <span aria-hidden="true">*</span><span className="sr-only">(wymagane)</span></FormLabel>
                  <FormDescription>
                    Zwięźle określ zalecany stan, sposób działania lub rozwiązanie. Używaj sformułowań neutralnych, np. „Organizacja zapewnia…", „Kierownictwo ustala…". Unikaj form nakazowych („należy", „powinno się").
                  </FormDescription>
                  <FormControl><Textarea rows={4} {...field} /></FormControl>
                  <FormMessage />
                  <LanguageWarnings warnings={zalecenieWarnings} />
                </FormItem>
              )} />

              <Separator />

              <FormField control={form.control} name="rekomendacje" render={({ field }) => (
                <FormItem>
                  <FormLabel>3. Rekomendacje</FormLabel>
                  <FormDescription>
                    Wskaż sposoby realizacji zalecenia: działania, role, warianty, dobre praktyki. Wpisz każdą rekomendację w osobnym wierszu.
                  </FormDescription>
                  <FormControl>
                    <Textarea rows={6} placeholder={"Np.\nOrganizacja ustanawia rolę koordynatora dostępności...\nKierownictwo zatwierdza politykę dostępności..."} {...field} />
                  </FormControl>
                  <LanguageWarnings warnings={rekomendacjeWarnings} />
                </FormItem>
              )} />

              <Separator />

              <FormField control={form.control} name="uzasadnienie" render={({ field }) => (
                <FormItem>
                  <FormLabel>4. Uzasadnienie</FormLabel>
                  <FormDescription>Wyjaśnij, dlaczego rozwiązanie problemu jest potrzebne i dlaczego proponowany sposób działania jest zasadny.</FormDescription>
                  <FormControl><Textarea rows={8} {...field} /></FormControl>
                </FormItem>
              )} />

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="podstawyPrawne" render={({ field }) => (
                  <FormItem>
                    <FormLabel>5. Podstawy prawne</FormLabel>
                    <FormDescription>Wymień przepisy i akty prawne. Wpisz każdą pozycję w osobnym wierszu.</FormDescription>
                    <FormControl><Textarea rows={6} {...field} /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="zrodla" render={({ field }) => (
                  <FormItem>
                    <FormLabel>6. Źródła i opracowania</FormLabel>
                    <FormDescription>Wymień publikacje i materiały. Wpisz każdą pozycję w osobnym wierszu.</FormDescription>
                    <FormControl><Textarea rows={6} {...field} /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="powiazania" render={({ field }) => (
                  <FormItem>
                    <FormLabel>7. Powiązania z innymi dokumentami Sieci</FormLabel>
                    <FormDescription>Wskaż inne dokumenty Sieci ściśle związane z przedmiotem zalecenia. Wpisz każde powiązanie w osobnym wierszu.</FormDescription>
                    <FormControl><Textarea rows={6} {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          {/* ZAŁĄCZNIKI */}
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="file-upload">8. Załączniki (PDF, DOCX, ZIP)</Label>
                <p id="file-hint" className="text-xs text-muted-foreground">Dozwolone formaty: PDF, DOCX, ZIP. Maks. 5 MB na plik.</p>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  aria-describedby="file-hint"
                />
              </div>

              {Object.entries(fileErrors).length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <ul className="list-none space-y-1">
                      {Object.entries(fileErrors).map(([k, m]) => (
                        <li key={k}>{m}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {files.length > 0 && (
                <ul className="space-y-1" aria-label="Dodane załączniki">
                  {files.map(f => (
                    <li key={f.name} className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary" aria-hidden="true">{f.name.split(".").pop()?.toUpperCase()}</Badge>
                        {f.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(f.name)}
                        aria-label={`Usuń załącznik: ${f.name}`}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <Separator />

              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(p => !p)}
                  aria-expanded={showPreview}
                  aria-controls="mdx-preview"
                >
                  {showPreview ? "Ukryj podgląd" : "Pokaż podgląd MDX"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className=""
                  onClick={() => {
                    if (confirm("Czy na pewno chcesz wyczyścić formularz?")) {
                      form.reset(defaultValues)
                      setFiles([])
                      localStorage.removeItem(STORAGE_KEY)
                    }
                  }}
                >
                  Wyczyść formularz
                </Button>
                <Button type="submit">↓ Pobierz ZIP (MDX + załączniki)</Button>
              </div>
            </CardContent>
          </Card>

          {showPreview && (
            <section id="mdx-preview" aria-label="Podgląd MDX">
              <Card>
                <CardHeader><CardTitle>Podgląd MDX</CardTitle></CardHeader>
                <CardContent><MdxPreview content={mdx} /></CardContent>
              </Card>
            </section>
          )}
        </form>
      </Form>
    </AppLayout>
  )
}
