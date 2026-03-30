const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://api.mappin.app";

export type Message = {
  id: string;
  text: string;
  senderName: string;
  isOwn: boolean;
  createdAt: string;
};

export async function fetchMessages(): Promise<Message[]> {
  const response = await fetch(`${BASE_URL}/messages`);
  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.status}`);
  }
  return response.json();
}

export async function sendMessage(text: string): Promise<Message> {
  const response = await fetch(`${BASE_URL}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.status}`);
  }
  return response.json();
}
