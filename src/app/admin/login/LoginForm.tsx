"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="card mt-6 space-y-4 p-6">
      <div>
        <label className="field-label" htmlFor="pw">Password</label>
        <input id="pw" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      {state?.error && <p className="notice notice-err" role="alert">{state.error}</p>}
      <button className="btn btn-primary" disabled={pending}>Sign in</button>
    </form>
  );
}
