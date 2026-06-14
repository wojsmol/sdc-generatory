"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ChevronDown, ExternalLink, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const BASE = "https://siec-dostepnosci-cyfrowej.github.io/sdc"

const WYMIARY = [
  { label: "Komunikacja",           href: `${BASE}/docs/komunikacja/wymiar-komunikacja/o-wymiarze-komunikacja` },
  { label: "Cykl życia TIK",        href: `${BASE}/docs/cykltik/wymiar-cykl-zycia-tik/o-wymiarze-cykl-zycia-tik` },
  { label: "Wiedza i umiejętności", href: `${BASE}/docs/wiedza/wymiar-wiedza-i-umiejetnosci/o-wymiarze-wiedza-i-umiejetnosci` },
  { label: "Zarządzanie i kultura", href: `${BASE}/docs/kultura/wymiar-zarzadzanie-i-kultura/o-wymiarze-zarzadzanie-i-kultura` },
  { label: "Pracownicy",            href: `${BASE}/docs/pracownicy/wymiar-pracownicy/o-wymiarze-pracownicy` },
  { label: "Zaopatrzenie",          href: `${BASE}/docs/zaopatrzenie/wymiar-zaopatrzenie/o-wymiarze-zaopatrzenie` },
  { label: "Wsparcie",              href: `${BASE}/docs/wsparcie/wymiar-wsparcie/o-wymiarze-wsparcie` },
]

const GENERATORY = [
  { label: "Generator zaleceń",        href: "/generator-zalecen" },
  { label: "Generator opisów praktyk", href: "/generator-dobrej-praktyki" },
  { label: "Word na Markdown",         href: "/generator-docx-markdown" },
]

function Dropdown({ label, items }: { label: string; items: { label: string; href: string }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isExternal = items[0]?.href.startsWith("http")

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 text-sm text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-1"
      >
        {label}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <ul role="menu" className="absolute top-full left-0 mt-1 z-50 min-w-[220px] rounded-md border border-border bg-card shadow-lg py-1">
          {items.map(item => (
            <li key={item.href} role="none">
              <a
                href={item.href}
                role="menuitem"
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:bg-muted"
              >
                {item.label}
                {isExternal && <ExternalLink className="h-3 w-3 opacity-50" aria-hidden="true" />}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

interface AppLayoutProps {
  children: React.ReactNode
  title: string
  description?: string
}

export function AppLayout({ children, title, description }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
      >
        Przejdź do treści głównej
      </a>

      <header className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4">
          <a
            href={BASE}
            className="flex items-center gap-3 hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded shrink-0"
            aria-label="Sieć Dostępności Cyfrowej – strona główna"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/logo.svg`} alt="" aria-hidden="true" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
            <span className="text-foreground font-bold text-base sm:text-lg">
              Sieć Dostępności Cyfrowej <strong>SDC</strong>
            </span>
          </a>

          {/* Desktop nav */}
          <nav aria-label="Główna nawigacja" className="hidden md:flex items-center gap-1 flex-wrap">
            <a href={`${BASE}/docs/o-sieci/projekt/o-projekcie-sdc`}
              className="text-sm text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-1">
              O Sieci
            </a>
            <Dropdown label="Wymiary" items={WYMIARY} />
            <Dropdown label="Generatory" items={GENERATORY} />
            <a href={`${BASE}/blog`}
              className="text-sm text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-1">
              Blog
            </a>
            <a href="https://github.com/Siec-Dostepnosci-Cyfrowej/sdc" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1 py-1">
              GitHub <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground"
            onClick={() => setMobileOpen(p => !p)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "Zamknij menu" : "Otwórz menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav id="mobile-nav" aria-label="Nawigacja mobilna" className="border-t border-border bg-white">
            <ul className="max-w-6xl mx-auto px-4 pb-4 space-y-1 list-none">
              <li>
                <a href={`${BASE}/docs/o-sieci/projekt/o-projekcie-sdc`}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm text-foreground hover:text-primary">
                  O Sieci
                </a>
              </li>
              <li>
                <p className="py-1 text-xs text-muted-foreground uppercase tracking-wide font-medium">Wymiary</p>
                <ul className="pl-3 space-y-1 list-none">
                  {WYMIARY.map(item => (
                    <li key={item.href}>
                      <a href={item.href} onClick={() => setMobileOpen(false)}
                        className="block py-1.5 text-sm text-foreground hover:text-primary">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                <p className="py-1 text-xs text-muted-foreground uppercase tracking-wide font-medium">Generatory</p>
                <ul className="pl-3 space-y-1 list-none">
                  {GENERATORY.map(item => (
                    <li key={item.href}>
                      <a href={item.href} onClick={() => setMobileOpen(false)}
                        className="block py-1.5 text-sm text-foreground hover:text-primary">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                <a href={`${BASE}/blog`} onClick={() => setMobileOpen(false)}
                  className="block py-2 text-sm text-foreground hover:text-primary">
                  Blog
                </a>
              </li>
              <li>
                <a href="https://github.com/Siec-Dostepnosci-Cyfrowej/sdc" target="_blank" rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-1 py-2 text-sm text-foreground hover:text-primary">
                  GitHub <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </nav>
        )}
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6" tabIndex={-1}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">{title}</h1>
          {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
      </main>

      <footer className="mt-16 border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-muted-foreground">
          Sieć Dostępności Cyfrowej
        </div>
      </footer>
    </div>
  )
}

export function MdxPreview({ content }: { content: string }) {
  return (
    <pre
      tabIndex={0}
      aria-label="Podgląd wygenerowanego pliku MDX"
      className="bg-gray-900 text-green-300 p-4 rounded-lg border text-xs whitespace-pre-wrap overflow-x-auto font-mono leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </pre>
  )
}

export function FormSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-4", className)}>{children}</div>
}

export function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>
}
