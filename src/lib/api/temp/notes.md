# cursor-notes

# Part 1: Core API Infrastructure

````markdown
# API Infrastructure

## Custom API Client (~/lib/api)

Our API client is built on `ky` with custom error handling and type safety.

### Basic Usage

```typescript
// GET request
const products = await api.get<Product[]>("/api/products");

// POST request with type safety
const newProduct = await api.post<Product>("api/products/add", {
  name: "Product",
  price: 99,
});
```
````

### Error Handling

All API responses are wrapped in a type-safe structure:

```tsx
interface APIResponse<T> {
  success: boolean;
  data: T;
}

interface APIErrorResponse {
  success: boolean;
  error?: ValidationError[];
  data?: unknown;
}
```

### Configuration

```tsx
// Enable auth token support
configureApi({ enableAuth: true });

// Set auth token
setAuthToken("your-jwt-token");
```

### Custom Instance Creation

```tsx
const customInstance = createKyInstance({
  baseURL: "<https://api.example.com>",
  timeout: 5000,
  headers: {
    "Custom-Header": "value",
  },
});
```

````jsx
# Part 2: State Management with TanStack Query

```markdown
# Custom State Management

## Atomic State Pattern

Our state management combines TanStack Query with Immer for immutable updates.

### Creating Basic State
```typescript
// Simple counter state
export const useCounter = createGlobalState("counter", { value: 0 });

// Usage
function Component() {
  const { data, setData } = useCounter();

  // Update with new value
  setData({ value: data.value + 1 });

  // Update with immer function
  setData(state => {
    state.value += 1;
  });
}
````

### Persisted State

```tsx
// State that persists in localStorage
export const useSettings = createGlobalState(
  "settings",
  { theme: "light", fontSize: "medium" },
  { persist: true },
);
```

### Derived State

```tsx
interface CartState {
  items: Array<{ id: number; price: number; quantity: number }>;
}

// Base cart state
export const useCartStore = createGlobalState<CartState>("cart", {
  items: [],
});

// Derived total calculation
export const useCartTotal = createDerivedState<CartState, number>(
  useCartStore,
  (state) =>
    state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
);

// Usage with actions
export const useCartActions = () => {
  const { setData } = useCartStore();

  const addItem = (item: CartItem) => {
    setData((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }
    });
  };

  return { addItem };
};
```

### Server State Integration

```tsx
// Query with proper typing
const { data: products } = useQuery({
  queryKey: ["products"],
  queryFn: async () => {
    const response = await api.get<Product[]>("/api/products");
    return response.success ? response.data : [];
  },
});

// Mutation with optimistic updates
const mutation = useMutation({
  mutationFn: async (values: CreateProductInput) => {
    return api.post<Product>("api/products/add", values);
  },
  onMutate: async (newProduct) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["products"] });

    // Snapshot the previous value
    const previousProducts = queryClient.getQueryData<Product[]>(["products"]);

    // Optimistically update
    queryClient.setQueryData<Product[]>(["products"], (old) => [
      ...(old ?? []),
      { id: "temp", ...newProduct },
    ]);

    return { previousProducts };
  },
  onError: (err, newProduct, context) => {
    // Rollback on error
    queryClient.setQueryData(["products"], context?.previousProducts);
  },
  onSettled: () => {
    // Refetch after error or success
    queryClient.invalidateQueries({ queryKey: ["products"] });
  },
});
```

````jsx
# Part 3: Hono API Routes

```markdown
# Hono API Implementation

## Route Structure
Our API routes use Hono with a consistent structure:

```typescript
// Base route setup (src/app/api/[[...route]]/route.ts)
const app = new Hono();
app.use("*", cors({
  origin: "*",
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization"]
}));

// Route registration
const routes = app.route("/api", indexRoute);

// Export for Next.js
export const GET = handle(app);
export const POST = handle(app);
````

## Controller Pattern

```tsx
// Example controller (product.controller.ts)
export const createProduct = async (c: Context) => {
  try {
    const { name, price } = await c.req.json();

    // Validation
    const result = productSchema.safeParse({ name, price });
    if (!result.success) {
      return c.json(validationErr(result.error), 400);
    }

    // Database operation
    const product = await prisma.product.create({
      data: { name, price },
    });

    return c.json(success(product));
  } catch (error) {
    return c.json(err("Failed to add product"));
  }
};
```

## Middleware Implementation

```tsx
// Auth middleware
export const authMiddleware = createMiddleware(async (c, next) => {
  try {
    const authHeader = c.req.header("Authorization");

    // Token validation logic
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const user = await validateToken(token);

      if (user) {
        c.set("user", user);
        return next();
      }
    }

    return c.json(err("Unauthorized"), 401);
  } catch (error) {
    return c.json(err("Authentication failed"), 401);
  }
});

// Usage in routes
productRoutes.post("/add", authMiddleware, createProduct);
```

## Response Utilities

```tsx
// Success response
return c.json(success({ id: 1, name: "Product" }));

// Error response
return c.json(err("Product not found"), 404);

// Validation error
return c.json(validationErr(zodError), 400);
```

````jsx
# Part 4: Authentication Flow

