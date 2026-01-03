"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCustomer } from "../actions";
import { toast } from "sonner";

interface DeleteCustomerDialogProps {
  customerId: string;
}

export function DeleteCustomerDialog({
  customerId,
}: DeleteCustomerDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    // On crée un FormData pour l'action serveur
    const formData = new FormData();
    formData.append("id", customerId);

    const res = await deleteCustomer(formData);

    // Note: Si l'action réussit, le 'redirect' du serveur prendra le relais
    // Si on arrive ici, c'est qu'il y a eu une erreur
    if (res?.error) {
      setIsDeleting(false);
      toast.error(res.error);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="link" type="button" disabled={isDeleting}>
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer le client
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Cela supprimera définitivement le
            client et ses données associées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="bg-black text-white hover:bg-gray-800"
            disabled={isDeleting}
          >
            {isDeleting ? "Suppression..." : "Confirmer la suppression"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
