"use client";

import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function sair() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      className="btn btn-outline-danger btn-sm"
      onClick={sair}
    >
      <i className="bi bi-box-arrow-right" aria-hidden="true" />
      Sair
    </button>
  );
}
