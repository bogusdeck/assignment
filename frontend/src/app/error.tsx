'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import DitheredPlanet from '@/components/DitheredPlanet'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <>
      <div className="fixed inset-0 bg-black z-0">
        <DitheredPlanet />
      </div>
      <div className="relative z-10 flex flex-col justify-center items-center min-h-screen p-4 text-center">
        <h1 className="text-6xl sm:text-8xl font-bold text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">
          CRITICAL_FAILURE
        </h1>
        <h2 className="text-2xl sm:text-4xl text-purple-400 mb-8 uppercase tracking-widest">
          ERR: SYSTEM_OVERLOAD
        </h2>

        <p className="text-white/70 text-lg sm:text-2xl max-w-xl mb-12">
          &gt; A severe error has occurred in the mainframe.
          Please attempt a system reboot to clear the memory banks.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => reset()}
            className="px-8 py-4 border-2 border-red-500 bg-red-950/40 backdrop-blur-md text-red-500 hover:bg-red-500 hover:text-black transition-colors text-xl sm:text-2xl font-bold uppercase"
          >
            [ INITIATE_REBOOT ]
          </button>

          <Link
            href="/"
            className="px-8 py-4 border-2 border-purple-400 bg-black/40 backdrop-blur-md text-purple-400 hover:bg-purple-400 hover:text-black transition-colors text-xl sm:text-2xl font-bold uppercase"
          >
            [ RETURN_TO_BASE ]
          </Link>
        </div>
      </div>
    </>
  )
}
