import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { IconSend, IconRobot, IconUser, IconLoader2 } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatWithCoach } from "@/features/coach/server/coachFns";

export const Route = createFileRoute("/_app/coach")({
  component: CoachPage,
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Bonjour ! Je suis votre coach financier Kolo. Comment puis-je vous aider aujourd'hui ? Posez-moi vos questions sur les tontines, l'épargne, ou la gestion de vos finances.",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: (message: string) =>
      chatWithCoach({ data: { message, history: messages } }),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Désolé, une erreur s'est produite. Veuillez réessayer.",
        },
      ]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    chatMutation.mutate(trimmed);
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Coach Financier</h1>
        <p className="mt-1 text-muted-foreground">
          Posez vos questions sur les tontines et la finance collective
        </p>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {msg.role === "user" ? (
                    <IconUser className="size-4" />
                  ) : (
                    <IconRobot className="size-4" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <IconRobot className="size-4" />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                  <IconLoader2 className="size-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Réflexion...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 border-t border-border p-4"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez une question au coach..."
              className="flex-1"
              disabled={chatMutation.isPending}
            />
            <Button type="submit" disabled={!input.trim() || chatMutation.isPending}>
              <IconSend className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
