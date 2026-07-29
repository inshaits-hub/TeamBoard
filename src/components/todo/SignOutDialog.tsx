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
      <AlertDialogContent
        className="
          sm:max-w-sm
          rounded-3xl
          border border-[#C6C7A5]
          bg-[#F8F3E6]
          shadow-2xl
          backdrop-blur-xl
        "
      >
        <AlertDialogHeader className="space-y-4">
          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#C6C7A5] shadow-md">
            <LogOut className="h-7 w-7 text-[#465E20]" />
          </div>

          {/* Title */}
          <AlertDialogTitle className="text-center text-3xl font-bold text-[#465E20]">
            Sign Out
          </AlertDialogTitle>

          {/* Description */}
          <AlertDialogDescription className="text-center text-base leading-7 text-[#7A5426]">
            {userName ? (
              <>
                Are you sure you want to sign out,{" "}
                <span className="font-semibold text-[#465E20]">
                  {userName}
                </span>
                ?
              </>
            ) : (
              "Are you sure you want to sign out?"
            )}

            <br />

            <span className="text-sm text-[#6E684F]">
              You'll need to sign in again to access your tasks.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 flex-row gap-3 sm:justify-center">
          {/* Cancel Button */}
          <AlertDialogCancel
            className="
              flex-1
              rounded-xl
              border
              border-[#465E20]
              bg-[#F8F3E6]
              text-[#465E20]
              font-medium
              transition-all
              hover:bg-[#C6C7A5]
              hover:text-[#465E20]
              hover:border-[#465E20]
              sm:flex-none
            "
          >
            Cancel
          </AlertDialogCancel>

          {/* Sign Out Button */}
          <AlertDialogAction
            onClick={onConfirm}
            className="
              flex-1
              rounded-xl
              bg-[#465E20]
              text-[#F8F3E6]
              font-semibold
              shadow-md
              transition-all
              hover:bg-[#5B6D2B]
              hover:shadow-lg
              sm:flex-none
            "
          >
            Sign Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