```markdown
# Authentication Implementation

## better-auth Setup

### Configuration
```typescript
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mongodb",
  }),
  emailAndPassword: {
    enabled: true,
  },
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [organization(), twoFactor(), admin(), bearer()],
});
````

### Client Usage

```tsx
// Sign in
const result = await authClient.signIn.email(
  {
    email,
    password,
  },
  {
    onSuccess: () => {
      toast.success("Signed in successfully");
      router.push("/dashboard");
    },
    onError: (ctx) => {
      setError(ctx.error.message);
    },
  },
);

// Sign out
await authClient.signOut();
```

### Token Generation

```tsx
// Generate API token
const token = sign(
  {
    sub: user.id,
    name: user.name,
    tokenType: "api",
  },
  process.env.BETTER_AUTH_SECRET!,
  { expiresIn: "30d" },
);
```

# Part 5: Database Models and Relations

````markdown
# Prisma MongoDB Implementation

## Core Models Structure

### User and Authentication Models

```prisma
model User {
  id               String       @id @map("_id")
  name             String
  email            String       @unique
  emailVerified    Boolean
  image            String?
  createdAt        DateTime
  updatedAt        DateTime
  twoFactorEnabled Boolean?
  role             String?
  banned           Boolean?
  banReason        String?
  banExpires       DateTime?

  // Relations
  sessions         Session[]
  accounts         Account[]
  members          Member[]
  invitations      Invitation[]
  twofactors       TwoFactor[]

  @@map("user")
}

model Session {
  id                   String   @id @map("_id")
  expiresAt            DateTime
  token                String   @unique
  userId               String
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  activeOrganizationId String?
  impersonatedBy       String?

  @@map("session")
}
```
````

### Organization Models

```
model Organization {
  id          String       @id @map("_id")
  name        String
  slug        String?      @unique
  logo        String?
  createdAt   DateTime
  metadata    String?

  // Relations
  members     Member[]
  invitations Invitation[]

  @@map("organization")
}

model Member {
  id             String       @id @map("_id")
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  role           String
  createdAt      DateTime

  @@map("member")
}
```

## Database Operations

### Repository Pattern

```tsx
// src/lib/repositories/user.repository.ts
export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        sessions: true,
        accounts: true,
      },
    });
  }

  async createWithOrganization(data: CreateUserInput) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          id: generateId(),
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const org = await tx.organization.create({
        data: {
          id: generateId(),
          name: `${user.name}'s Organization`,
          createdAt: new Date(),
          members: {
            create: {
              id: generateId(),
              userId: user.id,
              role: "OWNER",
              createdAt: new Date(),
            },
          },
        },
      });

      return { user, org };
    });
  }
}
```

### Usage in Controllers

```tsx
// src/app/api/[[...route]]/controllers/user.controller.ts
export const createUser = async (c: Context) => {
  try {
    const data = await c.req.json();
    const result = userSchema.safeParse(data);

    if (!result.success) {
      return c.json(validationErr(result.error));
    }

    const userRepo = new UserRepository(prisma);
    const { user, org } = await userRepo.createWithOrganization(result.data);

    return c.json(success({ user, org }));
  } catch (error) {
    return c.json(err("Failed to create user"));
  }
};
```

````jsx
# Part 6: Component Patterns and Form Handling

```markdown
# UI Component Implementation

## Form Pattern with Formik and Yup

