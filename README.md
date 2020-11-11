# Twilio Flex / SendGrid Email Integration Example

<<TODO>>

## Setting up SendGrid

* You'll need to [authenticate your domain](https://sendgrid.com/docs/ui/account-and-settings/how-to-set-up-domain-authentication/)
* Then point your MX record to `mx.sendgrid.net`
* Configure the [inbound parse webhook](https://app.sendgrid.com/settings/parse) to point at your application. If using [ngrok](https://ngrok.com) like me, it should look like `https://yourtunnel.ngrok.io/inbound`.
  * Note: Twilio Functions are currently not compatible with the inbound parse webhook
* Generate a SendGrid API Key [here](https://app.sendgrid.com/settings/api_keys) and note it down

## Configuring Twilio Flex

* Navigate to your [TaskRouter](https://www.twilio.com/console/taskrouter/workspaces) Workspace (it should be named `Flex Task Assignment`), then to Task Channels and create a new Task Channel named `Email`.

* Create an email Flex Flow

You'll need your webhook URL handy, in this quickstart I will use [ngrok](https://ngrok.com) in this example. You'll also need your `ChatServiceSid` which can be found [here](https://www.twilio.com/console/chat/dashboard).

Run the following `curl`:

```bash
curl -X POST https://flex-api.twilio.com/v1/FlexFlows \
  --data-urlencode 'ChannelType=custom' \
  --data-urlencode 'Enabled=true' \
  --data-urlencode 'ContactIdentity=null' \
  --data-urlencode 'IntegrationType=external' \
  --data-urlencode 'Integration.Url=https://yourtunnel.ngrok.io/flexflow' \
  --data-urlencode 'FriendlyName=Email FlexFlow' \
  --data-urlencode 'ChatServiceSid=ISxxxxxxxxx' \
  --data-urlencode 'LongLived=true' \
  -u ACxxxxxxxx:[AUTH_TOKEN]
```

  This should yield a Flex Flow Sid like `FOxxxxxxxxx` -- note it down.

## Setting up your webhook

Hopefully you've already cloned this repository and ran `npm install`. Next:

* Navigate to the `server` folder
* Configure your environment variables `cp .env.example .env`
  * We noted down the Flex Flow Sid and SendGrid API key already from the steps above
  * Here are links to grab the [account sid and auth token](https://www.twilio.com/console), your [workspace and workflow sid](https://www.twilio.com/console/taskrouter/workspaces) and [flex chat service sid](https://www.twilio.com/console/chat/dashboard).
* Run the server `node index.js`
* Start your tunnel `ngrok http 8080`

If you followed the steps above correctly, sending an e-mail should now yield some logs and a task within Flex.

![inbound screenshot](/screenshots/inbound-screenshot-no-plugin.png?raw=true "Inbound e-mail to Flex")

Of course, Flex doesn't know how to render tasks for our new e-mail channel yet, so we can't see the contents. For that, let's add a plugin!

## Building the plugin

In the root of the `plugin-email` directory execute

* npm install
* npm run build

Then upload the resulting distribution file to [Twilio Assets](https://www.twilio.com/console/assets/public).

It should now look like this:

![Flex Email UI](/screenshots/email-ui.png?raw=true "Flex Email UI")

## Changing the URL of your server

If you find yourself wanting to update the URL for your express server, you'll need to update the URL in two places:

* Replace the [inbound parse webhook](https://app.sendgrid.com/settings/parse) with your new URL
* Update the FlexFlow with your new URL:

```bash
curl -X POST https://flex-api.twilio.com/v1/FlexFlows/FOxxx \
  --data-urlencode 'Integration.Url=https://yourtunnel.ngrok.io/flexflow' \
  -u ACxxxxxxxx:[AUTH_TOKEN]
  ```

## Authors

* Martin Amps
* Trenton McManus

## Disclaimer
This software is to be considered "sample code", a Type B Deliverable, and is delivered "as-is" to the user. Twilio bears no responsibility to support the use or implementation of this software.
