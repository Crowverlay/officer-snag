# officer-snag

A discord police bot?

## setup

You'll need your own bot key for now, place the private key in the `BEATBOT_TOKEN` environment variable.
If this gets bigger I guess I'll look in to a testing server.

```
npm install
node .
```

### the invite protocol

The bot uses permissions `388160` at the moment.
After adding, users with admin permissions can set the output channel with `!outputTo` and (optionally) a channel for sending debug output with `!logTo`.

## contrib

New functions go in `commands`. See existing commands for examples. Command names should all be lowercase.
The third argument for `execute` is optional (it's a reference to the bot's database).