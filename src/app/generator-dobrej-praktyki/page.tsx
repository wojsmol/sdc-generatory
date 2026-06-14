"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { AppLayout, MdxPreview } from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateId, validateFiles } from "@/lib/fileUtils"
import { WYMIARY } from "@/lib/constants"

const STORAGE_KEY = "dobraPraktykaForm"

const schema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany."),
  podmiot: z.string().min(1, "Podmiot jest wymagany."),
  zglaszajacy: z.string().min(1, "Zgłaszający jest wymagany."),
  wymiar: z.string().min(1, "Wymiar dostępności jest wymagany."),
  kontakt: z.string(),
  opis: z.string()
    .min(500, "Opis musi mieć co najmniej 500 znaków.")
    .max(1500, "Opis nie może przekroczyć 1500 znaków."),
  problem: z.string(),
  cele: z.string(),
  dzialania: z.string(),
  rezultaty: z.string(),
})

type FormValues = z.infer<typeof schema>

const defaultValues: FormValues = {
  title: "", podmiot: "", zglaszajacy: "", wymiar: "",
  kontakt: "", opis: "", problem: "", cele: "", dzialania: "", rezultaty: "",
}

function generateMdx(form: FormValues, files: File[]) {
  const id = generateId(form.title || "dobra-praktyka")
  return `---
id: ${id}
title: ${form.title}
description: Krótki opis dobrej praktyki
sidebar_label: ${form.title}
sidebar_position: 999
opracowanie: ${form.zglaszajacy}
---

# Dobra praktyka: ${form.title}

## Metryczka
- **Podmiot realizujący:** ${form.podmiot}
- **Zgłaszający:** ${form.zglaszajacy}
- **Wymiar:** ${form.wymiar}
- **Kontakt:** ${form.kontakt}

## Krótki opis
${form.opis}

## Problem
${form.problem}

## Cele
${form.cele}

## Jak wdrożono praktykę
${form.dzialania}

## Rezultaty
${form.rezultaty}

## Załączniki
${files.length ? files.map(f => "- " + f.name).join("\n") : "_Brak załączników._"}
`
}

