"use client";

import { useState, useRef } from "react";
import { X, User, Plus } from "lucide-react";

interface RecipientSelectorProps {
  label: string;
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
}

const SAMPLE_SUGGESTIONS = [
  { name: "Alex Tech", email: "alex.tech@acmecorp.com", company: "Acme Corp" },
  { name: "Sarah Connor", email: "contact@innovate.io", company: "Innovate Tech" },
  { name: "David Miller", email: "finance@globaltech.org", company: "GlobalTech" },
  { name: "Jessica Alba", email: "jessica@apexsolutions.com", company: "Apex Solutions" },
  { name: "Michael Scott", email: "m.scott@dundermifflin.com", company: "Dunder Mifflin" },
];

export function RecipientSelector({
  label,
  value,
  onChange,
  placeholder = "Type email and press Enter...",
}: RecipientSelectorProps) {
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addEmail = (email: string) => {
    const cleaned = email.toLowerCase().trim().replace(/[,;]/g, "");
    if (cleaned && !value.includes(cleaned)) {
      onChange([...value, cleaned]);
    }
    setInput("");
    setShowDropdown(false);
  };

  const removeEmail = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", ";", "Tab", " "].includes(e.key) && input.trim()) {
      e.preventDefault();
      addEmail(input.trim());
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeEmail(value.length - 1);
    }
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      if (input.trim()) {
        addEmail(input.trim());
      }
      setShowDropdown(false);
    }, 150);
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    setShowDropdown(true);
  };

  const filteredSuggestions = SAMPLE_SUGGESTIONS.filter(
    (item) =>
      !value.includes(item.email) &&
      (item.email.toLowerCase().includes(input.toLowerCase()) ||
        item.name.toLowerCase().includes(input.toLowerCase()) ||
        item.company.toLowerCase().includes(input.toLowerCase()))
  );

  const isInputNewEmail =
    input.trim().length > 0 &&
    !value.includes(input.trim().toLowerCase()) &&
    !SAMPLE_SUGGESTIONS.some((s) => s.email.toLowerCase() === input.trim().toLowerCase());

  return (
    <div className="relative flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
        {label}
      </label>
      <div className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-transparent transition">
        {value.map((email, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 bg-violet-500/25 text-violet-200 text-xs px-3 py-1 rounded-full border border-violet-500/40 font-semibold"
          >
            {email}
            <button
              type="button"
              onClick={() => removeEmail(idx)}
              className="text-violet-300 hover:text-white rounded-full p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-400 focus:outline-none min-w-[200px] font-medium"
        />
      </div>

      {/* Autocomplete & Manual Add Dropdown */}
      {showDropdown && input.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto py-1 divide-y divide-slate-800">
          {filteredSuggestions.map((item) => (
            <button
              key={item.email}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addEmail(item.email);
              }}
              className="w-full px-3 py-2 text-left hover:bg-slate-800 flex items-center justify-between transition group"
            >
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-bold text-white group-hover:text-violet-300">{item.name}</span>
                <span className="text-[11px] text-slate-400 font-mono">({item.email})</span>
              </div>
              <span className="text-[10px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded font-medium">{item.company}</span>
            </button>
          ))}

          {isInputNewEmail && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addEmail(input.trim());
              }}
              className="w-full px-3 py-2 text-left hover:bg-violet-950/50 flex items-center gap-2 text-xs text-violet-300 font-bold transition"
            >
              <Plus className="w-3.5 h-3.5 text-violet-400" />
              <span>Add custom email: <strong className="text-white font-mono">{input.trim()}</strong></span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
