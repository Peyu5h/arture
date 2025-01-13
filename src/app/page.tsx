"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { useGetPhotosByQuery, useGetRandomPhotos } from "~/hooks/useUnsplash";
export default function Home() {
  const query = "red panda";

  const { toast } = useToast();
  const { data: randomPhotos } = useGetRandomPhotos();
  // const { data: photos } = useGetPhotosByQuery({ query });

  console.log(randomPhotos);
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
