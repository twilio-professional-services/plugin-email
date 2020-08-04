import React from 'react';
import { FlexPlugin } from 'flex-plugin';
import { TaskHelper } from '@twilio/flex-ui';

import MarkdownMessageBubble from './components/MarkdownMessageBubble/MarkdownMessageBubble';
import CustomMessageInput from './components/CustomMessageInput/CustomMessageInput';

const PLUGIN_NAME = 'EmailPlugin';

export default class EmailPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {
    this.registerEmailChannel(flex, manager);

    flex.MessageBubble.Content.replace(<MarkdownMessageBubble key="markdown-message-bubble" />, {
      if: props => {
        const task = TaskHelper.getTaskFromChannelSid(props.message.source.channel.sid);
        return task && task.taskChannelUniqueName === 'email';
      }
    });

    flex.MessageInput.Content.replace(<CustomMessageInput key="custom-message-input" />, {
      if: props => {
        let isEmail = false;
        try {
          const task = TaskHelper.getTaskFromChannelSid(props.channelSid);
          isEmail = task && task.taskChannelUniqueName === 'email'

          if (isEmail) {
            // TODO: Make less gross
            document.getElementsByClassName('Twilio-TaskCanvasHeader-Name')[0]
              .textContent = props.channel.source.attributes.pre_engagement_data.subject;

            document.querySelectorAll('.Twilio-TaskCanvasHeader-EndButton span')[0].textContent = 'END EMAIL INTERACTION';
            document.querySelectorAll('.Twilio-TabHeader span')[0].textContent = 'Email';
          }
        } catch (e) {
          console.error('failed to do things', e);
        }

        return isEmail;
      }
    });

    // Add attributes and channel to task info panel, useful for debugging.
    manager.strings.TaskInfoPanelContent = manager.strings.TaskInfoPanelContent
      + `<h2>Task Channel</h2><p>{{task.taskChannelUniqueName}}</p>`
      + `<h2>Attributes</h2><ul>{{#each task.attributes}}<li>{{@key}}: {{this}}</li>{{/each}}</p>`
  }

  /**
   * Makes the flex-ui understand our custom Email channel
   * enabling custom rendering and handling of sending via SendGrid
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param _manager { import('@twilio/flex-ui').Manager }
   */
  registerEmailChannel(flex, _manager) {
    const EmailChannel = flex.DefaultTaskChannels.createChatTaskChannel(
      'Email',
      task => task.taskChannelUniqueName === 'email'
    );

    EmailChannel.templates.TaskListItem.firstLine = task => task.attributes.name;
    EmailChannel.templates.TaskCanvasHeader.title = task => task.attributes.name;
    EmailChannel.templates.IncomingTaskCanvas.firstLine = task => task.attributes.subject;
    EmailChannel.templates.IncomingTaskCanvas.secondLine = task => task.attributes.message;

    ['active', 'list', 'main'].forEach(icon => {
      EmailChannel.icons[icon] = <svg xmlns="http://www.w3.org/2000/svg" fill="#fff" width="24" height="24" viewBox="0 0 24 24">
        <path d="M0 3v18h24v-18h-24zm6.623 7.929l-4.623 5.712v-9.458l4.623 3.746zm-4.141-5.929h19.035l-9.517 7.713-9.518-7.713zm5.694 7.188l3.824 3.099 3.83-3.104 5.612 6.817h-18.779l5.513-6.812zm9.208-1.264l4.616-3.741v9.348l-4.616-5.607z" />
        </svg>;
    });

    flex.TaskChannels.register(EmailChannel);
  }
}
