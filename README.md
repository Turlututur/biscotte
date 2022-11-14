# Biscotte

Un petit projet personnel visant à créer un bot discord de lecture de musique (suite à la fermeture du bot Rythm).
Il faut noter qu'il manque le fichier 'config.json' necessaire au bon fonctionnement du bot car il contient la clé du bot ainsi que le préfix utilisé.

## Ajoutez le sur votre serveur

https://discord.com/api/oauth2/authorize?client_id=887667419408109619&permissions=274881251328&scope=bot

## Installation

```bash
 $ npm install
 $ npm install discord.js
 $ npm install ytdl-core
 $ npm install yt-search
```

## Mise en service

```bash
$ node index.js
```

## Template config.json

```json
{
  "prefix": "c!",
  "token": "clé-de-votre-bot-discord"
}
```

Vous pouvez évidemment adapter le préfix à votre convenance !

## Usage

Sur le serveur sur lequel votre bot sera invité, tapez :

```
b!help
```

Le bot devrait alors vous répondre.

Vous n'avez plus qu'à lui faire jouer de la musique sur votre serveur !
