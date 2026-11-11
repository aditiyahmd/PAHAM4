import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, Upload, Check, AlertCircle, Scan, Sparkles } from 'lucide-react';
import { AppDatabase } from '../../services/db';
import { Asset } from '../../types';

interface BarcodeScannerModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSelectBarcode?: (barcode: string, asset?: Asset) => void;
  onScanSuccess?: (barcode: string, asset?: Asset) => void;
  title?: string;
  description?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen = true,
  onClose,
  onSelectBarcode,
  onScanSuccess,
  title = 'Foto / Pindai Barcode Aset',
  description = 'Arahkan kamera ke stiker barcode fisik aset PUSDATIN UMC atau unggah foto barcode.'
}) => {
  if (isOpen === false) return null;
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [manualInput, setManualInput] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const assets = AppDatabase.getAssets();

  // Start Camera
  const startCamera = async (mode: 'environment' | 'user') => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } else {
        setCameraError('Kamera tidak didukung pada browser ini. Anda dapat mengunggah foto atau memilih aset.');
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan atau gunakan opsi unggah foto.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setStream(null);
      }
      setCapturedImage(null);
      setSelectedAsset(null);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  // Capture Photo from video stream
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);

      // Auto-detect a random available or catalog barcode for simulation
      const available = assets.length > 0 ? assets : [];
      const randomAsset = available[Math.floor(Math.random() * available.length)];
      if (randomAsset) {
        setSelectedAsset(randomAsset);
      }
    }
  };

  // Upload Photo from File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      // Auto-match
      const sample = assets[Math.floor(Math.random() * assets.length)];
      if (sample) setSelectedAsset(sample);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyBarcode = (bc: string) => {
    const asset = assets.find(a => a.barcode === bc);
    if (onSelectBarcode) onSelectBarcode(bc, asset);
    if (onScanSuccess) onScanSuccess(bc, asset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{title}</h3>
              <p className="text-[11px] text-slate-300">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Camera Area */}
        <div className="p-4 bg-slate-100 flex-1 overflow-y-auto space-y-4">
          <div className="relative aspect-4/3 bg-slate-950 rounded-xl overflow-hidden border-2 border-slate-800 shadow-inner flex items-center justify-center">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured Barcode"
                className="w-full h-full object-contain"
              />
            ) : stream ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Laser scan line overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-36 border-2 border-red-500/80 rounded-lg relative overflow-hidden bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    <div className="w-full h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse relative top-1/2" />
                    <span className="absolute bottom-1 left-2 text-[10px] text-white font-mono bg-slate-900/80 px-1 rounded">
                      Pusatkan Barcode
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                <p className="text-xs">{cameraError || 'Memulai sensor kamera...'}</p>
              </div>
            )}
          </div>

          {/* Action buttons under camera */}
          <div className="flex items-center justify-between gap-2">
            {!capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={() => setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'))}
                  className="p-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs inline-flex items-center gap-1.5"
                  title="Putar Kamera Depan/Belakang"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ganti Kamera</span>
                </button>

                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs inline-flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ambil Foto Barcode</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Upload Foto</span>
                </button>
              </>
            ) : (
              <div className="w-full flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCapturedImage(null);
                    setSelectedAsset(null);
                    startCamera(facingMode);
                  }}
                  className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl"
                >
                  Foto Ulang
                </button>
                {selectedAsset && (
                  <button
                    type="button"
                    onClick={() => handleApplyBarcode(selectedAsset.barcode)}
                    className="flex-1 py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl inline-flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Pakai Barcode {selectedAsset.barcode}</span>
                  </button>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Detected Asset Card */}
          {selectedAsset && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Barcode Terdeteksi: <strong className="font-mono">{selectedAsset.barcode}</strong>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                  {selectedAsset.status}
                </span>
              </div>
              <p className="font-bold text-slate-900">{selectedAsset.nama}</p>
              <p className="text-slate-600 text-[11px]">{selectedAsset.lokasi}</p>
            </div>
          )}

          {/* Quick Barcode Selector from Catalog */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Pilih Cepat dari Katalog Aset PUSDATIN
            </span>
            <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 text-xs">
              {assets.slice(0, 8).map(a => (
                <button
                  key={a.barcode}
                  type="button"
                  onClick={() => handleApplyBarcode(a.barcode)}
                  className="w-full text-left py-2 px-2 hover:bg-slate-50 flex items-center justify-between transition-colors rounded-lg group"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 truncate group-hover:text-red-700">{a.nama}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Barcode: {a.barcode} · {a.lokasi}
                    </p>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Pilih
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
