import { useQuery } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient } from "@/lib/queryClient";

export default function MessageList() {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  // Websocket connection with reconnection logic
  useEffect(() => {
    function connect() {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);

      ws.onopen = () => {
        console.log("WebSocket connected");
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
        setTimeout(connect, 1000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
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
  }, []);

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
      {messages.map((message) => (
        <Card
          key={message.id}
          className={`p-4 ${
            message.userId === user?.id ? "bg-primary/5" : "bg-card"
          }`}
        >
          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarFallback>
                {message.userId === user?.id ? "ME" : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">
                  {message.userId === user?.id ? "You" : `User ${message.userId}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(message.createdAt), "p")}
                </span>
              </div>
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        </Card>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}