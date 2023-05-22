const { Client, EmbedBuilder, AttachmentBuilder, GatewayIntentBits } = require('discord.js');
const client = new Client({intents: [GatewayIntentBits.GuildMessages]});
const fs = require('fs');

const token = require('./config.json').token;

// Chargez le fichier JSON contenant les données des boss
const spawnData = require('./bosses.json');

function sendMessage(zone) {
  const channelID = '1110136454304251935';
  const attachment = new AttachmentBuilder(`./assets/${zone.toLowerCase()}.png`);
  const embedMessage = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(`Les boss de la zone ${zone} spawn dans 5 minutes !`)
    .setImage(`attachment://${zone.toLowerCase()}.png`)
    .setTimestamp();

  client.channels.fetch(channelID).then((channel) => channel.send({ embeds: [embedMessage], files: [attachment] }));
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
  
    // Obtenez l'heure actuelle
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
  
    // Parcourez les données des zones et des heures de spawn
    spawnData.forEach((spawn) => {
      const zone = spawn.zone;
      const spawnTimes = spawn.spawnTimes;
  
      // Parcourez les heures de spawn pour la zone actuelle
      spawnTimes.forEach((spawnTime) => {
        const [spawnHour, spawnMinute] = spawnTime.split(':');
  
        // Convertissez les heures et les minutes en nombres entiers
        const hour = parseInt(spawnHour);
        const minute = parseInt(spawnMinute);
  
        // Calculez le délai jusqu'à l'heure de spawn actuelle, en tenant compte des 5 minutes avant	
        let delay = 0;	
        if (hour > currentHour || (hour === currentHour && minute >= currentMinute + 5)) {	
            delay = (hour - currentHour) * 60 * 60 * 1000 + (minute - currentMinute - 5) * 60 * 1000;	
        } else {	
            delay =	
            (hour + 24 - currentHour) * 60 * 60 * 1000 + (minute - currentMinute - 5) * 60 * 1000;	
        }
  
        // Planifiez l'envoi du message pour l'heure de spawn
        setTimeout(() => {
          sendMessage(zone);
          setInterval(() => {
            sendMessage(zone);
          }, 24 * 60 * 60 * 1000); // Répétez tous les jours
        }, delay);
      });
    });
  });

client.login(token);
