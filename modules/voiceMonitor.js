const ms = require('ms');
const { phrases } = require('../data/phrases');
const Discord = require('discord.js');
const moment = require('moment');

const activeMembers = {};

function startTrack(member) {
  if (member.id in activeMembers) {
    console.log(
      `Member id ${member.id} (${member.displayName}) is already being tracked`
    );
  } else {
    activeMembers[member.id] = new Date();
  }
}

// also returns the amount of time someone was in VC (doesn't care about channel)
function endTrack(member) {
  if (member.id in activeMembers) {
    const dur = new Date() - activeMembers[member.id];
    delete activeMembers[member.id];

    console.log(
      `Member id ${member.id} (${member.displayName}) was in vc for: ${ms(dur)}`
    );

    return dur;
  } else {
    console.log(
      `Member id ${member.id} (${member.displayName}) was not being tracked`
    );
  }

  return null;
}

// adds a misclick incident to the database
function addIncident(member, details, db) {
  if (
    !db
      .get('users')
      .find({ serverId: member.guild.id, userId: member.id })
      .value()
  ) {
    db.get('users')
      .push({
        serverId: member.guild.id,
        userId: member.id,
        incidents: [],
        count: 0
      })
      .write();
  }

  const incident = {
    date: new Date(),
    channel: details.channel.name,
    duration: details.time
  };

  db.get('users')
    .find({ serverId: member.guild.id, userId: member.id })
    .update('count', n => n + 1)
    .write();
  db.get('users')
    .find({ serverId: member.guild.id, userId: member.id })
    .get('incidents')
    .push(incident)
    .write();

  return {
    user: db
      .get('users')
      .find({ serverId: member.guild.id, userId: member.id })
      .value(),
    incident
  };
}

function getPhrase(member) {
  const raw = phrases[Math.floor(Math.random() * phrases.length)];

  // replace w/ handle if needed
  const memberHandle = `${member}`;
  const formatted = raw.replace('{#1}', memberHandle);
  return formatted;
}

// output an incident report to the specified output channel
function reportIncident(member, info, channel) {
  // if the channel is null, immediately exit
  if (!channel) {
    console.log('No output channel specified for output');
    return;
  }

  // pick a phrase (any phrase)
  const phrase = getPhrase(member);
  const embed = new Discord.RichEmbed()
    .setColor('#FF0000')
    .setTitle('Incident Report')
    .setThumbnail(
      'https://cdn.discordapp.com/emojis/601119389093462027.png?v=1'
    )
    .setDescription(phrase)
    .addField('Incident Type', 'Misclick', true)
    .addField('Channel', info.incident.channel, true)
    .addField('Infraction', moment.localeData().ordinal(info.user.count), true)
    .setTimestamp(info.incident.date);

  channel.send(`${member} was caught by Officer Snag!`);
  channel.send(embed);
}

module.exports = {
  startTrack,
  endTrack,
  addIncident,
  reportIncident
};
