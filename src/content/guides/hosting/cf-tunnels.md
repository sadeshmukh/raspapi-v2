---
title: Cloudflare Tunnels
description: Deploy your API, selfhosted, with  Cloudflare Tunnels.
order: 1
---

TODO: add images

Your API works! Fantastic. Now let's get it online so the world can access it.

There are many ways to host your API, but one of the easiest and most secure ways is using **Cloudflare Tunnels**. This method allows you to expose your local server to the internet without opening any ports on your router.

> However, you will need your own **domain** managed by Cloudflare. Flavortown offers domain grants, so [check it out](https://flavortown.hackclub.com) if you need one!

First, go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com) in your Dashboard.

Navigate to **Networks** > **Connectors**.

Then, click Create a Tunnel and select Cloudflared.

There will be a few setup commands available to run for different operating systems.

## Cloudflared with Docker

I would highly recommend using Docker if you plan to run more than one tunnel on your computer. But... we'll need to make a few changes to the setup command.

> **Note:** Not using Docker? Skip this section!

Docker allows us to run things in containers - in this case, Cloudflared. This means we don't have to install Cloudflared directly on our computer, and we can run multiple tunnels easily. Install for [Mac](https://docs.docker.com/desktop/setup/install/mac-install/), [Windows](https://docs.docker.com/desktop/setup/install/windows-install/), or [Linux](https://docs.docker.com/desktop/setup/install/linux/).

The setup command Cloudflare provides for Docker looks something like this:

```bash
docker run cloudflare/cloudflared:latest tunnel --no-autoupdate run --token ey...
```

We want it to run in the background and have access to your computer's networking to see your app, so let's add the `-d` flag after `run` and the `--network="host"` flag before `cloudflare/cloudflared:latest`:

```bash
docker run -d --network="host" cloudflare/cloudflared:latest tunnel --no-autoupdate run --token ey...
```

Run that command in your terminal.

## Pulling it together

Now, whether you're using Docker or not, you should have Cloudflared running on your computer. Configure it from the UI as such:

![image](https://hc-cdn.hel1.your-objectstorage.com/s/v3/e622da4df4849e23_image.png)

Add your domain, pick a subdomain you like, and tada! Your API is now live on the internet. Give yourself a round of applause.
