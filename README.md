# Multi-Window Media Sequencer — Frontend

A React-based frontend for a Multi-Window Media Sequencer application that allows multiple display windows to play independent media playlists while supporting real-time synchronization across all windows.

## Features

- Support for image, video, and blank media.
- Multiple independent display windows.
- Individual playlist for each display window.
- Continuous 5-hour playback cycle.
- Configurable media duration.
- Dynamic playlist updates.
- Real-time updates using WebSocket/STOMP.
- Synchronize a selected media item across all display windows.
- Configurable synchronization duration.
- Automatically resumes the normal playlist after synchronization ends.
- Media playback progress indicator.
- Overall 5-hour cycle progress indicator.
- Responsive display interface.

## Technology Stack

- React.js
- JavaScript
- Axios
- STOMP.js
- SockJS
- CSS
- Vercel

## Application Architecture

The frontend communicates with the Spring Boot backend through REST APIs and WebSocket connections.

```text
React Frontend
      |
      | REST API
      |
      v
Spring Boot Backend
      |
      | WebSocket / STOMP
      |
      v
Multiple Display Windows



## REST API Integration

The frontend consumes the following backend APIs:

### Media

```http
GET /api/media
```

Fetches all available media.

### Windows

```http
GET /api/windows
```

Fetches all configured display windows.

```http
GET /api/windows/{windowId}/playlist
```

Fetches the playlist configured for a specific window.

```http
POST /api/windows/{windowId}/playlist
```

Adds media to a specific window's playlist.

### Synchronization

```http
GET /api/sync
```

Fetches the current synchronization state.

```http
POST /api/sync
```

Triggers synchronized playback of the selected media across all display windows for the configured duration.

## WebSocket Integration

The frontend uses **SockJS** and **STOMP** for real-time communication.

### WebSocket Endpoint

```text
/ws
```

### Sync Events

```text
/topic/sync
```

Receives synchronization events and updates all connected display windows.

### Playlist Updates

```text
/topic/window/{windowId}/playlist
```

Receives playlist updates for a specific display window.

## Synchronization Flow

```text
User selects media
        |
        v
POST /api/sync
        |
        v
Backend creates synchronization state
        |
        v
WebSocket broadcasts sync event
        |
        v
All display windows receive the event
        |
        v
Selected media starts at the synchronized time
        |
        v
Sync duration expires
        |
        v
Each window resumes its own playlist
```
