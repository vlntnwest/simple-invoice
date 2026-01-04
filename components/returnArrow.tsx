"use client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const ReturnArrow = () => {
  const router = useRouter();
  return (
    <Button variant="hided" type="button" onClick={() => router.back()}>
      <ArrowLeft className="h-6 w-6" />
    </Button>
  );
};

export default ReturnArrow;
