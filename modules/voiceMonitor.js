const ms = require('ms');

const activeMembers = {};

function startTrack(member) {
  if (member.id in activeMembers) {
    console.log(`Member id ${member.id} (${member.displayName}) is already being tracked`);
  } else {
    activeMembers[member.id] = new Date();
  }
}

// also returns the amount of time someone was in VC (doesn't care about channel)
function endTrack(member) {
  if (member.id in activeMembers) {
    const dur = new Date() - activeMembers[member.id];
    delete activeMembers[member.id];

    console.log(`Member id ${member.id} (${member.displayName}) was in vc for: ${ms(dur)}`);

    return dur;
  }
  else {
    console.log(`Member id ${member.id} (${member.displayName}) was not being tracked`);
  }

  return null;
}

function addIncident(member, details, db) {
  if (!db.get('users').find({ serverId: member.guild.id, userId: member.id }).value()) {
    db.get('users').push({ serverId: member.guild.id, userId: member.id, incidents: [], count: 0 }).write();
  }

  db.get('users').find({ serverId: member.guild.id, userId: member.id }).update('count', n => n + 1).write();
  db.get('users').find({ serverId: member.guild.id, userId: member.id }).get('incidents').push({
    date: new Date(),
    channel: details.channel.name,
    duration: details.time
  }).write();

  return db.get('users').find({ serverId: member.guild.id, userId: member.id }).value();
}

module.exports = {
  startTrack,
  endTrack,
  addIncident
}