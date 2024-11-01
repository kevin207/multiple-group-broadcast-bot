# MULTIPLE GROUP BROADCAST TELEGRAM BOT

## REQUIREMENTS
- Code editor (VsCode, etc)
- Database (PostgreSQL, etc)
- ORM to interact with database (Prisma, etc)
- Node.js installed on device (We're gonna use javascript/typescript)

## PACKAGE DEPEDENCIES
- dotenv (to store & use sensitive variable on .env file) -> npm i dotenv
- ts-node (to compile typescript file) -> npm i ts-node
- node-telegram-bot-api -> npm i node-telegram-bot-api
- typescript -> npm i typescript
- prisma client -> npm i @prisma-client
- nodemon (to watch code changes) -> npm i -g nodemon
- pm2 (to run instance on actual server) -> npm i pm2
- npm i @types/node-telegram-bot-api -> typescript support for node-telegram-bot-api

## STEP TO RUN BOT
- Create telegram bot from @botfather (get the bot token)
- Setup databases (get the connection url)
- Get your telegram user ID (use @userinfobot)
- Create repository (github / local repository)
- Clone this repository to your repository (and then changes the .env variables using your bot token & connection url)
- Also changes the admin array on the code /src/bot.ts on line 77 (use your telegram user id)
- run 'npx prisma migrate dev' to populate schema to your database
- run 'npm run start:dev' to start the bot locally on your device
- Done, but running on your local machine 

## EXTRA STEP TO RUN THE BOT ON ACTUAL SERVER:
- Clone the repository you create before to the server
- Install pm2 packages -> npm i pm2
- Run the pm2 instance using -> npm start ecosystem.config.ejs
- Done, bot running on the server and can be accessed anytime

Presentation Link: 
https://www.canva.com/design/DAGUdP4SFeY/APaQLKJnFkkVpph9lE-M6g/edit?utm_content=DAGUdP4SFeY&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton
