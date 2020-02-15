# Rocket.Chat Poll App

## Compatibility table

Poll Version | Minimum Rocket.Chat Version
------------ | -------------
v1.x | **0.74.1**
v2.x | **3.0.0**

## Installing

Rocket.Chat Poll App is provided via Rocket.Chat Marketplace https://rocket.chat/marketplace . To install it on your Rocket.Chat server, go to the Admin area, then Marketplace and search for `Poll`, click `Install` and you're ready to go.

## How to use it

Use the slash command to create a poll:

```
/poll "What is your favorite color?" "Blue" "Red" "Orange"
```

The following poll will be created:

![image](https://user-images.githubusercontent.com/8591547/52024341-b852f300-24e7-11e9-9b22-03be576c2964.png)

## Contributing

You'll need to set up the Rocket.Chat Apps dev environment, please see https://rocket.chat/docs/developer-guides/developing-apps/getting-started/

To install the using the command line, you have to turn on the setting `Enable development mode` on the Rocket.Chat server under `Admin > General > Apps`.

Then you can clone this repo and then:

```bash
npm install
rc-apps deploy
```

Follow the instructions and when you're done, the app will be installed on your Rocket.Chat server.
