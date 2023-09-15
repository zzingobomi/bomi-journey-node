import { RtcSocket } from "@src/p2p/RtcSocket";
import { GameRoomStateSchema } from "../schema/GameRoomStateSchema";
import { Room } from "./Room";
import { Protocol } from "@src/shared/Protocol";
import { TransformSchema } from "../schema/TransformSchema";
import { Vec3Schema, Vec4Schema } from "../schema/VectorSchema";

export class GameRoom extends Room<GameRoomStateSchema> {
  OnCreate() {
    console.log("OnCreate");

    this.SetPatchRate(1000 / 20);
    //this.SetPatchRate(1000 / 60);

    const roomState = new GameRoomStateSchema();
    this.SetState(roomState);
  }

  OnJoin(rtcSocket: RtcSocket) {
    console.log(`OnJoin ${rtcSocket.id}`);
    // TODO: id 작업, startpoint 작업
    const playerTransform = new TransformSchema();
    this.state.CreatePlayer(rtcSocket.id, rtcSocket.id, playerTransform);
  }

  OnLeave(rtcSocketId: string) {
    console.log(`OnLeave ${rtcSocketId}`);
    this.state.RemovePlayer(rtcSocketId);
  }

  OnDispose() {
    console.log("OnDispose");
  }

  OnMessageProtocol(rtcSocket: RtcSocket, bytes: number[]) {
    const code = bytes[0];

    switch (code) {
      case Protocol.ENTITY_CHANGES:
        {
          bytes.shift();
          this.state.UpdatePlayerChanges(rtcSocket.id, bytes);
        }
        break;
      case Protocol.ENTITY_POSITION:
        {
          const [x, y, z] = this.decodeFloat32Array(bytes);
          this.state.UpdatePlayerPosition(
            rtcSocket.id,
            new Vec3Schema(x, y, z)
          );
        }
        break;
      case Protocol.ENTITY_QUATERNION:
        {
          const [x, y, z, w] = this.decodeFloat32Array(bytes);
          this.state.UpdatePlayerQuaternion(
            rtcSocket.id,
            new Vec4Schema(x, y, z, w)
          );
        }
        break;
      case Protocol.ENTITY_SCALE:
        {
          const [x, y, z] = this.decodeFloat32Array(bytes);
          this.state.UpdatePlayerScale(rtcSocket.id, new Vec3Schema(x, y, z));
        }
        break;
      case Protocol.ENTITY_STATE:
        {
          const state = bytes[1];
          this.state.UpdatePlayerState(rtcSocket.id, state);
        }
        break;
    }
  }

  OnMessage(rtcSocket: RtcSocket, { eventType, data }: any) {
    console.log(eventType, data);
  }

  private decodeFloat32Array(bytes: number[]): Float32Array {
    bytes.shift(); // Remove protocol code
    const uint8Array = new Uint8Array(bytes);
    return new Float32Array(uint8Array.buffer);
  }
}
