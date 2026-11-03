"use client";

import { Eye, EyeOff, LogIn } from "lucide-react";
import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "@/app/(admin)/admin/_actions/auth";
import { Spinner } from "./ui";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Parol</span>
        <div className="relative">
          <input
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            required
            className="field pr-12"
            aria-invalid={Boolean(state.error)}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Parolni yashirish" : "Parolni koʻrsatish"}
            className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-canvas"
          >
            {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        </div>
      </label>
      {state.error && (
        <p className="rounded-xl bg-sale-soft px-3 py-2 text-[13px] font-medium text-sale" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary btn-lg w-full">
        {pending ? <Spinner /> : <LogIn className="size-5" />}
        Kirish
      </button>
    </form>
  );
}
