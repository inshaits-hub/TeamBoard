import { UserCircle, Mail, Building, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/40 px-6 py-4">
        <h2 className="text-lg font-bold text-app-card-foreground">Profile</h2>
        <p className="text-xs text-muted-foreground">Your account details</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto w-full max-w-2xl">
          <Card className="border-border/40">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-app-primary/30">
                  <AvatarFallback className="bg-app-primary text-app-primary-foreground text-lg">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg text-app-card-foreground">{user.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-app-bg/50 px-4 py-3">
                <Mail className="h-4 w-4 text-app-primary" />
                <div>
                  <p className="text-xs font-medium text-app-card-foreground">Email</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-app-bg/50 px-4 py-3">
                <Building className="h-4 w-4 text-app-primary" />
                <div>
                  <p className="text-xs font-medium text-app-card-foreground">Organization</p>
                  <p className="text-xs text-muted-foreground">{user.organization}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-app-bg/50 px-4 py-3">
                <Shield className="h-4 w-4 text-app-primary" />
                <div>
                  <p className="text-xs font-medium text-app-card-foreground">Role</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
