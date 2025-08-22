import BadmintonGame from '@/components/BadmintonGame';
import OrientationOverlay from '@/components/OrientationOverlay';

export default function GamePage() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <BadmintonGame />
      <OrientationOverlay />
    </div>
  );
}