ngrok http 3000 --host-header="localhost:3000"
ngrok http 8080 --host-header="localhost:8080"

kill -9 $(lsof -t -i:3000)



ngrok http --host-header=rewrite 3000

ctrl + shift + i : reformat file
ctrl + G : organise imports