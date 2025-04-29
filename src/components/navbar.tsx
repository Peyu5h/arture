"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authClient } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

export function Navbar({ onAuthDialogOpen }: { onAuthDialogOpen: () => void }) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header
      className={`absolute top-0 z-50 w-full transition-all duration-300 ${
        isScrolled ? "bg-transparent backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src="https://res.cloudinary.com/dkysrpdi6/image/upload/v1728660806/Arture/arture-logo_oljtzy.png"
            alt="Arture Logo"
            width={40}
            height={40}
            className="mr-2"
            priority
          />
          <span className="text-xl font-bold">Arture</span>
        </Link>

        <nav className="hidden items-center space-x-6 md:flex">
          <Link
            href="/templates"
            className="text-sm font-medium hover:text-primary"
          >
            Templates
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {isPending ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={session.user?.image || undefined}
                      alt={session.user?.name || "User"}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {session.user?.name
                        ? session.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .substring(0, 2)
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user?.name || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user?.email || ""}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/account")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={onAuthDialogOpen}
                className="hidden sm:flex"
              >
                Log in
              </Button>
              <Button onClick={onAuthDialogOpen}>Sign up</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
