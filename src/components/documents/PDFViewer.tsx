import { Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import type { Document } from '@/types/documents';
import SignatureOverlay from './SignatureOverlay';

interface SignatureField {
  id: string
  x: number
  y: number
  width: number
  height: number
  signedBy?: string
  signatureData?: string
  required: boolean
}

interface PDFViewerProps {
  url: string
  document?: Document
  showSignatures?: boolean
  isEditingSignatures?: boolean
  onSignatureFieldsChange?: (fields: SignatureField[]) => void
  onSign?: (fieldId: string, signatureData: string) => void
  className?: string
}

export default function PDFViewer({ 
  url, 
  document,
  showSignatures = false,
  isEditingSignatures = false,
  onSignatureFieldsChange,
  onSign,
  className = '' 
}: PDFViewerProps) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  
  return (
    <div className={`relative ${className}`}>
      <Viewer
        fileUrl={url}
        plugins={[defaultLayoutPluginInstance]}
      />
      
      {/* Signature Overlay Integration */}
      {showSignatures && document && (
        <SignatureOverlay
          document={document}
          isEditing={isEditingSignatures}
          onFieldsChange={onSignatureFieldsChange}
          onSign={onSign}
          className="absolute inset-0"
        />
      )}
    </div>
  );
}