import Link from 'next/link'
import DitheredPlanet from '@/components/DitheredPlanet'

export default function NotFound() {
  return (
    <>
      <div className="fixed inset-0 bg-black z-0">
        <DitheredPlanet />
      </div>
      <div className="relative z-10 flex flex-col justify-center items-center min-h-screen p-4 text-center">
        <div className="bg-black/80 backdrop-blur-sm border border-purple-400/30 p-8 sm:p-12 flex flex-col items-center justify-center max-w-2xl w-full">
          <h1 className="text-6xl sm:text-8xl font-bold text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">
            404
          </h1>
          <h2 className="text-2xl sm:text-4xl text-purple-400 mb-8 uppercase tracking-widest">
            ERR: SECTOR_NOT_FOUND
          </h2>

          <p className="text-white text-lg sm:text-2xl mb-12 font-medium">
            &gt; The coordinates you entered do not exist in this database.
            The data may have been corrupted or permanently deleted.
          </p>

          <Link
            href="/"
            className="px-8 py-4 border-2 border-purple-400 bg-purple-950/40 text-purple-400 hover:bg-purple-400 hover:text-black transition-colors text-xl sm:text-3xl font-bold uppercase w-full"
          >
            [ RETURN_TO_BASE ]
          </Link>
        </div>
      </div>
    </>
  )
}
