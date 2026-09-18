import React, { useEffect, useMemo, useState } from "react";
import { API } from "../api";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import MediaRenderer from "./MediaRenderer";
import { calculateNormalState, formatTime } from "./AppConstant";

const CYCLE_MS = 5 * 60 * 60 * 1000;

const PlayerWindow = ({ windowInfo }) => {
  const [playlist, setPlaylist] = useState([]);
  const [serverOffset, setServerOffset] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [sync, setSync] = useState(null);
  const [cycleStartTime] = useState(Date.now());

  useEffect(() => {
    loadWindow();
  }, [windowInfo.id]);

  const loadWindow = async () => {
    try {
      
      const playlistResponse = await API.get(`/windows/${windowInfo.id}/playlist`)
      const syncResponse = await  API.get("/sync");

      setPlaylist(playlistResponse.data || []);
      setServerOffset(0);

      if (syncResponse.data?.active) {
        setSync(syncResponse.data);
      } else {
        setSync(null);
      }
    } catch (error) {
      console.error("Failed to load window:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, []);

  
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => {
        return new SockJS("http://localhost:8080/ws");
      },

      reconnectDelay: 3000,

      onConnect: () => {
        console.log(`WebSocket connected for ${windowInfo.name}`);

        /*
         * Global synchronization event.
         */
        client.subscribe("/topic/sync", (message) => {
          const data = JSON.parse(message.body);

          console.log("SYNC received:", data);

          if (data.active) {
            setSync(data);
          } else {
            setSync(null);
          }
        });

      
        client.subscribe(
          `/topic/window/${windowInfo.id}/playlist`,
          (message) => {
            const data = JSON.parse(message.body);

            console.log("Playlist updated:", data);

            setPlaylist(data || []);
          },
        );
      },

      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers["message"]);
      },

      onWebSocketError: (error) => {
        console.error("WebSocket error:", error);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [windowInfo.id, windowInfo.name]);

  /*
   * Automatically leave sync mode when
   * the configured sync duration expires.
   */
  useEffect(() => {
    if (!sync?.active) {
      return;
    }

    const currentServerTime = Date.now() + serverOffset;

    const remaining = Number(sync.endsAtEpochMs) - currentServerTime;

    if (remaining <= 0) {
      setSync(null);
      return;
    }

    const timeout = setTimeout(() => {
      setSync(null);
    }, remaining + 100);

    return () => {
      clearTimeout(timeout);
    };
  }, [sync, serverOffset, now]);

  const syncProgress = useMemo(() => {
    if (!sync?.active || !sync.startedAtEpochMs || !sync.endsAtEpochMs) {
      return {
        percentage: 0,
        elapsedSeconds: 0,
        totalSeconds: 0,
      };
    }

    const start = Number(sync.startedAtEpochMs);

    const end = Number(sync.endsAtEpochMs);

    const current = now + serverOffset;

    const total = end - start;

    const elapsed = Math.min(Math.max(current - start, 0), total);

    const percentage = total > 0 ? (elapsed / total) * 100 : 0;

    return {
      percentage,
      elapsedSeconds: elapsed / 1000,
      totalSeconds: total / 1000,
    };
  }, [sync, now, serverOffset]);

  const normalState = useMemo(() => {
    return calculateNormalState(now + serverOffset, playlist);
  }, [now, serverOffset, playlist]);

  const syncState = useMemo(() => {
    if (!sync?.active || !sync.media) {
      return null;
    }

    const currentServerTime = now + serverOffset;

    const positionSeconds = Math.max(
      0,
      (currentServerTime - Number(sync.startedAtEpochMs)) / 1000,
    );

    const durationSeconds = Math.max(
      0,
      (Number(sync.endsAtEpochMs) - Number(sync.startedAtEpochMs)) / 1000,
    );

    return {
      item: {
        id: `sync-${sync.media.id}`,
        name: sync.media.name,
        url: sync.media.url,
        type: sync.media.type,
      },

      positionSeconds,

      durationSeconds,
    };
  }, [sync, now, serverOffset]);

  const currentState = syncState || normalState;

  const mediaProgress = useMemo(() => {
    if (!currentState?.item || !currentState?.durationSeconds) {
      return {
        percentage: 0,
        elapsed: 0,
        total: 0,
      };
    }

    const elapsed = Number(currentState.positionSeconds || 0);

    const total = Number(currentState.durationSeconds || 0);

    return {
      percentage: total > 0 ? Math.min((elapsed / total) * 100, 100) : 0,

      elapsed,

      total,
    };
  }, [currentState]);

  const cycleProgress = useMemo(() => {
    const currentTime = now;

    const cyclePosition = (currentTime - cycleStartTime) % CYCLE_MS;

    const percentage = (cyclePosition / CYCLE_MS) * 100;

    return {
      percentage,
      elapsed: cyclePosition / 1000,
      remaining: (CYCLE_MS - cyclePosition) / 1000,
    };
  }, [now, cycleStartTime]);

  return (
    <section className="player-window">
      <header>
        <strong className="window-name">{windowInfo.name}</strong>

        {syncState && <span className="sync-badge">SYNC</span>}
      </header>

      <div className="screen">
        <MediaRenderer
          item={currentState.item}
          positionSeconds={currentState.positionSeconds}
        />
      </div>

      <div className="player-info">
        <span>{currentState.item?.name || "No playlist"}</span>

        <span>
          {formatTime(currentState.positionSeconds)}

          {" / "}

          {formatTime(currentState.durationSeconds)}
        </span>
      </div>

      {/* MEDIA PROGRESS */}

      <div className="progress-section">
        <div className="progress-header">
          <span>Media Duration</span>

          <span>
            {formatTime(mediaProgress.elapsed)}

            {" / "}

            {formatTime(mediaProgress.total)}
          </span>
        </div>

        <div className="progress-track">
          <div
            className="media-progress-fill"
            style={{
              width: `${mediaProgress.percentage}%`,
            }}
          />
        </div>
      </div>

      {/* 5 HOUR PROGRESS */}

      <div className="progress-section">
        <div className="progress-header">
          <span>5 Hour Cycle</span>

          <span>
            {formatTime(cycleProgress.elapsed)}

            {" / 05:00:00"}
          </span>
        </div>

        <div className="progress-track">
          <div
            className="cycle-progress-fill"
            style={{
              width: `${cycleProgress.percentage}%`,
            }}
          />
        </div>

        <div className="cycle-remaining">
          {formatTime(cycleProgress.remaining)}

          {" remaining"}
        </div>
      </div>
    </section>
  );
};

export default PlayerWindow;
