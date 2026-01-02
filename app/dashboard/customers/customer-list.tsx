import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, Phone, MapPin } from "lucide-react";

export function CustomerList({ customers }: { customers: any[] }) {
  if (customers.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Aucun client pour le moment.
      </div>
    );
  }

  return (
    <>
      {/* VUE MOBILE : Cartes */}
      <div className="grid gap-4 md:hidden">
        {customers.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">{c.name}</h3>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {c.email}
                  </div>
                )}
                {c.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> {c.phone}
                  </div>
                )}
                {c.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />{" "}
                    <span className="truncate max-w-[200px]">{c.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* VUE DESKTOP : Tableau */}
      <div className="hidden md:block border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Adresse</TableHead>
              <TableHead>Code postal</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Pays</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.email || "-"}</TableCell>
                <TableCell>{c.phone || "-"}</TableCell>
                <TableCell className="truncate max-w-[200px]">
                  {c.address || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
