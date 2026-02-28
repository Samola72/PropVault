"use client";

import { useState } from "react";
import {
  MessageSquare, Send, Inbox, Search,
  ChevronRight, Clock, User, Plus, Reply
} from "lucide-react";
import { useMessages, useSendMessage, useThread, useMarkAsRead, useOrgUsers } from "@/hooks/use-messages";
import { useCurrentUser } from "@/hooks/use-organization";
import { Modal } from "@/components/shared/modal";
import { SearchInput } from "@/components/shared/search-input";
import { Skeleton } from "@/components/shared/loading-skeleton";
import { formatRelativeTime, generateInitials, cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Message } from "@/hooks/use-messages";

type Folder = "inbox" | "sent";

const composeSchema = z.object({
  recipient_id: z.string().uuid("Please select a recipient"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message body is required"),
});

const replySchema = z.object({
  body: z.string().min(1, "Reply cannot be empty"),
});

type ComposeData = z.infer<typeof composeSchema>;
type ReplyData = z.infer<typeof replySchema>;

export default function MessagesPage() {
  const currentUser = useCurrentUser();
  const [folder, setFolder] = useState<Folder>("inbox");
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  const { data: messagesData, isLoading } = useMessages(folder);
  const { data: threadData } = useThread(selectedMessage?.thread_id || null);
  const { data: orgUsersData, isLoading: isLoadingUsers } = useOrgUsers();
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();

  const messages: Message[] = messagesData?.data || [];
  const threadMessages: Message[] = threadData?.data || [];
  const orgUsers = Array.isArray(orgUsersData) ? orgUsersData : (orgUsersData?.data || []);

  const filteredMessages = messages.filter(
    (m) =>
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.sender?.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.body.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = messages.filter((m) => !m.is_read).length;

  // Compose form
  const {
    register: registerCompose,
    handleSubmit: handleCompose,
    reset: resetCompose,
    formState: { errors: composeErrors },
  } = useForm<ComposeData>({ resolver: zodResolver(composeSchema) });

  // Reply form
  const {
    register: registerReply,
    handleSubmit: handleReply,
    reset: resetReply,
    formState: { errors: replyErrors },
  } = useForm<ReplyData>({ resolver: zodResolver(replySchema) });

  async function onCompose(data: ComposeData) {
    await sendMessage.mutateAsync(data);
    resetCompose();
    setComposeOpen(false);
  }

  async function onReply(data: ReplyData) {
    if (!selectedMessage) return;
    await sendMessage.mutateAsync({
      recipient_id:
        selectedMessage.sender_id === currentUser?.id
          ? selectedMessage.recipient_id
          : selectedMessage.sender_id,
      subject: `Re: ${selectedMessage.subject}`,
      body: data.body,
      thread_id: selectedMessage.thread_id || selectedMessage.id,
    });
    resetReply();
  }

  function handleSelectMessage(message: Message) {
    setSelectedMessage(message);
    if (!message.is_read && message.recipient_id === currentUser?.id) {
      markAsRead.mutate(message.id);
    }
  }

  const recipientOptions = orgUsers.map((u: any) => ({
    value: u.id,
    label: `${u.full_name} (${u.role?.toLowerCase().replace("_", " ") || "member"})`,
  }));

  return (
    <div className="animate-fade-in h-[calc(100vh-9rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        <button
          onClick={() => setComposeOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
        >
          <Plus className="w-4 h-4" />
          Compose
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Left Panel — Message List */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Folder tabs */}
          <div className="flex border-b border-gray-100 flex-shrink-0">
            {(["inbox", "sent"] as Folder[]).map((f) => (
              <button
                key={f}
                onClick={() => { setFolder(f); setSelectedMessage(null); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition",
                  folder === f
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {f === "inbox" ? <Inbox className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "inbox" && unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="p-3 border-b border-gray-50 flex-shrink-0">
            <SearchInput value={search} onChange={setSearch} placeholder="Search messages..." />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {isLoading ? (
              <div className="p-3 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-600">No messages</p>
                <p className="text-xs text-gray-400 mt-1">
                  {search ? "Try a different search" : `Your ${folder} is empty`}
                </p>
              </div>
            ) : (
              filteredMessages.map((message) => {
                const isSelected = selectedMessage?.id === message.id;
                const isUnread = !message.is_read && message.recipient_id === currentUser?.id;
                const otherPerson =
                  folder === "inbox" ? message.sender : message.recipient;

                return (
                  <button
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={cn(
                      "w-full text-left px-4 py-3.5 hover:bg-gray-50 transition",
                      isSelected && "bg-blue-50 hover:bg-blue-50",
                      isUnread && !isSelected && "bg-blue-50/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                        isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                      )}>
                        {generateInitials(otherPerson?.full_name || "?")}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={cn(
                            "text-sm truncate",
                            isUnread ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                          )}>
                            {otherPerson?.full_name || "Unknown"}
                          </span>
                          <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                            {formatRelativeTime(message.created_at)}
                          </span>
                        </div>
                        <p className={cn(
                          "text-xs truncate mb-0.5",
                          isUnread ? "font-medium text-gray-700" : "text-gray-500"
                        )}>
                          {message.subject}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{message.body}</p>
                      </div>

                      {isUnread && (
                        <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel — Message Detail */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          {selectedMessage ? (
            <>
              {/* Message Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      {selectedMessage.subject}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                          {generateInitials(selectedMessage.sender?.full_name || "?")}
                        </div>
                        <span className="font-medium text-gray-700">
                          {selectedMessage.sender?.full_name}
                        </span>
                      </div>
                      <span className="text-gray-300">→</span>
                      <span>{selectedMessage.recipient?.full_name}</span>
                      <span className="text-gray-300">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatRelativeTime(selectedMessage.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thread messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Show full thread if available, else just the selected message */}
                {(threadMessages.length > 0 ? threadMessages : [selectedMessage]).map(
                  (msg) => {
                    const isOwnMessage = msg.sender_id === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-3",
                          isOwnMessage && "flex-row-reverse"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                          isOwnMessage
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-600"
                        )}>
                          {generateInitials(msg.sender?.full_name || "?")}
                        </div>
                        <div className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-3",
                          isOwnMessage
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-gray-100 text-gray-900 rounded-tl-none"
                        )}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.body}
                          </p>
                          <p className={cn(
                            "text-[11px] mt-1.5",
                            isOwnMessage ? "text-blue-200" : "text-gray-400"
                          )}>
                            {formatRelativeTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-gray-100 flex-shrink-0 bg-gray-50">
                <form onSubmit={handleReply(onReply)} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-1.5">
                    {generateInitials(currentUser?.full_name || "?")}
                  </div>
                  <div className="flex-1">
                    <textarea
                      {...registerReply("body")}
                      rows={2}
                      placeholder="Write a reply..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    {replyErrors.body && (
                      <p className="text-xs text-red-600 mt-1">{replyErrors.body.message}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={sendMessage.isPending}
                    className="self-end p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
                <MessageSquare className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-2">
                Select a message
              </h3>
              <p className="text-sm text-gray-400 max-w-xs">
                Choose a message from the list to read it, or compose a new one.
              </p>
              <button
                onClick={() => setComposeOpen(true)}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
                Compose New Message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      <Modal
        open={composeOpen}
        onClose={() => { setComposeOpen(false); resetCompose(); }}
        title="New Message"
        description="Send a message to a team member"
        size="md"
      >
        <form onSubmit={handleCompose(onCompose)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              To <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                {...registerCompose("recipient_id")}
                disabled={isLoadingUsers}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {isLoadingUsers ? "Loading users..." : recipientOptions.length === 0 ? "No other users in organization" : "Select recipient..."}
                </option>
                {recipientOptions.map((opt: any) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {recipientOptions.length === 0 && !isLoadingUsers && (
              <p className="text-xs text-amber-600">
                No other users found. Add team members to your organization to send messages.
              </p>
            )}
            {composeErrors.recipient_id && (
              <p className="text-xs text-red-600">{composeErrors.recipient_id.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              {...registerCompose("subject")}
              placeholder="Message subject"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {composeErrors.subject && (
              <p className="text-xs text-red-600">{composeErrors.subject.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              {...registerCompose("body")}
              rows={6}
              placeholder="Write your message here..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {composeErrors.body && (
              <p className="text-xs text-red-600">{composeErrors.body.message}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => { setComposeOpen(false); resetCompose(); }}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sendMessage.isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sendMessage.isPending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
