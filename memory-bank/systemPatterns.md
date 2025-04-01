# System Patterns & Technical Decisions

## Architecture Patterns

### 1. Server-Side Components

```typescript
// Example pattern for data fetching
async function EmailList({ userId }: { userId: string }) {
  const emails = await fetchUserEmails(userId);
  return (
    <ul>
      {emails.map((email) => (
        <EmailItem key={email.id} email={email} />
      ))}
    </ul>
  );
}
```

**Rationale:**

- Reduced client-side JavaScript
- Better initial page load
- SEO optimization
- Secure data fetching

### 2. Client-Side Patterns

#### State Management

```typescript
// React Query pattern for email data
export function useEmails(userId: string) {
  return useQuery({
    queryKey: ["emails", userId],
    queryFn: () => fetchUserEmails(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

**Benefits:**

- Automatic caching
- Background refetching
- Optimistic updates
- Request deduplication

### 3. Route Handlers

```typescript
// API route pattern
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const result = await processEmailClassification(data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Classification failed" },
      { status: 500 }
    );
  }
}
```

## Data Management

### 1. Database Access

```typescript
// Prisma pattern for type-safe queries
export async function getUserPreferences(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      emailRules: true,
      preferences: true,
    },
  });
}
```

### 2. Caching Strategy

```typescript
// Redis caching pattern
export async function getCachedClassification(emailHash: string) {
  const cached = await redis.get(`classification:${emailHash}`);
  if (cached) {
    return JSON.parse(cached);
  }
  const classification = await classifyEmail(emailHash);
  await redis.setex(
    `classification:${emailHash}`,
    3600, // 1 hour
    JSON.stringify(classification)
  );
  return classification;
}
```

## Component Patterns

### 1. Compound Components

```typescript
// Email interface components
const Email = {
  Root: ({ children }: PropsWithChildren) => (
    <div className="email-container">{children}</div>
  ),
  Header: ({ subject, from }: EmailHeaderProps) => (
    <div className="email-header">
      <h3>{subject}</h3>
      <span>{from}</span>
    </div>
  ),
  Body: ({ content }: EmailBodyProps) => (
    <div className="email-body">{content}</div>
  ),
  Actions: ({ onArchive, onLabel }: EmailActionProps) => (
    <div className="email-actions">
      <button onClick={onArchive}>Archive</button>
      <button onClick={onLabel}>Label</button>
    </div>
  ),
};
```

### 2. Error Boundaries

```typescript
// Custom error boundary pattern
export class EmailErrorBoundary extends React.Component<
  PropsWithChildren<{
    fallback: React.ReactNode;
  }>
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

### 3. ShadCN UI Component Pattern

```typescript
// Reusable UI component pattern with ShadCN
import * as React from "react"
import { cn } from "@/lib/utils"

// Base component with TypeScript props
function EmailCard({
  className,
  email,
  onSelect,
  ...props
}: EmailCardProps) {
  return (
    <Card
      data-selected={email.selected ? true : undefined}
      className={cn(
        "transition-colors hover:bg-accent",
        email.selected && "bg-accent",
        className
      )}
      {...props}
    >
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Avatar className="mt-1">
          <AvatarFallback>{getNameInitials(email.from)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <CardTitle>{email.subject}</CardTitle>
          <CardDescription className="line-clamp-1">{email.from}</CardDescription>
        </div>
        <EmailBadge priority={email.priority} />
      </CardHeader>
      <CardContent className="line-clamp-2 text-sm">
        {email.preview}
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="sm" onClick={() => onSelect(email.id)}>
          View
        </Button>
        <Separator orientation="vertical" className="mx-2 h-4" />
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/email/${email.id}/reply`}>Reply</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

// Type definition for component props
interface EmailCardProps extends React.ComponentProps<typeof Card> {
  email: Email;
  onSelect: (id: string) => void;
}
```

**Benefits:**

- Consistent UI through component composition
- Strong typing with React.ComponentProps
- Extensible with className and spread props
- Accessibility built-in through ShadCN primitives
- Tailwind-based styling for maintainability

## Authentication Pattern

### 1. Route Protection

```typescript
// Middleware pattern for auth
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
```

### 2. Session Management

```typescript
// Session handling pattern
export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
```

## API Integration Patterns

### 1. Gmail API

```typescript
// Rate limiting pattern
class GmailAPIClient {
  private queue: Queue;
  private rateLimiter: RateLimiter;

  async fetchEmails(options: FetchOptions) {
    return this.rateLimiter.execute(() =>
      this.queue.add(() => this.api.users.messages.list(options))
    );
  }
}
```

### 2. OpenAI Integration

```typescript
// Retry pattern for AI requests
async function classifyWithRetry(
  email: Email,
  options: ClassificationOptions
): Promise<Classification> {
  const retrier = new Retrier({
    maxAttempts: 3,
    backoff: exponential(1000),
  });

  return retrier.execute(async () => {
    try {
      return await openai.createCompletion({
        model: "gpt-4-turbo-preview",
        prompt: generatePrompt(email),
        ...options,
      });
    } catch (error) {
      if (error.code === "rate_limit_exceeded") {
        throw new RetryableError(error);
      }
      throw error;
    }
  });
}
```

## Testing Patterns

### 1. Component Testing

```typescript
// Testing pattern with React Testing Library
describe("EmailItem", () => {
  it("renders email details correctly", () => {
    const email = mockEmail();
    render(<EmailItem email={email} />);

    expect(screen.getByText(email.subject)).toBeInTheDocument();
    expect(screen.getByText(email.from)).toBeInTheDocument();
  });
});
```

### 2. API Testing

```typescript
// API route testing pattern
describe("Classification API", () => {
  it("classifies email correctly", async () => {
    const response = await fetch("/api/classify", {
      method: "POST",
      body: JSON.stringify(mockEmail()),
    });

    const data = await response.json();
    expect(data.category).toBeDefined();
    expect(data.priority).toBeGreaterThanOrEqual(1);
  });
});
```
