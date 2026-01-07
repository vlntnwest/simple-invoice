"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2, ShieldCheck, User } from "lucide-react";
import { removeTeamMember } from "@/app/actions/team";
import { toast } from "sonner";

export function TeamList({
  members,
  currentUserId,
}: {
  members: any[];
  currentUserId: string;
}) {
  const handleRemove = async (userId: string) => {
    if (confirm("Voulez-vous vraiment retirer cet utilisateur ?")) {
      await removeTeamMember(userId);
      toast.success("Utilisateur retiré");
    }
  };

  return (
    <div className="space-y-4">
      {members.map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between p-4 border rounded-lg bg-card"
        >
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback>
                {m.user.email?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {m.user.email}
                {m.userId === currentUserId && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Vous)
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {m.role === "ADMIN" ? (
                  <ShieldCheck className="h-3 w-3 text-primary" />
                ) : (
                  <User className="h-3 w-3" />
                )}
                {m.role}
              </div>
            </div>
          </div>

          {/* On ne peut pas se supprimer soi-même via ce bouton simple */}
          {m.userId !== currentUserId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(m.user.id)}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
