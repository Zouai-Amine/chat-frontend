export interface User {
  id: number;
  username: string;
}

export interface Message {
  id?: number;
  sender: string;
  text: string;
  timestamp: Date;
  reactions: { [user_id: number]: string };
}

export interface FloatingReaction {
  id: number;
  emoji: string;
  x: number;
  y: number;
  angle: number;
}

export interface WebSocketMessage {
  type: 'users' | 'message' | 'typing' | 'reaction' | 'new_reaction' | 'new_message';
  users?: User[];
  id?: number;
  sender?: string;
  text?: string;
  timestamp?: string;
  reactions?: { [key: number]: string };
  is_typing?: boolean;
  message_id?: number;
  user_id?: number;
  reaction?: string | string[] | { reaction: string };
  sender_id?: number;
  recipient_id?: number;
}
