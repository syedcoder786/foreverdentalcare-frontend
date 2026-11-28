import type { ReactNode } from 'react';
import { Skeleton } from './Spinner';
import { cn } from '../../utils/cn';

/**
 * Layout-shaped loading placeholders. Each mirrors the real page/card closely enough that
 * content swaps in without the page jumping around.
 */

/** Announces loading to screen readers while the visual skeleton is aria-hidden. */
function Busy({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** A few lines of paragraph text; the last line is shorter. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden className={cn('space-y-2.5', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5 rounded-full', i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

const cardShell = 'flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-surface shadow-soft';

export function ServiceCardSkeleton() {
  return (
    <div aria-hidden className={cardShell}>
      <Skeleton className="aspect-[16/7] w-full rounded-none" />
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <Skeleton className="size-12 rounded-2xl" />
          <div className="flex flex-col items-end gap-1.5">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-5 w-3/5 rounded-full" />
        <SkeletonText lines={2} className="mt-4" />
        <div className="mt-auto flex items-center justify-between pt-6">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function DoctorCardSkeleton() {
  return (
    <div aria-hidden className={cardShell}>
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-6 w-2/3 rounded-full" />
        <Skeleton className="mt-2.5 h-4 w-1/2 rounded-full" />
        <SkeletonText lines={2} className="mt-4" />
        <div className="mt-auto flex gap-3 pt-6">
          <Skeleton className="h-10 flex-1 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SpecialtyCardSkeleton() {
  return (
    <div aria-hidden className={cn(cardShell, 'p-7')}>
      <Skeleton className="size-14 rounded-2xl" />
      <Skeleton className="mt-5 h-6 w-1/2 rounded-full" />
      <SkeletonText lines={3} className="mt-4" />
      <div className="mt-auto flex items-center justify-between pt-6">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="size-5 rounded-full" />
      </div>
    </div>
  );
}

const CARDS = { service: ServiceCardSkeleton, doctor: DoctorCardSkeleton, specialty: SpecialtyCardSkeleton };

/** Responsive grid of card skeletons. */
export function CardGridSkeleton({
  kind,
  count = 3,
  className = 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',
  label = 'Loading',
}: {
  kind: keyof typeof CARDS;
  count?: number;
  className?: string;
  label?: string;
}) {
  const Card = CARDS[kind];
  return (
    <Busy label={label} className={className}>
      {Array.from({ length: count }).map((_, i) => <Card key={i} />)}
    </Busy>
  );
}

/** Matches the tinted PageHeader band used at the top of inner pages. */
export function PageHeaderSkeleton({ withAction = true, withDescription = true }: { withAction?: boolean; withDescription?: boolean }) {
  return (
    <section aria-hidden className="border-b border-slate-100 bg-gradient-to-b from-brand-50/70 to-surface dark:from-brand-500/[0.07] dark:to-transparent">
      <div className="container-page py-14 sm:py-20">
        <Skeleton className="mb-4 h-3 w-28 rounded-full" />
        <Skeleton className="h-10 w-full max-w-xl rounded-2xl sm:h-12" />
        {withDescription && (
          <div className="mt-5 max-w-2xl space-y-2.5">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-4/5 rounded-full" />
          </div>
        )}
        {withAction && (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Skeleton className="h-12 w-48 rounded-full" />
            <Skeleton className="h-4 w-32 rounded-full" />
          </div>
        )}
      </div>
    </section>
  );
}

/** Section title block (eyebrow + heading), as rendered by SectionHeading. */
function HeadingSkeleton({ center }: { center?: boolean }) {
  return (
    <div aria-hidden className={cn('flex flex-col gap-3', center && 'items-center')}>
      <Skeleton className="h-3 w-24 rounded-full" />
      <Skeleton className="h-8 w-72 max-w-full rounded-2xl" />
    </div>
  );
}

/** Generic inner page: header band + a grid of cards. Used while a route's code chunk loads. */
export function PageSkeleton({ label = 'Loading page' }: { label?: string }) {
  return (
    <Busy label={label}>
      <PageHeaderSkeleton />
      <section aria-hidden className="container-page py-14 sm:py-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <ServiceCardSkeleton key={i} />)}
        </div>
      </section>
    </Busy>
  );
}

/** Service / specialty detail: header, cover image + bullet list, side card. */
export function DetailPageSkeleton({ label = 'Loading details' }: { label?: string }) {
  return (
    <Busy label={label}>
      <PageHeaderSkeleton />
      <section aria-hidden className="container-page grid grid-cols-1 gap-12 py-14 sm:py-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Skeleton className="mb-10 aspect-[21/8] w-full rounded-[2rem]" />
          <Skeleton className="h-6 w-44 rounded-full" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-5 shrink-0 rounded-full" />
                <Skeleton className={cn('h-4 rounded-full', i % 2 ? 'w-3/5' : 'w-4/5')} />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-slate-200/80 bg-surface p-6 shadow-soft">
            <Skeleton className="h-5 w-40 rounded-full" />
            <SkeletonText lines={3} className="mt-5" />
            <Skeleton className="mt-6 h-11 w-full rounded-full" />
          </div>
        </div>
      </section>
    </Busy>
  );
}

/** Doctor profile: portrait + name/title band, then about and hours cards. */
export function DoctorProfileSkeleton() {
  return (
    <Busy label="Loading doctor profile">
      <section aria-hidden className="border-b border-slate-100 bg-gradient-to-b from-brand-50/70 to-surface dark:from-brand-500/[0.07] dark:to-transparent">
        <div className="container-page grid grid-cols-1 gap-10 py-14 sm:py-20 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-4">
            <Skeleton className="mx-auto aspect-[4/5] w-full max-w-sm rounded-[2rem]" />
          </div>
          <div className="lg:col-span-8">
            <div className="flex gap-1.5">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-5 h-11 w-full max-w-md rounded-2xl" />
            <Skeleton className="mt-3 h-5 w-56 rounded-full" />
            <div className="mt-5 max-w-2xl space-y-2.5">
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-3/4 rounded-full" />
            </div>
            <div className="mt-6 flex gap-8">
              <Skeleton className="h-4 w-36 rounded-full" />
              <Skeleton className="h-4 w-28 rounded-full" />
            </div>
            <Skeleton className="mt-8 h-12 w-52 rounded-full" />
          </div>
        </div>
      </section>
      <section aria-hidden className="container-page grid grid-cols-1 gap-10 py-14 sm:py-20 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Skeleton className="h-6 w-32 rounded-full" />
          <SkeletonText lines={5} />
        </div>
        <div className="lg:col-span-4">
          <div className="rounded-3xl border border-slate-200/80 bg-surface p-6 shadow-soft">
            <Skeleton className="h-5 w-40 rounded-full" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <Skeleton className="h-4 w-12 rounded-full" />
                  <Skeleton className="h-4 w-28 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Busy>
  );
}

/** Content page (About): header + text block + two feature cards. */
export function ContentPageSkeleton({ label = 'Loading page' }: { label?: string }) {
  return (
    <Busy label={label}>
      <PageHeaderSkeleton withAction={false} withDescription={false} />
      <section aria-hidden className="container-page py-14 sm:py-20">
        <SkeletonText lines={4} className="max-w-3xl" />
      </section>
      <section aria-hidden className="border-y border-slate-100 bg-slate-50/60 py-16 sm:py-20 dark:bg-surface/40">
        <div className="container-page grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-slate-200 bg-surface p-8 shadow-soft">
              <Skeleton className="size-12 rounded-2xl" />
              <Skeleton className="mt-5 h-6 w-40 rounded-full" />
              <SkeletonText lines={3} className="mt-4" />
            </div>
          ))}
        </div>
      </section>
    </Busy>
  );
}

/** Home page: hero, then featured sections with card grids. */
export function HomeSkeleton() {
  return (
    <Busy label="Loading home page">
      <section aria-hidden className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 to-surface dark:from-brand-500/[0.07] dark:to-transparent">
        <div className="container-page grid grid-cols-1 items-center gap-12 py-16 sm:py-24 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Skeleton className="h-7 w-44 rounded-full" />
            <Skeleton className="mt-6 h-12 w-full rounded-2xl sm:h-14" />
            <Skeleton className="mt-3 h-12 w-4/5 rounded-2xl sm:h-14" />
            <div className="mt-6 max-w-xl space-y-2.5">
              <Skeleton className="h-4 w-full rounded-full" />
              <Skeleton className="h-4 w-5/6 rounded-full" />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Skeleton className="h-12 w-44 rounded-full" />
              <Skeleton className="h-12 w-36 rounded-full" />
            </div>
          </div>
          <div className="lg:col-span-6">
            <Skeleton className="aspect-[5/4] w-full rounded-[2rem]" />
          </div>
        </div>
      </section>
      <section aria-hidden className="container-page py-16 sm:py-20">
        <HeadingSkeleton />
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <ServiceCardSkeleton key={i} />)}
        </div>
      </section>
      <section aria-hidden className="container-page pb-16 sm:pb-20">
        <HeadingSkeleton />
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <DoctorCardSkeleton key={i} />)}
        </div>
      </section>
    </Busy>
  );
}

