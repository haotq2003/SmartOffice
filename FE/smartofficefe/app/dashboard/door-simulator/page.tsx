'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardDoorSimulatorRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/door-simulator');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-sans">
      Đang chuyển hướng sang trang Mô phỏng Quẹt thẻ...
    </div>
  );
}
