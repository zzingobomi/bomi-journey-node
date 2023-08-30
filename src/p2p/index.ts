import { io, Socket } from "socket.io-client";
import {
  IAnswerPayload,
  ICandidatePayload,
  IOfferPayload,
  IRtcSockets,
  SocketMsgType,
  p2pType,
} from "./types";
import { RtcSocket } from "./RtcSocket";

export class P2P {
  socket: Socket;
  rtcSockets: IRtcSockets = {};

  OnSocketConnected?: (socketId: string) => void;
  OnAddRtcSocket?: (id: string) => void;
  OnRemoveRtcSocket?: (id: string) => void;

  constructor(scheme: string, host: string, port: string) {
    this.socket = io(`${scheme}://${host}:${port}`, {
      reconnectionDelayMax: 10000,
    });

    this.socket.on(SocketMsgType.Hello, (data) => {
      if (this.OnSocketConnected) this.OnSocketConnected(this.socket.id);
    });
  }

  public Join(roomId: string, type: p2pType) {
    this.socket.emit(SocketMsgType.JoinRoom, {
      roomId,
      type,
    });

    this.socket.on(SocketMsgType.OtherUsers, async (otherUsers: string[]) => {
      for (const otherUser of otherUsers) {
        const rtcSocket = new RtcSocket(otherUser);
        rtcSocket.Create();
        this.rtcSockets[otherUser] = rtcSocket;

        rtcSocket.OnIceCandidate = (payload: ICandidatePayload) => {
          payload.candidateSendId = this.socket.id;
          this.socket.emit(SocketMsgType.Candidate, payload);
        };
        // rtcSocket.OnConnectionStateChange = (ev: Event) => {
        //   const rtcConnectionState = (ev.currentTarget as RTCPeerConnection)
        //     .connectionState;
        //   console.log(`${otherUser} is ${rtcConnectionState}`);
        // };

        const offerSdp = await rtcSocket.CreateOffer();
        await rtcSocket.SetLocalDescription(offerSdp);

        const offerPayload: IOfferPayload = {
          sdp: offerSdp,
          offerSendId: this.socket.id,
          offerReceiveId: otherUser,
        };

        this.socket.emit(SocketMsgType.Offer, offerPayload);

        if (this.OnAddRtcSocket) this.OnAddRtcSocket(otherUser);
      }
    });

    this.socket.on(SocketMsgType.Offer, async (data: IOfferPayload) => {
      const { sdp, offerSendId } = data;
      const rtcSocket = new RtcSocket(offerSendId);
      rtcSocket.Create();
      this.rtcSockets[offerSendId] = rtcSocket;

      rtcSocket.OnIceCandidate = (payload: ICandidatePayload) => {
        payload.candidateSendId = this.socket.id;
        this.socket.emit(SocketMsgType.Candidate, payload);
      };
      // rtcSocket.OnConnectionStateChange = (ev: Event) => {
      //   const rtcConnectionState = (ev.currentTarget as RTCPeerConnection)
      //     .connectionState;
      //   console.log(`${offerSendId} is ${rtcConnectionState}`);
      // };

      await rtcSocket.SetRemoteDescription(sdp);
      const answerSdp = await rtcSocket.CreateAnswer();
      rtcSocket.SetLocalDescription(answerSdp);

      const answerPayload: IAnswerPayload = {
        sdp: answerSdp,
        answerSendId: this.socket.id,
        answerReceiveId: offerSendId,
      };

      this.socket.emit(SocketMsgType.Answer, answerPayload);

      if (this.OnAddRtcSocket) this.OnAddRtcSocket(offerSendId);
    });

    this.socket.on(SocketMsgType.Answer, (data: IAnswerPayload) => {
      const { sdp, answerSendId } = data;
      const rtcSocket = this.rtcSockets[answerSendId];
      rtcSocket.SetRemoteDescription(sdp);
    });

    this.socket.on(SocketMsgType.Candidate, async (data: ICandidatePayload) => {
      const { candidate, candidateSendId } = data;
      const rtcSocket = this.rtcSockets[candidateSendId];
      await rtcSocket.AddIceCandidate(candidate);
    });

    // TODO: 그냥 나갔을때 이 메세지를 안받나? 아니면 connectionState 로?
    this.socket.on(SocketMsgType.OtherExit, (exitSocketId: string) => {
      const rtcSocket = this.rtcSockets[exitSocketId];
      if (rtcSocket) {
        rtcSocket.CloseSendChannel();
        rtcSocket.CloseReceiveChannel();
        this.rtcSockets[exitSocketId] = null;
        delete this.rtcSockets[exitSocketId];

        if (this.OnRemoveRtcSocket) this.OnRemoveRtcSocket(exitSocketId);
      }
    });

    this.socket.on(SocketMsgType.Disconnect, (data) => {
      console.log(data);
    });
  }

  ///
  /// 호출되는 시점의 현재 rtcSocket 들을 리턴해준다.
  ///
  public GetAllRtcSockets() {
    return Object.values(this.rtcSockets);
  }

  public GetRtcSocket(id: string) {
    return this.rtcSockets[id];
  }
}
