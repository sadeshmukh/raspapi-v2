---
title: Typescript (with Hono)
description: Build an API with Hono, a lightweight framework (easily deployed to Workers).
order: 3
---

It's time to build an API with Typescript! Before we get started, make sure you've [installed](https://bun.com/docs/installation) `bun`. You can use `node`, but `bun` is lighter & is easier to work with in my experience.

To start off, let's create a new project with `bun create hono@latest`. One of the best parts of `hono` is how easy it is to deploy - I would suggest picking `cloudflare-workers` for ease of deployment later, but any of the other options work as well! After that's done, open up `src/index.ts`. You should see the following there:

```typescript
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
```

Let's test it out! Run it with `bun dev`, and you'll get a nice clean port to run it on (localhost:8788 if you're using Cloudflare Workers' Wrangler).

To add more routes, just add more `app.get()`, `app.post()`, etc. calls:

```typescript
app.get("/hello", (c) => {
  return c.json({ message: "Hello, RaspAPI!" });
});

app.post("/echo", async (c) => {
  const body = await c.req.json();
  return c.json({ you: body });
});
```

## Taking input

How do we take input from users for our API? We can use query, path, and body parameters.

Query parameters are what you see after the "?" in a URL. For example, in Youtube, we have links in the form: `https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=19s`. Here, `v` represents the video ID, and `t` represents the timestamp. They generally modify what you see, in some manner, so they're generally used as options.

```typescript
app.get("/double", (c) => {
  const x = Number(c.req.query("x")); // this isn't automatically validated, so it'll just be NaN if this isn't a number submitted
  return c.json({ result: x * 2 });
});
```

Path parameters are parameters of, well, the path, and are generally used for data about some specific thing (e.g. user, blog post, etc.).

Path parameters (`/hello/world`):

```typescript
app.get("/hello/:name", (c) => {
  const name = c.req.param("name");
  return c.json({ message: `Hello, ${name}!` });
});
```

Body parameters are not in the URL itself, and aren't present in GET requests. If you've got something you're sending _to_ the server, this is what you should be using.

Body parameters (POST with JSON):

```typescript
type JellyBeans = {
  flavor: string;
  color: string;
  quantity: number;
};

app.post("/eatbeans", async (c) => {
  const { flavor, color, quantity } = await c.req.json<JellyBeans>(); // this indicates the response type we should expect
  return c.json({
    message: `You ate ${quantity} ${color} ${flavor} jellybeans!`,
  });
});
```

## CORS

CORS, by defaults, prevents your API from being invoked from other browsers. If you'd like to allow this API to be used in the browser by other websites, make sure to configure this to allow it.

```typescript
import { cors } from "hono/cors";

app.use(
  cors({
    origin: "*", // customize this to only allow certain domains!
  }),
);
```

## Persisting data

Usually, an API needs to store some kind of data, be it user info, items in a shop, balances for a banking system. This is done with databases.

There are many types of databases: you might have heard of PostgreSQL, MySQL, SQLite, etc. For our API, since we're using Cloudflare Workers already, the obvious choice is Cloudflare D1, a serverless, SQLite-like database.

Let's build a simple reminders API! It will support creating and listing reminders. (As a challenge, after you complete this guide, implement updating, deleting, and completing reminders too!)

To set up D1, we need to configure Cloudflare Workers to let it know we need a D1 database. Run this command: `bunx wrangler d1 create hono-reminders`. You can change `hono-reminders` to whatever you want to call your database.

Wrangler will ask you these questions, to which you should answer:

```plaintext
✔ Would you like Wrangler to add it on your behalf? … yes
✔ What binding name would you like to use? … MY_DB
✔ For local dev, do you want to connect to the remote resource instead of a local resource? … no
```

This will automatically update your `wrangler.jsonc` configuration file with your changes. Finally, we need to let TypeScript know about our new database by running this command: `bun cf-typegen`. This will generate the required TypeScript declarations that let us use your D1 database in code.

## Using our database

Now we're ready to use our database in our code! Go back to your `src/index.ts` file and make the following changes:

```typescript
// Replace your `const app = new Hono()` with this line

const app = new Hono<{Bindings: CloudflareBindings}>()

// Add the following type and API endpoints

type Reminder = {
  id: number;
  text: string;
  due_at: number; // unix timestamp in seconds
};

// Fetch a list of reminders
app.get("/reminders", async (c) => {
  const { results } = await c.env.MY_DB.prepare(
    "SELECT * FROM reminders",
  ).all<Reminder>();
  return c.json(results);
});

// Create a new reminder
app.post("/reminders", async (c) => {
  const { text, due_at } = await c.req.json<Omit<Reminder, "id">>();
  const reminder = await c.env.MY_DB.prepare(
    "INSERT INTO reminders(text, due_at) VALUES(?, ?) RETURNING *",
  )
    .bind(text, due_at)
    .first<Reminder>();
  return c.json(reminder!);
});
```

If you know SQL, the de facto language used to query databases, you'll understand what the database methods above do. If you don't, it should be quite intuitive as it's designed to model English! We can see that the first endpoint selects, or gets, a list of reminders from the database and returns them, and the second endpoint inserts our new reminder into the database.

> If you want to learn more about SQL, you can check out [this W3Schools tutorial series](https://www.w3schools.com/sql/)!

## Database schema

Now, if you navigate to `http://localhost:8788/reminders`, you'll see... an `Internal Server Error`! This is because we didn't tell the database what types to expect beforehand, so it has no idea what a "reminder" is. We must first define a _schema_, which informs the database of the _tables_, or types, that will be stored.

Create a text file called `init.sql` and write the following:

```sql
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    due_at REAL NOT NULL
);
```

This creates a table called `reminders` with three fields: `id`, `text`, and `due_at`. Now, run this command to apply thie schema to the database: `bunx wrangler d1 execute MY_DB --local --file init.sql`.

> The `--local` in the command means to execute on the local copy of the database, which is created automatically by Wrangler to streamline development. The `--remote` command, which we'll use later, runs the script on the actual database on Cloudflare's servers.

Now if you refresh your browser, you should see an empty array! If you make a POST request to `http://localhost:8788/reminders` with a JSON body like `{"text": "do homework", "due_at": 1774944592}`, you'll see your newly created reminder in your browser when you refresh again. (You can use cURL, Python, or any other tool to make the request.)

## Testing your API

Hono has a builtin helper that lets us call the app and test it without making actual network requests. Here's how we can see how it'll handle certain input. First, make a new file called `index.test.ts` right next to `index.ts`. Add the following imports:

```typescript
import { describe, it, expect } from "bun:test";
import app from "./index";

describe("GET /", () => {
  it("returns hello", async () => {
    // ^^ the label here is just a label that gets printed later
    const res = await app.request("/");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Hello Hono!");
  });
});
```

Now, just run `bun test` to see how they do!

## Deploying

Cool. Let's get our API out there now!

```bash
bun run deploy
```

Log in, follow the steps, and that's it. It'll give you a URL where it's deployed, no need to go through any other deployment steps. Also, remember to run `bunx wrangler d1 execute MY_DB --remote --file init.sql --yes` to update your production database with your newest schema.

Remember to check the [requirements](/guides/about) before submitting!
