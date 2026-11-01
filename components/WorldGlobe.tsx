type WorldSpot = {
  name: string;
  x: number;
  y: number;
  value: number;
};

export default function WorldGlobe({ spots }: { spots: WorldSpot[] }) {
  return (
    <div className="world-globe" aria-label="World map">
      {spots.map((spot) => (
        <div
          key={spot.name}
          className="world-spot"
          style={{
            left: `${spot.x}%`,
            top: `${spot.y}%`,
            opacity: 0.45 + spot.value * 0.35,
          }}
          title={spot.name}
        />
      ))}
    </div>
  );
}
