"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "./Avatars";
import { PRODUCTS, type Product } from "./products";

/** App entry (sign in / start free). On the marketing host, middleware bounces
 * /dashboard to the app host; locally it resolves in-app. */
const APP = "/dashboard";

export function SiteNav({
  active,
  nameToggle,
}: {
  active?: Product["id"];
  nameToggle?: { crew: boolean; onToggle: () => void };
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <header className="site-head">
        <div className="nav">
          <Link href="/" className="brand">Mavrix<span className="dot">.</span></Link>
          <div className="links">
            <div className="drop">
              <button className="dt" type="button" aria-haspopup="true">Products <span className="ar" aria-hidden="true">▾</span></button>
              <div className="menu" role="menu">
                {PRODUCTS.map((p) => (
                  <Link key={p.id} className="mi" role="menuitem" href={p.path}>
                    <span className="av"><Avatar id={p.avatar} /></span>
                    <span><span className="nm">{p.name}</span><span className="rl">{p.persona} · {p.role}</span></span>
                  </Link>
                ))}
              </div>
            </div>
            <Link href="/#how">How it works</Link>
            <Link href="/#pricing">Pricing</Link>
          </div>
          <div className="right">
            {nameToggle && (
              <button
                type="button"
                className={`ntoggle${nameToggle.crew ? " is-crew" : ""}`}
                role="switch"
                aria-checked={nameToggle.crew}
                aria-label="Toggle between professional names and crew callsigns"
                onClick={nameToggle.onToggle}
              >
                <span className="on">Pro</span><span className="off">Crew</span>
              </button>
            )}
            {active ? (
              <Link href="/" className="back">‹ All products</Link>
            ) : (
              <Link href={APP} className="signin">Sign in</Link>
            )}
            <Link href={APP} className="btn btn-lime">Start free</Link>
            <button
              id="burger"
              className="burger"
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      <nav className={`mnav${open ? " open" : ""}`} aria-label="Mobile">
        <div className="mgroup">Products</div>
        {PRODUCTS.map((p) => (
          <Link
            key={p.id}
            className={`msub${active === p.id ? " active" : ""}`}
            aria-current={active === p.id ? "page" : undefined}
            href={p.path}
            onClick={close}
          >
            {p.name} · {p.persona}
          </Link>
        ))}
        <Link href="/#how" onClick={close}>How it works</Link>
        <Link href="/#pricing" onClick={close}>Pricing</Link>
        <Link href={APP} onClick={close}>Sign in</Link>
        <Link href={APP} className="mcta" onClick={close}>Start free</Link>
      </nav>
    </>
  );
}
