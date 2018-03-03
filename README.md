# MAPP
Mathematical Application: a binary expression simplification tool.

## Setup
1. Install version 9.6.1 of Node.
2. Run `npm install` in your terminal.
3. Run `npm start` in your terminal to start a server. In order to control the server make sure to install pm2 through `npm install pm2 -g`
4. In your browser, visit [http://localhost:4000/](http://localhost:4000/) to access the application.
5. Enter your boolean expression and hit submit!
6. To stop the server, run `pm2 stop WebServer` and `pm2 stop API`

## Notes
The Web Server is running on localhost:4000 and the API is running on localhost:3000. 
