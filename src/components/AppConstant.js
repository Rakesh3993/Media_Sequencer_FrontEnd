// const CYCLE_MS = 5 * 60 * 60 * 1000;

// export const calculateNormalState = (serverNow, playlist) => {
//   if (!playlist.length) {
//     return {
//       item: null,
//       positionSeconds: 0,
//     };
//   }

//   /*
//    * Calculate total configured playlist duration.
//    */
//   const totalDurationMs = playlist.reduce((sum, playlistItem) => {
//     return sum + Number(playlistItem.durationMs || 0);
//   }, 0);

//   if (totalDurationMs <= 0) {
//     return {
//       item: null,
//       positionSeconds: 0,
//     };
//   }

//   /*
//    * Current position inside the 5-hour cycle.
//    */
//   const cyclePosition = serverNow % CYCLE_MS;

//   /*
//    * Repeat the configured playlist.
//    */
//   let position = cyclePosition % totalDurationMs;

//   for (const playlistItem of playlist) {
//     const media = playlistItem.media;

//     const durationMs = Number(playlistItem.durationMs || 0);

//     if (position < durationMs) {
//       return {
//         item: media,

//         positionSeconds: position / 1000,

//         durationSeconds: durationMs / 1000,

//         index,
//       };
//     }

//     position -= durationMs;
//   }

//   /*
//    * Fallback.
//    */
//   const last = playlist[playlist.length - 1];

//   return {
//     item: last.media,
//     positionSeconds: Number(last.durationMs || 0) / 1000,
//   };
// };

// export const formatTime = (seconds) => {
//   const total = Math.floor(Number(seconds) || 0);

//   const hours = Math.floor(total / 3600);

//   const minutes = Math.floor((total % 3600) / 60);

//   const secs = total % 60;

//   return (
//     `${String(hours).padStart(2, "0")}:` +
//     `${String(minutes).padStart(2, "0")}:` +
//     `${String(secs).padStart(2, "0")}`
//   );
// };

const CYCLE_MS = 5 * 60 * 60 * 1000;

export const calculateNormalState = (serverNow, playlist) => {
  if (!playlist || playlist.length === 0) {
    return {
      item: null,
      positionSeconds: 0,
      durationSeconds: 0,
      index: -1,
    };
  }

  /*
   * Calculate total configured playlist duration.
   */
  const totalDurationMs = playlist.reduce((sum, playlistItem) => {
    return sum + Number(playlistItem.durationMs || 0);
  }, 0);

  if (totalDurationMs <= 0) {
    return {
      item: null,
      positionSeconds: 0,
      durationSeconds: 0,
      index: -1,
    };
  }

  /*
   * Current position inside the 5-hour cycle.
   */
  const cyclePosition = ((serverNow % CYCLE_MS) + CYCLE_MS) % CYCLE_MS;

  /*
   * Repeat the configured playlist.
   */
  let position = cyclePosition % totalDurationMs;

  for (let index = 0; index < playlist.length; index++) {
    const playlistItem = playlist[index];
    const media = playlistItem.media;

    const durationMs = Number(playlistItem.durationMs || 0);

    if (durationMs <= 0) {
      continue;
    }

    if (position < durationMs) {
      return {
        item: media,
        positionSeconds: position / 1000,
        durationSeconds: durationMs / 1000,
        index,
      };
    }

    position -= durationMs;
  }

  /*
   * Fallback.
   */
  const lastIndex = playlist.length - 1;
  const last = playlist[lastIndex];
  const lastDurationMs = Number(last.durationMs || 0);

  return {
    item: last.media,
    positionSeconds: 0,
    durationSeconds: lastDurationMs / 1000,
    index: lastIndex,
  };
};

export const formatTime = (seconds) => {
  const total = Math.floor(Number(seconds) || 0);

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  return (
    `${String(hours).padStart(2, "0")}:` +
    `${String(minutes).padStart(2, "0")}:` +
    `${String(secs).padStart(2, "0")}`
  );
};

