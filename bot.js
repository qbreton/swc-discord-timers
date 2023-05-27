const { Client, EmbedBuilder, AttachmentBuilder, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ],
    allowedMentions: { parse: ['roles'] }
});
const fs = require('fs');
const moment = require('moment-timezone');

const token = require('./config.json').token;
// Chargez le fichier JSON contenant les données des boss
const spawnData = require('./bosses.json');

// Définir le fuseau horaire de Paris (Europe/Paris)
moment.tz.setDefault('Europe/Paris');

function sendMessage(zone, isBaphomet = false) {
    const channelID = '1110136454304251935';
    const roleId = '682893248687112239';
    const message = isBaphomet ? `Le baphomet de la zone ${zone} spawn dans 5 minutes !` : `Les boss de la zone ${zone} spawn dans 5 minutes local !`;

    const attachment = new AttachmentBuilder(`./assets/${zone.toLowerCase()}.png`);
    const embedMessage = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(message)
        .setImage(`attachment://${zone.toLowerCase()}.png`)
        .setTimestamp();

    client.channels.fetch(channelID).then((channel) => channel.send({ content: `<@&${roleId}>`,  embeds: [embedMessage], files: [attachment] }));
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
  
    checkBossSpawn();
    checkBaphometSpawn();
  });

function checkBossSpawn() {
  // Obtenez la date et l'heure actuelles dans le fuseau horaire de Paris
  const parisTime = moment();

  // Obtenez la date dans le fuseau horaire de Paris
  const currentDate = parisTime.format('YYYY-MM-DD');
  const currentHour = parisTime.hours();
  const currentMinute = parisTime.minutes();

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
      
      // Créez une date avec l'heure de spawn actuelle dans le fuseau horaire de Paris
      const spawnDate = moment.tz(`${currentDate} ${spawnHour}:${spawnMinute}`, 'YYYY-MM-DD HH:mm', 'Europe/Paris');
      
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
        // Planifiez l'envoi périodique du message tous les jours à l'heure de spawn
        setInterval(() => {
          sendMessage(zone);
        }, 24 * 60 * 60 * 1000);
      }, delay);
    });
  });
}

function checkBaphometSpawn() {
  const parisTime = moment();
  const currentDay = parisTime.format('dddd');
  const currentHour = parisTime.format('HH:mm');

  // Parcourez les données des boss pour vérifier s'il y a un baphomet à apparaître aujourd'hui ou dans le futur
  spawnData.forEach((boss) => {
    const zone = boss.zone;
    const baphometSpawnData = boss.baphomet;

    // Recherchez le prochain baphomet à planifier (incluant les baphomets passés)
    const nextBaphometSpawn = baphometSpawnData.find((spawn) => {
      const spawnDay = spawn.day;
      const spawnTime = spawn.time;
      const spawnDateTime = moment.tz(`${spawnDay} ${spawnTime}`, 'dddd HH:mm', 'Europe/Paris');
      
      // Vérifiez si la date de spawn est aujourd'hui ou ultérieure
      return parisTime.isSameOrBefore(spawnDateTime);
    });

    if (nextBaphometSpawn) {
      const spawnDay = nextBaphometSpawn.day;
      const spawnTime = nextBaphometSpawn.time;
      const spawnDateTime = moment.tz(`${spawnDay} ${spawnTime}`, 'dddd HH:mm', 'Europe/Paris');
      spawnDateTime.subtract(5, 'minutes'); // Soustrayez 5 minutes pour l'envoi du message

      const diffInMinutes = spawnDateTime.diff(parisTime, 'minutes');

      // Planifiez l'envoi du message 5 minutes avant le spawn
      setTimeout(() => {
        sendMessage(zone, true);
        setInterval(() => {
          sendMessage(zone, true);
        }, 7 * 24 * 60 * 60 * 1000); // Répétez tous les 7 jours
      }, diffInMinutes * 60 * 1000);
    }
  });
}

function getNextBaphometSpawnDate(currentDay, spawnTimes) {
  const parisTime = moment();
  const currentHour = parisTime.format('HH:mm');

  // Find the next occurrence of the Baphomet spawn
  for (let i = 0; i < 7; i++) {
    const nextSpawnDayIndex = (moment().isoWeekday() + i) % 7;
    const nextSpawnDay = moment().isoWeekday(nextSpawnDayIndex).format('dddd');

    if (nextSpawnDay === currentDay) {
      // Check if the current spawn time has already passed today
      for (const spawnTime of spawnTimes) {
        if (spawnTime >= currentHour) {
          return moment().isoWeekday(nextSpawnDayIndex).format('YYYY-MM-DD');
        }
      }
    }
  }

  return null; // No more spawns this week
}

// Fonction pour sauvegarder les données dans le fichier JSON
function saveSpawnData(data) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync('bosses.json', jsonData);
}


client.login(token);