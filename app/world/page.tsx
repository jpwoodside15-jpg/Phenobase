import WorldGlobe from "@/components/WorldGlobe";
import { allSpots } from "@/data/worldAll";

export default function WorldPage() {
  return (
    <main className="page-shell world-page">
      <section className="hero-card narrow">
        <p className="eyebrow">Global cannabis culture</p>
        <h1>World Map</h1>
        <p>
          A lightweight view of cultivator and culture hotspots across the globe.
        </p>
      </section>
      <WorldGlobe spots={allSpots} />
    </main>
  );
}
