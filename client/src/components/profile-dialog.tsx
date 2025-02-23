import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UpdateUser } from "@shared/schema";
import { Pencil, Check, X, Loader2 } from "lucide-react";

// Built-in avatars
const BUILT_IN_AVATARS = [
  "/avatars/avatar1.svg",
  "/avatars/avatar2.svg",
  "/avatars/avatar3.svg",
  "/avatars/avatar4.svg",
  "/avatars/avatar5.svg",
];

export function ProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.avatar || BUILT_IN_AVATARS[0]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateUser) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      username: newUsername,
      avatar: selectedAvatar,
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Your Profile
            {!isEditing ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={selectedAvatar} />
            <AvatarFallback className="text-2xl">
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {isEditing && (
            <div className="flex gap-2 flex-wrap justify-center">
              {BUILT_IN_AVATARS.map((avatar) => (
                <Button
                  key={avatar}
                  variant={selectedAvatar === avatar ? "default" : "outline"}
                  size="icon"
                  className="h-12 w-12 p-0 rounded-full"
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  <Avatar className="h-full w-full">
                    <AvatarImage src={avatar} />
                  </Avatar>
                </Button>
              ))}
            </div>
          )}

          <Card className="w-full">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Username</Label>
                {isEditing ? (
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                ) : (
                  <p className="text-lg font-medium">{user.username}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-lg">{user.email}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">User ID</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded">{user.userId}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Account Created</Label>
                <p className="text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}