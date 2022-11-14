//version 1.4.0

const Discord = require("discord.js");
const { prefix, token, ahegao } = require("./config.json");
const ytdl = require("ytdl-core");
const yts = require("yt-search");

const queue = new Map();
const client = new Discord.Client();

const status = [
  ["LISTENING", "de la Lo-fi 😌"],
  ["LISTENING", "de la synthwave 😎"],
  ["LISTENING", "du rap 👌"],
  ["LISTENING", "du metal ! 🤘"],
  ["LISTENING", "de l'asmr 😴"],
  ["LISTENING", "de l'électro 😋"],
  ["WATCHING", "ton historique 🤨"],
  ["LISTENING", "de la k-pop 😍"],
  ["STREAMING", "un film louche 🤨"],
  ["LISTENING", "de la drill 💀🔪"],
];

/**Uniquement pour la console du serveur, permet de connaître le status du bot */
client.once("ready", () => {
  client.user.setActivity("le réveil sonner 😴", { type: "LISTENING" });

  setInterval(() => {
    let id = Math.floor(Math.random() * (status.length - 1) + 1);
    // console.log(status[id][1])
    // console.log(status[id][0])
    client.user.setActivity(status[id][1], { type: status[id][0] });
  }, 60000 * 30); //toutes les 30 minutes

  console.log("Ready!");
  client.users.fetch("314817432911085569", false).then((user) => {
    user.send("Bonjour, j'ai démarré sans problème.");
  });
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
  client.users.fetch("314817432911085569", false).then((user) => {
    user.send("Je me reconnecte !");
  });
});

client.once("disconnect", () => {
  console.log("Disconnect!");
  client.users.fetch("314817432911085569", false).then((user) => {
    user.send("Déconnectée !");
  });
});

/**On va écouter et être à l'affus
 * d'une commande et agir en fonction    */

client.on("message", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const serverQueue = queue.get(message.guild.id);

  if (message.content.startsWith(`${prefix}play`)) {
    try {
      execute(message, serverQueue);
    } catch (err) {
      client.users.fetch("314817432911085569", false).then((user) => {
        user.send("J'ai rencontré une erreur : ``` \n " + err + "```");
      });
    }

    return;
  } else if (message.content.startsWith(`${prefix}purge`)) {
    purge(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}help`)) {
    //console.log(message);
    message.channel.send(
      "Bonjour à vous UwU ! Je suis Biscotte, un bot musical, je peux vous jouer de la musique via YouTube ! Voici les commandes que vous pouvez utiliser avec moi :  ``` - b!play [url/phrase] \n - b!skip \n - b!stop \n \n - b!remove - b!pause et b!resume```"
    );
    return;
  } else if (message.content.startsWith(`${prefix}skip`)) {
    skip(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}remove`)) {
    remove(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}pause`)) {
    pause(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}resume`)) {
    resume(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}stop`)) {
    stop(message, serverQueue);
    return;
  } else {
    message.channel.send("Je n'ai pas compris votre demande... (⌣̩̩́_⌣̩̩̀)");
  }
});

/**on regarde si l'utilisateur est dans un channel
 * et si le bot a le droit d'y aller.
 * Si ce n'est pas le cas, message d'erreur */

async function execute(message, serverQueue) {
  const args = message.content.split(" ");

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel)
    return message.channel.send(
      "Vous devez être dans un salon vocal pour jouer de la musique... (~_~;)"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "Je n'ai pas la permission de rejoindre ce salon vocal... (~_~;)"
    );
  }

  // const songInfo = await ytdl.getInfo(args[1]);
  // const song = {
  //       title: songInfo.videoDetails.title,
  //       url: songInfo.videoDetails.video_url,
  //  };

  let song;
  if (ytdl.validateURL(args[1])) {
    const songInfo = await ytdl.getInfo(args[1]);
    song = {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
    };
  } else {
    const { videos } = await yts(args.slice(1).join(" ")); //les videos peuvent avoir des espaces
    if (!videos.length) {
      return message.channel.send("Je n'ai pas trouvé de chanson...");
    } else {
      song = {
        title: videos[0].title,
        url: videos[0].url,
      };
    }
  }

  if (!serverQueue || !serverQueue.connection.dispatcher) {
    //On verifie que la queue soit vide et que le bot soit déconnecté
    const queueContruct = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      songs: [],
      volume: 5,
      playing: true,
    };

    queue.set(message.guild.id, queueContruct);

    queueContruct.songs.push(song);

    try {
      var connection = await voiceChannel.join();
      queueContruct.connection = connection;
      play(message.guild, queueContruct.songs[0]);
    } catch (err) {
      console.log(err);
      client.users.fetch("314817432911085569", false).then((user) => {
        user.send("J'ai rencontré une erreur : ```" + err + "```");
      });
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(
      `**${song.title}** à été ajouté à la liste d'attente ! UwU`
    );
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Vous devez être dans un salon vocal pour changer la musique. (҂⌣̀_⌣́)"
    );
  if (!serverQueue)
    return message.channel.send("Je n'ai pas de chanson à passer (・_・;)");
  serverQueue.connection.dispatcher.end();
}