/** A form: labelled fields and a submit button. Used inside an existing card. */
export function FormSkeleton({ fields = 5, label = 'Loading form' }: { fields?: number; label?: string }) {
  return (
    <Busy label={label}>
      <div aria-hidden className="space-y-6">
        <Skeleton className="h-6 w-56 rounded-full" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className={cn('space-y-2', i === fields - 1 && fields % 2 === 1 && 'sm:col-span-2')}>
              <Skeleton className="h-3.5 w-24 rounded-full" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-full sm:w-56" />
      </div>
    </Busy>
  );
}

/** Patient profile: header card with avatar, then appointment cards. */
export function ProfileSkeleton() {
  return (
    <Busy label="Loading your profile" className="container-page py-14 sm:py-20">
      <div aria-hidden className="flex items-center gap-5 rounded-[2rem] border border-slate-200/80 bg-surface p-6 shadow-soft sm:p-8">
        <Skeleton className="size-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-6 w-48 rounded-full" />
          <Skeleton className="h-4 w-32 rounded-full" />
        </div>
      </div>
      <div aria-hidden className="mt-8 space-y-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    </Busy>
  );
}

/** Admin screen: title row, stat tiles and a table. */
export function AdminPageSkeleton({ label = 'Loading' }: { label?: string }) {
  return (
    <Busy label={label} className="space-y-6">
      <div aria-hidden className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-48 rounded-full" />
          <Skeleton className="h-4 w-72 max-w-full rounded-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      <div aria-hidden className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <TableSkeleton />
    </Busy>
  );
}

