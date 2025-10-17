import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import { copyToClipboard } from '../utils/share';

const ShareDialog = ({ isOpen, onClose, url, title = 'Share Profile' }) => {
  const qrRef = useRef(null);
  const [copyOk, setCopyOk] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    setCopyOk(ok);
    setTimeout(() => setCopyOk(false), 2000);
  };

  const handleDownloadQR = async () => {
    try {
      const node = qrRef.current;
      if (!node) return;
      const canvas = await html2canvas(node);
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'irtzalink-profile-qr.png';
      a.click();
    } catch (e) {
      console.error('QR download failed', e);
    }
  };

  const waLink = `https://wa.me/?text=${encodeURIComponent('Check out my IrtzaLink profile: ' + url)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
        </div>

        {/* Link box */}
        <div className="flex items-center gap-2 mb-4">
          <input value={url} readOnly className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm" />
          <button onClick={handleCopy} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm">
            {copyOk ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* QR */}
        <div className="flex items-center justify-center mb-4">
          <div ref={qrRef} className="bg-white p-3 rounded-xl">
            <QRCode value={url} size={140} />
          </div>
        </div>
        <div className="flex gap-2 justify-center mb-4">
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm">WhatsApp</a>
          <button onClick={handleDownloadQR} className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm">Download QR</button>
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">If native share isn’t available in your browser, copy the link or share the QR code.</p>
      </div>
    </div>
  );
};

export default ShareDialog;
