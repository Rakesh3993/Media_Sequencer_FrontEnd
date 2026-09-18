import React, { useEffect, useRef } from "react";

export default function MediaRenderer({
  item,
  positionSeconds
}) {

  const videoRef = useRef(null);

  useEffect(() => {

    if (
      !item ||
      item.type !== "VIDEO" ||
      !videoRef.current
    ) {
      return;
    }

    const video = videoRef.current;

    const target = Math.max(
      0,
      Number(positionSeconds || 0)
    );

    const syncVideo = async () => {

      if (
        Math.abs(
          video.currentTime - target
        ) > 0.75
      ) {
        try {
          video.currentTime = target;
        } catch (error) {
          console.error(
            "Video seek failed",
            error
          );
        }
      }

      try {
        await video.play();
      } catch (error) {
        console.log(
          "Autoplay blocked. Click the page once and retry."
        );
      }
    };

    syncVideo();

  }, [
    item?.id,
    item?.url,
    item?.type
  ]);

  if (!item) {
    return (
      <div className="fallback">
        No playlist configured
      </div>
    );
  }

  if (item.type === "BLANK") {
    return (
      <div
        key={`blank-${item.id}`}
        className="blank"
      />
    );
  }

  if (item.type === "IMAGE") {
    return (
      <img
        key={`image-${item.id}-${item.url}`}
        className="media"
        src={item.url}
        alt={item.name}
      />
    );
  }

  if (item.type === "VIDEO") {
    return (
      <video
        key={`video-${item.id}-${item.url}`}
        ref={videoRef}
        className="media"
        src={item.url}
        muted
        playsInline
        autoPlay
        preload="auto"
      />
    );
  }

  return (
    <div className="fallback">
      Unsupported media
    </div>
  );
}