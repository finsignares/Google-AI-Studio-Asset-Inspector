/**
 * Utility to extract representative keyframes from a video Blob or File
 * evenly distributed across its duration for AI multimodal analysis.
 */
export async function extractKeyframesFromVideo(
  videoBlobOrFile: Blob | File,
  targetFrameCount: number = 8,
  maxWidth: number = 1280,
  quality: number = 0.82
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const videoUrl = URL.createObjectURL(videoBlobOrFile);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = videoUrl;

    const frames: string[] = [];
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const cleanup = () => {
      URL.revokeObjectURL(videoUrl);
      video.remove();
      canvas.remove();
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Failed to load video file for frame extraction. Please ensure the video format is supported."));
    };

    video.onloadedmetadata = async () => {
      try {
        const duration = video.duration || 3;
        const validDuration = Number.isFinite(duration) && duration > 0 ? duration : 3;

        // Calculate aspect ratio dimensions
        const origWidth = video.videoWidth || 1280;
        const origHeight = video.videoHeight || 720;
        const scale = Math.min(1, maxWidth / Math.max(origWidth, origHeight));
        canvas.width = Math.round(origWidth * scale);
        canvas.height = Math.round(origHeight * scale);

        // Generate evenly spaced sample timestamps (skipping the very first 0.1s to avoid black camera start frames)
        const timestamps: number[] = [];
        const step = validDuration / (targetFrameCount + 1);
        for (let i = 1; i <= targetFrameCount; i++) {
          timestamps.push(Math.min(validDuration - 0.1, Math.max(0.1, step * i)));
        }

        // Helper to seek and capture frame
        for (const time of timestamps) {
          await new Promise<void>((res) => {
            const onSeeked = () => {
              video.removeEventListener("seeked", onSeeked);
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                // Draw a subtle timestamp mark on canvas for diagnostic precision
                const frameData = canvas.toDataURL("image/jpeg", quality);
                frames.push(frameData);
              }
              res();
            };
            video.addEventListener("seeked", onSeeked);
            video.currentTime = time;
          });
        }

        cleanup();
        resolve(frames);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
  });
}

/**
 * Resize and compress a standalone image file (JPEG/PNG) to standard inspection size
 */
export async function compressImageFile(
  file: File,
  maxWidth: number = 1280,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidth / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL("image/jpeg", quality);
          resolve(compressed);
        } else {
          reject(new Error("Could not initialize canvas context."));
        }
      };
      img.onerror = () => reject(new Error("Failed to load image."));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}
