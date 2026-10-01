import { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';
import { listenMessages, sendMessage, toMillis } from '../../lib/groupPrayer';

// 함께 기도 중에 주고받는 짧은 글. 기도를 방해하지 않아야 해서 기본은 닫혀 있고,
// 읽지 않은 글이 있으면 아이콘에 점만 찍어 알린다. 열면 말씀 카드 위로 덮인다.
function formatTime(value) {
  const ms = toMillis(value);
  if (ms == null) return '';
  const d = new Date(ms);
  const h = d.getHours();
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${h12}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function GroupPrayerChat({ churchId, cellId, gpId, user }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  // 열었을 때 본 마지막 개수 — 이것보다 많아지면 안 읽은 글이 있는 것
  const [seenCount, setSeenCount] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    const unsubscribe = listenMessages(churchId, cellId, gpId, setMessages);
    return unsubscribe;
  }, [churchId, cellId, gpId]);

  // 열려 있는 동안은 계속 읽은 것으로 치고, 새 글이 오면 아래로 따라간다
  useEffect(() => {
    if (!open) return;
    setSeenCount(messages.length);
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [open, messages.length]);

  const unread = Math.max(0, messages.length - seenCount);

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft('');
    try {
      await sendMessage(churchId, cellId, gpId, user, text);
    } catch (e) {
      // 못 보냈으면 적은 글을 돌려줘서 다시 보낼 수 있게 한다
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="채팅 열기"
        style={{ background: '#FFFDF9', color: '#4A3B3F' }}
        className="relative rounded-full p-2 shadow-sm"
      >
        <MessageCircle size={16} />
        {unread > 0 && (
          <span
            style={{ background: '#F2678A', width: '8px', height: '8px', border: '1.5px solid #FFFDF9' }}
            className="absolute -top-0.5 -right-0.5 rounded-full"
          />
        )}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(false)}
        aria-label="채팅 닫기"
        style={{ background: '#6FA66B', color: '#FFF8F0' }}
        className="rounded-full p-2 shadow-sm"
      >
        <MessageCircle size={16} />
      </button>

      {/* 아래에서 올라오는 시트 — 말씀 카드를 완전히 가리지 않도록 화면의 절반만 차지한다 */}
      <div className="fixed inset-x-0 bottom-0 z-[55] flex flex-col" style={{ maxHeight: '55vh' }}>
        <div
          style={{ background: '#FFFDF9', color: '#4A3B3F' }}
          className="rounded-t-3xl shadow-xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
            <span className="text-sm font-bold">함께 나누기</span>
            <button onClick={() => setOpen(false)} aria-label="닫기" style={{ color: '#9C8286' }}>
              <X size={16} />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-2" style={{ minHeight: '120px' }}>
            {messages.length === 0 && (
              <p style={{ color: '#9C8286' }} className="text-xs text-center py-6 leading-relaxed">
                기도하며 나누고 싶은 말을 적어보세요.
              </p>
            )}
            {messages.map((m) => {
              const mine = m.uid === user.uid;
              return (
                <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  {!mine && (
                    <span style={{ color: '#9C8286' }} className="text-[11px] px-1">
                      {m.displayName}
                    </span>
                  )}
                  <div
                    style={{
                      background: mine ? '#E8F3E4' : '#F5F0E8',
                      maxWidth: '80%',
                    }}
                    className="rounded-2xl px-3 py-2"
                  >
                    <span className="text-sm leading-snug whitespace-pre-line break-words">{m.text}</span>
                  </div>
                  <span style={{ color: '#C4B5B8' }} className="text-[10px] px-1">
                    {formatTime(m.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 px-4 pb-4 pt-2 shrink-0">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit();
              }}
              placeholder="함께 나눌 말"
              style={{ background: '#F5F0E8', color: '#4A3B3F' }}
              className="flex-1 rounded-full px-4 py-2 text-sm"
            />
            <button
              onClick={submit}
              disabled={!draft.trim() || sending}
              aria-label="보내기"
              style={{ background: '#6FA66B', color: '#FFF8F0' }}
              className="rounded-full p-2.5 disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
