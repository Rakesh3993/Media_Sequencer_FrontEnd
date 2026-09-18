import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export function createSocket(onSync, onPlaylist) {
  const client = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
    reconnectDelay: 3000,
    onConnect: () => {
      client.subscribe("/topic/sync", message => {
        onSync(JSON.parse(message.body));
      });

      onPlaylist?.(client);
    }
  });

  client.activate();
  return client;
}
