import type { Metadata } from "next";

import HomeHub from "../components/home-hub";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return <HomeHub />;
}
