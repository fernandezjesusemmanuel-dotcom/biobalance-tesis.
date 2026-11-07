"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { PreIngresoScreen } from "@/components/onboarding/PreIngresoScreen";
import { createClient } from "@/lib/supabase/client";
import {
  hasCompletedPreIngreso,
  markPreIngresoCompleted,
} from "@/lib/preingreso-storage";

export default function PreIngresoPage() {
  const router = useRouter();

  useEffect(() => {
    if (hasCompletedPreIngreso()) {
      router.replace("/");
    }
  }, [router]);

  const handleIniciarTest = async () => {
    markPreIngresoCompleted();

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ pre_ingreso_completado: true })
        .eq("id", user.id);
    }

    router.push("/");
    router.refresh();
  };

  return <PreIngresoScreen onIniciarTest={handleIniciarTest} />;
}
