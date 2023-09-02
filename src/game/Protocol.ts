import { encode } from "@colyseus/schema";

// Colyseus protocol codes range between 0~100
export enum Protocol {
  // Room-related (10~19)
  JOIN_ROOM = 10,
  ERROR = 11,
  LEAVE_ROOM = 12,
  ROOM_DATA = 13,
  ROOM_STATE = 14,
  ROOM_STATE_PATCH = 15,
  ROOM_DATA_SCHEMA = 16, // used to send schema instances via room.send()
  ROOM_DATA_BYTES = 17,
}

export const getMessageBytes = {
  [Protocol.JOIN_ROOM]: (handshake?: number[]) => {
    let offset = 0;

    const handshakeLength = handshake ? handshake.length : 0;

    const buff = new Uint8Array(1 + handshakeLength);
    buff[offset++] = Protocol.JOIN_ROOM;

    if (handshake) {
      for (let i = 0, l = handshake.length; i < l; i++) {
        buff[offset++] = handshake[i];
      }
    }

    return buff;
  },

  [Protocol.ERROR]: (code: number, message: string = "") => {
    const bytes = [Protocol.ERROR];

    encode.number(bytes, code);
    encode.string(bytes, message);

    return bytes;
  },

  [Protocol.ROOM_STATE]: (bytes: number[]) => {
    return new Uint8Array([Protocol.ROOM_STATE, ...bytes]);
  },
};
