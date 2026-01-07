import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-xl font-bold mb-4">Simple invoices</h1>
      <Button asChild>
        <Link href={"/dashboard"}>Dashboard</Link>
      </Button>
    </main>
  );
}
