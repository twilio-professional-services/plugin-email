require('dotenv').config();

const client = require('twilio')(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

console.log('cleaning up taskrouter tasks');

client.taskrouter.workspaces(process.env.WORKSPACE_SID)
    .tasks
    .list({limit: 500})
    .then(tasks => {
        tasks.forEach(task => {
            task.remove().then(() => console.log('removed', task.sid));
        });
    }).catch(e => console.error('failed to cleanup tasks', e));

console.log('cleaning up chat channels');

client.chat.services(process.env.PROGRAMABLE_CHAT_SERVICE)
    .channels
    .list({limit: 500})
    .then(channels => {
        channels.forEach(channel => {
            channel.remove().then(() => console.log('removed', channel.sid));
        });
    }).catch(e => console.error('failed to cleanup chat', e));

