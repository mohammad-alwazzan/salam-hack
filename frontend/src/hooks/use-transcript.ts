"use client";

import { useEffect, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, type TranscriptionSegment, type Participant } from "livekit-client";

export type TranscriptEntry = {
  id: string;
  text: string;
  final: boolean;
  isAgent: boolean;
  participantName: string;
  receivedAt: number;
};

export function useTranscript() {
  const room = useRoomContext();
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);

  useEffect(() => {
    function handleTranscription(
      segments: TranscriptionSegment[],
      participant?: Participant,
    ) {
      const isAgent = participant?.isAgent ?? false;
      const participantName = participant?.name ?? (isAgent ? "Mizan" : "You");

      setEntries((prev) => {
        let next = [...prev];
        for (const seg of segments) {
          const existing = next.findIndex((e) => e.id === seg.id);
          const entry: TranscriptEntry = {
            id: seg.id,
            text: seg.text,
            final: seg.final,
            isAgent,
            participantName,
            receivedAt: seg.lastReceivedTime,
          };
          if (existing >= 0) {
            next[existing] = entry;
          } else {
            next = [...next, entry];
          }
        }
        // Keep last 60 entries to avoid unbounded growth
        if (next.length > 60) next = next.slice(next.length - 60);
        return next;
      });
    }

    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    return () => {
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
    };
  }, [room]);

  return entries;
}
