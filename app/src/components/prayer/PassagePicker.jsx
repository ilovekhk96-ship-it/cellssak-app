import { useState } from 'react';
import { Search, BookOpen, Pencil } from 'lucide-react';
import { PRAYER_VERSES } from '../../data/constants';
import { BIBLE_BOOKS, findBook, formatRef, BIBLE_TEXT_AVAILABLE, loadPassageText } from '../../data/bible';

// 말씀 한 편을 고르거나 적는 자리. 세 가지 방법을 탭으로 나눠 둔다.
//
//  성경에서  — 책/장/절을 골라 "시편 23:1-3" 같은 장절 표기를 자동으로 만든다.
//              본문은 아직 앱에 없어서(저작권 허가 전) 붙여넣어야 하지만, 허가를 받아
//              loadPassageText를 구현하면 이 화면은 그대로 두고 본문만 자동으로 채워진다
//  기도구절  — 앱에 이미 들어있는 기도 관련 구절 50개에서 고른다. 바로 쓸 수 있다
//  직접입력  — 장절도 본문도 직접 적는다
const TABS = [
  { id: 'bible', label: '성경에서', icon: BookOpen },
  { id: 'verses', label: '기도구절', icon: Search },
  { id: 'manual', label: '직접입력', icon: Pencil },
];

export default function PassagePicker({ value, onChange }) {
  const [tab, setTab] = useState('bible');
  const [book, setBook] = useState('시편');
  const [chapter, setChapter] = useState(23);
  const [fromVerse, setFromVerse] = useState('');
  const [toVerse, setToVerse] = useState('');
  const [verseQuery, setVerseQuery] = useState('');

  const bookInfo = findBook(book);
  const chapterCount = bookInfo?.chapters || 1;

  const applyBibleRef = async (nextBook, nextChapter, nextFrom, nextTo) => {
    const ref = formatRef(nextBook, nextChapter, nextFrom, nextTo);
    // 허가를 받아 본문이 들어오면 자동으로 채워지고, 그 전까지는 적어둔 본문을 유지한다
    const text = BIBLE_TEXT_AVAILABLE
      ? (await loadPassageText(nextBook, nextChapter, nextFrom, nextTo)) ?? value.text
      : value.text;
    onChange({ ref, text });
  };

  const filteredVerses = verseQuery.trim()
    ? PRAYER_VERSES.filter(
        (v) => v.ref.includes(verseQuery.trim()) || v.text.includes(verseQuery.trim())
      )
    : PRAYER_VERSES;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: tab === t.id ? '#6FA66B' : '#F5F0E8',
                color: tab === t.id ? '#FFF8F0' : '#4A3B3F',
              }}
              className="flex-1 rounded-xl px-2 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1"
            >
              <Icon size={11} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'bible' && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-1.5">
            <select
              value={book}
              onChange={(e) => {
                const nextBook = e.target.value;
                // 책을 바꾸면 장 수가 달라지므로, 넘치면 1장으로 되돌린다
                const nextChapter = Math.min(chapter, findBook(nextBook)?.chapters || 1);
                setBook(nextBook);
                setChapter(nextChapter);
                applyBibleRef(nextBook, nextChapter, fromVerse, toVerse);
              }}
              style={{ background: '#F5F0E8', color: '#4A3B3F' }}
              className="flex-[2] rounded-xl px-2 py-2 text-sm"
            >
              {BIBLE_BOOKS.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={chapter}
              onChange={(e) => {
                const next = Number(e.target.value);
                setChapter(next);
                applyBibleRef(book, next, fromVerse, toVerse);
              }}
              style={{ background: '#F5F0E8', color: '#4A3B3F' }}
              className="flex-1 rounded-xl px-2 py-2 text-sm"
            >
              {Array.from({ length: chapterCount }, (_, i) => i + 1).map((c) => (
                <option key={c} value={c}>
                  {c}장
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-1.5 items-center text-xs" style={{ color: '#9C8286' }}>
            <input
              value={fromVerse}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '');
                setFromVerse(v);
                applyBibleRef(book, chapter, v, toVerse);
              }}
              inputMode="numeric"
              placeholder="1"
              style={{ background: '#F5F0E8', color: '#4A3B3F' }}
              className="w-16 rounded-xl px-2 py-2 text-sm text-center"
            />
            <span>절부터</span>
            <input
              value={toVerse}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '');
                setToVerse(v);
                applyBibleRef(book, chapter, fromVerse, v);
              }}
              inputMode="numeric"
              placeholder="3"
              style={{ background: '#F5F0E8', color: '#4A3B3F' }}
              className="w-16 rounded-xl px-2 py-2 text-sm text-center"
            />
            <span>절까지 (비우면 장 전체)</span>
          </div>

          {!BIBLE_TEXT_AVAILABLE && (
            <p style={{ color: '#9C8286' }} className="text-[11px] leading-snug">
              장절은 자동으로 들어갑니다. 본문은 아직 앱에 없어서 아래에 붙여넣어 주세요.
            </p>
          )}
        </div>
      )}

      {tab === 'verses' && (
        <div className="flex flex-col gap-1.5">
          <input
            value={verseQuery}
            onChange={(e) => setVerseQuery(e.target.value)}
            placeholder="구절 검색 (예: 기도, 마태복음)"
            style={{ background: '#F5F0E8', color: '#4A3B3F' }}
            className="rounded-xl px-3 py-2 text-sm"
          />
          <div style={{ maxHeight: '160px' }} className="overflow-y-auto flex flex-col gap-1">
            {filteredVerses.map((v) => (
              <button
                key={v.ref}
                onClick={() => onChange({ ref: v.ref, text: v.text })}
                style={{
                  background: value.ref === v.ref ? '#E8F3E4' : '#F5F0E8',
                  color: '#4A3B3F',
                }}
                className="rounded-xl px-3 py-2 text-left"
              >
                <span style={{ color: '#6FA66B' }} className="text-[11px] font-bold block">
                  {v.ref}
                </span>
                <span className="text-xs leading-snug line-clamp-2">{v.text}</span>
              </button>
            ))}
            {filteredVerses.length === 0 && (
              <p style={{ color: '#9C8286' }} className="text-xs text-center py-3">
                찾는 구절이 없어요.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 장절은 어느 탭에서든 확인·수정할 수 있게 항상 보여준다 */}
      <input
        value={value.ref}
        onChange={(e) => onChange({ ...value, ref: e.target.value })}
        placeholder="시편 23:1-3"
        style={{ background: '#F5F0E8', color: '#4A3B3F' }}
        className="rounded-xl px-3 py-2 text-sm"
      />
      <textarea
        value={value.text}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
        placeholder="본문을 붙여넣어 주세요"
        rows={3}
        style={{ background: '#F5F0E8', color: '#4A3B3F' }}
        className="rounded-xl px-3 py-2 text-sm resize-none"
      />
    </div>
  );
}
