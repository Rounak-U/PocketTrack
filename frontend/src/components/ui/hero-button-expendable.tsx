"use client"

import { useState, useEffect } from "react"
import { ArrowRight, BarChart3, LogIn } from "lucide-react"
import { motion } from "framer-motion"
import { GodRays } from "@paper-design/shaders-react"
import Link from "next/link"

export default function Hero() {
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    try {
      const token = localStorage.getItem("accessToken")
      setIsAuthed(Boolean(token))
    } catch (e) {
      setIsAuthed(false)
    }
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white dark:bg-zinc-950 px-4 sm:px-6 py-12 sm:py-20 transition-colors duration-300">
      {/* Login / Dashboard Button at Top Right (shows Dashboard when access token exists) */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-20">
        <Link href={isAuthed ? "/dashboard" : "/login"}>
          <button className="bg-white/20 backdrop-blur-md text-white px-4 py-1 sm:px-6 sm:py-2 rounded-full hover:bg-white/30 transition-all duration-300 border border-white/20 shadow-lg flex items-center gap-2">
            {isAuthed ? <BarChart3 className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {isAuthed ? "Dashboard" : "Sign In"}
          </button>
        </Link>
      </div>

      {/* GodRays Background */}
      <div className="absolute inset-0 pointer-events-none">
        <GodRays
          colorBack="#00000000"
          colors={["#16a34a40", "#22c55e40", "#15803d40", "#16653440"]}
          colorBloom="#16a34a"
          offsetX={0.85}
          offsetY={-1}
          intensity={0.5}
          spotty={0.45}
          midSize={10}
          midIntensity={0}
          density={0.38}
          bloom={0.3}
          speed={0.5}
          scale={1.6}
          frame={3332042.8159981333}
          style={{ height: "100%", width: "100%", position: "absolute", top: 0, left: 0 }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 px-3 py-1 text-sm font-medium text-zinc-800 dark:text-zinc-200 backdrop-blur-sm"
        >
          <span className="flex h-2 w-2 rounded-full bg-green-600 mr-2"></span>
          New: Smart Expense Insights
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-4xl"
        >
          Track your UPI spending <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
            smarter & faster
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl px-4 leading-relaxed"
        >
          PocketTrack helps students and young professionals analyze UPI spending by uploading transaction statements and visualizing expenses through smart dashboards.
          Automatically categorize transactions, highlight patterns, and provide insights for better financial habits.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="inline-block relative mt-4"
        >
          <Link href={isAuthed ? "/dashboard" : "/upload"}>
            <button className="relative flex items-center gap-2 h-14 px-8 py-3 text-lg font-semibold text-black tracking-wide bg-white hover:bg-gray-100 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-300">
              Analyze My Spending
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}