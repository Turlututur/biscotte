//version 1.4.0

const Discord = require("discord.js");
const { prefix, token } = require("./config.json");
const ytdl = require("ytdl-core");
const yts = require("yt-search");

const queue = new Map();
const client = new Discord.Client();

const status = [
  ["LISTENING", "some Lo-fi 😌"],
  ["LISTENING", "synthwave 😎"],
  ["LISTENING", "some rap 👌"],
  ["LISTENING", "some metal ! 🤘"],
  ["LISTENING", "some l'asmr 😴"],
  ["LISTENING", "some l'électro 😋"],
  ["LISTENING", "some k-pop 😍"],
  ["LISTENING", "some drill 💀🔪"],
];

/**Uniquement pour la console du serveur, permet de connaître le status du bot */
client.once("ready", () => {
  client.user.setActivity("the alarm clock ring 😴", { type: "LISTENING" });

  setInterval(() => {
    let id = Math.floor(Math.random() * (status.length - 1) + 1);
    // console.log(status[id][1])
    // console.log(status[id][0])
    client.user.setActivity(status[id][1], { type: status[id][0] });
  }, 60000 * 30); //toutes les 30 minutes

  console.log("Ready!");
  client.users.fetch("314817432911085569", false).then((user) => {
    user.send("Hello, lauched successfully");
  });
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
  client.users.fetch("314817432911085569", false).then((user) => {
    user.send("Reconnecting !");
  });
});

client.once("disconnect", () => {
  console.log("Disconnect!");
  client.users.fetch("314817432911085569", false).then((user) => {
    user.send("Disconnected !");
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
        user.send("Error : ``` \n " + err + "```");
      });
    }

    return;
  } else if (message.content.startsWith(`${prefix}purge`)) {
    purge(message, serverQueue);
    return;
  } else if (message.content.startsWith(`${prefix}help`)) {
    //console.log(message);
    message.channel.send(
      "Hi ! I'm Biscotte, your personnal music bot, i can play some music through YouTube ! Here are the commands you can use with me :  ``` - b!play [url/words] \n - b!skip \n - b!stop \n \n - b!remove - b!pause and b!resume```"
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
    message.channel.send(
      "I get what you are saying *doesn't get what you are saying* (⌣̩̩́_⌣̩̩̀)"
    );
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
      "You should be in a voice channel to play music... (~_~;)"
    );
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
    return message.channel.send(
      "I don't have the permission to join this voice channel... (~_~;)"
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
      return message.channel.send("I didn't find any song...");
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
        user.send("Error : ```" + err + "```");
      });
      queue.delete(message.guild.id);
      return message.channel.send(err);
    }
  } else {
    serverQueue.songs.push(song);
    return message.channel.send(
      `**${song.title}** has been added to your queue ! UwU`
    );
  }
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You should be in a voice channel to change the current music. (҂⌣̀_⌣́)"
    );
  if (!serverQueue)
    return message.channel.send("I don't have any song to skip.. (・_・;)");
  serverQueue.connection.dispatcher.end();
}

/** Fonction permettant l'arrêt de la musique
 * et le depart du bot depuis un salon vocal
 */

function stop(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "You should be in a voice channel to stop the music ! (҂⌣̀_⌣́)"
    );

  if (!serverQueue)
    return message.channel.send("I don't have any song to stop... (・_・;)");
  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
  message.channel.send("Oki ! Music stopped !  (｡◕‿◕｡)");
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
        user.send("Error : ``` \n " + error + "```");
      });
    });
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
  serverQueue.textChannel.send(
    `I'm starting to play : **${song.title}** ヽ(•‿•)ノ . \n **${song.url}**`
  );
}

function pause(message, serverQueue) {
  if (!message.member.voice.channel) {
    return message.channel.send(
      "You should be in a voice channel to pause the music. (҂⌣̀_⌣́)"
    );
  } else {
    serverQueue.connection.dispatcher.pause();
    message.channel.send("Let's make a break ! (づ￣ ³￣)づ");
    return;
  }
}

/**Fonction permettant de reprendre la musique lorsqu'elle
 * est mise en pause.
 */
function resume(message, serverQueue) {
  if (!message.member.voice.channel) {
    return message.channel.send(
      "You should be in a voice channel to bring back the music. (҂⌣̀_⌣́)"
    );
  } else {
    serverQueue.connection.dispatcher.resume();
    message.channel.send("Let's resume the music ! (づ｡◕‿‿◕)づ");
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
      "You should be in a voice channel to remove a song !"
    );
  } else {
    message.channel.send(
      `**${serverQueue.songs.pop().title}** has been removed from queue.`
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
    message.channel.send("Forbidden command.");
    return;
  } else {
    serverQueue.voiceChannel.leave();
    message.channel.send("Sir, everything is stopped, sir !");
    return;
  }
}

client.login(token);
