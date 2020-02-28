const fs = require('fs-extra');
const ms = require('ms');

// database
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = low(adapter);

// settings contains server settings, users contains persistent user data.
// both keyed by server id
db.defaults({ settings: [], users: [] }).write();

const Discord = require('discord.js');
const { prefix } = require('./config.json');
const VM = require('./modules/voiceMonitor');
const client = new Discord.Client();

client.commands = new Discord.Collection();

const commandFiles = fs
  .readdirSync('./commands')
  .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

function logToChannel(guild, message) {
  const guildId = guild.id;
  const settings = db.get('settings').find({ serverId: guildId }).value();

  if ('logChannel' in settings) {
    guild.channels.find(channel => channel.id === settings.logChannel).send(message);
  }

  console.log(message);
}

function outputToChannel(guild, message) {
  const guildId = guild.id;
  const settings = db.get('settings').find({ serverId: guildId }).value();

  if ('outputChannel' in settings) {
    guild.channels.find(channel => channel.id === settings.outputChannel).send(message);
  }

  console.log(`Output: ${message}`);
}

client.once('ready', () => {
  console.log('Ready!');
});

client.on('message', message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (!client.commands.has(commandName)) return;
  const command = client.commands.get(commandName);

  // check permissions
  if (command.permissions) {
    if (message.member && !message.member.hasPermission(command.permissions)) {
      message.reply(
        `You do not have permission to execute this command. Required: ${command.permissions.join(
          ', '
        )}.`
      );
    }
  }

  // no dm commands allowed
  if (command.guildOnly && message.channel.type !== 'text') {
    return message.reply('Command cannot be executed in DMs');
  }

  // bit of scaffolding for arg handling
  if (command.args && !args.length) {
    let reply = `${message.author} Required arguments not found.`;

    if (command.usage) {
      reply += `\nUsage: \`${prefix}${command.name} ${command.usage}\``;
    }

    return message.channel.send(reply);
  }

  try {
    command.execute(message, args, db);
  } catch (error) {
    console.error(error);
    message.reply('Error Executing Command');
  }
});

// tracking voice events
client.on('voiceStateUpdate', (oldMember, newMember) => {
  if (!oldMember.voiceChannel && newMember.voiceChannel) {
    logToChannel(oldMember.guild, `${oldMember.displayName} joined vc: ${newMember.voiceChannel.name}`);
    VM.startTrack(newMember);
  }

  if (!newMember.voiceChannel && oldMember.voiceChannel) {
    const dur = VM.endTrack(newMember);
    logToChannel(oldMember.guild, `${oldMember.displayName} exited vc: ${oldMember.voiceChannel.name} after ${ms(dur)}.`);

    // TODO: magic number bad
    if (dur < 8000) {
      const info = VM.addIncident(oldMember, { time: dur, channel: oldMember.voiceChannel }, db);
      
      outputToChannel(oldMember.guild, `GOTTEM! ${oldMember} misclicked the ${oldMember.voiceChannel.name} channel. Misclicks: ${info.count}.`);
    }
  }
});

client.login(process.env.BEATBOT_TOKEN);
