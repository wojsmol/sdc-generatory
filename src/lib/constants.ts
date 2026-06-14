export const WYMIARY = [
  "Komunikacja",
  "Wiedza i umiejętności",
  "Wsparcie",
  "Cykl życia TIK",
  "Pracownicy",
  "Zaopatrzenie",
  "Zarządzanie i kultura",
] as const

export type Wymiar = (typeof WYMIARY)[number]

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
]

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
