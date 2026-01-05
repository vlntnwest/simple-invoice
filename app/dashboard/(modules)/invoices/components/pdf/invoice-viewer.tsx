"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Loader2, ZoomIn, ZoomOut, Minimize } from "lucide-react";

// Configuration Worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface InvoiceViewerProps {
  url: string;
}

export function InvoiceViewer({ url }: InvoiceViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);

  // scale = 1 correspond maintenant à "largeur du conteneur" (Fit Width)
  const [scale, setScale] = useState<number>(1.0);

  // On stocke la largeur du conteneur
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- 1. ResizeObserver pour mesurer la div parente en temps réel ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const newWidth = entries[0].contentRect.width;
      if (newWidth) {
        // On retire un peu de padding (ex: 32px ou 64px) pour ne pas coller aux bords
        // Sinon la scrollbar horizontale peut apparaitre
        setContainerWidth(newWidth - 48);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Fonction pour remettre à "Fit Width"
  const handleFitWidth = () => setScale(1.0);

  return (
    // On ajoute la ref sur ce conteneur principal
    <div
      ref={containerRef}
      className="flex flex-col items-center w-full h-full pt-4 overflow-auto"
    >
      {/* Zone PDF */}
      <div className="relative shadow-xl transition-all duration-200 ease-out origin-top">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-[600px] w-full bg-white rounded-sm">
              <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
          }
          error={
            <div className="text-red-500 p-8 bg-white text-sm rounded-sm">
              Erreur de chargement du PDF
            </div>
          }
        >
          {/* --- LA MAGIE EST ICI --- 
                1. width={containerWidth} : Force le PDF à prendre la largeur mesurée
                2. scale={scale} : Agit comme un multiplicateur. 
                   Si width est défini : scale={1} = 100% du container. scale={1.2} = 120% du container.
            */}
          <Page
            pageNumber={1}
            width={containerWidth || undefined}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            canvasBackground="white"
            className="bg-white"
          />
        </Document>
      </div>

      <div className="mt-6 text-xs text-slate-400 font-medium">
        Page 1 sur {numPages}
      </div>
    </div>
  );
}