/** Table rows inside a bordered card. */
export function TableSkeleton({ rows = 6, label = 'Loading list' }: { rows?: number; label?: string }) {
  return (
    <Busy label={label} className="overflow-hidden rounded-2xl border border-slate-200 bg-surface">
      <div className="flex gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
        {['w-1/3', 'w-1/2', 'w-2/5', 'w-1/4'].map((w, i) => (
          <div key={i} className={i === 0 ? 'flex-[2]' : 'flex-1'}>
            <Skeleton className={cn('h-3 rounded-full', w)} />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0">
          <div className="flex flex-[2] items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-3/4 rounded-full" />
          </div>
          <Skeleton className="h-4 flex-1 rounded-full" />
          <Skeleton className="h-4 flex-1 rounded-full" />
          <Skeleton className="h-6 flex-1 rounded-full" />
        </div>
      ))}
    </Busy>
  );
}

/** Full admin frame (sidebar + top bar + page) shown while the session is being checked. */
export function AdminShellSkeleton() {
  return (
    <Busy label="Checking your session" className="min-h-dvh bg-slate-50 dark:bg-canvas">
      <aside aria-hidden className="fixed inset-y-0 left-0 hidden w-72 flex-col gap-3 bg-brand-900 p-6 lg:flex">
        <div className="mb-6 h-9 w-40 animate-pulse rounded-xl bg-white/10" />
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="size-5 animate-pulse rounded-md bg-white/10" />
            <div className={cn('h-3.5 animate-pulse rounded-full bg-white/10', i % 3 ? 'w-28' : 'w-36')} />
          </div>
        ))}
      </aside>
      <div className="lg:pl-72">
        <div aria-hidden className="flex h-16 items-center justify-between border-b border-slate-200 bg-surface px-4 sm:px-6">
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <AdminPageSkeleton label="Loading dashboard" />
        </div>
      </div>
    </Busy>
  );
}

/** Centered sign-in card (admin login). */
export function AuthCardSkeleton() {
  return (
    <Busy label="Loading" className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-brand-50 via-surface to-sky-soft-50 px-4 py-12">
      <div aria-hidden className="w-full max-w-md">
        <Skeleton className="mx-auto mb-8 h-10 w-44 rounded-xl" />
        <div className="space-y-5 rounded-[2rem] border border-slate-200/80 bg-surface p-6 shadow-lift sm:p-8">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32 rounded-full" />
              <Skeleton className="h-3.5 w-48 rounded-full" />
            </div>
          </div>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-20 rounded-full" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </Busy>
  );
}

/** Label/value detail tiles, e.g. inside a modal. */
export function DetailListSkeleton({ rows = 6, label = 'Loading details' }: { rows?: number; label?: string }) {
  return (
    <Busy label={label} className="space-y-5">
      <div aria-hidden className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-2xl border border-slate-100 p-4">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className={cn('h-4 rounded-full', i % 2 ? 'w-1/2' : 'w-3/4')} />
          </div>
        ))}
      </div>
      <div aria-hidden className="flex gap-2">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
    </Busy>
  );
}

/** Grid of image tiles (gallery). */
export function ImageGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <Busy label="Loading photos" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} aria-hidden className="overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-soft">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="p-3"><Skeleton className="h-3.5 w-2/3 rounded-full" /></div>
        </div>
      ))}
    </Busy>
  );
}

/** Stack of list rows / editor cards. */
export function ListSkeleton({ rows = 4, rowClassName = 'h-16', label = 'Loading' }: { rows?: number; rowClassName?: string; label?: string }) {
  return (
    <Busy label={label} className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className={cn('rounded-2xl', rowClassName)} />)}
    </Busy>
  );
}
