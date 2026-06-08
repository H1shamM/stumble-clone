/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AuthModalProps {
  isOpen: boolean;
  email: string;
  password: any;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogin: () => void;
  onRegister: () => void;
  onClose: () => void;
  apiBase: string;
}

export function AuthModal({
  isOpen,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onRegister,
  onClose,
}: AuthModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Authentication</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-space-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={onEmailChange}
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={onPasswordChange}
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-space-2">
            <Button onClick={onLogin}>Login</Button>
            <Button variant="secondary" onClick={onRegister}>
              Register
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
