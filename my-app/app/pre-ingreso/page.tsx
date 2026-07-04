"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { PreIngresoScreen } from "@/components/onboarding/PreIngresoScreen";
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

  const handleIniciarTest = () => {
    markPreIngresoCompleted();
    router.push("/");
    router.refresh();
  };

  return <PreIngresoScreen onIniciarTest={handleIniciarTest} />;
}
