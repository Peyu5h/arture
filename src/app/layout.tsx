import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster as UIToaster } from "~/components/ui/toaster";
import { Toaster } from "sonner";
import ReactQueryProvider from "~/lib/ReactQueryProvider";
import { Navbar } from "~/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | Arture",
    default: "Arture",
  },
  description: "...",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <UIToaster />
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
