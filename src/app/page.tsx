"use client";

import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
export default function Home() {
  const { toast } = useToast();
  return (
    <div>
      <div className="">
        Hello
        <Button
          onClick={() =>
            toast({
              description: "Your message has been sent.",
            })
          }
        >
          Click me
        </Button>
      </div>
    </div>
  );
}
