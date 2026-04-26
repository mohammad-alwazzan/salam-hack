# Mizan — Design Theme Reference

> Single source of truth for all UI decisions. Every new page and component must follow this spec.
> Reference screenshot: `Screenshot 2026-04-26 174026.png`

---

## 1. Overall Aesthetic

| Property | Value |
|---|---|
| Style | Flat minimalism — no decorative textures, no gradients on page background |
| Feel | Mobile-first layout rendered on desktop. Narrow centered column, not a wide grid |
| Background | Pure white (`bg-background` / `oklch(1 0 0)`) |
| Theme baseline | **Light-first.** All core layouts and components are designed for light mode by default |
| Radius | `rounded-xl` (16px) for cards; `rounded-full` for avatars; `rounded-lg` for small chips |

---

## 2. Layout

```
max-w-[760px] mx-auto px-4 md:px-6 py-8 md:py-10
```

- **Comfortable default shell** — pages are no longer compressed to phone-width on desktop.
- Default page max-width: `max-w-[760px]`.
- Analytics-heavy pages (Budget) can use `max-w-[1120px]`.
- Section spacing: `space-y-10` between major sections.
- No sidebar. Navigation is a minimal top bar only.

---

## 3. Navigation Bar

- Floats at top, no background fill, no bottom border visible (or extremely faint).
- Left: Logo mark (small dark circle) + app name `"Mizan"` in medium weight.
- Right: Bell icon + logout icon — ghost icon buttons, `size-4`.
- Height: ~`h-12`.

---

## 4. Typography Scale

| Role | Classes |
|---|---|
| Page greeting (h1) | `text-2xl font-bold tracking-tight` |
| Greeting subtitle (date) | `text-sm text-muted-foreground` |
| Section label | `text-[10px] font-semibold uppercase tracking-widest text-muted-foreground` |
| Entity name (bank/merchant) | `text-sm font-semibold` |
| Entity subtitle (type · id / category · date) | `text-xs text-muted-foreground` |
| Hero balance amount | `text-3xl font-bold` (foreground on light card) |
| Standard amount | `text-sm font-semibold tabular-nums` |
| Currency label | `text-xs font-normal text-muted-foreground` |
| "View all" link | `text-xs font-medium text-primary` (teal/accent tint) |

---

## 5. Color Conventions

| Semantic | Color |
|---|---|
| Positive / income amount | `text-emerald-600` |
| Negative / debit amount | `text-foreground` (plain dark — no red for debits) |
| Overdue / error | `text-destructive` |
| Muted text | `text-muted-foreground` |
| Section "View all" link | `text-primary` (follows primary token) |

> **Debits are NOT red.** They are rendered in the default foreground color. Only overdue/error states use destructive red.

---

## 6. Section Header Pattern

Every data section uses the same two-row header:

```tsx
<div className="flex items-center justify-between mb-3">
  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
    SECTION NAME
  </span>
  <span className="text-xs text-muted-foreground">3 connected</span>
  {/* or */}
  <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-primary gap-0.5"
    render={<Link href="..." />}>
    View all <ChevronRight className="size-3" />
  </Button>
</div>
<Separator className="mb-1" />
```

---

## 7. List Row Pattern (Accounts & Transactions)

**No `<Card>` wrapper.** Rows are plain flex items with a bottom divider.

```tsx
<div className="divide-y divide-border/60">
  <div className="flex items-center gap-3 py-3.5">
    {/* Avatar */}
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
      <BuildingIcon className="size-4" />
    </div>
    {/* Label */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold truncate">Arab Bank</p>
      <p className="text-xs text-muted-foreground">Checking · 4291</p>
    </div>
    {/* Amount */}
    <div className="text-right shrink-0">
      <p className="text-sm font-semibold tabular-nums">8,170.75</p>
      <p className="text-xs text-muted-foreground">USD</p>
    </div>
  </div>
</div>
```

### Avatar color mapping

