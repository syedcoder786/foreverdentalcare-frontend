import { motion } from 'motion/react';
import { useClinic } from '../../hooks/usePublicData';
import { whatsappHref } from '../../utils/format';
import { cn } from '../../utils/cn';

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.85 9.85 0 0 0 12.04 2zm0 18.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
    </svg>
  );
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
