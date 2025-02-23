import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import MessageList from "@/components/chat/message-list";
import MessageInput from "@/components/chat/message-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

export default function ChatPage() {
  const { user, logoutMutation } = useAuth();
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

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

      <div className="flex-1 flex">
        {/* User List Sidebar */}
        <aside className="w-64 border-r bg-muted/10 hidden md:block">
          <div className="p-4">
            <h2 className="font-semibold mb-2">Online Users</h2>
            <Separator className="my-2" />
            <ScrollArea className="h-[calc(100vh-10rem)]">
              <div className="space-y-2">
                {users.map((chatUser) => (
                  <div
                    key={chatUser.id}
                    className={`p-2 rounded-lg flex items-center gap-2 ${
                      chatUser.id === user?.id ? "bg-primary/10" : "hover:bg-muted/50"
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {chatUser.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {chatUser.username}
                      {chatUser.id === user?.id && " (You)"}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col p-4">
          <ScrollArea className="flex-1 mb-4">
            <MessageList />
          </ScrollArea>
          <MessageInput />
        </main>
      </div>
    </div>
  );
}