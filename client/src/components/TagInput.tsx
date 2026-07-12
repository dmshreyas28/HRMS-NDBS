import { useState } from "react";

interface TagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export function TagInput({ values, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const trimmed = draft.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setDraft("");
  };

  const removeTag = (tag: string) => {
    onChange(values.filter((v) => v !== tag));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded border border-gray-300 p-2">
      {values.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-indigo-400 hover:text-indigo-600"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag();
          }
        }}
        onBlur={addTag}
        placeholder={placeholder ?? "Type and press Enter"}
        className="min-w-[120px] flex-1 border-none bg-transparent text-sm text-gray-900 outline-none"
      />
    </div>
  );
}
