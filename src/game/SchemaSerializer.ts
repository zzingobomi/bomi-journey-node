import { Schema, Reflection } from "@colyseus/schema";
import { RtcSocket } from "@src/p2p/RtcSocket";
import { Protocol } from "./Protocol";
import { Serializer } from "./Serializer";
import { ClientState } from "@src/p2p/types";

export class SchemaSerializer<T> implements Serializer<T> {
  public id = "@colyseus/schema";
  private state: T & Schema;

  private handshakeCache: number[];

  public reset(newState: T & Schema) {
    this.state = newState;
  }

  public getFullState(rtcSocket?: RtcSocket) {
    const fullEncodedState = this.state.encodeAll(true);
    return fullEncodedState;
  }

  public applyPatches(rtcSockets: RtcSocket[]): boolean {
    const hasChanges = this.state["$changes"].changes.size > 0;

    if (hasChanges) {
      let numClients = rtcSockets.length;

      // get patch bytes
      const patches = this.state.encode(false, [], true);

      while (numClients--) {
        const client = rtcSockets[numClients];

        if (
          client.peerConnection.connectionState === "connected" &&
          client.sendChannel.readyState === "open"
        ) {
          if (client.state === ClientState.JOINED) {
            client.sendChannel.send(
              new Uint8Array([Protocol.ROOM_STATE_PATCH, ...patches])
            );
          }
        }
      }

      this.state.discardAllChanges();
      return true;
    }

    return false;
  }

  public handshake() {
    /**
     * Cache handshake to avoid encoding it for each client joining
     */
    if (!this.handshakeCache) {
      this.handshakeCache = this.state && Reflection.encode(this.state);
    }

    return this.handshakeCache;
  }
}
