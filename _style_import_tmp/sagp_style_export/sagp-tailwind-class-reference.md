# SAGP Original Tailwind Class Reference

This file lists the major Tailwind utility structures from the SAGP project so you can recreate or compare the original component-level styling.

## Global CSS classes

```css
cyber-grid
scanlines
neon-card
neon-text
glitch
cyber-scrollbar
```

## Body / layout

```tsx
<body className="scanlines cyber-grid min-h-screen">
<main className="pt-24 pb-24 md:pb-12">
<div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
```

## Navbar

```tsx
<header className="fixed left-0 right-0 top-0 z-40 border-b border-cyber-cyan/15 bg-[#070713]/80 backdrop-blur-xl">
  <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
    <Link className="group flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-[4px] border border-cyber-cyan/35 bg-cyber-cyan/10 shadow-[0_0_22px_rgba(0,245,255,0.22)]" />
      <span className="hidden font-heading text-lg font-bold tracking-[0.22em] text-white neon-text sm:inline">SAGP</span>
    </Link>
    <nav className="hidden items-center gap-1 md:flex">
      <Link className="flex items-center gap-2 rounded-[4px] px-3 py-2 text-sm font-semibold text-cyan-100/70 transition hover:bg-white/8 hover:text-white" />
      <Link className="bg-cyber-cyan/12 text-cyber-cyan shadow-[inset_0_0_18px_rgba(0,245,255,0.08)]" />
    </nav>
  </div>
</header>

<nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-cyber-cyan/15 bg-[#070713]/90 px-2 py-2 backdrop-blur-xl md:hidden">
  <div className="grid grid-cols-5 gap-1">
    <Link className="flex flex-col items-center justify-center gap-1 rounded-[4px] px-2 py-2 text-[11px] font-semibold text-cyan-100/60" />
  </div>
</nav>
```

## Buttons

```tsx
base: "inline-flex items-center justify-center gap-2 rounded-[4px] text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-cyan disabled:pointer-events-none disabled:opacity-50"
default: "bg-cyber-cyan text-black shadow-[0_0_22px_rgba(0,245,255,0.28)] hover:bg-cyber-green"
secondary: "border border-cyber-purple/50 bg-cyber-purple/12 text-white hover:bg-cyber-purple/20"
ghost: "text-white hover:bg-white/10"
danger: "border border-[#ff3b81]/60 bg-[#ff3b81]/15 text-white hover:bg-[#ff3b81]/25"
size default: "h-10 px-4 py-2"
size sm: "h-8 px-3 text-xs"
size lg: "h-12 px-6 text-base"
```

## Cards

```tsx
<Card className="neon-card" />
<CardHeader className="space-y-1.5 p-5" />
<CardTitle className="font-heading text-lg font-bold tracking-wide text-white" />
<CardDescription className="text-sm leading-6 text-cyan-100/68" />
<CardContent className="p-5 pt-0" />
```

## Inputs / forms

```tsx
<Input className="h-10 w-full rounded-[4px] border border-cyber-cyan/25 bg-black/30 px-3 text-sm text-white outline-none placeholder:text-cyan-100/35 focus:border-cyber-cyan focus:ring-2 focus:ring-cyber-cyan/20" />
<select className="h-10 rounded-[4px] border border-cyber-cyan/25 bg-black/40 px-3 text-sm text-white outline-none focus:border-cyber-cyan" />
```

## Badges

```tsx
<span className="inline-flex items-center rounded-[4px] border border-cyber-cyan/30 bg-cyber-cyan/10 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-cyber-cyan" />
<span className="border-cyber-purple/30 bg-cyber-purple/10 text-cyber-purple" />
<span className="border-cyber-green/35 bg-cyber-green/10 text-cyber-green" />
```

## Progress

```tsx
<div className="h-2 overflow-hidden rounded-[4px] border border-cyber-cyan/20 bg-black/35">
  <div className="h-full bg-gradient-to-r from-cyber-cyan via-cyber-green to-cyber-purple shadow-[0_0_16px_rgba(0,245,255,0.45)] transition-all" />
</div>
```

