"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const InvoiceViewer = dynamic(
  () => import("./invoice-viewer").then((mod) => mod.InvoiceViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    ),
  }
);

interface Props {
  url: string;
}

export function DynamicInvoiceViewer({ url }: Props) {
  return <InvoiceViewer url={url} />;
}
