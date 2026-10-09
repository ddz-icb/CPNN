import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../reusable_components/sidebarComponents.jsx";
import { formatToolPaperCitation, imprintFields } from "./aboutContent.js";

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand?.("copy");
  textArea.remove();
  if (!copied) throw new Error("Clipboard access is unavailable");
}

function DetailList({ fields }) {
  return (
    <dl className="about-detail-list">
      {fields.map(({ label, value }) => (
        <div className="about-detail-row" key={label}>
          <dt>{label}</dt>
          <dd className={value ? "" : "about-empty-value"} aria-label={value || `${label}: not provided`}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function AboutSidebar() {
  const citation = useMemo(() => formatToolPaperCitation(), []);
  const [copyStatus, setCopyStatus] = useState("");
  const statusTimerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(statusTimerRef.current), []);

  const handleCopyCitation = async () => {
    window.clearTimeout(statusTimerRef.current);
    try {
      await copyText(citation);
      setCopyStatus("Citation copied");
    } catch {
      setCopyStatus("Could not copy citation");
    }
    statusTimerRef.current = window.setTimeout(() => setCopyStatus(""), 2500);
  };

  return (
    <div className="about-sidebar">
      <section className="about-card" aria-labelledby="about-cpnn-heading">
        <h2 id="about-cpnn-heading">About CPNN</h2>
        <p>
          CPNN is an interactive application for exploring, filtering, and visualizing co-phosphorylation networks.
        </p>
      </section>

      <section className="about-card" aria-labelledby="about-citation-heading">
        <h2 id="about-citation-heading">Tool paper</h2>
        <blockquote className="about-citation" data-testid="tool-paper-citation">{citation}</blockquote>
        <div className="about-citation-actions">
          <Button text={copyStatus === "Citation copied" ? "Copied" : "Copy citation"} onClick={handleCopyCitation} disabled={!citation} />
          <span className="about-copy-status" role="status" aria-live="polite">{copyStatus}</span>
        </div>
      </section>

      <section className="about-card" aria-labelledby="about-imprint-heading">
        <h2 id="about-imprint-heading">Imprint</h2>
        <DetailList fields={imprintFields} />
      </section>
    </div>
  );
}
