"use client";

import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";
import { PDFPagination } from "@/components/pagination";

// Configuration Worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface QuoteViewerProps {
  url: string;
}

export function QuoteViewer({ url }: QuoteViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isPdfReady, setIsPdfReady] = useState(false);

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
    setPageNumber(1);
    setIsPdfReady(true);
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center w-full h-full pt-4 overflow-auto"
    >
      {!isPdfReady && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      )}
      {/* Zone PDF */}
      <div className="relative shadow-xl transition-all duration-200 ease-out origin-top rounded-md overflow-hidden">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={null}
          error={
            <div className="p-8 bg-white text-base font-medium">
              Erreur de chargement du PDF
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            width={containerWidth || undefined}
            scale={1}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            canvasBackground="white"
            className="bg-white"
          />
        </Document>
      </div>
      {isPdfReady && numPages && numPages > 1 && (
        <div className="py-4 w-full bg-background border-t z-10">
          <PDFPagination
            currentPage={pageNumber}
            totalPages={numPages}
            onPageChange={setPageNumber}
          />
        </div>
      )}
    </div>
  );
}
