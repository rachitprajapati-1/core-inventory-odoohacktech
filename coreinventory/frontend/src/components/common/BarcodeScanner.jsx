import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { X, Camera, ZoomIn } from 'lucide-react';

export default function BarcodeScanner({ onResult, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;
    setScanning(true);

    codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
      if (result) {
        setScanning(false);
        codeReader.reset();
        onResult(result.getText());
      }
      if (err && !err.message?.includes('NotFoundException')) {
        setError('Camera access denied. Use manual entry below.');
        setScanning(false);
      }
    }).catch(() => {
      setError('Camera not available. Use manual entry below.');
      setScanning(false);
    });

    return () => { codeReader.reset(); };
  }, [onResult]);

  const handleManual = (e) => {
    e.preventDefault();
    if (manualCode.trim()) onResult(manualCode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-2xl w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-primary-400" />
            <h3 className="font-semibold text-white text-sm">Scan Barcode</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Camera viewfinder */}
          <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3]">
            <video ref={videoRef} className="w-full h-full object-cover" />
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-primary-500 rounded-lg w-48 h-32 relative">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-500 animate-bounce" style={{ animationDuration: '1.5s' }} />
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary-400 rounded-tl" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary-400 rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary-400 rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary-400 rounded-br" />
                </div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-red-400 text-xs text-center px-4">{error}</p>
              </div>
            )}
          </div>

          <p className="text-slate-500 text-xs text-center">Point camera at barcode or QR code</p>

          {/* Manual entry fallback */}
          <div className="border-t border-surface-border pt-3">
            <p className="text-slate-500 text-xs mb-2 text-center">Or enter code manually</p>
            <form onSubmit={handleManual} className="flex gap-2">
              <input
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="SKU or barcode..."
                className="input text-sm flex-1"
              />
              <button type="submit" className="btn-primary px-3">
                <ZoomIn size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
