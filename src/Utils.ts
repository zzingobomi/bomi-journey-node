import { encode } from "@colyseus/schema";
import { Protocol } from "./shared/Protocol";

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

export function utf8Read(view: number[], offset: number) {
  const length = view[offset++];

  var string = "",
    chr = 0;
  for (var i = offset, end = offset + length; i < end; i++) {
    var byte = view[i];
    if ((byte & 0x80) === 0x00) {
      string += String.fromCharCode(byte);
      continue;
    }
    if ((byte & 0xe0) === 0xc0) {
      string += String.fromCharCode(((byte & 0x1f) << 6) | (view[++i] & 0x3f));
      continue;
    }
    if ((byte & 0xf0) === 0xe0) {
      string += String.fromCharCode(
        ((byte & 0x0f) << 12) |
          ((view[++i] & 0x3f) << 6) |
          ((view[++i] & 0x3f) << 0)
      );
      continue;
    }
    if ((byte & 0xf8) === 0xf0) {
      chr =
        ((byte & 0x07) << 18) |
        ((view[++i] & 0x3f) << 12) |
        ((view[++i] & 0x3f) << 6) |
        ((view[++i] & 0x3f) << 0);
      if (chr >= 0x010000) {
        // surrogate pair
        chr -= 0x010000;
        string += String.fromCharCode(
          (chr >>> 10) + 0xd800,
          (chr & 0x3ff) + 0xdc00
        );
      } else {
        string += String.fromCharCode(chr);
      }
      continue;
    }
    throw new Error("Invalid byte " + byte.toString(16));
  }
  return string;
}

// Faster for short strings than Buffer.byteLength
export function utf8Length(str: string = "") {
  let c = 0;
  let length = 0;
  for (let i = 0, l = str.length; i < l; i++) {
    c = str.charCodeAt(i);
    if (c < 0x80) {
      length += 1;
    } else if (c < 0x800) {
      length += 2;
    } else if (c < 0xd800 || c >= 0xe000) {
      length += 3;
    } else {
      i++;
      length += 4;
    }
  }
  return length + 1;
}

export const replaceText = (selector: string, text: string) => {
  const element = document.getElementById(selector);
  if (element) element.innerText = text;
};

export const addText = (selector: string, text: string) => {
  const element = document.getElementById(selector);
  if (element) element.innerText += text + "\n";
};

export const addSelectList = (selector: string, text: string) => {
  const element = document.getElementById(selector) as HTMLSelectElement;
  if (element) {
    const option = document.createElement("option");
    option.value = text;
    option.text = text;
    element.appendChild(option);
  }
};

export const removeSelectList = (selector: string, text: string) => {
  const element = document.getElementById(selector) as HTMLSelectElement;
  if (element) {
    const optionToRemove = element.querySelector(`option[value="${text}"]`);
    if (optionToRemove) {
      optionToRemove.remove();
    }
  }
};

export const makeRandomString = (length: number) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
};
