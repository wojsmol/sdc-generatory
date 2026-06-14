import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "./constants"

export type FileErrors = { [key: string]: string }

export function validateFiles(selected: File[]): { validFiles: File[]; errors: FileErrors } {
  const errors: FileErrors = {}
  const validFiles: File[] = []

  selected.forEach((file) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      errors[`file:${file.name}`] = "Tylko PDF, DOCX, ZIP."
    } else if (file.size > MAX_FILE_SIZE) {
      errors[`file:${file.name}`] = "Maksymalny rozmiar pliku: 5 MB."
    } else {
      validFiles.push(file)
    }
  })

  return { validFiles, errors }
}

export function generateId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function linesToList(text: string, placeholder: string): string {
  const lines = text
    .split(/\r?\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (!lines.length) return placeholder
  return lines.map((l) => "- " + l).join("\n")
}

export function analyzeNeutralLanguage(text: string): string[] {
  const warnings: string[] = []
  const lower = text.toLowerCase()

  if (/\b(zrób|opracuj|przygotuj|zapewnij|zadbaj|rozważ|sprawdź|upewnij się|wprowadź|wdroż)\b/.test(lower)) {
    warnings.push('Wykryto tryb rozkazujący. Zalecenia powinny stosować język neutralny, np. „Organizacje opracowują…".')
  }

  if (/\b(ty|tobie|twoje|twoja|twój)\b/.test(lower)) {
    warnings.push("Wykryto bezpośrednie zwroty do odbiorcy. Zalecenia są kierowane do organizacji.")
  }

  if (/\b(powinien|powinna|powinno|powinni)\b/.test(lower)) {
    warnings.push('Występuje czasownik „powinien". Zaleca się formę opisową, np. „Organizacje ustanawiają…".')
  }

  return warnings
}
