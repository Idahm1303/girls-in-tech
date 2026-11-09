import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

export const alt = `Girls in Tech — ${BRAND.motto}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          overflow: "hidden",
          backgroundColor: "#511735",
          color: "#FFFFFF",
          padding: "72px 84px",
          fontFamily: "Arial",
        }}
      >
        <div style={{ display: "flex", width: "68%", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              marginBottom: "32px",
              fontSize: "30px",
              fontWeight: 700,
            }}
          >
            <svg width="94" height="52" viewBox="0 0 160 88" fill="none">
              <path
                d="M80 44c-11.2-15.5-20.2-24-31-24-12 0-22 10.1-22 24s10 24 22 24c10.8 0 19.8-8.5 31-24Zm0 0c11.2 15.5 20.2 24 31 24 12 0 22-10.1 22-24s-10-24-22-24c-10.8 0-19.8 8.5-31 24Z"
                stroke="#FFFFFF"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="8"
              />
            </svg>
            <span>Girls in Tech · TUT ICT</span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: "790px",
              fontSize: "76px",
              fontWeight: 700,
              letterSpacing: "-5px",
              lineHeight: 1.08,
            }}
          >
            Limitless minds.
            <br />
            <span style={{ color: "#FFD8E8" }}>Infinite Code.</span>
          </div>
          <div
            style={{
              marginTop: "34px",
              color: "#F9E8EF",
              fontSize: "24px",
            }}
          >
            A community to learn boldly, connect, and create.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            width: "260px",
            height: "260px",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.28)",
            borderRadius: "52px",
            background: "rgba(255,255,255,0.1)",
            transform: "rotate(-7deg)",
          }}
        >
          <svg width="205" height="120" viewBox="0 0 160 88" fill="none">
            <path
              d="M80 44c-11.2-15.5-20.2-24-31-24-12 0-22 10.1-22 24s10 24 22 24c10.8 0 19.8-8.5 31-24Zm0 0c11.2 15.5 20.2 24 31 24 12 0 22-10.1 22-24s-10-24-22-24c-10.8 0-19.8 8.5-31 24Z"
              stroke="#FFFFFF"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="6"
            />
          </svg>
        </div>
      </div>
    ),
    { ...size },
  );
}
