# To run the emqx broker with the conifgs ,credentials and env variables

This is if you want to run it on your own , without docker compose

```bash
docker run -d --name emqx-test \
  -p 1883:1883 \
  -p 18083:18083 \
  -v $(pwd)/emqx/emqx.conf:/opt/emqx/etc/emqx.conf \
  -v $(pwd)/emqx/auth-built-in-db-bootstrap.csv:/opt/emqx/etc/auth-built-in-db-bootstrap.csv \
  --env-file .env \
  emqx/emqx:5.8.0
```
