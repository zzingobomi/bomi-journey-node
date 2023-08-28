import { Client } from "../renderer/types";

export interface Serializer<T> {
  id: string;
  reset(data: any): void;
  getFullState(client?: Client): any;
  applyPatches(clients: Client[]): boolean;
  handshake?(): number[];
}
