# Demo Configuration

For easy running of the system , these are some pre built configuration files that can be used to run the system in a demo mode.

Run Nginx with the provided configuration file to reverse proxy the services to the correct ports.

from the project root

```bash

docker run -d --name nginx-demo \
  -p 80:80 \
  -p 443:443 \
  -p 1884:1883 \
  -v $(pwd)/demo/nginx.docker.conf:/etc/nginx/nginx.conf:ro \
  -v $(pwd)/demo/certs:/etc/nginx/certs:ro \
  nginx:latest

```

If you're running nginx on your local machine , run the following from the demo dir

```bash

nginx -c $(pwd)/demo/nginx.self.conf

```
