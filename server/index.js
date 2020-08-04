require('dotenv').config();

// Our comms dependencies
const axios = require('axios');
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
const utils = require('./utils');
const extractHtmlContent = require('./extractHtmlContent.js');

sgMail.setApiKey(process.env.SG_MAIL_KEY);

// Express setup
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');

// markdown <> html converter
const showdown = require('showdown');
const showdownConverter = new showdown.Converter();

app.use(bodyParser.urlencoded({
  extended: true
}));



app.use('/i/', express.static('attachments'));

/*
  Handling emails from the SendGrid Inbound Parse webhook
  Sends them into Flex and creates a task
  Note: Demo purposes only. No security (eg: signature validation), validation or sanity checking here..
*/
app.post('/inbound', multer().any(), (req, res) => {
  console.log('received inbound email');

  const email = req.body;
  const parsedHeaders = utils.getParsedHeaders(email.headers);
  const fromAddress = parsedHeaders.from.address;
  const fromName = parsedHeaders.from.name;

  const subject = parsedHeaders.subject.replace(/^(?:[rR][Ee][(\[]?\d?[\])]?:\s?)+/gm, '');
  let html = email.html;
  let markdown = email.text;

  try {
    const attachments = JSON.parse(email['attachment-info']);
    req.files.forEach(file => {
      const attachment = attachments[file.fieldname];
      if (!attachment) {
        console.log('file not found', file);
        return;
      }

      const ext = attachment['filename'].split('.').pop();
      fs.writeFileSync(`./attachments/${attachment['content-id']}.${ext}`, file.buffer);
      const escapedCid = 'cid\\:' + attachment['content-id'].replace(/-/g, '\\-');
      // Note: assumes https always
      html = html.replace(new RegExp(escapedCid, 'g'), `https://${base}/i/${attachment['content-id']}.${ext}`);
    });
  } catch (e) {}

  try {
    markdown = markdown.replace('Sent from my iPhone', '');
    if (html && html.length) {
      markdown = extractHtmlContent(html);
    }
  } catch (e) {
    console.error('failed to convert html to markdown', e);
  }

  const threadID = fromAddress;
  const uniqueName = `${fromAddress}:${subject}`;

  const channelArgs = {
    flexFlowSid: process.env.FLEX_FLOW_SID,
    identity: fromAddress,
    chatUniqueName: uniqueName,
    chatUserFriendlyName: fromAddress,
    chatFriendlyName: subject,
    target: uniqueName,
    preEngagementData: JSON.stringify({
      threadID,
      fromName,
      fromAddress,
      subject
    })
  };

  twilio.flexApi.channel.create(channelArgs).then(channel => {
    console.log('got chat channel', channel.sid);

    getChannel(channel.sid).then(channel => {
      twilio.chat.services(process.env.PROGRAMABLE_CHAT_SERVICE)
        .channels(channel.sid)
        .messages
        .create({
          body: markdown,
          from: fromAddress,
          messageId: parsedHeaders['message-id'],
          inReplyTo: parsedHeaders['in-reply-to'],
          contentType: parsedHeaders['content-type']
        }).then(() => {
          let attrs = JSON.parse(channel.attributes) || {};

          utils.checkTaskPending(twilio, attrs.taskSid).then(pending => {
            if (pending) {
              console.log('not creating a new task because one is in progress');
            } else {
              utils.createTask(twilio, channel.sid, fromAddress)
                .then(task => {
                  console.log('created task', task.sid);

                  attrs.taskSid = task.sid;
                  channel.update({
                      attributes: JSON.stringify(attrs)
                    })
                    .then(() => console.log('updated channel attributes to', attrs))
                    .catch(e => console.error('failed to update channel attributes', e));
                })
                .catch(e => console.error('failed to create task', e));
            }
          }).catch(e => console.error('failed to send message to flex', e));
        }).catch(e => console.error('cannot convert inbound email to chat because channel doesn\'t exist', e));
    }).catch(e => console.error('failed to create channel', e.response.data));

    res.sendStatus(200);
  });
});

app.post('/flexflow', (req, res) => {
  console.log('got flexflow webhook', req.body);

  if (req.body.Source === 'SDK') {
    console.log('sending e-mail');

    getChannel(req.body.ChannelSid).then(channel => {
      const attrs = JSON.parse(channel.attributes);
      console.log('got channel attrs', attrs);

      const html = showdownConverter.makeHtml(req.body.Body);
      const msg = {
        to: attrs.pre_engagement_data.fromAddress,
        from: process.env.FROM_ADDRESS,
        subject: 'RE: ' + attrs.pre_engagement_data.subject,
        text: req.body.Body,
        html: html
      };

      sgMail.send(msg).then(e => {
        console.log('sent email', e);
      }).catch(e => {
        console.error('failed to send email', e);
      })
    });

    res.sendStatus(200);
  }
});

const getChannel = (channelSid) => {
  return twilio.chat.services(process.env.PROGRAMABLE_CHAT_SERVICE)
    .channels(channelSid)
    .fetch();
}

app.listen(process.env.PORT, () => console.log(`e-mail server listening on port ${process.env.PORT}`));
