import { useState } from 'react';
import Timer from '../component/Timer';

export default function ProfileScreen() {
  const [timeLeft, setTimeLeft] = useState(165);

  return <Timer timeLeft={timeLeft} setTimeLeft={setTimeLeft} />;
}
