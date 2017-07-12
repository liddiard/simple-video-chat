import React, { Component } from 'react';
import PropTypes from 'prop-types';
import qs from 'qs';
import SimpleWebRTC from 'simplewebrtc';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      room: null,
      havePeer: false,
      localMediaError: false
    };
  }

  componentDidMount() {
    let id = this.props.query.id;
    if (!id) {
      id = this.generateUID();
      window.history.replaceState({}, '', `?id=${id}`);
    }
    this.setState({ room: id });

    if (!navigator.mediaDevices) {
      return this.alertUnsupported();
    }

    navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      if (!devices.some(device => device.label.length)) {
        alert('You will be prompted for access to your camera and microphone for the video chat.\n\nPlease allow access in order to video chat.');
      }
    });

    const webrtc = new SimpleWebRTC({
      // the id/element dom element that will hold "our" video
      localVideoEl: 'local-video',
      // the id/element dom element that will hold remote videos
      remoteVideosEl: 'remote-video',
      // immediately ask for camera access
      autoRequestMedia: true
    });

    if (!webrtc.capabilities.supportGetUserMedia) {
      return this.alertUnsupported();
    }

    // we have to wait until it's ready
    webrtc.on('readyToCall', () => {
      if (this.state.room) {
        webrtc.joinRoom(this.state.room);
      }
      else {
        throw new Error('No room provided to join.');
      }
    });

    webrtc.on('videoAdded', (video, peer) => {
      const peers = webrtc.getPeers();
      if (peers.length > 1) {
        return alert('A third person has attempted to join the video call. However, they will not be displayed because video chats with more than two people are not currently supported.');
      }
      this.setState({ havePeer: true });
      const remotes = document.getElementById('remote-video');
      remotes.appendChild(video);
    });

    webrtc.on('videoRemoved', (video, peer) => {
      document.getElementById('remote-video').removeChild(video);
      this.setState({ havePeer: false });
    });

    webrtc.on('localMediaError', err => {
      this.setState({ localMediaError: true });
    });
  }

  generateUID() {
    // generate 8-character random alphanumeric string
    // http://stackoverflow.com/a/12502559/2487925
    // set upper limit because chrome represents numbers with higher
    // precision than other browsers
    return Math.random().toString(36).slice(2, 10)
  }

  alertUnsupported() {
    alert('Sorry, your browser does not support video chat. Please try using Google Chrome, Firefox, or an Android browser.');
  }

  render() {
    let message;
    if (this.state.localMediaError) {
      message = (
        <div className="top message">
          <p>Please allow access to your camera for the video chat.</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      );
    }
    else if (!this.state.havePeer) {
      if (this.props.query.id) {
        message = (
          <div className="center message">
            Waiting for someone else to join the video chat…
          </div>
        );
      }
      else {
        message = (
          <div className="top message">
            Share the URL in the address bar with a friend to begin your video chat.
          </div>
        );
      }
    }

    return (
      <div className="App">
        {message}
        <video id="local-video"></video>
        <div id="remote-video"></div>
      </div>
    );
  }
}

App.defaultProps = {
  query: qs.parse(window.location.search, { ignoreQueryPrefix: true })
};

App.propTypes = {
  query: PropTypes.object.isRequired
};

export default App;
