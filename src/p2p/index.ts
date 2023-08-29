import { io, Socket } from "socket.io-client";
import {
  DATA_CHANNEL_NAME,
  IAnswerPayload,
  ICandidatePayload,
  IOfferPayload,
  IPeerConnections,
  IPeerInfo,
  SocketMsgType,
  p2pType,
} from "./types";

export class P2P {
  socket: Socket;
  peerConnections: IPeerConnections = {};

  onSocketConnected?: (socketId: string) => void;
  onConnectionStateChange?: (otherSocketid: string, ev: Event) => void;
  onIceConnectionStateChange?: (otherSocketid: string, ev: Event) => void;
  onAddPeerConnection?: (otherSocketid: string) => void;
  onRemovePeerConnection?: (otherSocketid: string) => void;
  onSendChannelOpen?: (otherSocketid: string, ev: Event) => void;
  onSendChannelClose?: (otherSocketid: string, ev: Event) => void;
  onReceiveChannelOpen?: (otherSocketid: string, ev: Event) => void;
  onReceiveChannelClose?: (otherSocketid: string, ev: Event) => void;
  onReceiveChannelMessage?: (otherSocketid: string, ev: Event) => void;

  constructor(scheme: string, host: string, port: string) {
    this.socket = io(`${scheme}://${host}:${port}`, {
      reconnectionDelayMax: 10000,
    });

    this.socket.on(SocketMsgType.Hello, (data) => {
      if (this.onSocketConnected) this.onSocketConnected(this.socket.id);
    });
  }

  public Init(roomId: string, type: p2pType) {
    this.socket.emit(SocketMsgType.JoinRoom, {
      roomId,
      type,
    });

    this.socket.on(SocketMsgType.OtherUsers, async (otherUsers: string[]) => {
      for (const otherUser of otherUsers) {
        const peerConnection = this.createPeerConnection(otherUser);
        const offerSdp = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offerSdp);

        const offerPayload: IOfferPayload = {
          sdp: offerSdp,
          offerSendId: this.socket.id,
          offerReceiveId: otherUser,
        };

        this.socket.emit(SocketMsgType.Offer, offerPayload);

        if (this.onAddPeerConnection) this.onAddPeerConnection(otherUser);
      }
    });

    this.socket.on(SocketMsgType.Offer, async (data: IOfferPayload) => {
      const { sdp, offerSendId } = data;
      const peerConnection = this.createPeerConnection(offerSendId);
      await peerConnection.setRemoteDescription(sdp);
      const answerSdp = await peerConnection.createAnswer();
      peerConnection.setLocalDescription(answerSdp);

      const answerPayload: IAnswerPayload = {
        sdp: answerSdp,
        answerSendId: this.socket.id,
        answerReceiveId: offerSendId,
      };

      this.socket.emit(SocketMsgType.Answer, answerPayload);

      if (this.onAddPeerConnection) this.onAddPeerConnection(offerSendId);
    });

    this.socket.on(SocketMsgType.Answer, (data: IAnswerPayload) => {
      const { sdp, answerSendId } = data;
      const peerConnection = this.peerConnections[answerSendId].peerConnection;
      peerConnection.setRemoteDescription(sdp);
    });

    this.socket.on(SocketMsgType.Candidate, async (data: ICandidatePayload) => {
      const { candidate, candidateSendId } = data;
      const peerConnection =
        this.peerConnections[candidateSendId].peerConnection;
      await peerConnection.addIceCandidate(candidate);
    });

    // TODO: 그냥 나갔을때 이 메세지를 안받나? 아니면 connectionState 로?
    this.socket.on(SocketMsgType.OtherExit, (exitSocketId: string) => {
      const peerInfo = this.peerConnections[exitSocketId];
      if (peerInfo) {
        if (peerInfo.sendChannel) {
          peerInfo.sendChannel.close();
        }
        if (peerInfo.receiveChannel) {
          peerInfo.receiveChannel.close();
        }
        this.peerConnections[exitSocketId] = null;
        delete this.peerConnections[exitSocketId];

        if (this.onRemovePeerConnection)
          this.onRemovePeerConnection(exitSocketId);
      }
    });

    this.socket.on(SocketMsgType.Disconnect, (data) => {
      console.log(data);
    });
  }

  public Send(otherSocketId: string, data: any) {
    this.peerConnections[otherSocketId].sendChannel?.send(data);
  }

  private createPeerConnection(otherSocketId: string) {
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
          candidateSendId: this.socket.id,
          candidateReceiveId: otherSocketId,
        };

        this.socket.emit(SocketMsgType.Candidate, candidatePayload);
      }
    };

    const peerInfo: IPeerInfo = {
      id: otherSocketId,
      peerConnection,
    };

    this.peerConnections[otherSocketId] = peerInfo;

    // ========================
    // DataChannel
    // ========================

    const sendChannel = peerConnection.createDataChannel(DATA_CHANNEL_NAME);
    sendChannel.onopen = (ev) => {
      if (this.onSendChannelOpen) this.onSendChannelOpen(otherSocketId, ev);
    };
    sendChannel.onclose = (ev) => {
      if (this.onSendChannelClose) this.onSendChannelClose(otherSocketId, ev);
    };
    peerInfo.sendChannel = sendChannel;

    peerConnection.ondatachannel = (ev) => {
      const receiveChannel = ev.channel;
      peerInfo.receiveChannel = receiveChannel;
      receiveChannel.onopen = (ev) => {
        if (this.onReceiveChannelOpen)
          this.onReceiveChannelOpen(otherSocketId, ev);
      };
      receiveChannel.onclose = (ev) => {
        if (this.onReceiveChannelClose)
          this.onReceiveChannelClose(otherSocketId, ev);
      };
      receiveChannel.onmessage = (ev) => {
        if (this.onReceiveChannelMessage)
          this.onReceiveChannelMessage(otherSocketId, ev);
      };
    };

    // ========================
    // StateChange
    // ========================

    peerConnection.onconnectionstatechange = (ev) => {
      if (this.onConnectionStateChange)
        this.onConnectionStateChange(otherSocketId, ev);
    };

    peerConnection.oniceconnectionstatechange = (ev) => {
      if (this.onIceConnectionStateChange)
        this.onIceConnectionStateChange(otherSocketId, ev);
    };

    return peerConnection;
  }

  // TODO: handle data channel / onconnections 등 콜백으로 처리하기
  // ========================
  // Handle DataChannel
  // ========================

  // private handleSendChannelStatusChange(
  //   dataChannel: RTCDataChannel,
  //   event: Event
  // ) {
  //   if (dataChannel) {
  //     if (dataChannel.readyState === "open") {
  //       console.log("node data channel is open.");
  //     } else if (dataChannel.readyState === "closed") {
  //       console.log("node data channel is closed.");
  //     }
  //   }
  // }

  // private handleReceiveChannelStatusChange(
  //   dataChannel: RTCDataChannel,
  //   event: Event
  // ) {
  //   if (dataChannel) {
  //     console.log(
  //       "node receive channel's status has changed to " + dataChannel.readyState
  //     );
  //   }
  // }

  // private handleReceiveMessage(
  //   dataChannel: RTCDataChannel,
  //   event: MessageEvent<any>
  // ) {
  //   console.log("received:", event.data);
  // }
}
