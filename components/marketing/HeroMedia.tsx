"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./HomeContent.module.css";

const videoSrc = "/images/home/laundry-hero.mp4";
const posterSrc = "/images/home/laundry-hero-poster.webp";
type DataConnection = EventTarget & { saveData?: boolean };

export default function HeroMedia() {
  const video = useRef<HTMLVideoElement>(null);
  const [eligible, setEligible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 768px)");
    const connection = (navigator as Navigator & { connection?: DataConnection }).connection;
    const update = () => setEligible(!reduced.matches && desktop.matches && !connection?.saveData);
    update();
    reduced.addEventListener("change", update);
    desktop.addEventListener("change", update);
    connection?.addEventListener("change", update);
    return () => {
      reduced.removeEventListener("change", update);
      desktop.removeEventListener("change", update);
      connection?.removeEventListener("change", update);
    };
  }, []);
  const showVideo = eligible && !failed;
  return <>
    <Image src={posterSrc} alt="" fill preload sizes="100vw" className={styles.heroImage} />
    {showVideo && <video ref={video} className={styles.heroVideo} src={videoSrc} poster={posterSrc} muted loop playsInline autoPlay preload="none" aria-hidden="true" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)} />}
    {showVideo && <button type="button" className={styles.motionControl} onClick={() => {
      if (!video.current) return;
      if (playing) video.current.pause();
      else void video.current.play().catch(() => setFailed(true));
    }} aria-label={playing ? "Pause background video" : "Play background video"}>{playing ? "Ⅱ Pause motion" : "▶ Play motion"}</button>}
  </>;
}
