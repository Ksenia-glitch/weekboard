import { URGENCY_LEGEND } from '../utils/urgency'

export function UrgencyLegend() {
  return (
    <aside className="urgency-legend" aria-label="Deadline color guide">
      <p className="urgency-legend__title">Deadline colors</p>
      <ul className="urgency-legend__list">
        {URGENCY_LEGEND.map((item) => (
          <li key={item.level} className="urgency-legend__item">
            <span className={`swatch urgency-${item.level}`} aria-hidden="true" />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
