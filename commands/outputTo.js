module.exports = {
  name: 'outputto',
  description: 'Specify a channel to send general messages to.',
  args: true,
  guildOnly: true,
  permissions: ['ADMINISTRATOR'],
  usage: '[channel]',
  execute(message, args, db) {
    if (!args.length) {
      message.reply(
        'No channel name specified. Use # to specify a channel in this server.'
      );
      return;
    }

    const re = /<\#(\d+)>/g;
    const reResult = re.exec(args[0]);

    if (!reResult) {
      message.reply(
        'Invalid channel name specified. Use # to specify a channel.'
      );
      return;
    }

    const channelId = reResult[1];
    console.log(channelId);

    const channels = message.guild.channels;
    const chan = channels.find(channel => channel.id === channelId);

    if (chan) {
      console.log(
        `Server ${message.guild.name} (${message.guild.id}) outputting to channel #${chan.name} (${chan.id})`
      );

      message.reply(`Now sending output to ${chan}.`);

      if (
        !db
          .get('settings')
          .find({ serverId: message.guild.id })
          .value()
      ) {
        db.get('settings')
          .push({ serverId: message.guild.id })
          .write();
      }

      db.get('settings')
        .find({ serverId: message.guild.id })
        .set('outputChannel', chan.id)
        .write();
    } else {
      message.reply(`Text channel with name ${args[0]} not found`);
      return;
    }
  }
};
