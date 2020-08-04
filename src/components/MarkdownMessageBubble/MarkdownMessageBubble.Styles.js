import { default as styled } from 'react-emotion';

export default styled('div')`
  .messageToolbox a {
    display:inline-block;
  }

  .messageToolbox a:first-child {
    margin-right: 20px;
  }

  .markdownWrapper {
    overflow: hidden;
    text-overflow: hidden;
    margin-bottom: 15px;

    img {
      width: auto;
      height: auto;
    }
  }

  .bubbleWrapper {
    padding: 8px;
  }

  .bubbleHeader {
    display: flex;
    flex-wrap: nowrap;
    -webkit-box-flex: 1;
    flex-grow: 1;
    flex-shrink: 1;
    flex-direction: row;
    
  }

  .messageAuthor {
    margin-left: auto;
    margin-right: auto;
    font-size: 12px;
    width: 100%;
    display: flex;
    flex-wrap: nowrap;
    -webkit-box-flex: 1;
    flex-grow: 1;
    flex-shrink: 1;
    flex-direction: column;
    margin-right: 8px;
  }

  .messageDate {
    display:flex;
    text-align:right;
    font-size: 10px;
    flex: 0 0 auto;
  }

  .messageToolbox {
    display: flex;
    flex-wrap: nowrap;
    -webkit-box-flex: 1;
    flex-grow: 1;
    flex-shrink: 1;
    flex-direction: row;

    button:first-child {
      display:flex;
      flex: 0 1 auto;
      margin-right: 8px;
    }

    button {
      outline: none;
      display:flex;
      text-align:right;
      font-size: 10px;
      flex: 0 0 auto;
    }
  }


  strong {
    font-weight:bold;
  }
`;
