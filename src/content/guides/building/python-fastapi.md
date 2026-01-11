---
title: Python (with FastAPI and uv)
description: Build a simple API using FastAPI and uv in Python.
order: 1
---

Let's build a simple API with **FastAPI** with Python! Before we get started, make sure you have `uv` [installed](https://docs.astral.sh/uv/getting-started/installation/). This lets us use **virtual environments**, which keeps each project in its own isolated space.

To create a new project, create a new directory and navigate into it. Then, run `uv init` to set up a new uv project:

```bash
mkdir myraspapi
cd myraspapi
uv init
```

Next in our terminal, let's install FastAPI and uvicorn (the server that will run our API) into our virtual environment:

```bash
uv add fastapi uvicorn
```

Open that folder in your editor of choice. You'll notice a few files here set up for you. Our code will sit in `main.py`, so let's open it up.

> **Note:** If you ever run into an error such as `ModuleNotFoundError: No module named 'fastapi'`, try running `source .venv/bin/activate` to manually activate the virtual environment created by uv.

Next, let's add some code to `main.py` to create our very first API endpoints!

```python
from fastapi import FastAPI
import uvicorn

app = FastAPI()
@app.get("/hello")
def hello():
    return {"message": "Hello, RaspAPI!"}

uvicorn.run(app)
```

And let's run it:

```bash
uv run main.py --reload
```

> **Note:** The `--reload` flag makes sure the server restarts whenever you make changes to the code. When you deploy your API later, you can remove this.

You should see something like:

```
INFO:     Started server process [712345162]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

Ctrl-click or open `http://localhost:8000/hello` in your browser, and you should see:

```json
{
  "message": "Hello, RaspAPI!"
}
```

Great! You've built your first API endpoint with FastAPI. Now, any Python code you write inside that function will run whenever someone accesses that endpoint.

TODO: add more to guide
