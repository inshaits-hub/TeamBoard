import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LogOut } from "lucide-react";

interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  userName?: string;
}

export function SignOutDialog({
  open,
  onOpenChange,
  onConfirm,
  userName,
}: SignOutDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-sm rounded-3xl border-border/50 bg-app-card shadow-2xl">
        <AlertDialogHeader className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 shadow-md">
            <LogOut className="h-7 w-7 text-destructive" />
          </div>

          <AlertDialogTitle className="text-center text-3xl font-bold text-app-card-foreground">
            Sign Out
          </AlertDialogTitle>

          <AlertDialogDescription className="text-center text-base leading-7 text-muted-foreground">
            {userName ? (
              <>
                Are you sure you want to sign out,{" "}
                <span className="font-semibold text-app-card-foreground">
                  {userName}
                </span>
                ?
              </>
            ) : (
              "Are you sure you want to sign out?"
            )}

            <br />

            <span className="text-sm text-muted-foreground/70">
              You'll need to sign in again to access your tasks.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 flex-row gap-3 sm:justify-center">
          <AlertDialogCancel className="flex-1 rounded-xl sm:flex-none">
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-destructive text-destructive-foreground font-semibold shadow-md transition-all hover:bg-destructive/90 sm:flex-none"
          >
            Sign Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
