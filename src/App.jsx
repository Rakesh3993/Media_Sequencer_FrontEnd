import React, { useEffect, useState } from "react";
import { API } from "./api";
import PlayerWindow from "./components/PlayerWindow";
import { formatTime } from "./components/AppConstant";

export default function App() {
  const [windows, setWindows] = useState([]);
  const [media, setMedia] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState("");
  const [syncDuration, setSyncDuration] = useState(10);
  const [message, setMessage] = useState("");

  const [syncProgress, setSyncProgress] = useState(null);

  const [currentTime, setCurrentTime] = useState(Date.now());

  const load = async () => {
    try {
      const windowsResponse = await API.get("/windows");
      const mediaResponse = await API.get("/media");

      setWindows(windowsResponse.data);
      setMedia(mediaResponse.data);

      if (!selectedMedia && mediaResponse.data.length) {
        setSelectedMedia(String(mediaResponse.data[0].id));
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  /*
   * Initial load
   */
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const syncAll = async () => {
    if (!selectedMedia) {
      return;
    }

    try {
      const response = await API.post("/sync", {
        mediaId: Number(selectedMedia),
        durationMs: Number(syncDuration) * 1000,
      });

      const data = response.data;

      console.log("Sync response:", data);

      setSyncProgress({
        start: Number(data.startedAtEpochMs),

        end: Number(data.endsAtEpochMs),
      });

      setMessage("Sync command sent to all windows.");

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (error) {
      console.error("Sync failed:", error);

      setMessage("Failed to trigger sync.");

      setTimeout(() => {
        setMessage("");
      }, 2500);
    }
  };

  const syncTotalMs = syncProgress ? syncProgress.end - syncProgress.start : 0;
  const syncElapsedMs = syncProgress
    ? Math.min(Math.max(currentTime - syncProgress.start, 0), syncTotalMs)
    : 0;

  const syncRemainingMs = Math.max(syncTotalMs - syncElapsedMs, 0);

  const syncPercentage =
    syncTotalMs > 0 ? (syncElapsedMs / syncTotalMs) * 100 : 0;

  const syncElapsedSeconds = syncElapsedMs / 1000;
  const syncTotalSeconds = syncTotalMs / 1000;
  const syncRemainingSeconds = syncRemainingMs / 1000;

  useEffect(() => {
    if (!syncProgress) {
      return;
    }

    if (currentTime >= syncProgress.end) {
      setSyncProgress(null);
    }
  }, [currentTime, syncProgress]);

  return (
    <main>
      <div className="topBar">
        <div>
          <h1>Multi-Window Media Sequencer</h1>

          <p>
            Each window repeats its configured playlist inside a 5-hour cycle.
          </p>
        </div>

        <div className="sync-controls">
          <select
            value={selectedMedia}
            onChange={(e) => setSelectedMedia(e.target.value)}
          >
            {media.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            value={syncDuration}
            onChange={(e) => setSyncDuration(e.target.value)}
          />

          <button onClick={syncAll}>TRIGGER SYNC</button>
        </div>
      </div>

      {message && <div className="toast">{message}</div>}

      {syncProgress && (
        <div className="global-sync-progress">
          <div className="global-sync-header">
            <div>
              <span className="global-sync-title">SYNC PLAYBACK</span>

              <span className="global-sync-media">
                {
                  media.find((m) => String(m.id) === String(selectedMedia))
                    ?.name
                }
              </span>
            </div>

            <span className="global-sync-time">
              {formatTime(syncElapsedSeconds)}

              {" / "}

              {formatTime(syncTotalSeconds)}
            </span>
          </div>

          <div className="global-sync-track">
            <div
              className="global-sync-fill"
              style={{
                width: `${syncPercentage}%`,
              }}
            />
          </div>
          <div className="global-sync-footer">
            <span>
              {Math.round(syncPercentage)}

              {"% completed"}
            </span>

            <span>
              {formatTime(syncRemainingSeconds)}

              {" remaining"}
            </span>
          </div>
        </div>
      )}
      <div className="grid">
        {windows.map((windowInfo) => (
          <PlayerWindow key={windowInfo.id} windowInfo={windowInfo} />
        ))}
      </div>
    </main>
  );
}
