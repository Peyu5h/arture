"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
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
import { ClientOnly } from "~/components/client-only";
import { ny } from "~/lib/utils";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";

export function Navbar({
  onAuthDialogOpen,
  hideNavLinks = false,
}: {
  onAuthDialogOpen?: () => void;
  hideNavLinks?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleAuthClick = () => {
    if (onAuthDialogOpen) {
      onAuthDialogOpen();
    } else {
      router.push("/sign-in");
    }
  };

  return (
    <header className="border-border/40 bg-background/80 fixed top-0 z-50 w-full border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="https://res.cloudinary.com/dkysrpdi6/image/upload/v1728660806/Arture/arture-logo_oljtzy.png"
            alt="Arture"
            width={36}
            height={36}
            priority
          />
          <span className="text-lg font-semibold">Arture</span>
        </Link>

        {/* Center Navigation - hidden when user is logged in */}
        {!hideNavLinks && (
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className={ny(
                "relative text-sm font-medium transition-colors",
                pathname === "/"
                  ? "text-foreground after:bg-primary after:absolute after:right-0 after:-bottom-[21px] after:left-0 after:h-0.5"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Home
            </Link>
            <Link
              href="/templates"
              className={ny(
                "relative text-sm font-medium transition-colors",
                pathname === "/templates"
                  ? "text-foreground after:bg-primary after:absolute after:right-0 after:-bottom-[21px] after:left-0 after:h-0.5"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Templates
            </Link>
          </nav>
        )}

        {/* Right Side - Auth */}
        <div className="flex items-center gap-4">
          <ClientOnly
            fallback={
              <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
            }
          >
            {isPending ? (
              <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="relative items-center justify-between rounded-full p-1 py-2"
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
                    <div className="ml-2 flex flex-col">
                      <p className="pr-2 text-sm leading-none font-medium">
                        {session.user?.name || "User"}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm leading-none font-medium">
                        {session.user?.name || "User"}
                      </p>
                      <p className="text-muted-foreground text-xs leading-none">
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
              <Button
                effect={"shineHover"}
                onClick={handleAuthClick}
                className="bg-primary/70 hover:bg-primary/80 rounded-lg px-6"
              >
                Get started
              </Button>
            )}
          </ClientOnly>

          <div className="ml-2">
            <AnimatedThemeToggler />
          </div>
        </div>
      </div>
    </header>
  );
}
