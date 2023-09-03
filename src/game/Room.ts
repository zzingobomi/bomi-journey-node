import { RtcSocket } from "@src/p2p/RtcSocket";
import { SchemaSerializer } from "./SchemaSerializer";
import { Schema } from "@colyseus/schema";
import { ClientState } from "@src/p2p/types";
import { Protocol } from "@src/shared/Protocol";
import { getMessageBytes } from "@src/Utils";

export abstract class Room<State extends Schema> {
  public rtcSockets: RtcSocket[] = [];

  public state: State;

  private patchInterval: number | undefined;
  private serializer: SchemaSerializer<State> = new SchemaSerializer();

  abstract OnCreate(): void | Promise<any>;
  abstract OnJoin(rtcSocket: RtcSocket): void | Promise<any>;
  abstract OnLeave(rtcSocketId: string): void | Promise<any>;
  abstract OnDispose(): void | Promise<any>;
  abstract OnMessageProtocol(
    rtcSocket: RtcSocket,
    bytes: number[]
  ): void | Promise<any>;
  abstract OnMessage(rtcSocket: RtcSocket, data: any): void | Promise<any>;

  public async _onCreate() {
    await this.OnCreate();
  }

  public async _onJoin(rtcSocket: RtcSocket) {
    this.rtcSockets.push(rtcSocket);

    await this.OnJoin(rtcSocket);

    rtcSocket.Send(
      getMessageBytes[Protocol.JOIN_ROOM](
        this.serializer && this.serializer.handshake()
      )
    );
  }

  public async _onLeave(rtcSocketId: string) {
    this.rtcSockets = this.rtcSockets.filter((c) => c.id !== rtcSocketId);

    await this.OnLeave(rtcSocketId);
  }

  public async _onDispose() {
    await this.OnDispose();
  }

  public SetPatchRate(milliseconds: number): void {
    // clear previous interval in case called setPatchRate more than once
    if (this.patchInterval) {
      clearInterval(this.patchInterval);
      this.patchInterval = undefined;
    }

    if (milliseconds !== null && milliseconds !== 0) {
      this.patchInterval = window.setInterval(() => {
        this.broadcastPatch();
      }, milliseconds);
    }
  }

  public SetState(newState: State) {
    this.serializer.reset(newState);

    this.state = newState;
  }

  public _onMessageProtocol(rtcSocket: RtcSocket, data: number[]) {
    const bytes = Array.from(new Uint8Array(data));
    const code = bytes[0];

    switch (code) {
      case Protocol.ROOM_DATA:
        console.log("ROOM_DATA");
        break;
      case Protocol.ROOM_DATA_BYTES:
        console.log("ROOM_DATA_BYTES");
        break;
      case Protocol.JOIN_ROOM:
        console.log("joinRoom");
        rtcSocket.state = ClientState.JOINED;

        this.sendFullState(rtcSocket);
        break;
      case Protocol.LEAVE_ROOM:
        console.log("leaveRoom");
        break;
      case Protocol.ENTITY_POSITION:
      case Protocol.ENTITY_QUATERNION:
      case Protocol.ENTITY_SCALE:
      case Protocol.ENTITY_STATE:
        this.OnMessageProtocol(rtcSocket, bytes);
        break;
      default:
        console.error(`inknown protocol type! ${code}`);
        break;
    }
  }

  public async _onMessage(rtcSocket: RtcSocket, data: any) {
    await this.OnMessage(rtcSocket, data);
  }

  protected broadcastPatch(): boolean {
    if (!this.state) {
      return false;
    }

    if (this.rtcSockets.length > 0) {
      return this.serializer.applyPatches(this.rtcSockets);
    }
    return false;
  }

  private sendFullState(rtcSocket: RtcSocket): void {
    rtcSocket.Send(
      getMessageBytes[Protocol.ROOM_STATE](
        this.serializer.getFullState(rtcSocket)
      )
    );
  }
}
