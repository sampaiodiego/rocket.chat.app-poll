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
/poll What is your favorite color?
```

Fill the form:

![image](https://user-images.githubusercontent.com/8591547/74581666-9d3b1000-4f90-11ea-9112-7a85a771a04b.png)

The following poll will be created:

![image](https://user-images.githubusercontent.com/8591547/74581679-c065bf80-4f90-11ea-8e51-cd63b8ac7cd8.png)

## Contributing

You'll need to set up the Rocket.Chat Apps dev environment, please see https://rocket.chat/docs/developer-guides/developing-apps/getting-started/

To install the using the command line, you have to turn on the setting `Enable development mode` on the Rocket.Chat server under `Admin > General > Apps`.

Then you can clone this repo and then:

Install npm dependencies:
```bash
npm install
```
To run an app locally, you need to install Rocket.Chat's app engine dependencies first:
```bash
sudo npm install -g @rocket.chat/apps-cli
sudo npm install -g @rocket.chat/apps-engine 
```

After this you need to start the Rocket.Chat's server on your local machine.

Then run following command from Rocket.Chat Poll App Directory:
```bash
rc-apps deploy --url http://localhost:3000 --username admin_username --password admin_password
```
Admin username and password can be created  from Rocket.Chat's server.

Now Rocket.Chat Poll App can be used locally.


Follow the instructions and when you're done, the app will be installed on your Rocket.Chat server.
