import { RtcSocket } from "@src/p2p/RtcSocket";
import { GameRoomState } from "./GameRoomState";
import { Room } from "./Room";

export class GameRoom extends Room<GameRoomState> {
  OnCreate() {
    console.log("OnCreate");

    this.SetPatchRate(1000 / 20);

    const roomState = new GameRoomState();
    this.SetState(roomState);
  }

  OnJoin(rtcSocket: RtcSocket) {
    console.log(`OnJoin ${rtcSocket.id}`);
    this.state.addPlayer(rtcSocket.id);
  }

  OnLeave(rtcSocketId: string) {
    console.log(`OnLeave ${rtcSocketId}`);
    this.state.removePlayer(rtcSocketId);
  }

  OnDispose() {
    console.log("OnDispose");
  }

  OnMessage(rtcSocket: RtcSocket, { eventType, data }: any) {
    if (eventType === "move") {
      this.state.movePlayer(rtcSocket.id, data);
    }
  }
}
