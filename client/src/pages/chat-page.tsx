import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import MessageList from "@/components/chat/message-list";
import MessageInput from "@/components/chat/message-input";

export default function ChatPage() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Chatroom</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              Welcome, {user?.username}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4">
          <MessageList />
        </div>
        <MessageInput />
      </main>
    </div>
  );
}