export default function GeneratorDobrejPraktyki() {
  const [files, setFiles] = useState<File[]>([])
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
  })

  const values = form.watch()
  const mdx = generateMdx(values, files)
  const opisLength = (values.opis || "").trim().length
  const opisProgress = Math.min(100, Math.round((opisLength / 1500) * 100))
  const opisOk = opisLength >= 500 && opisLength <= 1500

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
      title="Generator opisu dobrej praktyki"
      description="Uzupełnij formularz. Na końcu pobierzesz ZIP z plikiem MDX i załącznikami."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Dane praktyki</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tytuł <span aria-hidden="true">*</span><span className="sr-only">(wymagane)</span></FormLabel>
                      <FormControl><Input placeholder="Krótka nazwa dobrej praktyki" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="podmiot" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Podmiot realizujący <span aria-hidden="true">*</span><span className="sr-only">(wymagane)</span></FormLabel>
                      <FormControl><Input placeholder="Nazwa instytucji" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="zglaszajacy" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zgłaszający <span aria-hidden="true">*</span><span className="sr-only">(wymagane)</span></FormLabel>
                      <FormControl><Input placeholder="Imię i nazwisko" autoComplete="name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="wymiar" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wymiar dostępności cyfrowej <span aria-hidden="true">*</span><span className="sr-only">(wymagane)</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger aria-label="Wybierz wymiar dostępności"><SelectValue placeholder="-- wybierz wymiar --" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {WYMIARY.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="kontakt" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dane kontaktowe</FormLabel>
                      <FormControl><Input placeholder="E-mail lub numer telefonu" autoComplete="email" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>

                <div className="space-y-4">
                  <FormField control={form.control} name="opis" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Krótki opis (500–1500 znaków) <span aria-hidden="true">*</span><span className="sr-only">(wymagane)</span></FormLabel>
                      <FormControl>
                        <Textarea
                          rows={6}
                          maxLength={1500}
                          placeholder="Zwięźle opisz, na czym polega praktyka i jak pomaga w zarządzaniu dostępnością."
                          aria-describedby="opis-counter opis-hint"
                          className={field.value ? (opisOk ? "border-green-500 focus-visible:ring-green-500" : "border-red-500") : ""}
                          {...field}
                        />
                      </FormControl>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span
                            id="opis-counter"
                            aria-live="polite"
                            aria-atomic="true"
                            className={field.value ? (opisOk ? "text-green-600" : "text-red-600") : "text-gray-400"}
                          >
                            {opisLength} / 1500 znaków
                            {field.value && !opisOk && opisLength < 500 ? ` — potrzeba jeszcze ${500 - opisLength}` : ""}
                          </span>
                          {opisOk && <span className="text-green-600" aria-hidden="true">✓ Długość prawidłowa</span>}
                        </div>
                        <Progress
                          value={opisProgress}
                          aria-label={`Długość opisu: ${opisLength} z wymaganych 500 znaków`}
                          className={opisOk ? "[&>div]:bg-green-500" : opisLength > 0 ? "[&>div]:bg-red-500" : ""}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="problem" render={({ field }) => (
                    <FormItem><FormLabel>Problem</FormLabel><FormControl><Textarea rows={3} placeholder="Jaki problem rozwiązuje praktyka?" {...field} /></FormControl></FormItem>
                  )} />

                  <FormField control={form.control} name="cele" render={({ field }) => (
                    <FormItem><FormLabel>Cele</FormLabel><FormControl><Textarea rows={3} placeholder="Jakie cele realizuje praktyka?" {...field} /></FormControl></FormItem>
                  )} />

                  <FormField control={form.control} name="dzialania" render={({ field }) => (
                    <FormItem><FormLabel>Jak wdrożono praktykę</FormLabel><FormControl><Textarea rows={4} placeholder="Najważniejsze działania i etapy." {...field} /></FormControl></FormItem>
                  )} />

                  <FormField control={form.control} name="rezultaty" render={({ field }) => (
                    <FormItem><FormLabel>Rezultaty</FormLabel><FormControl><Textarea rows={3} placeholder="Jakie efekty uzyskano?" {...field} /></FormControl></FormItem>
                  )} />
                </div>
              </div>

              <Separator />

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-gray-700">Załączniki (PDF, DOCX, ZIP)</legend>
                <Input type="file" multiple onChange={handleFileChange} aria-describedby="file-hint" />
                <p id="file-hint" className="text-xs text-gray-500">Dozwolone formaty: PDF, DOCX, ZIP. Maks. 5 MB na plik.</p>
                {Object.entries(fileErrors).map(([k, m]) => (
                  <p className="text-xs text-red-600" role="alert" key={k}>{m}</p>
                ))}
                {files.length > 0 && (
                  <ul className="space-y-1" aria-label="Dodane załączniki">
                    {files.map(f => (
                      <li key={f.name} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
                        <span className="flex items-center gap-2">
                          <Badge variant="secondary" aria-hidden="true">{f.name.split(".").pop()?.toUpperCase()}</Badge>
                          {f.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(f.name)}
                          aria-label={`Usuń załącznik: ${f.name}`}
                          className="text-red-600 text-xs hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 rounded"
                        >
                          Usuń
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </fieldset>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button type="submit">↓ Pobierz ZIP (MDX + załączniki)</Button>
                <Button type="button" variant="outline" onClick={() => setShowPreview(p => !p)} aria-expanded={showPreview} aria-controls="mdx-preview">
                  {showPreview ? "Ukryj podgląd" : "Pokaż podgląd MDX"}
                </Button>
                <Button type="button" variant="ghost" className="ml-auto text-gray-600 hover:text-gray-900"
                  onClick={() => { if (confirm("Czy na pewno chcesz wyczyścić formularz?")) { form.reset(defaultValues); setFiles([]); localStorage.removeItem(STORAGE_KEY) } }}>
                  Wyczyść formularz
                </Button>
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
