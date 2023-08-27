import { io } from "socket.io-client";
import { addSelectList, addText, removeSelectList, replaceText } from "./utils";

enum MessageType {
  Hello = "hello",
  JoinRoom = "joinRoom",
  OtherUsers = "otherUsers",
  Offer = "offer",
  Answer = "answer",
  Candidate = "candidate",
  Disconnect = "disconnect",
  OtherExit = "otherExit",
}

interface IOfferPayload {
  sdp: RTCSessionDescriptionInit;
  offerSendId: string;
  offerReceiveId: string;
}

interface IAnswerPayload {
  sdp: RTCSessionDescriptionInit;
  answerSendId: string;
  answerReceiveId: string;
}

interface ICandidatePayload {
  candidate: RTCIceCandidate;
  candidateSendId: string;
  candidateReceiveId: string;
}

interface IPeerInfo {
  peerConnection: RTCPeerConnection;
  sendChannel?: RTCDataChannel;
  receiveChannel?: RTCDataChannel;
}

interface IPeerConnections {
  [key: string]: IPeerInfo;
}

const DATA_CHANNEL_NAME = "data";

const peerConnections: IPeerConnections = {};

const socket = io(
  `${process.env.WS_SCHEME}://${process.env.WS_HOST}:${process.env.WS_PORT}`,
  {
    reconnectionDelayMax: 10000,
  }
);

socket.on(MessageType.Hello, (data) => {
  console.log("socket connected", socket.id);
  replaceText("socket-id", socket.id);
});

socket.emit(MessageType.JoinRoom, { roomId: "room1" });

socket.on(MessageType.OtherUsers, async (otherUsers: string[]) => {
  for (const otherUser of otherUsers) {
    addSelectList("others", otherUser);
    const peerConnection = createPeerConnection(otherUser);
    const offerSdp = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerSdp);

    const offerPayload: IOfferPayload = {
      sdp: offerSdp,
      offerSendId: socket.id,
      offerReceiveId: otherUser,
    };

    socket.emit(MessageType.Offer, offerPayload);
  }
});

socket.on(MessageType.Offer, async (data: IOfferPayload) => {
  const { sdp, offerSendId } = data;
  addSelectList("others", offerSendId);
  const peerConnection = createPeerConnection(offerSendId);
  await peerConnection.setRemoteDescription(sdp);
  const answerSdp = await peerConnection.createAnswer();
  peerConnection.setLocalDescription(answerSdp);

  const answerPayload: IAnswerPayload = {
    sdp: answerSdp,
    answerSendId: socket.id,
    answerReceiveId: offerSendId,
  };

  socket.emit(MessageType.Answer, answerPayload);
});

socket.on(MessageType.Answer, (data: IAnswerPayload) => {
  const { sdp, answerSendId } = data;
  const peerConnection = peerConnections[answerSendId].peerConnection;
  peerConnection.setRemoteDescription(sdp);
});

socket.on(MessageType.Candidate, async (data: ICandidatePayload) => {
  const { candidate, candidateSendId } = data;
  const peerConnection = peerConnections[candidateSendId].peerConnection;
  await peerConnection.addIceCandidate(candidate);
});

socket.on(MessageType.Disconnect, (data) => {
  console.log(data);
});

socket.on(MessageType.OtherExit, (exitSocketId: string) => {
  const peerInfo = peerConnections[exitSocketId];
  if (peerInfo.sendChannel) {
    peerInfo.sendChannel.close();
  }
  if (peerInfo.receiveChannel) {
    peerInfo.receiveChannel.close();
  }
  peerConnections[exitSocketId] = null;
  delete peerConnections[exitSocketId];
  removeSelectList("others", exitSocketId);
});

function createPeerConnection(otherSocketId: string) {
  const peerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });

  peerConnection.onicecandidate = (ev) => {
    if (ev.candidate) {
      const candidatePayload: ICandidatePayload = {
        candidate: ev.candidate,
        candidateSendId: socket.id,
        candidateReceiveId: otherSocketId,
      };

      socket.emit(MessageType.Candidate, candidatePayload);
    }
  };

  const peerInfo: IPeerInfo = {
    peerConnection,
  };

  peerConnections[otherSocketId] = peerInfo;

  // ========================
  // DataChannel
  // ========================
  const sendChannel = peerConnection.createDataChannel(DATA_CHANNEL_NAME);
  sendChannel.onopen = (ev) => {
    handleSendChannelStatusChange(sendChannel, ev);
  };
  sendChannel.onclose = (ev) => {
    handleSendChannelStatusChange(sendChannel, ev);
  };
  peerInfo.sendChannel = sendChannel;

  peerConnection.ondatachannel = (ev) => {
    const receiveChannel = ev.channel;
    peerInfo.receiveChannel = receiveChannel;
    receiveChannel.onopen = (ev) => {
      handleReceiveChannelStatusChange(receiveChannel, ev);
    };
    receiveChannel.onclose = (ev) => {
      handleReceiveChannelStatusChange(receiveChannel, ev);
    };
    receiveChannel.onmessage = (ev) => {
      handleReceiveMessage(receiveChannel, ev);
    };
  };

  // ========================
  // StateChange
  // ========================

  peerConnection.onconnectionstatechange = (ev) => {
    console.log(
      "Peer Connection State has changed:",
      peerConnection.connectionState
    );
  };

  peerConnection.oniceconnectionstatechange = (ev) => {
    //console.log("Ice Connection State has changed:", ev);
  };

  return peerConnection;
}

// ========================
// Handle DataChannel
// ========================

function handleSendChannelStatusChange(
  dataChannel: RTCDataChannel,
  event: Event
) {
  if (dataChannel) {
    if (dataChannel.readyState === "open") {
      console.log("Data channel is open.");
    } else if (dataChannel.readyState === "closed") {
      console.log("Data channel is closed.");
    }
  }
}

function handleReceiveChannelStatusChange(
  dataChannel: RTCDataChannel,
  event: Event
) {
  if (dataChannel) {
    console.log(
      "Receive channel's status has changed to " + dataChannel.readyState
    );
  }
}

function handleReceiveMessage(
  dataChannel: RTCDataChannel,
  event: MessageEvent<any>
) {
  addText("received", event.data);
}

document.getElementById("send-button").addEventListener("click", () => {
  const msgInputEle = document.getElementById("message") as HTMLInputElement;
  const toSelectEle = document.getElementById("others") as HTMLSelectElement;

  console.log(peerConnections[toSelectEle.value]);

  peerConnections[toSelectEle.value].sendChannel.send(
    `from ${socket.id}: ${msgInputEle.value}`
  );

  msgInputEle.value = "";
});
