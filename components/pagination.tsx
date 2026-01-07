"use client";

import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils"; // Utilitaire standard shadcn pour fusionner les classes

interface PDFPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PDFPagination({
  currentPage,
  totalPages,
  onPageChange,
}: PDFPaginationProps) {
  const [jumpPage, setJumpPage] = useState<string>("");

  const handlePageChange = (newPage: number) => {
    // Pas besoin d'event ici car on utilise des boutons
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(jumpPage);
    if (page && page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpPage("");
    }
  };

  return (
    <Pagination>
      <PaginationContent>
        {/* Précédent */}
        <PaginationItem>
          <Button
            variant="outline" // Remplace la classe "border bg-background..."
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-10 w-10" // Taille standard pagination shadcn
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </PaginationItem>

        {/* Page 1 */}
        {currentPage > 2 && (
          <PaginationItem className="hidden sm:block">
            <Button
              variant="link" // Remplace "underline hover:bg-transparent..."
              onClick={() => handlePageChange(1)}
              className="h-10 w-10"
            >
              1
            </Button>
          </PaginationItem>
        )}

        {/* Ellipsis début (...) */}
        {currentPage > 3 && (
          <PaginationItem>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <PaginationEllipsis />
                  <span className="sr-only">Plus de pages</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-3">
                <form onSubmit={handleJump} className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpPage}
                    onChange={(e) => setJumpPage(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Page..."
                  />
                  <Button type="submit" size="sm" className="h-8 px-2">
                    Go
                  </Button>
                </form>
              </PopoverContent>
            </Popover>
          </PaginationItem>
        )}

        {/* Page Précédente (n-1) */}
        {currentPage > 1 && (
          <PaginationItem>
            <Button
              variant="link"
              onClick={() => handlePageChange(currentPage - 1)}
              className="h-10 w-10"
            >
              {currentPage - 1}
            </Button>
          </PaginationItem>
        )}

        {/* Page Courante (Active) */}
        <PaginationItem>
          <Button
            variant="default" // Utilise le style primaire (noir par défaut)
            className={cn(
              "h-10 w-10 pointer-events-none",
              "bg-black text-white hover:bg-black/90" // Ton style custom forcé
            )}
          >
            {currentPage}
          </Button>
        </PaginationItem>

        {/* Page Suivante (n+1) */}
        {currentPage < totalPages && (
          <PaginationItem>
            <Button
              variant="link"
              onClick={() => handlePageChange(currentPage + 1)}
              className="h-10 w-10"
            >
              {currentPage + 1}
            </Button>
          </PaginationItem>
        )}

        {/* Ellipsis fin (...) */}
        {currentPage < totalPages - 2 && (
          <PaginationItem>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <PaginationEllipsis />
                  <span className="sr-only">Plus de pages</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-3">
                <form onSubmit={handleJump} className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpPage}
                    onChange={(e) => setJumpPage(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Page..."
                  />
                  <Button type="submit" size="sm" className="h-8 px-2">
                    Go
                  </Button>
                </form>
              </PopoverContent>
            </Popover>
          </PaginationItem>
        )}

        {/* Dernière page */}
        {currentPage < totalPages - 1 && (
          <PaginationItem className="hidden sm:block">
            <Button
              variant="link"
              onClick={() => handlePageChange(totalPages)}
              className="h-10 w-10"
            >
              {totalPages}
            </Button>
          </PaginationItem>
        )}

        {/* Suivant */}
        <PaginationItem>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-10 w-10"
            aria-label="Page suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
