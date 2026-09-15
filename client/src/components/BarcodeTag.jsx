import React, { useState } from 'react';
import { Barcode, Check, Copy } from 'lucide-react';

export default function BarcodeTag({ code, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span 
      className="barcode-tag" 
      onClick={handleCopy}
      title="Click to copy Barcode / ISBN"
      style={{ cursor: 'pointer' }}
    >
      <Barcode size={14} />
      <span>{code}</span>
      {copied ? <Check size={12} color="var(--status-success)" /> : <Copy size={11} />}
    </span>
  );
}
