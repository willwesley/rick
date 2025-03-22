# UCCS Spring 2025 CS3110 Live Project

This is the repo containing the stuff written in class to demonstrate various vanillajs capabilities and stuff.
It will evolve.

The `html` directory contains our *static* web resources, such as HTML, CSS, JavaScript to run in the browser, images, fonts, and Rick Astley videos.
The `jsapp` directory contains the JavaScript and supporting files

## Setup Notes

In class we experienced a couple nightmares, the commands for which have been lost to time, but reproduced below.

### Production Environment

We set up nanode servers on Linode running Debian 12.
We used freedns.afraid.org to set up DNS A records pointing at the IP address of our servers.
On these servers we installed `nginx`, `cerbot`, and `nodejs`.

```bash
# install nginx
apt-get update
apt-get install nginx
# install certbot
apt-get install python3 python3-venv libaugeas0
python3 -m venv /opt/certbot/
/opt/certbot/bin/pip install certbot certbot-nginx
ln -s /opt/certbot/bin/certbot /usr/bin/certbot
# install nodejs
curl -fsSL https://deb.nodesource.com/setup_23.x | sudo bash -
sudo apt-get install -y nodejs
```

We used `certbot` to install a certificate issued by Let's Encrypt in our nginx server:

```bash
certbot --nginx
```

At this point we were able to visit our server using HTTPS on a domain, which was serving files from `/var/www/html/` on our Linode server.
The example I demonstrated is https://rickastley.mooo.com.

We created a custom server application using `nodejs` and set it up as a `systemd` service.
The content of our server was at `/var/www/jsapp/index.js` and is as follows:

```js
#!/usr/bin/env node
const http = require("http")
const handleRequest = (req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" })
  res.write("Good afternoon!")
  res.end()
};
const server = http.createServer(handleRequest)
server.listen(3000);
```

Then we created `/etc/systemd/system/jsapp.service` with the following content:

```ini
[Unit]
Description=Wow Service

[Service]
ExecStart=/var/www/jsapp/index.js
Restart=always
User=root
Group=nogroup
WorkingDirectory=/var/www/jsapp

[Install]
WantedBy=multi-user.target
```

And then we executed the following commands:

```bash
# set executable permission bit
chmod +x /var/www/jsapp/index.js
# enable and start service
systemctl enable jsapp
systemctl start jsapp
```

Some of us needed to troubleshoot errors emitted by the service using the following two commands:

```bash
systemctl status jsapp
journalctl -u jsapp
```

And then it came to pass that we configured `nginx` to forward requests for resources under `/api` to our `nodejs` server.
To do this we added a `location` block to our default site configuration and then restarted nginx using `systemctl restart nginx`.
We added the block just after the existing `location /` block in the `server` block containing `ssl` instructions added by `certbot`:

```
location /api {
    proxy_set_header Host $host;
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

At this point, in addition to getting static files over HTTPS, we were able to get a response from our custom application as well, by going to `/api` on our host over HTTPS.
I demonstrated `https://rickastley.mooo.com/api`.

### Development Environment

In order to act like professionals, we created a local development environment similar to the production environment on our local workstations.

We installed `nodejs` locally.
For me it was exactly the same as doing it on the server.
For the rest of us, we followed instructions on the nodejs website for our respective operating systems.

We also installed the `nodemon` and `http-server` packages, "globally" (`-g`).

```bash
npm install -g nodemon http-server
```

We used `nodemon` to watch files in our `jsapp` directory and restart our custom application whenever a change occurred.

```bash
cd jsapp
nodemon index.js
```

In another terminal, we then ran `http-server` in a mode to stand-in for `nginx` locally (but without SSL and lots of other configuration needed).

```bash
cd html
http-server -P http://localhost:3000
```

At this point, we were able to modify files in both `jsapp` and `html`, refresh the browser window, and see our changes *locally* at `http://localhost:8080`.
Edits to files in `jsapp` resulted in the server restarting.

### Deployment

I demonstrated using a bash script to `scp` the relevant files from the local folders to the linode host and then restarting the `jsapp` service via `ssh`.
I also mentioned this is janky as janks can be, but it's pretty sufficient for what we're doing right now.

## Authentication and Authorization

We've added `Basic` HTTP authentication to our app.
We've created a function to extract the username and password from the HTTP `Authorization` header if present, authenticate that information in our users map, and return the username if authenticated or `undefined` if not.

We also are hashing (with salt and pepper) the passwords we're storing in that file.
We are using NodeJS's built in `crypto` library to create an HMAC that uses `sha256`.
The reader is encouraged to research the truth, but we're going to be abusive to the truth and say that in doing this we're "peppering" our hashes.
*Peppering* a hash is when we add a secret string to our passwords before performing the hash.
We are, in fact, salting our password hashes with the user's username.

We initially created a password for a single user in our password database manually.
In order to get that hash, we used the `hash` function we defined on lines 7 and 8 of `jsapp/index.js` to hash a password concatenated with the username.
This gives us a salted and peppered hash of the password:

```js
console.log(
  hash('dastley' + 'rick')
)
```

To authorize users, since we only have two levels of authorization, we consider anyone who can authenticate at least an "author," and users whose names are in the `admins` array to be admins.
We actually have a third level of authorization for unauthenticated, or anonymous, users.
All users can `GET` the list of dancers.
Authors and above can `POST`, `PUT`, and `DELETE` dancers.
Only admins can `GET`, `POST`, `PUT`, and `DELETE` to the `/api/admin` path, where user administration is performed.
