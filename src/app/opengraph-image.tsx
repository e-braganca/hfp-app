import { ImageResponse } from "next/og";

/* ============================================================================
   The card people see before they see the site.

   It does not repeat the headline. In an unfurl the title and description sit
   right beside the image, so a picture of the same sentence is the sentence
   twice — the image's job is to show what prose cannot.

   What it shows is the thing that makes this different from a form and a box
   of pens: a named, GMC-numbered clinician putting their name to the order,
   and the protocol they checked it against. Lifted from the landing hero,
   where the same two cards float over the photograph.

   Generated rather than exported, so a copy change is a copy change.
   ============================================================================ */

export const runtime = "edge";
export const alt = "A Prescriptr order approved by a named UK prescriber, with its protocol check";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CHECKS = ["Contraindications — clear", "Weight photo verified", "ID verified"];

/**
 * Drawn, not typed. Satori renders with its own font stack and "✓" is not in
 * it, so the character came out as a tofu box.
 */
function Tick({ size: s }: { size: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="m5 12.5 4.5 4.5L19 7" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #2f3e3a 0%, #3f5750 45%, #52796f 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* the mark, and a label rather than a claim — this side has to make
            sense on its own in a timeline crop, without repeating the title */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 420 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 46,
                  height: 46,
                  borderRadius: 13,
                  background: "#ffffff",
                  color: "#2f3e3a",
                  fontSize: 27,
                  fontWeight: 800,
                }}
              >
                P
              </div>
              <div style={{ display: "flex", fontSize: 27, fontWeight: 800, letterSpacing: 6 }}>PRESCRIPTR</div>
            </div>
            <div style={{ display: "flex", marginTop: 14, fontSize: 17, letterSpacing: 4, color: "rgba(255,255,255,0.5)" }}>
              UK GLP-1 WEIGHT LOSS
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", width: 90, height: 6, borderRadius: 3, background: "#f6c667" }} />
            <div style={{ display: "flex", marginTop: 22, fontSize: 36, fontWeight: 700, lineHeight: 1.22, letterSpacing: -0.6 }}>
              Every order carries a prescriber&rsquo;s name.
            </div>
          </div>
        </div>

        {/* the artifact itself */}
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 470,
              padding: "26px 30px",
              borderRadius: 20,
              background: "#ffffff",
              color: "#1f2a27",
              boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", fontSize: 15, fontWeight: 800, letterSpacing: 3.5, color: "#6b7a76" }}>
              PROTOCOL CHECK
            </div>
            {CHECKS.map((c) => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 15, fontSize: 23 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 25,
                    height: 25,
                    borderRadius: 13,
                    background: "#2e7d5b",
                  }}
                >
                  <Tick size={15} />
                </div>
                {c}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              width: 470,
              padding: "22px 30px",
              borderRadius: 20,
              background: "rgba(27,38,35,0.92)",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", fontSize: 24, fontWeight: 700 }}>Approved by Dr. Eleanor Hart</div>
              <div style={{ display: "flex", marginTop: 5, fontSize: 17, letterSpacing: 2.5, color: "rgba(255,255,255,0.55)" }}>
                GMC 7041182 · 09:41
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                borderRadius: 19,
                background: "#2e7d5b",
              }}
            >
              <Tick size={21} />
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