/** Fonction permettant l'arrêt de la musique
 * et le depart du bot depuis un salon vocal
 */

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "Vous devez être dans un salon vocal pour arrêter la musique (҂⌣̀_⌣́)"
    );

  if (!serverQueue)
    return message.channel.send("Je n'ai pas de chanson à arrêter (・_・;)");
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
  message.channel.send("Oki ! J'arrête la musique !  (｡◕‿◕｡)");
}

/** Fonction permettant
 * la lecture d'un fichier à partir
 * d'un url youtube
 */

function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  const dispatcher = serverQueue.connection
    .play(ytdl(song.url, { filter: "audioonly" }))
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", (error) => {
      console.error(error);
      client.users.fetch("314817432911085569", false).then((user) => {
        user.send("J'ai rencontré une erreur : ``` \n " + error + "```");
      });
    });
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(
    `Je commence à jouer: **${song.title}** ヽ(•‿•)ノ . \n **${song.url}**`
  );
}

function pause(message, serverQueue) {
  if (!message.member.voice.channel) {
    return message.channel.send(
      "Vous devez être dans un salon vocal pour mettre la musique en pause. (҂⌣̀_⌣́)"
    );
  } else {
    serverQueue.connection.dispatcher.pause();
    message.channel.send("On fait une petite pause ! (づ￣ ³￣)づ");
    return;
  }
}

/**Fonction permettant de reprendre la musique lorsqu'elle
 * est mise en pause.
 */
function resume(message, serverQueue) {
  if (!message.member.voice.channel) {
    return message.channel.send(
      "Vous devez être dans un salon vocal pour remettre la musique. (҂⌣̀_⌣́)"
    );
  } else {
    serverQueue.connection.dispatcher.resume();
    message.channel.send("On reprend la musique ! (づ｡◕‿‿◕)づ");
    return;
  }
}

/**
 * Fonction de suppression de la dernière chanson passée
 * en liste d'attente.
 * */
function remove(message, serverQueue) {
  if (!message.member.voice.channel) {
    return message.channel.send(
      "Vous devez être dans un salon vocal pour retirer une musique !"
    );
  } else {
    message.channel.send(
      `J'ai retiré **${serverQueue.songs.pop().title}** de la liste d'attente`
    );
    return;
  }
}

/**Fonction qui permet au créateur de stopper toute activité
 * même si il ne se trouve pas dans un salon vocal.
 * (en cas de freeze du bot)
 * pas au point supp pas les liste
 * todo : bah finir
 */
function purge(message, serverQueue) {
  if (!message.author.id == "314817432911085569") {
    message.channel.send("Vous n'avez pas le droit.");
    return;
  } else {
    serverQueue.voiceChannel.leave();
    message.channel.send("J'arrête toute activité.");
    return;
  }
}

client.login(token);
