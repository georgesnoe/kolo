import { createServerFn } from "@tanstack/react-start";
import { askCoach } from "@/core/api/gemini";
import { auth } from "@/core/auth/auth";
import { getRequest } from "@tanstack/react-start/server";

async function getAuthSession() {
  const request = getRequest();
  if (!request) throw new Error("No request context");
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) throw new Error("Not authenticated");
  return session;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const chatWithCoach = createServerFn({ method: "POST" })
  .inputValidator((data: { message: string; history: ChatMessage[] }) => data)
  .handler(async ({ data }) => {
    try {
      await getAuthSession();

      const systemContext = `Tu es le coach financier de Kolo, une application de finance collective francophone.
Tu aides les utilisateurs avec leurs questions sur les tontines, l'épargne collective, et la gestion financière personnelle.
Réponds en français, de manière claire et bienveillante. Sois concis mais utile.`;

      const fullMessage = `${systemContext}\n\nHistorique récent:\n${data.history
        .slice(-5)
        .map((m) => `${m.role === "user" ? "Utilisateur" : "Coach"}: ${m.content}`)
        .join("\n")}\n\nUtilisateur: ${data.message}`;

      const response = await askCoach(fullMessage);

      return { response };
    } catch (error) {
      console.error("[chatWithCoach] Error:", error);
      throw error;
    }
  });
