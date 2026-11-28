import { motion } from 'motion/react';
import { FaWhatsapp } from 'react-icons/fa6';
import { useClinic } from '../../hooks/usePublicData';
import { whatsappHref } from '../../utils/format';
import { cn } from '../../utils/cn';

export function WhatsAppIcon({ className }: { className?: string }) {
  return <FaWhatsapp className={className} aria-hidden />;
}

/** Floating WhatsApp contact button (only rendered when a WhatsApp number is configured). */
export function WhatsAppFloatingButton() {
  const { clinic } = useClinic();
  if (!clinic.whatsappNumber) return null;
  return (
    <motion.a
      href={whatsappHref(clinic.whatsappNumber, `Hello ${clinic.clinicName}, I would like to ask about an appointment.`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with the clinic on WhatsApp"
      initial={{ scale: 0, opacity: 0, rotate: -30 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 1.2 }}
      className={cn(
        'fixed right-4 bottom-4 z-30 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white',
        'shadow-lift hover:bg-[#1ebe5b] sm:right-6 sm:bottom-6',
      )}
    >
      <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-25 [animation-duration:2.5s]" />
      <WhatsAppIcon className="relative size-7" />
    </motion.a>
  );
}
