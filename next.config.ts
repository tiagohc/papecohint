import type { NextConfig } from "next";



const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 👇 ISTO É O FIX
  turbopack: {},
};

module.exports = withPWA(nextConfig);