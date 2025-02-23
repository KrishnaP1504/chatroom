import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function ProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Your Profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="text-2xl">
              {user?.username?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Card className="w-full">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Username</Label>
                <p className="text-lg font-medium">{user?.username}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-lg">{user?.email}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">User ID</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded">{user?.userId}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Account Created</Label>
                <p className="text-sm">
                  {new Date(user?.createdAt ?? "").toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
