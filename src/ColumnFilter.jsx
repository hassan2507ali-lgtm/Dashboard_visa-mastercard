import { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, Search, X } from 'lucide-react';

// Popover filter ala Excel di header kolom: sort, cari, dan checklist nilai.
// options: [{ value, label }], selected: array value terpilih (null = semua), sortDir: 'asc' | 'desc' | null
const POPOVER_WIDTH = 260;
const POPOVER_MAX_HEIGHT = 400;

const ColumnFilter = ({ title, isNumber, options, selected, sortDir, anchorRect, onSort, onApply, onClose }) => {
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState(() => new Set(selected ?? options.map(o => o.value)));

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? options.filter(o => o.label.toLowerCase().includes(q)) : options;
  }, [options, search]);

  const allVisibleChecked = visible.length > 0 && visible.every(o => draft.has(o.value));
  const toggleAllVisible = () => {
    const next = new Set(draft);
    visible.forEach(o => (allVisibleChecked ? next.delete(o.value) : next.add(o.value)));
    setDraft(next);
  };
  const toggle = (value) => {
    const next = new Set(draft);
    if (next.has(value)) next.delete(value); else next.add(value);
    setDraft(next);
  };

  const handleOk = () => {
    // Saat sedang mencari, seperti Excel: hanya nilai yang terlihat & dicentang yang dipakai
    const picked = search.trim() ? visible.filter(o => draft.has(o.value)).map(o => o.value) : [...draft];
    onApply(picked.length === options.length ? null : picked);
  };

  // Posisi fixed supaya tidak terpotong oleh container tabel yang bisa di-scroll
  const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - POPOVER_WIDTH - 8));
  const top = Math.max(8, Math.min(anchorRect.bottom + 4, window.innerHeight - POPOVER_MAX_HEIGHT - 8));

  const sortBtn = (dir) => `w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${sortDir === dir ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      <div
        className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col text-left normal-case tracking-normal"
        style={{ left, top, width: POPOVER_WIDTH, maxHeight: POPOVER_MAX_HEIGHT }}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); if (e.key === 'Enter') handleOk(); }}
      >
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <p className="text-[12px] font-bold text-slate-800 truncate">{title}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
        </div>

        <div className="px-1.5 pb-2 border-b border-slate-100">
          <button onClick={() => onSort(sortDir === 'asc' ? null : 'asc')} className={sortBtn('asc')}>
            <ArrowUp size={13} /> {isNumber ? 'Urutkan Terkecil → Terbesar' : 'Urutkan A → Z'}
          </button>
          <button onClick={() => onSort(sortDir === 'desc' ? null : 'desc')} className={sortBtn('desc')}>
            <ArrowDown size={13} /> {isNumber ? 'Urutkan Terbesar → Terkecil' : 'Urutkan Z → A'}
          </button>
        </div>

        <div className="px-3 pt-2">
          <div className="relative flex items-center">
            <Search size={12} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari..."
              className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded-lg text-[12px] text-slate-700 outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <div className="px-3 py-2 overflow-y-auto flex-1 min-h-0">
          <label className="flex items-center gap-2 py-1 text-[12px] font-bold text-slate-700 cursor-pointer">
            <input type="checkbox" checked={allVisibleChecked} onChange={toggleAllVisible} className="accent-blue-600" />
            (Select All)
          </label>
          {visible.map(o => (
            <label key={o.value} className="flex items-center gap-2 py-1 text-[12px] text-slate-600 cursor-pointer">
              <input type="checkbox" checked={draft.has(o.value)} onChange={() => toggle(o.value)} className="accent-blue-600" />
              <span className="truncate" title={o.label}>{o.label}</span>
            </label>
          ))}
          {visible.length === 0 && <p className="py-2 text-[12px] text-slate-400">Tidak ada nilai yang cocok.</p>}
        </div>

        <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-slate-100">
          <button onClick={() => onApply(null)} className="text-[12px] font-semibold text-[#1e3a8a] hover:underline">Clear</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 border border-slate-200 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button
              onClick={handleOk}
              disabled={draft.size === 0}
              className="px-4 py-1.5 bg-[#111827] hover:bg-black text-white rounded-lg text-[12px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >OK</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ColumnFilter;
