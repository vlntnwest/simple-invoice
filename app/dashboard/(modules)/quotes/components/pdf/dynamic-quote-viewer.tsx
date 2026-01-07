"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const QuoteViewer = dynamic(
  () => import("./quote-viewer").then((mod) => mod.QuoteViewer),
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

export function DynamicQuoteViewer({ url }: Props) {
  return <QuoteViewer url={url} />;
}
