import type { ComponentType } from 'react';
import {
  Activity,
  Anchor,
  Award,
  Baby,
  CalendarCheck,
  ClipboardList,
  Crown,
  Droplets,
  Flower2,
  HeartHandshake,
  HeartPulse,
  Leaf,
  Microscope,
  Moon,
  ScanLine,
  Scissors,
  ShieldCheck,
  Smile,
  Sparkles,
  Stethoscope,
  Sun,
  Syringe,
  Users,
} from 'lucide-react';
import { TbDental, TbDentalBroken, TbGenderFemale, TbMoodSmileBeam } from 'react-icons/tb';

type IconComponent = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

/** Icon keys available to admins for sections, specialties and services. */
export const ICONS: Record<string, { icon: IconComponent; label: string }> = {
  tooth: { icon: TbDental, label: 'Tooth / dentistry' },
  toothbroken: { icon: TbDentalBroken, label: 'Damaged tooth / root canal' },
  dentures: { icon: TbMoodSmileBeam, label: 'Full smile / dentures' },
  stethoscope: { icon: Stethoscope, label: 'Stethoscope / consultation' },
  sparkles: { icon: Sparkles, label: 'Sparkles / cleaning' },
  activity: { icon: Activity, label: 'Activity' },
  anchor: { icon: Anchor, label: 'Anchor / implant' },
  sun: { icon: Sun, label: 'Sun / whitening' },
  smile: { icon: Smile, label: 'Smile / braces' },
  scissors: { icon: Scissors, label: 'Scissors / surgery' },
  crown: { icon: Crown, label: 'Crown' },
  baby: { icon: Baby, label: 'Children' },
  xray: { icon: ScanLine, label: 'X-ray / scan' },
  syringe: { icon: Syringe, label: 'Syringe / anaesthesia' },
  leaf: { icon: Leaf, label: 'Leaf / herbal' },
  flower: { icon: Flower2, label: 'Flower / women’s health' },
  female: { icon: TbGenderFemale, label: 'Women only' },
  moon: { icon: Moon, label: 'Evening' },
  droplets: { icon: Droplets, label: 'Droplets / cupping' },
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
  const Icon = (name && ICONS[name]?.icon) || TbDental;
  return <Icon className={className} aria-hidden />;
}
