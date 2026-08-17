import { ExternalLink, PlayCircle, Video } from "lucide-react";
import { ScreenshotGallery } from "@/components/storefront/product/ScreenshotGallery";

function videoSource(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? { kind: "embed" as const, url: `https://www.youtube-nocookie.com/embed/${id}` } : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v") || parsed.pathname.match(/^\/shorts\/([^/]+)/)?.[1];
      return id ? { kind: "embed" as const, url: `https://www.youtube-nocookie.com/embed/${id}` } : null;
    }

    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? { kind: "embed" as const, url: `https://player.vimeo.com/video/${id}` } : null;
    }

    if (/\.(mp4|webm|ogg|mov)(?:$|\?)/i.test(url)) {
      return { kind: "video" as const, url };
    }

    return { kind: "link" as const, url };
  } catch {
    return null;
  }
}

export function ProductMedia({ images, title, workflowVideoUrl }: { images: string[]; title: string; workflowVideoUrl?: string }) {
  const video = workflowVideoUrl ? videoSource(workflowVideoUrl) : null;

  return (
    <section className="mx-auto mt-8 max-w-6xl scroll-mt-24 sm:mt-10" aria-labelledby="product-media-heading">
      <p className="label-muted">Product preview</p>
      <h2 id="product-media-heading" className="mt-2 font-display text-3xl font-bold text-ink">Screens and workflow</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">Explore the interface and see how the product works before choosing a package.</p>

      <div className="mt-5 grid items-start gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-rule bg-white p-2 shadow-card sm:p-3">
          <ScreenshotGallery images={images} title={title} />
        </div>

        {video && (
          <div id="workflow-video" className="scroll-mt-24 overflow-hidden rounded-2xl border border-rule bg-[#061a3a] p-2 shadow-card sm:p-3">
            {video.kind === "embed" && (
              <iframe
                src={video.url}
                title={`${title} workflow video`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="aspect-video w-full rounded-xl bg-black"
              />
            )}
            {video.kind === "video" && <video src={video.url} controls preload="metadata" playsInline className="aspect-video w-full rounded-xl bg-black object-contain" />}
            {video.kind === "link" && (
              <a href={video.url} target="_blank" rel="noopener noreferrer nofollow" className="flex aspect-video flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#0a2754] to-[#123b78] px-6 text-center text-white">
                <PlayCircle className="h-12 w-12 text-blue-200" aria-hidden="true" />
                <span className="mt-3 font-display text-xl font-bold">Watch the workflow video</span>
                <span className="mt-2 inline-flex items-center gap-1 text-xs text-blue-100/70">Opens in a new tab <ExternalLink className="h-3.5 w-3.5" /></span>
              </a>
            )}
          </div>
        )}
        {!video && (
          <div id="workflow-video" className="scroll-mt-24 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-[#061a3a] to-[#123b78] p-2 shadow-card sm:p-3">
            <div className="flex aspect-video flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 px-6 text-center text-white">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white/10 ring-1 ring-white/15"><Video className="h-7 w-7 text-blue-100" aria-hidden="true" /></span>
              <span className="mt-4 font-display text-xl font-bold">Workflow video coming soon</span>
              <span className="mt-2 max-w-md text-sm text-blue-100/70">A guided product tour will be added here. You can still schedule a live demonstration with our team.</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
