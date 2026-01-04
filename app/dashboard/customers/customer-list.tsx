"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { ChevronRight } from "lucide-react";
import { CustomerDetails } from "./customer-details";

export function CustomerList({ customers }: { customers: any[] }) {
  // Gestion de l'état local pour le panneau latéral
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleCustomerClick = (customer: any) => {
    setSelectedCustomer(customer);
    setIsSheetOpen(true);
  };

  if (customers.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Aucun client pour le moment.
      </div>
    );
  }

  return (
    <>
      {/* VUE MOBILE/DESKTOP : Liste Clickable */}
      <ul className="flex flex-col border rounded-2xl bg-card overflow-hidden">
        {customers.map((c, index) => {
          // Déterminer le nom à afficher
          const displayName = c.companyName || `${c.firstName} ${c.lastName}`;

          return (
            <li key={c.id}>
              <button
                onClick={() => handleCustomerClick(c)}
                className="w-full px-4 py-4 text-left justify-start hover:bg-muted/50 transition-all focus:outline-none focus:bg-muted cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {displayName}
                    </h3>
                    {c.email && (
                      <p className="text-muted-foreground text-xs truncate">
                        {c.email}
                      </p>
                    )}
                  </div>

                  <div className="ml-1 text-muted-foreground">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </button>

              {index < customers.length - 1 && (
                <div className="px-4">
                  <Separator />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* LE PANNEAU LATÉRAL (Sheet) */}
      <CustomerDetails
        customer={selectedCustomer}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  );
}
