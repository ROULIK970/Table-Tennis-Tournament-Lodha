/**
 * Shared domain types for the tournament frontend.
 *
 * Strapi v5's REST API returns a *flattened* shape: fields sit at the top level
 * alongside `id` and `documentId` (there is no v4-style `attributes` wrapper),
 * and populated relations are plain nested objects / arrays.
 */

export type Phase = "group" | "quarterfinal" | "semifinal" | "final"

export type TournamentStatus = "upcoming" | "ongoing" | "completed"

export const PHASES: Phase[] = ["group", "quarterfinal", "semifinal", "final"]

export const PHASE_LABELS: Record = {
  group: "Group Stage",
  quarterfinal: "Quarterfinal",
  semifinal: "Semifinal",
  final: "Final",
}

export interface StrapiEntity {
  id: number
  documentId: string
  createdAt?: string
  updatedAt?: string
}

export interface Category extends StrapiEntity {
  name: string
  players?: Player[]
  groups?: Group[]
  matches?: Match[]
}

export interface Player extends StrapiEntity {
  name: string
  age?: number | null
  flatNumber?: string | null
  mobile?: string | null
  email?: string | null
  registeredAt?: string | null
  category?: Category | null
  groups?: Group[]
}

export interface Group extends StrapiEntity {
  name: string
  category?: Category | null
  players?: Player[]
}

export interface Match extends StrapiEntity {
  phase: Phase
  score1?: number | null
  score2?: number | null
  scheduledAt?: string | null
  completedAt?: string | null
  category?: Category | null
  player1?: Player | null
  player2?: Player | null
  winner?: Player | null
}

export interface Tournament extends StrapiEntity {
  title: string
  startDate?: string | null
  endDate?: string | null
  ceremonyDate?: string | null
  status: TournamentStatus
}

export interface StrapiPagination {
  page: number
  pageSize: number
  pageCount: number
  total: number
}

export interface StrapiCollectionResponse<T> {
  data: T[]
  meta: { pagination?: StrapiPagination }
}

export interface StrapiSingleResponse<T> {
  data: T
  meta: Record
}

/** Standings row used by the leaderboard. */
export interface Standing {
  player: Player
  played: number
  wins: number
  losses: number
  pointsFor: number
  pointsAgainst: number
}
