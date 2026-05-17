import dynamic from "next/dynamic";

const Sokoban3D = dynamic(() => import("../components/Sokoban3D"), { ssr: false });

export default function Home() {
  return <Sokoban3D />;
}
