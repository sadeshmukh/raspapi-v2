---
title: Making an API in C (with Mongoose)
description: Build a simple API using the mongoose library in C
order: 2
---

This guide is aimed towards people who want to build their **own API in C**!
Before we start, it would be useful to have the [Mongoose documentation](https://mongoose.ws/documentation/) open, I find that it's pretty understandable, even for beginners.

This is a great idea if you want to learn deeper into how things work behind the curtains, especially if your used to doing things where the library handles a good chunk of things for you.

Please note that unlike Python or some other languages, C is a compiled language, not interpreted.
This means that you will have to re-compile your code every time you want to test it.

If you want a guide on the best setup for debugging and testing code in C, please refer to [this tutorial](https://www.tutorialspoint.com/cprogramming/c_environment_setup.htm). It explains in detail how to set up your C environment and using it with an IDE.

To start, please copy [mongoose.c](https://raw.githubusercontent.com/cesanta/mongoose/master/mongoose.c) and the [mongoose.h](https://raw.githubusercontent.com/cesanta/mongoose/master/mongoose.h) header file to your source tree.

Now, make a C file called `main.c` and open it up, lets get some code in here!

```c
#include "mongoose.h" // Including the dependency
#include <time.h> // For time() so you don't have issues compiling, we can use this later.

int main() {
    struct mg_mgr mgr; // This is the mongoose event manger, it holds all connections
    mg_mgr_init(&mgr); // Initialize the event manager
    
    mg_http_listen(&mgr, "http://0.0.0.0:8000", fn, NULL);   // Setup HTTP listener
    mg_http_listen(&mgr, "https://0.0.0.0:8443", fn, NULL);  // Setup HTTPS listener

    while (true) {
        mg_mgr_poll(&mgr, 1000);
    }

    return 0;
}
```

All this code is doing is including the dependency for mongoose you added earlier and basic things like the event manager and setting up an infinite event loop with `while (true)`.

Mongoose has two basic data structures that you need to know:

- ``struct mg_mgr`` - An event manager that holds all active connections
- ``struct mg_connection`` - A single connection descriptor

Now, lets make an event handler function, the above code shouldn't of worked because in this line:
```c
mg_http_listen(&mgr, "http://0.0.0.0:8000", fn, NULL);   // Setup HTTP listener
```
We put in "fn" as a parameter instead of our event handler function.

The most basic way to make an event handler function that handles requests would be something like this:

```c
static void ev_handler(struct mg_connection *c, int ev, void *ev_data) {
    if (ev == MG_EV_HTTP_MSG) {  // New HTTP request received
    struct mg_http_message *hm = (struct mg_http_message *) ev_data; // * is a pointer in C, it is storing the memory address of the struct, not the struct itself.
    // hm in this case just stands for HTTP message, nothing special.

    if (mg_match(hm->uri, mg_str("/api/hello"), NULL)) {
        mg_http_reply(c, 200, "", "{%m:%d}\n", MG_ESC("status"), 1);
    } else {
      struct mg_http_serve_opts opts = {.root_dir = ".", .fs = &mg_fs_posix};
      mg_http_serve_dir(c, hm, &opts);  // For all other URLs, Serve static files
    }
}
```

> Note that the line:
> ```c
> struct mg_http_serve_opts opts = {.root_dir = ".", .fs = &mg_fs_posix};
> ```
> mg_fs_posix is the default POSIX filesystem implementation that Mongoose provides. It knows how to read files from your disk using standard functions like open, read, stat, etc.
> .fs is required because Mongoose abstracts the filesystem. In theory, you could provide your own custom filesystem (like in-memory, embedded resources, or something virtual).
> So .fs = &mg_fs_posix basically tells Mongoose: “Use the normal OS filesystem to find and serve files.”

Now that you have that that function, go ahead and change that line of code from earlier to include the function name:

```c
mg_http_listen(&mgr, "http://0.0.0.0:8000", ev_handler, NULL);   // Setup HTTP listener
mg_http_listen(&mgr, "http://0.0.0.0:8443", ev_handler, NULL);   // Setup HTTPS listener
```

Now, you've set up basic code that serves on port 8000 and 8443, compile it using a command similar to this (for mac or linux, for windows search up how to compile, I haven't personally worked with it but the C compiler on windows is great I've heard!):

```c
gcc -o main main.c mongoose.c // Where main is the executable name, and you are compiling main.c and linking mongoose.c to it.
./main
```

If you head over to https://localhost:8000 or https://localhost:8443, you should see that you have your basic setup done!
What you effectively now have set up is a single route.

## Creating Different Endpoint Types:
Right now the simple server you have set up only checks for a single route:

```c
/api/hello
```
If the request matches that path, the server returns a JSON response, otherwise it serves static files.

## Implementing different types of requests

However, real APIs usually have multiple endpoints and different request types like `GET` and `POST`.

The parsed HTTP request stored in struct mg_http_message contains two important fields:

- `hm->uri` — the request path (for example /api/hello)
- `hm->method` — the HTTP method (GET, POST, etc.)

You can use these to create multiple endpoints. You need at least 3 GET endpoints and 1 POST endpoint to submit your project.

Example:

```c
static void ev_handler(struct mg_connection *c, int ev, void *ev_data) {
  if (ev == MG_EV_HTTP_MSG) {
    struct mg_http_message *hm = (struct mg_http_message *) ev_data;

    // GET /api/hello
    if (mg_match(hm->uri, mg_str("/api/hello"), NULL) &&
        mg_match(hm->method, mg_str("GET"), NULL)) {

      mg_http_reply(c, 200, "", "{\"message\":\"hello\"}");

    // GET /api/time
    } else if (mg_match(hm->uri, mg_str("/api/time"), NULL) &&
               mg_match(hm->method, mg_str("GET"), NULL)) {

      mg_http_reply(c, 200, "", "{\"time\": %lu}", (unsigned long) time(NULL));

    // GET /api/status
    } else if (mg_match(hm->uri, mg_str("/api/status"), NULL) &&
               mg_match(hm->method, mg_str("GET"), NULL)) {

      mg_http_reply(c, 200, "", "{\"status\":\"ok\"}");

    // POST /api/echo
    } else if (mg_match(hm->uri, mg_str("/api/echo"), NULL) &&
               mg_match(hm->method, mg_str("POST"), NULL)) {

      mg_http_reply(c, 200, "", "{\"you_sent\":\"%.*s\"}",
                    (int) hm->body.len, hm->body.buf);

    } else {
      struct mg_http_serve_opts opts = {.root_dir = ".", .fs = &mg_fs_posix};
      mg_http_serve_dir(c, hm, &opts);
    }
  }
}
```

This code looks very daunting at first, but all it's really doing is giving different outputs based on whether the user is sending a GET or POST request, there are other types of things you can manage using Mongoose and I highly encourage messing around with things for your own project!

> Note: In formatted I/O functions in C, % is a format specificier where you specify the type, and then write the value afterwards, it can take a bit to get used to.

If you want to learn more about types of API requests, look into [this blog post](https://rehanpinjari.medium.com/understanding-the-different-types-of-api-calls-a-complete-guide-d31cfbf66f89), it explains things in a pretty simple way.

If you want to take a look into the Mongoose documentation, take a look [here](https://mongoose.ws/documentation/) (they have amazing documentation).

# CORS Implementation
CORS (cross-origin-resource-sharing) is a security feature in web browsers that blocks requests to your API from domains of your choice, if you want to let any domain on the internet access your API, go ahead and pop this into your file in the `ev_handler` method:

```c
if (...) {
// Send CORS headers for every response
    mg_printf(c,
    "Access-Control-Allow-Origin: *\r\n"
    "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
    "Access-Control-Allow-Headers: Content-Type\r\n");

    if (mg_vcmp(&hm->method, "OPTIONS") == 0) {
        mg_http_reply(c, 200, "", "");  // Empty response to "approve"
        return;
    }

    // Rest of your implementation here stays the same
}
```

The first part is basically just stating what the CORS configuration is, and the second part handles `options` requests, basically the browsers way of asking what the policy is on CORS for your API.

Thats it! I hope that with the knowledge you gained from this guide, you figured out how to atleast get started.
Next, you should come up with a creative idea (doesn't have to be very complex), and figure out how to integrate the [requirements](https://raspapi.halceon.dev/guides/about) into your project!

If you have any questions, you can message **Samhith (me)** on Slack, and I'd be happy to help with a lot of things!