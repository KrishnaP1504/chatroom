import { useQuery } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MessageList() {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    enabled: !!user // Only fetch messages when user is authenticated
  });

  // Filter messages based on search query
  const filteredMessages = messages.filter(message => 
    message.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Websocket connection with reconnection logic
  useEffect(() => {
    if (!user) return; // Don't connect if user is not authenticated

    function connect() {
      if (isConnecting) return;
      setIsConnecting(true);

      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnecting(false);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        queryClient.setQueryData<Message[]>(["/api/messages"], (old = []) => [
          ...old,
          message,
        ]);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected, attempting to reconnect...");
        setIsConnecting(false);
        setTimeout(connect, 1000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnecting(false);
        ws.close();
      };

      wsRef.current = ws;
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 bg-background z-10 pb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredMessages.map((message) => (
        <Card
          key={message.id}
          className={`p-4 ${
            message.userId === user?.id ? "bg-primary/5" : "bg-card"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar>
                <AvatarFallback>
                  {message.userId === user?.id ? "ME" : "U"}
                </AvatarFallback>
              </Avatar>
              <Badge 
                variant="outline" 
                className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background bg-green-500"
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">
                  {message.userId === user?.id ? "You" : `User ${message.userId}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(message.createdAt), "p")}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.reactions && message.reactions.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {message.reactions.map((reaction: string, index: number) => (
                  <span key={index}>{reaction}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}