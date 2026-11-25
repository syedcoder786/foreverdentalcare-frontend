import { useId, useRef } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useUploadImage } from '../../hooks/useAdminData';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/cn';

interface ImageUploadProps {
  label: string;
  value?: string | null;
  onChange: (url: string) => void;
  hint?: string;
  aspect?: 'square' | 'wide' | 'portrait';
  error?: string;
}

const ASPECTS = { square: 'aspect-square', wide: 'aspect-[16/9]', portrait: 'aspect-[4/5]' };

/** Uploads an image to the backend storage and returns its public URL. JPEG/PNG/WebP/GIF, max 5 MB. */
export function ImageUpload({ label, value, onChange, hint, aspect = 'wide', error }: ImageUploadProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadImage();

  const onFile = async (file?: File) => {
    if (!file) return;
    upload.reset();
    try {
      const result = await upload.mutateAsync(file);
      onChange(result.url);
    } catch {
      /* error shown below */
    } finally {
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
      <div className={cn('group relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-brand-300', ASPECTS[aspect], 'max-h-64')}>
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-sm text-slate-500">
            <ImagePlus className="size-7 text-slate-400" aria-hidden />
            Click to upload an image
          </div>
        )}
        <input
          ref={input}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => onFile(e.target.files?.[0])}
          aria-describedby={`${id}-hint`}
        />
        {upload.isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/70">
            <Loader2 className="size-6 animate-spin text-brand-600" aria-label="Uploading" />
          </div>
        )}
        {value && !upload.isPending && (
          <button type="button" onClick={() => onChange('')} className="absolute top-2 right-2 rounded-full bg-black/60 p-2 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100" aria-label="Remove image">
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
      <p id={`${id}-hint`} className="text-xs text-slate-500">{hint ?? 'JPEG, PNG, WebP or GIF, up to 5 MB.'}</p>
      {(upload.isError || error) && <p role="alert" className="text-sm text-red-600">{upload.isError ? getErrorMessage(upload.error) : error}</p>}
    </div>
  );
}