### Base Form Structure
```typescript
// src/components/forms/ProductForm.tsx
interface ProductFormProps {
  initialValues?: Partial<Product>;
  onSubmit: (values: CreateProductInput) => Promise<void>;
}

export function ProductForm({ initialValues, onSubmit }: ProductFormProps) {
  const formik = useFormik({
    initialValues: {
      name: initialValues?.name ?? "",
      price: initialValues?.price ?? 0,
    },
    validationSchema: productSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSubmit(values);
        toast.success("Product saved successfully");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to save");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      <FormField
        name="name"
        label="Product Name"
        error={formik.touched.name ? formik.errors.name : undefined}
      >
        <Input
          id="name"
          {...formik.getFieldProps('name')}
          className={cn(
            formik.touched.name && formik.errors.name && "border-red-500"
          )}
        />
      </FormField>

      {/* Similar pattern for other fields */}
    </form>
  );
}
````

### Reusable Form Components

```tsx
// src/components/ui/FormField.tsx
interface FormFieldProps {
  name: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ name, label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

## Loading States Pattern

### Loading Component

```tsx
// src/components/ui/LoadingState.tsx
interface LoadingStateProps {
  loading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

export function LoadingState({
  loading,
  error,
  children,
  loadingComponent = <DefaultLoader />,
  errorComponent = <DefaultError />,
}: LoadingStateProps) {
  if (loading) return loadingComponent;
  if (error) return errorComponent;
  return children;
}

// Usage
<LoadingState
  loading={isLoading}
  error={error}
  loadingComponent={
    <div className="flex justify-center">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  }
>
  <ProductList products={products} />
</LoadingState>;
```

## Data Fetching Pattern

### Query Hook Pattern

```tsx
// src/hooks/useProducts.ts
export function useProducts(options?: UseQueryOptions<Product[]>) {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await api.get<Product[]>("/api/products");
      return response.success ? response.data : [];
    },
    ...options,
  });
}

// src/hooks/useProduct.ts
export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const response = await api.get<Product>(`/api/products/${id}`);
      return response.success ? response.data : null;
    },
    enabled: !!id,
  });
}

// Usage
function ProductPage({ id }: { id: string }) {
  const { data: product, isLoading } = useProduct(id);

  return (
    <LoadingState loading={isLoading}>
      <ProductDetails product={product} />
    </LoadingState>
  );
}
```

# Part 7: Error Handling Patterns

````markdown
# Comprehensive Error Handling

## API Error Structure

### Error Types

```typescript
// src/lib/api/types.ts
export interface ValidationError {
  code: string;
  message: string;
  path?: string[];
}

export interface APIErrorResponse {
  success: boolean;
  error?: ValidationError[];
  data?: unknown;
}

export class ApiError extends Error {
  public statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}
```
````

### Error Handling Middleware (Hono)

```tsx
// src/app/api/[[...route]]/middleware/error.ts
export const errorHandler = createMiddleware(async (c, next) => {
  try {
    await next();
  } catch (error) {
    console.error("API Error:", error);

    if (error instanceof ZodError) {
      return c.json(validationErr(error), 400);
    }

    if (error instanceof ApiError) {
      return c.json(err(error.message), error.statusCode || 500);
    }

    // Prisma error handling
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          return c.json(err("Duplicate entry found"), 409);
        case "P2025":
          return c.json(err("Record not found"), 404);
        default:
          return c.json(err("Database error occurred"), 500);
      }
    }

    return c.json(err("Internal server error"), 500);
  }
});
```

### Frontend Error Boundary

```tsx
// src/components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Something went wrong</h2>
            <p className="text-muted-foreground mt-2">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Query Error Handling

```tsx
// src/hooks/useQueryWithError.ts
export function useQueryWithError<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<APIResponse<T>>,
  options?: UseQueryOptions<T>,
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const response = await queryFn();
        if (!response.success) {
          throw new Error(response.error?.[0]?.message || "Query failed");
        }
        return response.data;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Query failed");
        throw error;
      }
    },
    ...options,
  });
}
```

````jsx
# Part 8: Performance Optimization Strategies

```markdown
# Performance Optimizations

## React Query Optimizations

### Query Configuration
```typescript
// src/components/providers/ReactQueryProvider.tsx
export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            cacheTime: 1000 * 60 * 30, // 30 minutes
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
````

### Optimistic Updates

```tsx
// src/hooks/useOptimisticMutation.ts
export function useOptimisticMutation<T, TInput>(
  queryKey: QueryKey,
  mutationFn: (input: TInput) => Promise<APIResponse<T>>,
  optimisticUpdate: (input: TInput, oldData?: T[]) => T[],
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<T[]>(queryKey);

      queryClient.setQueryData<T[]>(queryKey, (old) =>
        optimisticUpdate(newData, old),
      );

      return { previousData };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(queryKey, context?.previousData);
      toast.error(err instanceof Error ? err.message : "Operation failed");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// Usage
const addProductMutation = useOptimisticMutation(
  ["products"],
  (input: CreateProductInput) => api.post<Product>("api/products/add", input),
  (input, oldData = []) => [...oldData, { id: "temp", ...input }],
);
```

## Component Optimization

### Memoization Pattern

```tsx
// src/components/ProductCard.tsx
interface ProductCardProps {
  product: Product;
  onEdit: (id: string) => void;
}

export const ProductCard = memo(
  function ProductCard({ product, onEdit }: ProductCardProps) {
    const handleEdit = useCallback(() => {
      onEdit(product.id);
    }, [product.id, onEdit]);

    return (
      <Card>
        <CardHeader>
          <CardTitle>{product.name}</CardTitle>
        </CardHeader>
        <CardFooter>
          <Button onClick={handleEdit}>Edit</Button>
        </CardFooter>
      </Card>
    );
  },
  (prev, next) => prev.product.id === next.product.id,
);
```

### Virtual List for Large Data

```tsx
// src/components/VirtualizedList.tsx
import { useVirtualizer } from "@tanstack/react-virtual";

export function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = 50,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  estimateSize?: number;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
  });

  return (
    <div ref={parentRef} className="h-[500px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              transform: `translateY(${virtualItem.start}px)`,
              width: "100%",
            }}
          >
            {renderItem(items[virtualItem.index])}
          </div>
        ))}
      </div>
    </div>
  );
}

// Usage
<VirtualizedList
  items={products}
  renderItem={(product) => <ProductCard key={product.id} product={product} />}
/>;
```

### Image Optimization

```tsx
// src/components/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
}: OptimizedImageProps) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-md">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={priority}
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  );
}
```

### Route-Based Code Splitting

```tsx
// src/app/page.tsx
const ProductForm = dynamic(() => import("~/components/ProductForm"), {
  loading: () => <ProductFormSkeleton />,
  ssr: false,
});

const Chart = dynamic(() => import("~/components/Chart"), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```
