// src/hooks/useForm.js
// ─────────────────────────────────────────────────────────────────────────────
// Simple form state hook.
// Usage:
//   const { values, field, set, setValues } = useForm({ name: "", email: "" });
//   <input {...field("name")} />        — binds value + onChange
//   set("name", "Alice")               — set a single field programmatically
//   setValues({ name: "Alice", ... })  — replace all values at once
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

export function useForm(initial) {
  const [values, setValues] = useState(initial);

  const set = (key, value) =>
    setValues(prev => ({ ...prev, [key]: value }));

  const field = (key) => ({
    value: values[key] ?? "",
    onChange: (e) => set(key, e.target.value),
  });

  return { values, set, field, setValues };
}
