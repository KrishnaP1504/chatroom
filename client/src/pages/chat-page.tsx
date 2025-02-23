import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Search, User as UserIcon, Menu } from "lucide-react";
import MessageList from "@/components/chat/message-list";
import MessageInput from "@/components/chat/message-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ProfileDialog } from "@/components/profile-dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function ChatPage() {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Filter users based on search query
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const UsersList = () => (
    <div className="flex-1 p-4">
      <h2 className="font-semibold mb-2">Online Users</h2>
      <Separator className="my-2" />
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="space-y-2">
          {filteredUsers.map((chatUser) => (
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
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium block truncate">
                  {chatUser.username}
                  {chatUser.id === user?.id && " (You)"}
                </span>
                <span className="text-xs text-muted-foreground block truncate">
                  ID: {chatUser.userId}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by name or ID..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <UsersList />
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-2xl font-bold">Chatroom</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setShowProfile(true)}
            >
              <UserIcon className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* User List Sidebar - Hidden on mobile */}
        <aside className="w-80 border-r bg-muted/10 hidden md:flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or ID..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <UsersList />
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col p-4">
          <ScrollArea className="flex-1 mb-4">
            <MessageList />
          </ScrollArea>
          <MessageInput />
        </main>
      </div>

      <ProfileDialog
        open={showProfile}
        onOpenChange={setShowProfile}
      />
    </div>
  );
}