## Login page

```tsx
<section className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
  <canvas className="absolute inset-0 h-full w-full opacity-45" />
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,245,255,0.10),transparent_34rem)]" />
  <div className="relative z-10 w-full max-w-md neon-card p-6 shadow-[0_0_70px_rgba(0,245,255,0.22)] sm:p-8" />
</section>
```

## Dashboard hero

```tsx
<section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
  <div className="neon-card overflow-hidden p-6 sm:p-8">
    <h1 className="mt-5 font-heading text-4xl font-black tracking-tight text-white neon-text sm:text-6xl" />
    <p className="mt-4 max-w-2xl text-base leading-7 text-cyan-100/68" />
    <div className="mt-6 flex flex-wrap gap-3" />
  </div>
</section>
```

## Stat cards

```tsx
<CardContent className="flex items-center gap-4 p-5">
  <div className="grid h-12 w-12 place-items-center rounded-[4px] border border-cyber-cyan/30 bg-cyber-cyan/10 text-cyber-cyan" />
  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-100/55" />
  <p className="font-heading text-2xl font-bold text-white" />
  <p className="text-xs text-cyan-100/50" />
</CardContent>
```

## Module catalog

```tsx
<div className="neon-card flex flex-col gap-3 p-4 sm:flex-row">
  <div className="relative flex-1">
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/40" />
    <Input className="pl-10" />
  </div>
</div>
<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" />
<Link className="group block h-full">
  <Card className="h-full transition duration-300 hover:-translate-y-1 hover:border-cyber-cyan/55 hover:shadow-[0_0_34px_rgba(0,245,255,0.18)]" />
</Link>
```

## Module detail page

```tsx
<section className="neon-card p-6 sm:p-8">
  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
    <h1 className="mt-4 font-heading text-4xl font-black text-white neon-text" />
    <p className="mt-4 max-w-3xl text-base leading-7 text-cyan-100/68" />
    <div className="min-w-72 rounded-[4px] border border-cyber-cyan/15 bg-black/20 p-4" />
  </div>
</section>
<div className="grid gap-5 lg:grid-cols-3" />
```

## Game shell

```tsx
<div className="grid gap-6 xl:grid-cols-[1fr_360px]">
  <div className="neon-card overflow-hidden p-2">
    <div className="aspect-video min-h-[320px] w-full" />
  </div>
  <Card>
    <CardContent className="space-y-4">
      <p className="font-heading text-5xl font-black text-white" />
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-[4px] border border-cyber-cyan/15 bg-cyber-cyan/5 p-3" />
        <div className="rounded-[4px] border border-cyber-green/15 bg-cyber-green/5 p-3" />
      </div>
    </CardContent>
  </Card>
</div>
```

## Profile / risk analytics

```tsx
<section className="neon-card p-6 sm:p-8">
  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between" />
</section>
<section className="grid gap-6 xl:grid-cols-[1fr_360px]" />
<div className="grid gap-4 lg:grid-cols-2">
  <div className="h-72 rounded-[4px] border border-cyber-cyan/15 bg-black/20 p-3" />
</div>
```

## Leaderboard

```tsx
<section className="grid gap-4 md:grid-cols-3" />
<CardContent className="p-6 text-center">
  <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[4px] border border-cyber-cyan/35 bg-cyber-cyan/10 font-heading text-xl text-white" />
</CardContent>
<table className="w-full min-w-[760px] text-left text-sm">
  <thead className="border-b border-cyber-cyan/15 font-mono uppercase tracking-[0.16em] text-cyan-100/45" />
  <tr className="border-b border-white/5" />
</table>
```

## Admin console

```tsx
<div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
  <section className="grid gap-4 md:grid-cols-4" />
  <section className="grid gap-6 xl:grid-cols-2" />
</div>
```
