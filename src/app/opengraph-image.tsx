import { ImageResponse } from "next/og";

/* ============================================================================
   The card people see before they see the site.

   Generated rather than exported from Figma so it cannot drift from the
   headline it quotes — and so a copy change is a copy change, not a trip
   through a design file.
   ============================================================================ */

export const runtime = "edge";
export const alt = "Prescriptr — weight loss, prescribed properly";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #2f3e3a 0%, #3f5750 45%, #52796f 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#ffffff",
              color: "#2f3e3a",
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            P
          </div>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 800, letterSpacing: 6 }}>PRESCRIPTR</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 86, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2 }}>
            Weight loss,
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
            <div style={{ display: "flex", fontSize: 86, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2 }}>
              prescribed properly.
            </div>
          </div>
          {/* the warning-light underline the H1 carries on the page itself */}
          <div style={{ display: "flex", width: 560, height: 8, marginTop: 10, borderRadius: 4, background: "#f6c667" }} />
          <div style={{ display: "flex", marginTop: 30, fontSize: 30, lineHeight: 1.4, color: "rgba(255,255,255,0.78)", maxWidth: 900 }}>
            Wegovy and Mounjaro from GPhC-registered UK prescribers — screened against clinical protocol, reviewed by a
            named clinician.
          </div>
        </div>

        <div style={{ display: "flex", gap: 44, fontSize: 22, color: "rgba(255,255,255,0.65)" }}>
          <div style={{ display: "flex" }}>5-minute assessment</div>
          <div style={{ display: "flex" }}>Prescriber review under 24h</div>
          <div style={{ display: "flex" }}>Only charged if approved</div>
        </div>
      </div>
    ),
    size,
  );
}