| Entity | Shape | Color |
|---|---|---|
| Checking account | `rounded-full` | `bg-emerald-500` |
| Savings account | `rounded-full` | `bg-blue-500` |
| Remittance account | `rounded-full` | `bg-violet-500` |
| Transaction (shopping) | `rounded-xl` | `bg-pink-100 text-pink-600` |
| Transaction (transfer) | `rounded-xl` | `bg-emerald-100 text-emerald-600` |
| Transaction (grocery) | `rounded-xl` | `bg-teal-100 text-teal-600` |
| Transaction (utilities) | `rounded-xl` | `bg-amber-100 text-amber-600` |

> **Solid colors for bank avatars.** Soft tinted backgrounds for transaction category icons.

---

## 8. Hero Balance Card (Light Surface)

The total balance widget is a light card with subtle border. Avoid inverted dark surfaces in the default experience.

```tsx
<div className="rounded-2xl border border-border/70 bg-card text-card-foreground p-5 space-y-4">
  {/* Label */}
  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
    TOTAL BALANCE
  </p>
  {/* Amount */}
  <p className="text-3xl font-bold">
    35,531.25 <span className="text-sm font-medium text-muted-foreground">USD</span>
  </p>
  {/* Budget progress */}
  <div className="space-y-1">
    <div className="flex justify-between text-[10px] text-muted-foreground">
      <span>Monthly budget · 39% used</span>
      <span>9,300.00 left</span>
    </div>
    <Progress value={39} className="h-1 [&>div]:bg-foreground bg-muted" />
  </div>
  {/* Income / Spent sub-tiles */}
  <div className="grid grid-cols-2 gap-2">
    <div className="rounded-xl border border-border/70 bg-muted/40 p-3 space-y-1">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
        <ArrowUpRight className="size-3" /> INCOME
      </p>
      <p className="text-base font-bold">15,200.00</p>
    </div>
    <div className="rounded-xl border border-border/70 bg-muted/40 p-3 space-y-1">
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
        <ArrowDownLeft className="size-3" /> SPENT
      </p>
      <p className="text-base font-bold">5,900.00</p>
    </div>
  </div>
</div>
```

---

## 9. Quick Actions Grid

Four equal-width action tiles below the hero card.

```tsx
<div className="grid grid-cols-4 gap-3">
  {actions.map(({ label, icon: Icon, color, href }) => (
    <Link href={href} key={label}
      className="flex flex-col items-center gap-2.5 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:bg-muted/50">
      <div className={`flex size-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="size-5" />
      </div>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  ))}
</div>
```

| Action | Icon bg color |
|---|---|
| Bills | `bg-orange-100 text-orange-500` |
| Budget | `bg-teal-100 text-teal-500` |
| Voice AI | `bg-pink-100 text-pink-500` |
| Chat AI | `bg-indigo-100 text-indigo-500` |

---

## 10. Spacing & Grid Rules

| Rule | Value |
|---|---|
| Section gap | `space-y-10` |
| List row padding | `py-3.5` |
| Card internal padding | `p-5` |
| Icon size (list rows) | `size-9` |
| Icon size (quick actions) | `size-10` with `size-5` inner icon |
| Divider | `divide-y divide-border/60` (NOT separate `<Separator>` per row) |

---

## 11. What NOT to Do

- **No wide two-column grids** on the dashboard. Keep single column.
- **No colored card backgrounds** for account/transaction rows — they are plain rows.
- **No large decorative gradients** on the page background.
- **No red on debit amounts** — only use `text-destructive` for actual error states.
- **No `asChild` prop** — this project uses `@base-ui/react/button`. Use `render={<Link href="..." />}` instead.
- **No emoji as icons** — use Lucide icons exclusively.
- **No Card wrapper around list rows** — use `divide-y` on a plain `<div>`.
- **No floating navbar spacing** — the nav is minimal and borderless.
- **No forced `.dark` wrapper** in app providers/layout. Light mode is the runtime default.
