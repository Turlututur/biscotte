# Biscotte

A small personal project to create a discord bot for playing music (following the closure of the Rythm bot).
It should be noted that the 'config.json' file necessary for the proper functioning of the bot is missing because it contains the key of the bot as well as the prefix used.

## Add the bot to your server 

https://discord.com/api/oauth2/authorize?client_id=887667419408109619&permissions=274881251328&scope=bot

## Use this code !

```bash
 $ npm install
 $ npm install discord.js
 $ npm install ytdl-core
 $ npm install yt-search
```

## Commissioning

```bash
$ node index.js
```

## Template config.json

```json
{
  "prefix": "b!",
  "token": "clé-de-votre-bot-discord"
}
```

Of course, you can adapt the prefix to your liking !

## Usage

On the server where your bot will be invited, type:

```
b!help
```

The bot should then respond to you (in French).

All you have to do is make it play music on your server !
