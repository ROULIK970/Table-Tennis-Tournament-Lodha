"use client"

import { useState } from "react"
import useSWR from "swr"

import type { Category, Group, Player } from "@/types"

import { adminMutate, swrFetcher } from "@/lib/admin-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table"

const FIELD =
  "h-9 w-full rounded-[2px] border border-border bg-background px-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"

function categoryId(entity: {
  category?: Category | null
}): string | undefined {
  return entity.category?.documentId
}

export default function AdminPlayersPage() {
  const playersSwr = useSWR(
    "/players?populate=*&pagination[pageSize]=200&sort=name:asc",
    (p) => swrFetcher<Player>(p)
  )
  const categoriesSwr = useSWR(
    "/categories?pagination[pageSize]=200&sort=name:asc",
    (p) => swrFetcher<Category>(p)
  )
  const groupsSwr = useSWR(
    "/groups?populate=*&pagination[pageSize]=200&sort=name:asc",
    (p) => swrFetcher<Group>(p)
  )

  const players = playersSwr.data?.data ?? []
  const categories = categoriesSwr.data?.data ?? []
  const groups = groupsSwr.data?.data ?? []

  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    await Promise.all([playersSwr.mutate(), groupsSwr.mutate()])
  }

  const loading =
    playersSwr.isLoading || categoriesSwr.isLoading || groupsSwr.isLoading
  const loadError = playersSwr.error || categoriesSwr.error || groupsSwr.error

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Players</h1>
        <p className="text-muted mt-1 text-sm">
          {players.length} registration{players.length === 1 ? "" : "s"}. Assign
          players to groups for the round-robin stage.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="border-danger/40 bg-danger/10 text-danger border px-3 py-2 text-sm"
        >
          {error}
        </p>
      ) : null}
      {loadError ? (
        <p className="border-danger/40 bg-danger/10 text-danger border px-3 py-2 text-sm">
          Failed to load data. Make sure Strapi is running and your session is
          valid.
        </p>
      ) : null}

      <CreateGroupForm
        categories={categories}
        players={players}
        onError={setError}
        onCreated={refresh}
      />

      {groups.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-bold">Groups</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.documentId}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{group.name}</CardTitle>
                    {group.category ? (
                      <Badge tone="accent">{group.category.name}</Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardBody>
                  {group.players && group.players.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {group.players.map((player) => (
                        <li key={player.documentId}>{player.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted text-sm">No players yet.</p>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-bold">Registrations</h2>
        {loading ? (
          <p className="text-muted text-sm">Loading…</p>
        ) : players.length === 0 ? (
          <p className="text-muted text-sm">No registrations yet.</p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Age</TH>
                <TH>Flat</TH>
                <TH>Mobile</TH>
                <TH>Email</TH>
                <TH>Category</TH>
                <TH>Groups</TH>
              </TR>
            </THead>
            <TBody>
              {players.map((player) => (
                <TR key={player.documentId}>
                  <TD className="font-medium">{player.name}</TD>
                  <TD>{player.age ?? "—"}</TD>
                  <TD>{player.flatNumber ?? "—"}</TD>
                  <TD>{player.mobile ?? "—"}</TD>
                  <TD className="text-muted">{player.email ?? "—"}</TD>
                  <TD>{player.category?.name ?? "—"}</TD>
                  <TD>
                    {player.groups && player.groups.length > 0
                      ? player.groups.map((g) => g.name).join(", ")
                      : "—"}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------

function CreateGroupForm({
  categories,
  players,
  onError,
  onCreated,
}: {
  categories: Category[]
  players: Player[]
  onError: (message: string | null) => void
  onCreated: () => Promise
}) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [selected, setSelected] = useState<Set>(new Set())
  const [saving, setSaving] = useState(false)

  const eligible = players.filter(
    (p) => !category || categoryId(p) === category
  )

  function toggle(documentId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(documentId)) next.delete(documentId)
      else next.add(documentId)
      return next
    })
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    onError(null)
    if (!name.trim()) {
      onError("Give the group a name.")
      return
    }
    if (!category) {
      onError("Choose a category for the group.")
      return
    }
    setSaving(true)
    try {
      await adminMutate("/groups", "POST", {
        name: name.trim(),
        category,
        players: Array.from(selected),
      })
      setName("")
      setSelected(new Set())
      await onCreated()
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to create group.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create group &amp; assign players</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Group name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Group A"
                className={FIELD}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Category</span>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setSelected(new Set())
                }}
                className={FIELD}
              >
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c.documentId} value={c.documentId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">
              Players{" "}
              <span className="text-muted">({selected.size} selected)</span>
            </legend>
            {!category ? (
              <p className="text-muted text-sm">
                Select a category to list its players.
              </p>
            ) : eligible.length === 0 ? (
              <p className="text-muted text-sm">
                No players registered in this category yet.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {eligible.map((player) => (
                  <label
                    key={player.documentId}
                    className="border-border bg-background flex items-center gap-2 border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(player.documentId)}
                      onChange={() => toggle(player.documentId)}
                    />
                    {player.name}
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <Button type="submit" disabled={saving}>
            {saving ? "Creating…" : "Create group"}
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
