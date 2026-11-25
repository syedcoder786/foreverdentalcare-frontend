import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Eye, Target } from 'lucide-react';
import { useDoctors, useGallery, usePage, useSite } from '../hooks/usePublicData';
import { PageHeader } from '../components/layout/PageHeader';
import { CtaBand } from '../components/layout/CtaBand';
import { CmsCards, CmsHeading, CustomSections, RichText } from '../components/content/Cms';
import { Seo } from '../components/content/Seo';
import { DoctorCard } from '../components/doctors/DoctorCard';
import { Reveal, Stagger, StaggerItem } from '../components/motion/Reveal';
import { PageLoader } from '../components/ui/Spinner';
import { SectionHeading } from '../components/ui/SectionHeading';
import { cn } from '../utils/cn';

function Gallery() {
  const { data = [] } = useGallery();
  const categories = useMemo(() => ['All', ...Array.from(new Set(data.map((g) => g.category).filter(Boolean) as string[]))], [data]);
  const [active, setActive] = useState('All');
  if (data.length === 0) return null;
  const images = active === 'All' ? data : data.filter((g) => g.category === active);
  return (
    <section id="gallery" className="container-page scroll-mt-24 py-16 sm:py-20">
      <Reveal><SectionHeading eyebrow="Gallery" title="Inside the clinic" /></Reveal>
      {categories.length > 2 && (
        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Gallery categories">
          {categories.map((c) => (
            <button key={c} type="button" role="tab" aria-selected={active === c} onClick={() => setActive(c)}
              className={cn('relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors', active === c ? 'text-white' : 'text-slate-600 hover:text-ink')}>
              {active === c && <motion.span layoutId="gallery-tab" className="absolute inset-0 rounded-full bg-brand-700" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative">{c}</span>
            </button>
          ))}
        </div>
      )}
      <motion.div layout className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((g) => (
          <motion.figure layout key={g.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="group relative aspect-square overflow-hidden rounded-2xl">
            <img src={g.imageUrl} alt={g.caption ?? 'Clinic photo'} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            {g.caption && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-sm text-white">{g.caption}</figcaption>}
          </motion.figure>
        ))}
      </motion.div>
    </section>
  );
}

export default function About() {
  const { clinic } = useSite();
  const { sections, section, seo, isLoading } = usePage('ABOUT');
  const { data: doctors = [] } = useDoctors();
  if (isLoading) return <PageLoader />;
  const intro = section('intro');
  const mission = section('mission');
  const vision = section('vision');
  const facilities = section('facilities');
  const equipment = section('equipment');

  return (
    <>
      <Seo seo={seo} title="About us" />
      <PageHeader eyebrow={intro?.subtitle ?? 'About us'} title={intro?.title ?? `About ${clinic.clinicName}`}>
        {intro?.imageUrl && <img src={intro.imageUrl} alt="" className="mt-2 max-h-96 w-full rounded-[2rem] object-cover shadow-lift" />}
      </PageHeader>

      {intro?.body && (
        <section className="container-page py-14 sm:py-20">
          <Reveal><RichText text={intro.body} className="max-w-3xl text-lg leading-relaxed text-muted" /></Reveal>
        </section>
      )}

      {(mission || vision) && (
        <section className="border-y border-slate-100 bg-slate-50/60 py-16 sm:py-20 dark:bg-surface/40">
          <Stagger className="container-page grid gap-6 md:grid-cols-2">
            {[{ s: mission, icon: Target }, { s: vision, icon: Eye }].filter((x) => x.s).map(({ s, icon: Icon }) => (
              <StaggerItem key={s!.id} className="rounded-3xl border border-slate-200 bg-surface p-8 shadow-soft">
                <Icon className="size-8 text-brand-600 dark:text-brand-300" aria-hidden />
                <h2 className="mt-5 font-display text-2xl font-semibold text-ink">{s!.title}</h2>
                <RichText text={s!.body} className="mt-3 leading-relaxed text-muted" />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      {doctors.length > 0 && (
        <section className="container-page py-16 sm:py-20">
          <Reveal><SectionHeading eyebrow="Our team" title="The practitioners" /></Reveal>
          <Stagger className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => <StaggerItem key={d.id} className="h-full"><DoctorCard doctor={d} /></StaggerItem>)}
          </Stagger>
        </section>
      )}

      {facilities && (
        <section className="container-page py-16 sm:py-20">
          <Reveal><CmsHeading section={facilities} /></Reveal>
          <div className="mt-10"><CmsCards items={facilities.items} columns={3} /></div>
        </section>
      )}

      {equipment && (
        <section className="container-page pb-16 sm:pb-20">
          <Reveal><CmsHeading section={equipment} /></Reveal>
          <div className="mt-10"><CmsCards items={equipment.items} columns={4} /></div>
        </section>
      )}

      <Gallery />
      <CustomSections sections={sections} />
      <Reveal><CtaBand /></Reveal>
    </>
  );
}
