"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { ClientOnly } from "~/components/client-only";

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client] = useState(new QueryClient());

  return (
    <QueryClientProvider client={client}>
      {children}
      <ClientOnly>
        <ReactQueryDevtools initialIsOpen={false} />
      </ClientOnly>
    </QueryClientProvider>
  );
}
