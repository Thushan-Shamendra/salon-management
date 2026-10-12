"use client";

import { useSectionCustomization } from "@/components/customization/CustomizationProvider";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  HeartIcon,
  SparklesIcon,
  UsersIcon,
} from "@/components/ui/icons";
import styles from "./AboutHero.module.css";

const SALON_FEATURES = [
  "Premium Products",
  "Professional Team",
  "Wedding Beauty",
  "Modern Care",
  "Quality Service",
  "Relaxing Space",
];

export default function AboutHero() {
  const custom = useSectionCustomization("hero");

  return (
    <section className={styles.hero} aria-labelledby="about-hero-title" data-customization-section="hero">
      <div className={styles.header}>
        <p className={styles.headerBadge} data-customization-role="eyebrow">
          <SparklesIcon className={styles.badgeIcon} />{custom.has("eyebrow") ? custom.text("eyebrow", "") : <>
          ABOUT SALVORA
        </>}</p>
        <h1
          id="about-hero-title"
          className={`${styles.heading} text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight`} data-customization-role="heading"
        >{custom.has("heading") ? custom.text("heading", "") : <>
          More Than a Salon
          </>}<span data-customization-role="highlight">{custom.has("highlightedText") ? custom.text("highlightedText", "") : <>A Place for You</>}</span>
        </h1>
      </div>

      <div className={styles.composition}>
        <div className={styles.introCard}>
          <p className={styles.eyebrow}>YOUR EVERYDAY ESCAPE</p>
          <h2 className={styles.introTitle} data-customization-role="subheading">{custom.has("subheading") ? custom.text("subheading", "") : <>
            Care That Goes
            <span>Beyond Beauty</span>
          </>}</h2>
          <p className={styles.introDescription} data-customization-role="description">
            {custom.text("description", "A little time for yourself, with thoughtful treatments and personal attention in a calming space.")}
          </p>
          <Link href="/services" className={styles.servicesLink} data-customization-role="primaryButton">{custom.has("primaryButtonText") ? custom.text("primaryButtonText", "") : <>
            Explore Our Services
            </>}<ArrowRightIcon className={styles.arrow} />
          </Link>
        </div>

        <div className={styles.salonImage}>
          <div className={styles.imageMask}>
            <Image
              src="/images/about-sunlit-salon.png"
              alt="Sunlit salon with arched mirrors, cream styling chairs, and warm gold details"
              fill
              preload
              sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1188px) 82vw, 944px"
              className={styles.image}
            />
          </div>
        </div>

        <div className={`${styles.glassCard} ${styles.leftGlass}`}>
          <UsersIcon className={styles.featureIcon} />
          <h2 className={styles.featureTitle}>Experienced Beauticians</h2>
          <p className={styles.featureDescription}>
            Skilled professionals dedicated to your beauty.
          </p>
        </div>

        <div className={`${styles.glassCard} ${styles.rightGlass}`}>
          <HeartIcon className={styles.featureIcon} />
          <h2 className={styles.featureTitle}>Personalized Care</h2>
          <p className={styles.featureDescription}>
            Tailored treatments for your unique needs.
          </p>
        </div>

        <ul className={styles.miniGrid} aria-label="Our salon features">
          {SALON_FEATURES.map((feature) => (
            <li key={feature} className={styles.miniCard}>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
