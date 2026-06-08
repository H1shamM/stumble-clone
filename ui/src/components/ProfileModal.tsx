/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileModalProps {
  isOpen: boolean;
  user: any;
  historyCount: number;
  favoritesCount: number;
  onClose: () => void;
  onLogout: () => void;
}

export function ProfileModal({
  isOpen,
  user,
  historyCount,
  favoritesCount,
  onClose,
  onLogout,
}: ProfileModalProps) {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-space-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatar_url} alt={user.display_name} />
            <AvatarFallback>{user.display_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-bold">{user.display_name}</h3>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-space-4 mt-space-4">
          <div className="bg-muted p-space-4 rounded-md">
            <p className="text-sm">Stumbles</p>
            <p className="text-2xl font-bold">{historyCount}</p>
          </div>
          <div className="bg-muted p-space-4 rounded-md">
            <p className="text-sm">Favorites</p>
            <p className="text-2xl font-bold">{favoritesCount}</p>
          </div>
        </div>
        <Button variant="destructive" onClick={onLogout} className="mt-space-4">
          Logout
        </Button>
      </DialogContent>
    </Dialog>
  );
}
