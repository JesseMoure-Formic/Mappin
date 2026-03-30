import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { sendMessage, fetchMessages, Message } from "../src/api/messages";

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    try {
      const data = await fetchMessages();
      setMessages(data);
    } catch {
      setError("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);
    setText("");

    try {
      const message = await sendMessage(trimmed);
      setMessages((prev) => [...prev, message]);
      listRef.current?.scrollToEnd({ animated: true });
    } catch {
      setError("Failed to send message. An unexpected server error has occurred. Please try again.");
      setText(trimmed); // restore text so user can retry
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubble,
                  item.isOwn ? styles.bubbleOwn : styles.bubbleOther,
                ]}
              >
                {!item.isOwn && (
                  <Text style={styles.sender}>{item.senderName}</Text>
                )}
                <Text style={styles.messageText}>{item.text}</Text>
                <Text style={styles.timestamp}>
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            )}
          />
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor="#555"
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  flex: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  messageList: { padding: 12, gap: 8 },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    padding: 10,
    marginBottom: 4,
  },
  bubbleOwn: {
    alignSelf: "flex-end",
    backgroundColor: "#2563eb",
  },
  bubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: "#1e1e1e",
  },
  sender: { color: "#aaa", fontSize: 11, marginBottom: 2 },
  messageText: { color: "#fff", fontSize: 15 },
  timestamp: { color: "#ffffff80", fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  errorBanner: {
    backgroundColor: "#7f1d1d",
    margin: 12,
    borderRadius: 10,
    padding: 12,
  },
  errorText: { color: "#fca5a5", fontSize: 13 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#222",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    color: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: "#2563eb",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: "#fff", fontWeight: "600" },
});
