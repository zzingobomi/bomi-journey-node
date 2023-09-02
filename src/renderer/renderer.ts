/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

console.log(
  '👋 This message is being logged by "renderer.js", included via webpack'
);

import "./mvp.css";
import "./index.css";
import { P2P } from "@src/p2p";
import { Room } from "@src/game/Room";
import { GameRoomState } from "@src/game/GameRoomState";
import { addSelectList, addText, removeSelectList, replaceText } from "./utils";
import { GameRoom } from "@src/game/GameRoom";

export class App {
  p2pNode: P2P;
  p2pGame: P2P;
  room: Room<GameRoomState>;

  constructor() {
    // NodeP2P 세팅
    this.p2pNode = new P2P(
      process.env.WS_SCHEME,
      process.env.WS_HOST,
      process.env.WS_PORT
    );
    this.p2pNode.Join("noderoom1", "node");
    this.p2pNode.OnSocketConnected = (socketId: string) => {
      replaceText("socket-id-node", socketId);
    };
    this.p2pNode.OnAddRtcSocket = (id: string) => {
      const rtcSocket = this.p2pNode.GetRtcSocket(id);
      rtcSocket.OnConnectionStateChange = (ev: Event) => {
        const state = (ev.currentTarget as RTCPeerConnection).connectionState;
        switch (state) {
          case "connected":
            console.log(`${rtcSocket.id} is connected`);
            break;
          case "disconnected":
            console.log(`${rtcSocket.id} is disconnected`);
            break;
          default:
            console.log(state);
            break;
        }
      };
      rtcSocket.OnReceiveChannelMessage = (ev: MessageEvent<any>) => {
        addText("received-node", ev.data);
      };
      addSelectList("others-node", id);
    };
    this.p2pNode.OnRemoveRtcSocket = (id: string) => {
      removeSelectList("others-node", id);
    };

    // GameP2P 세팅
    this.p2pGame = new P2P(
      process.env.WS_SCHEME,
      process.env.WS_HOST,
      process.env.WS_PORT
    );
    this.p2pGame.Join("userroom1", "gameserver");
    this.p2pGame.OnSocketConnected = (socketId: string) => {
      replaceText("socket-id-game", socketId);
    };
    this.p2pGame.OnAddRtcSocket = (id: string) => {
      const rtcSocket = this.p2pGame.GetRtcSocket(id);
      rtcSocket.OnConnectionStateChange = (ev: Event) => {
        const state = (ev.currentTarget as RTCPeerConnection).connectionState;
        switch (state) {
          case "connected":
            console.log(`${rtcSocket.id} is connected`);
            break;
          case "disconnected":
            console.log(`${rtcSocket.id} is disconnected`);
            break;
          default:
            console.log(`${rtcSocket.id} is ${state}`);
            break;
        }
      };
      // TODO: SendchannelOpen 때 하는게 맞는가?
      rtcSocket.OnSendChannelOpen = (ev: Event) => {
        this.room._onJoin(rtcSocket);
      };
      rtcSocket.OnReceiveChannelMessage = (ev: MessageEvent<any>) => {
        if (typeof ev.data === "string") {
          this.room._onMessage(rtcSocket, JSON.parse(ev.data));
        } else {
          this.room._onMessageProtocol(rtcSocket, ev.data);
        }
      };
      addSelectList("users-game", id);
    };
    this.p2pGame.OnRemoveRtcSocket = (id: string) => {
      this.room._onLeave(id);
      removeSelectList("users-game", id);
    };

    // GameRoom 세팅
    this.room = new GameRoom();
    this.room._onCreate();

    // Usage
    document
      .getElementById("send-button-node")
      .addEventListener("click", () => {
        const msgInputEle = document.getElementById(
          "message-node"
        ) as HTMLInputElement;
        const toSelectEle = document.getElementById(
          "others-node"
        ) as HTMLSelectElement;

        this.p2pNode
          .GetRtcSocket(toSelectEle.value)
          .Send(`from ${this.p2pNode.socket.id}: ${msgInputEle.value}`);

        msgInputEle.value = "";
      });
  }
}

new App();
