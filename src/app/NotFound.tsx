import { Link } from 'react-router'

export function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="font-display text-6xl font-bold text-sea">Adrift</p>
      <p className="mt-3 text-muted">That page has sailed off the chart.</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-sea px-5 py-2 font-medium text-white">
        Back to harbour
      </Link>
    </div>
  )
}
