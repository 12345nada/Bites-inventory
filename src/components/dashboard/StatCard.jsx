export default function StatCard({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>

      <div className="stat-content">
        <h4>{title}</h4>

        <h2>{value}</h2>

        <p>{subtitle}</p>
      </div>
    </div>
  );
}