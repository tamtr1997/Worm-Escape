'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useLevels } from '@/hooks/useLevels';
import { PlusCircle, Play, Trash2, Lock, Unlock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { WormIcon } from '@/components/icons/WormIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Heart, Coins, Store, HomeIcon} from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const { levels, highestLevelUnlocked, resetProgress, isLoading } = useLevels();
  const router = useRouter();
  
  // Xử lý an toàn cho currentLevel
  const currentLevel = levels?.find(level => level.order === highestLevelUnlocked);
  
  const handlePlay = () => {
    // Kiểm tra an toàn trước khi chuyển trang
    if (!levels || levels.length === 0 || !highestLevelUnlocked) return;
    
    const targetLevel = levels.find(level => level.order === highestLevelUnlocked);
    if (targetLevel) {
      router.push(`/play/${targetLevel.id}`);
    }
  };

  // Hiển thị loading nếu đang tải
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center bg-black font-body pt-6">
        <div className="relative bg-[#0f172a] w-[390px] h-[640px] rounded-[2rem] shadow-2xl overflow-hidden border border-gray-700 flex flex-col"
          style={{
            backgroundImage: "url('/Background fd.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute top-0 left-0 w-full flex justify-center mt-4">
            <img
              src="/header.png"
              alt="Game Header"
              className="w-[358px] h-[54px] object-contain"
            />
          </div>
          
          <section className="flex flex-col items-center justify-center flex-1 pb-24">
            <div className="flex flex-col gap-6 items-center">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-16 rounded-full bg-white/20" />
              ))}
            </div>
          </section>
          
          <div className="absolute bottom-0 left-0 w-full flex justify-center">
            <img
              src="/footer.png"
              alt="Game Footer"
              className="w-[390px] h-[110px] object-contain"
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-black font-body pt-6">
      {/* Khung điện thoại */}
      <div className="relative bg-[#0f172a] w-[390px] h-[640px] rounded-[2rem] shadow-2xl overflow-hidden border border-gray-700 flex flex-col"
        style={{
          backgroundImage: "url('/Background fd.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute top-0 left-0 w-full flex justify-between items-center mt-4 px-4 z-10">
           <div className="w-10 h-10"></div>
          <img
            src="/header.png"
            alt="Game Header"
            className="w-[358px] h-[54px] object-contain"
          />
          <Link href="/create" passHref>
              <Button variant="outline" size="icon" className='bg-blue-500/80 border-2 border-white/50 text-white rounded-full w-10 h-10'>
                <Settings />
              </Button>
            </Link>
        </div>
        
        <section className="flex flex-col items-center justify-center flex-1 pb-24">
          <div className="flex flex-col items-center justify-center gap-6">
            {/* Hiển thị level hiện tại - an toàn */}
            <div className="relative inline-block cursor-pointer w-80">
              <span className="absolute inset-2 flex items-center justify-center text-white text-[48px] font-bold">
                Level {currentLevel?.order || highestLevelUnlocked || 1} 
              </span>
            </div>

            
            {/* Nút Play */}
            <div 
              className="absolute bottom-[150px] left-1/2 -translate-x-1/2 cursor-pointer" 
              onClick={handlePlay}
            >
              <img
                src="/play.png"
                alt="Game Play"
                className="w-[200px] h-[93px] object-contain"
              />
            </div>
          </div>
        </section>
        
        <div className="absolute bottom-0 left-0 w-full flex justify-center">
          <img
            src="/footer.png"
            alt="Game Footer"
            className="w-[390px] h-[110px] object-contain"
          />
        </div>
      </div>
    </main>
  );
}
