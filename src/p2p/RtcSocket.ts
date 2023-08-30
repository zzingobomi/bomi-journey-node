import { DATA_CHANNEL_NAME, ICandidatePayload, StunUrls } from "./types";

export class RtcSocket {
  id: string;
  peerConnection: RTCPeerConnection;
  sendChannel?: RTCDataChannel;
  receiveChannel?: RTCDataChannel;

  OnIceCandidate?: (payload: ICandidatePayload) => void;
  OnConnectionStateChange?: (ev: Event) => void;
  OnIceConnectionStateChange?: (ev: Event) => void;
  OnSendChannelOpen?: (ev: Event) => void;
  OnSendChannelClose?: (ev: Event) => void;
  OnReceiveChannelOpen?: (ev: Event) => void;
  OnReceiveChannelClose?: (ev: Event) => void;
  OnReceiveChannelMessage?: (ev: MessageEvent<any>) => void;

  constructor(otherId: string) {
    this.id = otherId;
  }

  public Create() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: StunUrls,
        },
      ],
    });

    this.peerConnection.onicecandidate = (ev) => {
      if (ev.candidate) {
        const candidatePayload: ICandidatePayload = {
          candidate: ev.candidate,
          candidateReceiveId: this.id,
        };

        if (this.OnIceCandidate) this.OnIceCandidate(candidatePayload);
      }
    };

    // ========================
    // DataChannel
    // ========================

    this.sendChannel = this.peerConnection.createDataChannel(DATA_CHANNEL_NAME);
    this.sendChannel.onopen = (ev) => {
      if (this.OnSendChannelOpen) this.OnSendChannelOpen(ev);
    };
    this.sendChannel.onclose = (ev) => {
      if (this.OnSendChannelClose) this.OnSendChannelClose(ev);
    };

    this.peerConnection.ondatachannel = (ev) => {
      this.receiveChannel = ev.channel;
      this.receiveChannel.onopen = (ev) => {
        if (this.OnReceiveChannelOpen) this.OnReceiveChannelOpen(ev);
      };
      this.receiveChannel.onclose = (ev) => {
        if (this.OnReceiveChannelClose) this.OnReceiveChannelClose(ev);
      };
      this.receiveChannel.onmessage = (ev) => {
        if (this.OnReceiveChannelMessage) this.OnReceiveChannelMessage(ev);
      };
    };

    // ========================
    // StateChange
    // ========================

    this.peerConnection.onconnectionstatechange = (ev) => {
      if (this.OnConnectionStateChange) this.OnConnectionStateChange(ev);
    };

    this.peerConnection.oniceconnectionstatechange = (ev) => {
      if (this.OnIceConnectionStateChange) this.OnIceConnectionStateChange(ev);
    };
  }

  public async CreateOffer(options?: RTCOfferOptions) {
    const offerSdp = await this.peerConnection.createOffer(options);
    return offerSdp;
  }

  public async CreateAnswer(options?: RTCAnswerOptions) {
    const answerSdp = await this.peerConnection.createAnswer(options);
    return answerSdp;
  }

  public SetLocalDescription(sdp: RTCSessionDescriptionInit) {
    return this.peerConnection.setLocalDescription(sdp);
  }

  public SetRemoteDescription(sdp: RTCSessionDescriptionInit) {
    return this.peerConnection.setRemoteDescription(sdp);
  }

  public async AddIceCandidate(candidate: RTCIceCandidateInit) {
    return await this.peerConnection.addIceCandidate(candidate);
  }

  public CloseSendChannel() {
    if (this.sendChannel) this.sendChannel.close();
  }

  public CloseReceiveChannel() {
    if (this.receiveChannel) this.receiveChannel.close();
  }

  public Send(data: any) {
    if (this.sendChannel) this.sendChannel.send(data);
  }
}
