"use client";
import { useEffect } from "react";
import Assessment from "@/components/assessment/Assessment";
import { usePathname, useRouter } from "next/navigation";

export default function AssessmentDomainPage(){
  const router = useRouter();
  const pathname = usePathname();
  useEffect(()=>{
    // Assessment component handles domain selection internally for now.
    // This route exists for future deep-linking; redirect to /assessment.
    router.replace("/assessment");
  }, [router, pathname]);
  return null;
}


