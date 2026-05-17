import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, Camera, CameraOff, Search, Box, ArrowRight, AlertTriangle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../../api';

const Scanner = () => {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [asset, setAsset] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const lookupAsset = useCallback(async (code) => {
    if (!code?.trim()) return;
    const clean = code.trim().toUpperCase();
    setScannedCode(clean);
    setLoading(true);
    setAsset(null);
    setNotFound(false);

    // Search by ID
    const res = await api.get(`/api/assets?search=${encodeURIComponent(clean)}&limit=5`);
    if (res?.ok) {
      const data = await res.json();
      const list = data.data || data;
      // Try exact match first
      const exact = list.find(a => a.id?.toUpperCase() === clean || a.serial?.toUpperCase() === clean);
      if (exact) {
        setAsset(exact);
      } else if (list.length > 0) {
        setAsset(list[0]);
      } else {
        setNotFound(true);
      }
    } else {
      setNotFound(true);
    }
    setLoading(false);
  }, []);

  const startScanner = async () => {
    setCameraError('');
    try {
      const html5Qr = new Html5Qrcode('scanner-region');
      html5QrRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        (decodedText) => {
          // On success
          stopScanner();
          lookupAsset(decodedText);
        },
        () => {} // ignore errors during scanning
      );
      setScanning(true);
    } catch (err) {
      setCameraError(err?.message || 'No se pudo acceder a la camara. Verifica los permisos.');
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrRef.current?.isScanning) {
        await html5QrRef.current.stop();
      }
    } catch {}
    setScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      lookupAsset(manualCode);
      setManualCode('');
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Header */}
      <div style={{ width: '100%', maxWidth: '560px', marginBottom: '28px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <ScanLine className="text-accent" size={28} /> Escaner de Activos
        </h1>
        <p className="text-muted" style={{ fontSize: '0.88rem' }}>
          Escanea un codigo QR o de barras para acceder a la ficha del activo.
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Scanner area */}
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
          <div
            id="scanner-region"
            ref={scannerRef}
            style={{
              width: '100%',
              maxWidth: '360px',
              margin: '0 auto',
              borderRadius: '12px',
              overflow: 'hidden',
              background: scanning ? '#000' : 'var(--bg-primary)',
              minHeight: scanning ? '300px' : '0',
              display: scanning ? 'block' : 'none',
            }}
          />

          {!scanning && !scannedCode && (
            <div style={{ padding: '40px 20px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '20px',
                background: 'rgba(37,99,235,0.08)', margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ScanLine size={36} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <p className="text-muted" style={{ marginBottom: '20px', fontSize: '0.9rem' }}>
                Apunta la camara al codigo del activo
              </p>
            </div>
          )}

          {cameraError && (
            <div style={{ padding: '16px', background: 'rgba(220,38,38,0.06)', borderRadius: '10px', margin: '12px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>{cameraError}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: scanning ? '16px' : '0' }}>
            {!scanning ? (
              <button className="btn-primary" onClick={startScanner} style={{ padding: '12px 28px', fontSize: '0.9rem' }}>
                <Camera size={18} /> Iniciar Camara
              </button>
            ) : (
              <button className="btn-secondary" onClick={stopScanner} style={{ padding: '10px 24px', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                <CameraOff size={16} /> Detener
              </button>
            )}
          </div>
        </div>

        {/* Manual search */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Busqueda manual
          </p>
          <form onSubmit={handleManualSearch} style={{ display: 'flex', gap: '10px' }}>
            <div className="input-control" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, cursor: 'text' }}>
              <Search size={15} className="text-muted" />
              <input
                type="text"
                placeholder="Ej: ACT-001 o numero de serie..."
                style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '0.9rem' }}
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
              />
            </div>
            <button className="btn-primary" type="submit" disabled={!manualCode.trim()} style={{ padding: '10px 20px' }}>
              Buscar
            </button>
          </form>
        </div>

        {/* Result */}
        {loading && (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
            <p className="text-muted">Buscando activo...</p>
          </div>
        )}

        {notFound && !loading && (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: 'rgba(220,38,38,0.08)', margin: '0 auto 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={26} style={{ color: 'var(--danger)' }} />
            </div>
            <h3 style={{ fontSize: '1rem', marginBottom: '6px' }}>Activo no encontrado</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              No se encontro un activo con el codigo <strong style={{ fontFamily: 'monospace' }}>{scannedCode}</strong>
            </p>
          </div>
        )}

        {asset && !loading && (
          <div
            className="glass-panel"
            style={{ padding: '24px', cursor: 'pointer', border: '1px solid var(--glass-border)', transition: 'all 0.2s' }}
            onClick={() => navigate(`/inventory/view/${asset.id}`)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: 'rgba(34,197,94,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Box size={24} style={{ color: '#15803d' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600, background: 'rgba(37,99,235,0.08)', padding: '2px 8px', borderRadius: '6px' }}>
                    {asset.id}
                  </span>
                  {asset.estado && (
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                      background: asset.estado === 'DISPONIBLE' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                      color: asset.estado === 'DISPONIBLE' ? '#15803d' : '#a16207',
                    }}>
                      {asset.estado}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '2px' }}>{asset.nombre || asset.name || 'Sin nombre'}</h3>
                {(asset.ubicacion || asset.categoria) && (
                  <p className="text-muted" style={{ fontSize: '0.82rem' }}>
                    {[asset.categoria, asset.ubicacion].filter(Boolean).join(' — ')}
                  </p>
                )}
              </div>
              <ArrowRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
