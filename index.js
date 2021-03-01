import React, { Component } from "react";
import { render } from "react-dom";
import "./style.css";

/*
Application Requirements:
1. All messages are displayed in a list.
2. Each message has its content, senderUuid , and sentAt properties displayed.
3. Messages are displayed at-most once. If there are duplicated messages, we would like
them to be deduplicated if the uuid and content are the same.
4. Instead of showing the sentAt timestamp, we would like to display a more
human-readable string such as "DayOfTheWeek Month Day, Year at Time" .
5. Support sorting by sentAt in either ascending or descending order.
6. Support pagination through messages where each page contains 5 messages. You are
welcome to implement this how you see fit, e.g. infinite scrolling, a button, etc.
7. Allow a message to be deleted. You are welcome to implement this how you see fit.
*/

// This is the list of messages.
import { messages } from "./data.json";

// Top level App Component.
class App extends Component {
  render() {
    return <ChatList msgs={this.props.msgs} />;
  }
}

// Represents a formatted list of Chat objects
// Filters out duplicate messages, defined as two objects with
// identical uuid and content.
// Props:
//    msgs: a list of JSON message objects called msgs
// QUESTION: are we sure we don't want to check for user in the duplicate
// check? Are the same message with the same ID from different users possible?
// Should that be counted as a duplicate?
// TODO: Consider time complexity of find function O(n)? within reduce O(n) ~= O(n^2).
// This could be improved by using something with O(1) lookup, like a set/dictionary,
// but reduce doesn't like those...
class ChatList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      allMsgs: this.filterDuplicates(props.msgs),
      pageLen: 5,
      currPage: 1,
      loading: false
    };
  }
  // This hook is used to add a listener to load more chats when the user
  // has scrolled to the bottom of the list.
  componentDidMount() {
    let sb = this.refs.scrollBox;
    sb.addEventListener("scroll", () => {
      if (sb.scrollTop + sb.clientHeight >= sb.scrollHeight) {
        this.loadMore();
      }
    });
  }
  // NOTE: This works well with small sets of chat messages,
  // but it does NOT unload previous chats after a certain amount of scrolling.
  // For significantly larger message lists, chats past which we have already
  // scrolled should eventually be destroyed for performance.
  loadMore = () => {
    // Check if there's anything else to load (we couldn't do this with an API,
    // but it works well with our JSON file setup). 
    // Don't try to load if nothing will happen, or if already loading.
    if (this.state.loading || this.state.currPage * this.state.pageLen >= this.state.allMsgs.length) {
      return;
    }
    this.setState({ loading: true });
    // For an actual application, we could add an API call around here.
    // The timeout is simply here to simiulate the slight delay in API return.
    setTimeout(() => {
      this.setState({ currPage: (this.state.currPage += 1), loading: false });
    }, 1000);
  };
  // builds Chat components for all msgs up to current page
  displayItems = () => {
    return this.state.allMsgs
      .slice(0, this.state.pageLen * this.state.currPage)
      .map(m => <Chat 
        key={m.uuid + m.content}
        id={m.uuid + m.content} 
        msg={m} 
        onDelete={this.handleDelete} />
      );
  };
  // Removes duplicates, defined as a message object with identical
  // uuid and content. Does NOT check sender field.
  filterDuplicates = (msgs) => {
    return msgs.reduce((accum, current) => {
      const seen = accum.find(
        m => m.uuid === current.uuid && m.content === current.content
      );
      if (seen) {
        return accum;
      } else {
        return accum.concat([current]);
      }
    }, []);
  };
  // This function is passed to the Chat child object, which will 
  // call it when the delete button is pressed.
  handleDelete = (id) => {
    this.setState({allMsgs: this.state.allMsgs.filter(m => m.uuid+m.content != id)});
  }
  render() {
    return (
      <div className="scrollBox" ref="scrollBox">
        <ol className="chatList">{this.displayItems()}</ol>
        <div className="loading">
          {this.state.loading ?
            <img
              width="20px"
              height="20px"
              src="https://media.giphy.com/media/sSgvbe1m3n93G/source.gif"
            />
          : "No further messages." }
        </div>
      </div>
    );
  }
}

// Represents a single chat message.
// Props: 
//    msg: a JSON message object
//    id: a string of message uuid+content
//    onDelete: a callback to handle a delete chat button press
class Chat extends Component {
  render() {
    return (
      <div className="chat">
        <span>User: {this.props.msg.senderUuid}&nbsp;&nbsp;&nbsp;</span>
        <PrettyTimestamp stamp={this.props.msg.sentAt} />
        <table>
          <tbody>
            <tr>
              <td>
                <div>{this.props.msg.content}</div>
              </td>
              <td width="5%">
                <button 
                  className="delete" 
                  onClick={() => this.props.onDelete(this.props.id)}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

// Represents a sentAt string in a pretty format
// Props:
//    stamp: a datetime string from the message object
class PrettyTimestamp extends Component {
  // Converts a string into a more human-friendly format.
  // Params: a string of the form "2015-05-22T13:55:10.542Z"
  formatStamp = (s) => {
    let options = {
      day: "numeric",
      weekday: "long",
      year: "numeric",
      month: "long"
    };
    let stamp = new Date(Date.parse(s));
    return (
      stamp.toLocaleDateString("us-EN", options) +
      " at " +
      stamp.toLocaleTimeString()
    );
  };
  render() {
    // Convert stamp to a more natural format before returning
    return <span className="stamp">{this.formatStamp(this.props.stamp)}</span>;
  }
}

render(<App msgs={messages} />, document.getElementById("root"));
