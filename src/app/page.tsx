"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
export default function Home() {
  const { toast } = useToast();
  return (
    <div>
      <div className="">
        <Link href="/editor/123">
          <Button
            onClick={() =>
              toast({
                description: "Your message has been sent.",
              })
            }
          >
            Go to editor
          </Button>
        </Link>
      </div>
    </div>
  );
}
