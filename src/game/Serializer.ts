import { RtcSocket } from "@src/p2p/RtcSocket";

export interface Serializer<T> {
  id: string;
  reset(data: any): void;
  getFullState(rtcSocket?: RtcSocket): any;
  applyPatches(rtcSockets: RtcSocket[]): boolean;
  handshake?(): number[];
}
