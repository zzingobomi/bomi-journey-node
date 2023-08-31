import { RtcSocket } from "@src/p2p/RtcSocket";
import { State } from "./PlayerSchema";
import { Protocol } from "./Protocol";
import { SchemaSerializer } from "./SchemaSerializer";
import PubSub from "pubsub-js";
import { RtcSocketEventType } from "@src/p2p/types";

export class GameServer {
  public rtcSockets: RtcSocket[] = [];

  public state: State;

  private _patchInterval: number | undefined;

  private _serializer: SchemaSerializer<State> = new SchemaSerializer();

  token: string;

  constructor() {
    console.log("Gameserver Created!");

    this.setPatchRate(1000 / 20);

    this.setState(new State());

    this.token = PubSub.subscribe(RtcSocketEventType.ReceiveData, (msg, data) =>
      this.onMessageCallback(data)
    );
  }

  public onJoin(rtcSocket: RtcSocket) {
    this.rtcSockets.push(rtcSocket);
    this.state.createPlayer(rtcSocket.id);

    // confirm room id that matches the room name requested to join
    rtcSocket.sendChannel.send(new Uint8Array([Protocol.JOIN_ROOM]));
  }

  public onLeave(rtcSocket: RtcSocket) {
    this.rtcSockets = this.rtcSockets.filter((c) => c.id !== rtcSocket.id);
    this.state.removePlayer(rtcSocket.id);
  }

  public onDispose() {
    console.log("Dispose GameServer");
  }

  public setPatchRate(milliseconds: number): void {
    // clear previous interval in case called setPatchRate more than once
    if (this._patchInterval) {
      clearInterval(this._patchInterval);
      this._patchInterval = undefined;
    }

    if (milliseconds !== null && milliseconds !== 0) {
      this._patchInterval = window.setInterval(() => {
        this.broadcastPatch();
      }, milliseconds);
    }
  }

  public setState(newState: State) {
    this._serializer.reset(newState);

    this.state = newState;
  }

  protected broadcastPatch(): boolean {
    if (this.rtcSockets.length > 0) {
      return this._serializer.applyPatches(this.rtcSockets);
    }
    return false;
  }

  private onMessageCallback(data: number[]) {
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
        //this.sendFullState(client);
        break;
      case Protocol.LEAVE_ROOM:
        console.log("leaveRoom");
        break;
    }
  }

  private sendFullState(rtcSocket: RtcSocket): void {
    //client.enqueueRaw(getMessageBytes[Protocol.ROOM_STATE](this._serializer.getFullState(client)));
  }
}
