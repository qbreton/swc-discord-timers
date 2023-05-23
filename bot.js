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

    // Appelez la fonction checkBaphometSpawn à intervalles réguliers (par exemple, toutes les minutes)
    setInterval(checkBaphometSpawn, 60000); // Vérifie chaque minute s'il y a un boss à apparaître
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

      // Calculez la différence en minutes entre l'heure de spawn et l'heure actuelle
      const diffInMinutes = spawnDate.diff(parisTime, 'minutes');
      
      // Calculez le délai jusqu'à l'heure de spawn actuelle, en tenant compte des 5 minutes avant	
      let delay = 0;	
      if (hour > currentHour || (hour === currentHour && minute >= currentMinute + 5)) {	
          delay = (hour - currentHour) * 60 * 60 * 1000 + (minute - currentMinute - 5) * 60 * 1000;	
      } else {	
          delay =	
          (hour + 24 - currentHour) * 60 * 60 * 1000 + (minute - currentMinute - 5) * 60 * 1000;	
      }
      console.log(delay / 1000);

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
  const currentDate = parisTime.format('YYYY-MM-DD');

  // Parcourez les données des boss pour vérifier s'il y a un boss à apparaître aujourd'hui
  spawnData.forEach((boss) => {
    if (boss.nextBaphomet === currentDate && parisTime.hours() === 22 && parisTime.minutes() === 25) {
      const zone = boss.zone;

      // Mettez à jour la valeur nextSpawnDate pour le boss
      const nextSpawnDate = getNextSpawnDate(currentDate); // Fonction pour calculer la prochaine date d'apparition

      // Mettez à jour la valeur nextSpawnDate dans les données du boss
      boss.nextBaphomet = nextSpawnDate;

      // Sauvegardez les données mises à jour dans le fichier JSON
      saveSpawnData(spawnData); // Fonction pour sauvegarder les données dans le fichier JSON

      sendMessage(zone, true);
    }
  });
}

// Fonction pour calculer la prochaine date d'apparition du boss
function getNextSpawnDate(currentDate) {
  const nextDate = moment(currentDate, 'YYYY-MM-DD').add(spawnData.length, 'days');
  return nextDate.format('YYYY-MM-DD');
}

// Fonction pour sauvegarder les données dans le fichier JSON
function saveSpawnData(data) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync('bosses.json', jsonData);
}


client.login(token);