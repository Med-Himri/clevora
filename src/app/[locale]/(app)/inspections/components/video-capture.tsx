"use client";

import { CircleStopIcon, FolderOpenIcon, LoaderIcon, VideoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Ltr } from "@/components/app/ltr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/browser";
import { saveVideoAction } from "../actions";

/** Storage keeps files under 10 MB: about 75 s at 1 Mbit/s. */
export const VIDEO_MAX_BYTES = 10 * 1024 * 1024;
const MAX_SECONDS = 75;
const BITRATE = 1_000_000;

function pickType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t));
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * Inspection in video mode: one walk-around video of the car, filmed in the app
 * (small file) or picked from the phone (must stay under 10 MB).
 */
export function VideoCapture({ agencyId, inspectionId, videoUrl, done }: { agencyId: string; inspectionId: string; videoUrl: string | null; done: boolean }) {
  const t = useTranslations("inspection.video");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [canRecord, setCanRecord] = useState(false);
  const preview = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Known only in the browser: hide "Filmer" where the camera cannot be used.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feature detection after mount
    setCanRecord(Boolean(navigator.mediaDevices?.getUserMedia) && Boolean(pickType()));
  }, []);

  const stopCamera = () => {
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
  };
  useEffect(() => stopCamera, []);

  const upload = async (blob: Blob) => {
    if (blob.size > VIDEO_MAX_BYTES) return void toast.error(t("tooBig"));
    setUploading(true);
    try {
      const path = `${agencyId}/inspections/${inspectionId}/video`;
      const { error } = await createClient()
        .storage.from("agency-docs")
        .upload(path, blob, { contentType: (blob.type || "video/mp4").split(";")[0], upsert: true });
      if (error) throw error;
      const r = await saveVideoAction(inspectionId, path);
      if (!r.ok) throw new Error(r.error);
      toast.success(t("saved"));
      router.refresh();
    } catch {
      toast.error(t("failed"));
    } finally {
      setUploading(false);
      if (file.current) file.current.value = "";
    }
  };

  const openCamera = async () => {
    setOpen(true);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      if (preview.current) preview.current.srcObject = stream.current;
    } catch {
      setOpen(false);
      toast.error(t("noCamera"));
    }
  };

  const startRecording = () => {
    if (!stream.current) return;
    const mimeType = pickType();
    const rec = new MediaRecorder(stream.current, { mimeType, videoBitsPerSecond: BITRATE });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      stopCamera();
      setRecording(false);
      setOpen(false);
      void upload(new Blob(chunks, { type: mimeType }));
    };
    rec.start(1000);
    recorder.current = rec;
    setSeconds(0);
    setRecording(true);
  };

  // Timer, and automatic stop at the size limit.
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);
  useEffect(() => {
    if (seconds >= MAX_SECONDS && recorder.current?.state === "recording") recorder.current.stop();
  }, [seconds]);

  const close = (o: boolean) => {
    if (o) return;
    if (recorder.current?.state === "recording") recorder.current.stop();
    else {
      stopCamera();
      setOpen(false);
    }
  };

  return (
    <Card data-testid="inspection-video">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <VideoIcon className="size-5 text-muted-foreground" aria-hidden />
          {t("title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t("hint")}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {videoUrl ? (
          <video src={videoUrl} controls playsInline preload="metadata" className="aspect-video w-full rounded-xl border bg-black" data-testid="inspection-video-player">
            <track kind="captions" />
          </video>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/40 p-4 text-center text-sm text-muted-foreground">
            {uploading ? <LoaderIcon className="size-6 animate-spin" aria-hidden /> : <VideoIcon className="size-6" aria-hidden />}
            {uploading ? t("uploading") : t("empty")}
          </div>
        )}
        {uploading && videoUrl ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderIcon className="size-4 animate-spin" aria-hidden />
            {t("uploading")}
          </p>
        ) : null}
        {!done ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {canRecord ? (
              <Button size="lg" onClick={openCamera} disabled={uploading} data-testid="video-record">
                <VideoIcon aria-hidden />
                {videoUrl ? t("again") : t("record")}
              </Button>
            ) : null}
            <Button size="lg" variant={canRecord ? "outline" : "default"} onClick={() => file.current?.click()} disabled={uploading}>
              <FolderOpenIcon aria-hidden />
              {t("pick")}
            </Button>
            <input
              ref={file}
              type="file"
              accept="video/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              data-testid="inspection-video-file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
              }}
            />
          </div>
        ) : null}
        {!done ? <p className="text-xs text-muted-foreground">{t("limit", { s: MAX_SECONDS })}</p> : null}
      </CardContent>

      <Dialog open={open} onOpenChange={close}>
        <DialogContent closeLabel={tc("close")} className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("record")}</DialogTitle>
            <DialogDescription>{t("howTo")}</DialogDescription>
          </DialogHeader>
          <div className="relative overflow-hidden rounded-xl bg-black">
            <video ref={preview} autoPlay muted playsInline className="aspect-video w-full object-cover" />
            {recording ? (
              <span className="absolute start-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-sm font-semibold text-white">
                <span className="size-2.5 animate-pulse rounded-full bg-red-500" aria-hidden />
                <Ltr>{clock(seconds)} / {clock(MAX_SECONDS)}</Ltr>
              </span>
            ) : null}
          </div>
          {recording ? (
            <Button size="lg" variant="destructive" onClick={() => recorder.current?.stop()}>
              <CircleStopIcon aria-hidden />
              {t("stop")}
            </Button>
          ) : (
            <Button size="lg" onClick={startRecording}>
              <VideoIcon aria-hidden />
              {t("start")}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
