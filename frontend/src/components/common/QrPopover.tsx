import { useEffect, useRef, useState } from 'react';
import { QrCode, X, Maximize2, Minimize2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import logoSvg from '../../assets/logo.svg';

interface QrPopoverProps {
  url: string;
}

function QrOverlay({ url, onClose }: { url: string; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [onClose]);

  const qrSize = expanded ? 450 : 200;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-near-black/40" onClick={onClose} />
      <div
        ref={overlayRef}
        className={`relative bg-white rounded-lg shadow-xl p-6 w-full mx-4 transition-all duration-200 ${expanded ? 'max-w-lg' : 'max-w-xs'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <img src={logoSvg} alt="Quizify" className="h-6 w-6 scale-125" />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-full hover:bg-chip-gray text-body-gray"
              title={expanded ? 'Minimize' : 'Expand'}
            >
              {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-chip-gray text-body-gray"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex justify-center">
          <QRCodeSVG
            value={url}
            size={qrSize}
            level="M"
            marginSize={4}
          />
        </div>
        <p className="mt-4 text-xs text-body-gray break-all text-center">{url}</p>
      </div>
    </div>
  );
}

export function QrPopover({ url }: QrPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pill-icon"
        title="Show QR code"
      >
        <QrCode className="w-4 h-4" />
      </button>

      {open && <QrOverlay url={url} onClose={() => setOpen(false)} />}
    </>
  );
}

export { QrOverlay };
