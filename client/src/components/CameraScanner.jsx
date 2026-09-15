import React, { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import BarcodeRenderer from './BarcodeRenderer';
import { Camera, X, ZapOff, CheckCircle2, AlertCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * CameraScanner - Uses the browser's native BarcodeDetector API (Chrome/Edge 88+)
 * with camera stream. Also includes quick sample barcodes for direct testing.
 */
export default function CameraScanner({ isOpen, onClose, onDetected, products = [] }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const detectorRef = useRef(null);

  const [supported, setSupported] = useState(null); // null = checking, true/false
  const [scanning, setScanning] = useState(false);
  const [lastDetected, setLastDetected] = useState(null);
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [showSamples, setShowSamples] = useState(true);

  // Check BarcodeDetector support
  useEffect(() => {
    if (!isOpen) return;
    if ('BarcodeDetector' in window) {
      setSupported(true);
      try {
        detectorRef.current = new window.BarcodeDetector({
          formats: ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'upc_e']
        });
      } catch (e) {
        console.warn('BarcodeDetector initialization error:', e);
      }
    } else {
      setSupported(false);
    }
  }, [isOpen]);

  // Start camera when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const startCamera = async () => {
      try {
        setError('');
        setLastDetected(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          setScanning(true);
          scanLoop();
        }
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access in browser settings.');
        } else {
          setError(`Camera notice: ${err.message}`);
        }
        setScanning(false);
      }
    };

    startCamera();
    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, supported]);

  const scanLoop = () => {
    if (!detectorRef.current || !videoRef.current) return;

    const detect = async () => {
      try {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          const barcodes = await detectorRef.current.detect(videoRef.current);
          if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            handleDetectedCode(code);
            return; // stop loop
          }
        }
        animFrameRef.current = requestAnimationFrame(detect);
      } catch (_) {
        animFrameRef.current = requestAnimationFrame(detect);
      }
    };
    animFrameRef.current = requestAnimationFrame(detect);
  };

  const stopCamera = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const handleDetectedCode = (code) => {
    setLastDetected(code);
    setTimeout(() => {
      onDetected(code);
      stopCamera();
      onClose();
    }, 600);
  };

  const handleClose = () => {
    stopCamera();
    setLastDetected(null);
    setError('');
    setManualCode('');
    onClose();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleDetectedCode(manualCode.trim());
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="📷 Camera Barcode Scanner" maxWidth="560px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Detection success banner */}
        {lastDetected && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            background: 'var(--status-success-bg)', border: '1px solid var(--status-success-border)',
            padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
            animation: 'pulse 0.5s ease-in-out'
          }}>
            <CheckCircle2 size={24} color="var(--status-success)" />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--status-success)', fontSize: '0.9rem' }}>
                Barcode Detected Successfully!
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                {lastDetected}
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
            background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-border)',
            padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)'
          }}>
            <AlertCircle size={18} color="var(--status-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--status-danger)', lineHeight: 1.4 }}>{error}</span>
          </div>
        )}

        {/* Camera Feed or Unsupported Message */}
        {supported === false ? (
          <div style={{
            background: 'var(--status-warning-bg)', border: '1px solid var(--status-warning-border)',
            padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center'
          }}>
            <ZapOff size={32} color="var(--status-warning)" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              BarcodeDetector Not Supported by Browser
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
              Please use Google Chrome or Microsoft Edge for native webcam scanning.<br />
              You can click any product barcode below or enter the code manually!
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#000', aspectRatio: '4/3' }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />

            {/* Scanner Overlay */}
            {scanning && !lastDetected && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                {/* Corner brackets */}
                <div style={{ width: '240px', height: '150px', position: 'relative' }}>
                  {/* TL */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: 28, height: 28, borderTop: '3px solid #22C55E', borderLeft: '3px solid #22C55E', borderRadius: '4px 0 0 0' }} />
                  {/* TR */}
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 28, height: 28, borderTop: '3px solid #22C55E', borderRight: '3px solid #22C55E', borderRadius: '0 4px 0 0' }} />
                  {/* BL */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: 28, height: 28, borderBottom: '3px solid #22C55E', borderLeft: '3px solid #22C55E', borderRadius: '0 0 0 4px' }} />
                  {/* BR */}
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderBottom: '3px solid #22C55E', borderRight: '3px solid #22C55E', borderRadius: '0 0 4px 0' }} />
                  {/* Scan line animation */}
                  <div style={{
                    position: 'absolute', left: 4, right: 4, height: '2px',
                    background: 'linear-gradient(90deg, transparent, #22C55E, transparent)',
                    animation: 'scanLine 2s ease-in-out infinite'
                  }} />
                </div>
              </div>
            )}

            {/* Status Label */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
              padding: '1.5rem 1rem 0.75rem', textAlign: 'center'
            }}>
              <span style={{ color: '#FFF', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                {lastDetected ? '✅ Scanned! Adding to cart...' : scanning ? '📷 Point camera at any product barcode' : 'Starting camera...'}
              </span>
            </div>
          </div>
        )}

        {/* Quick Click-to-Scan Product Barcodes (Great when testing in front of webcam!) */}
        {products && products.length > 0 && (
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem'
          }}>
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => setShowSamples(!showSamples)}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={14} color="var(--accent-gold)" />
                <span>Show / Scan Catalog Barcodes ({products.length} items)</span>
              </div>
              {showSamples ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {showSamples && (
              <div style={{ marginTop: '0.75rem', maxHeight: '170px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  💡 Point another device/paper with these barcodes to the camera, or click <strong>"Scan"</strong> to test:
                </div>
                {products.slice(0, 8).map(p => (
                  <div 
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-surface)',
                      padding: '0.4rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                        ₹{Number(p.price).toFixed(2)}
                      </div>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      <BarcodeRenderer value={p.barcode_isbn} width={100} height={20} showText={false} />
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      style={{ flexShrink: 0, padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                      onClick={() => handleDetectedCode(p.barcode_isbn)}
                    >
                      Scan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual Code Fallback */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Or enter barcode manually:
          </div>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Barcode / ISBN number"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn btn-primary" disabled={!manualCode.trim()}>
              Use Code
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 4px; opacity: 1; }
          50% { top: calc(100% - 6px); opacity: 0.8; }
          100% { top: 4px; opacity: 1; }
        }
      `}</style>
    </Modal>
  );
}
