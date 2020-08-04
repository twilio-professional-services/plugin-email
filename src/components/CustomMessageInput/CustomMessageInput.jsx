import React from 'react';
import styled from 'react-emotion';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertToRaw } from 'draft-js';
import draftToMarkdown from 'draftjs-to-markdown';
import CustomMessageInputStyles from './CustomMessageInput.Styles'
import * as Flex from "@twilio/flex-ui";
import { withTheme } from '@twilio/flex-ui';

const Button = styled(Flex.Button)`
  background-color: ${(props) => props.theme.colors.defaultButtonColor};
  color: #fff;
  font-weight:bold;

  &:enabled {
    &:hover,
    &:active,
    &:focus {
      background-color: ${(props) => props.theme.colors.focusColor};
    }
  }
`;

class CustomMessageInput extends React.Component {
  constructor(props) {
    super(props)
    this.props = props;
    this.state = {
      editorState: EditorState.createEmpty(),
    }
  }

  onEditorStateChange = (editorState) => {
    this.setState({
      editorState
    });
  }

  send = () => {
    const { channel, useSeparateInputStore } = this.props;

    const raw = convertToRaw(this.state.editorState.getCurrentContent());
    const body = draftToMarkdown(raw);

    Flex.Actions.invokeAction('SendMessage', {
      body,
      channel,
      useSeparateInputStore
    });

    this.setState({editorState: EditorState.createEmpty()});
  }

  render() {
    return (
      <CustomMessageInputStyles>
        <Editor
          editorState={this.state.editorState}
          editorClassName='editorClassName'
          onEditorStateChange={this.onEditorStateChange}
          toolbar={{
            options: [
              'inline', 'fontSize', 'link', 'emoji',
            ],
            inline: {
              options: ['bold', 'italic', 'underline', 'monospace', 'superscript', 'subscript']
            }
          }}
        />
        <Button onClick={this.send}>Send</Button>
      </CustomMessageInputStyles>
    );
  }
}

export default withTheme(CustomMessageInput);
