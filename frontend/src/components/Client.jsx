import React, { useRef, useState } from "react";
import "../styles/client.css";

// Vite-friendly dynamic import
const logosModules = import.meta.glob("../assets/logos/*.svg", { eager: true });
const logos = Object.values(logosModules).map((mod) => mod.default);

function Client() {
  const mid = Math.ceil(logos.length / 2);
  const topLogos = logos.slice(0, mid);
  const bottomLogos = logos.slice(mid);

  // Pause animation on hover
  const [topPaused, setTopPaused] = useState(false);
  const [botPaused, setBotPaused] = useState(false);

  return (
    <section className="client-section">
      {/* Background decoration */}
      <div className="client-bg-grid" aria-hidden="true" />
      <div className="client-bg-glow client-bg-glow--left" aria-hidden="true" />
      <div className="client-bg-glow client-bg-glow--right" aria-hidden="true" />

      <div className="client-inner">

        {/* ── Header ── */}
        <div className="client-header">
          <div className="client-eyebrow">
            <span className="client-eyebrow__dot" />
            Trusted Partners
            <span className="client-eyebrow__dot" />
          </div>
          <h2 className="client-heading">
            Institutions That{" "}
            <span className="client-heading__accent">Trust Us</span>
          </h2>
          <p className="client-subtext">
            Powering data management for leading colleges, NGOs, and organizations across India.
          </p>
        </div>

        {/* ── Stats strip ── */}
        <div className="client-stats">
          {[
            { value: "100+", label: "Institutions" },
            { value: "1K+", label: "Active Users" },
            { value: "99.9%", label: "Uptime" },
            { value: "4.9★", label: "Avg Rating" },
          ].map(({ value, label }) => (
            <div className="client-stat" key={label}>
              <span className="client-stat__value">{value}</span>
              <span className="client-stat__label">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Marquee container ── */}
        <div className="client-marquee-wrapper">

          {/* Edge fade masks */}
          <div className="client-fade client-fade--left" aria-hidden="true" />
          <div className="client-fade client-fade--right" aria-hidden="true" />

          {/* Top row — scrolls left */}
          <div
            className="client-track-outer"
            onMouseEnter={() => setTopPaused(true)}
            onMouseLeave={() => setTopPaused(false)}
          >
            <div
              className="client-track client-track--left"
              style={{ animationPlayState: topPaused ? "paused" : "running" }}
            >
              {[...topLogos, ...topLogos, ...topLogos].map((logo, idx) => (
                <div className="client-logo-card" key={`top-${idx}`}>
                  <img
                    src={logo}
                    alt={`client-logo-top-${idx}`}
                    className="client-logo-img"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom row — scrolls right */}
          <div
            className="client-track-outer"
            onMouseEnter={() => setBotPaused(true)}
            onMouseLeave={() => setBotPaused(false)}
          >
            <div
              className="client-track client-track--right"
              style={{ animationPlayState: botPaused ? "paused" : "running" }}
            >
              {[...bottomLogos, ...bottomLogos, ...bottomLogos].map((logo, idx) => (
                <div className="client-logo-card" key={`bot-${idx}`}>
                  <img
                    src={logo}
                    alt={`client-logo-bot-${idx}`}
                    className="client-logo-img"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div className="client-footer">
          <span className="client-footer__text">Want to join our network?</span>
          <a href="#contact" className="client-footer__btn">
            Partner With Us
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2.5 7h9M7 2.5L11.5 7 7 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>

      </div>
    </section>
  );
}

export default Client;