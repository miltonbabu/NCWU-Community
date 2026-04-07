import { ChatProvider } from "../contexts/ChatContext";
import { ChatContainer } from "../components/xingyuan/ChatContainer";
import { useAuth } from "../contexts/AuthContext";

export default function XingyuanAIPage() {
  const { user } = useAuth();

  return (
    <ChatProvider userId={user?.id}>
      <ChatContainer />
    </ChatProvider>
  );
}
