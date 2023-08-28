export enum MessageType {
  Hello = "hello",
  JoinRoom = "joinRoom",
  OtherUsers = "otherUsers",
  Offer = "offer",
  Answer = "answer",
  Candidate = "candidate",
  Disconnect = "disconnect",
  OtherExit = "otherExit",
}

export interface IOfferPayload {
  sdp: RTCSessionDescriptionInit;
  offerSendId: string;
  offerReceiveId: string;
}

export interface IAnswerPayload {
  sdp: RTCSessionDescriptionInit;
  answerSendId: string;
  answerReceiveId: string;
}

export interface ICandidatePayload {
  candidate: RTCIceCandidate;
  candidateSendId: string;
  candidateReceiveId: string;
}

export interface IPeerInfo {
  id: string;
  peerConnection: RTCPeerConnection;
  sendChannel?: RTCDataChannel;
  receiveChannel?: RTCDataChannel;
}

export interface IPeerConnections {
  [key: string]: IPeerInfo;
}

export const DATA_CHANNEL_NAME = "data";

// For GameServer
export type Client = IPeerInfo;

export enum EventType {
  ReceiveData = "receiveData",
}
