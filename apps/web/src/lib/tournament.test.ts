import { describe, expect, it } from "vitest"

import type { Match, Player } from "@/types"

import {
  computeStandings,
  determineWinner,
  getNextPhase,
  shouldCreateNextMatch,
} from "./tournament"

const player = (documentId: string, name: string): Player => ({
  id: Number(documentId.replace(/\D/g, "")) || 0,
  documentId,
  name,
})

describe("determineWinner", () => {
  it("returns the higher-scoring player's id", () => {
    expect(determineWinner(3, 1, "p1", "p2")).toBe("p1")
    expect(determineWinner(1, 3, "p1", "p2")).toBe("p2")
  })

  it("returns empty string for a draw or invalid scores", () => {
    expect(determineWinner(2, 2, "p1", "p2")).toBe("")
    expect(determineWinner(Number.NaN, 1, "p1", "p2")).toBe("")
  })
})

describe("getNextPhase", () => {
  it("walks the knockout ladder", () => {
    expect(getNextPhase("group")).toBe("quarterfinal")
    expect(getNextPhase("quarterfinal")).toBe("semifinal")
    expect(getNextPhase("semifinal")).toBe("final")
  })

  it("returns null after the final", () => {
    expect(getNextPhase("final")).toBeNull()
  })
})

describe("shouldCreateNextMatch", () => {
  it("creates a next match once a fresh pair of winners exists", () => {
    // 2 completed quarterfinals, 0 semifinals so far -> owe 1 semifinal.
    expect(shouldCreateNextMatch("quarterfinal", 2, 0)).toBe(true)
    // 4 completed quarterfinals, 1 semifinal exists -> owe a 2nd semifinal.
    expect(shouldCreateNextMatch("quarterfinal", 4, 1)).toBe(true)
  })

  it("does not create when the owed matches already exist", () => {
    expect(shouldCreateNextMatch("quarterfinal", 2, 1)).toBe(false)
    expect(shouldCreateNextMatch("quarterfinal", 1, 0)).toBe(false)
  })

  it("never creates anything after the final", () => {
    expect(shouldCreateNextMatch("final", 2, 0)).toBe(false)
  })

  it("never auto-advances the group stage (standings decide that)", () => {
    expect(shouldCreateNextMatch("group", 4, 0)).toBe(false)
  })
})

describe("computeStandings", () => {
  it("ranks players by wins then point differential", () => {
    const a = player("a1", "Asha")
    const b = player("b2", "Bala")
    const c = player("c3", "Chetan")

    const matches: Match[] = [
      {
        id: 1,
        documentId: "m1",
        phase: "group",
        player1: a,
        player2: b,
        score1: 11,
        score2: 5,
        winner: a,
      },
      {
        id: 2,
        documentId: "m2",
        phase: "group",
        player1: a,
        player2: c,
        score1: 11,
        score2: 9,
        winner: a,
      },
      {
        id: 3,
        documentId: "m3",
        phase: "group",
        player1: b,
        player2: c,
        score1: 11,
        score2: 7,
        winner: b,
      },
    ]

    const standings = computeStandings([a, b, c], matches)
    expect(standings.map((s) => s.player.documentId)).toEqual([
      "a1",
      "b2",
      "c3",
    ])
    expect(standings[0]?.wins).toBe(2)
    expect(standings[2]?.wins).toBe(0)
  })

  it("ignores matches without a winner", () => {
    const a = player("a1", "Asha")
    const b = player("b2", "Bala")
    const matches: Match[] = [
      {
        id: 1,
        documentId: "m1",
        phase: "group",
        player1: a,
        player2: b,
        score1: null,
        score2: null,
        winner: null,
      },
    ]
    const standings = computeStandings([a, b], matches)
    expect(standings.every((s) => s.played === 0)).toBe(true)
  })
})
