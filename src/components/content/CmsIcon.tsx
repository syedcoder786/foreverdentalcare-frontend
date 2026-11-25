import {
  Activity,
  Anchor,
  Award,
  CalendarCheck,
  ClipboardList,
  Crown,
  Droplets,
  Flower2,
  HeartHandshake,
  HeartPulse,
  Leaf,
  Microscope,
  Scissors,
  ShieldCheck,
  Smile,
  Sparkles,
  Stethoscope,
  Sun,
  Users,
  type LucideIcon,
} from 'lucide-react';

/** Icon keys available to admins for sections, specialties and services. */
export const ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  stethoscope: { icon: Stethoscope, label: 'Stethoscope / consultation' },
  sparkles: { icon: Sparkles, label: 'Sparkles / cleaning' },
  activity: { icon: Activity, label: 'Activity' },
  anchor: { icon: Anchor, label: 'Anchor / implant' },
  sun: { icon: Sun, label: 'Sun / whitening' },
  smile: { icon: Smile, label: 'Smile' },
  scissors: { icon: Scissors, label: 'Scissors / surgery' },
  crown: { icon: Crown, label: 'Crown' },
  leaf: { icon: Leaf, label: 'Leaf / herbal' },
  flower: { icon: Flower2, label: 'Flower / women’s health' },
  droplets: { icon: Droplets, label: 'Droplets' },
  heartpulse: { icon: HeartPulse, label: 'Heart pulse' },
  shield: { icon: ShieldCheck, label: 'Shield / safety' },
  clipboard: { icon: ClipboardList, label: 'Clipboard / plans' },
  heart: { icon: HeartHandshake, label: 'Care' },
  users: { icon: Users, label: 'Family' },
  calendar: { icon: CalendarCheck, label: 'Calendar' },
  microscope: { icon: Microscope, label: 'Equipment' },
  award: { icon: Award, label: 'Award' },
};

export function CmsIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && ICONS[name]?.icon) || Stethoscope;
  return <Icon className={className} aria-hidden />;
}
