
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

  const handlePlay = (levelId: string) => {
    router.push(`/play/${levelId}`);
  };


  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 font-body">
  

    {/* Khung điện thoại */}
    <div className="relative bg-[#0f172a] w-[390px] h-[844px] rounded-[2rem] shadow-2xl overflow-hidden border border-gray-700 flex flex-col"
    style={{
            backgroundImage: "url('/backgroup.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
    >
      
      <header className="flex items-center justify-between p-4">
        {/* App Icon */}
        {/* <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/50">
          <Image src="/backgroup.png" alt="App Icon" width={40} height={40} />
        </div> */}

        {/* Stats */}
        <div className="absolute top-2 right-2 flex items-center gap-3 text-gray-700">
          <div className="flex items-center bg-white/60 rounded-full px-2 py-1 gap-1 text-sm font-medium">
            <Coins className="w-4 h-4" />
            123
          </div>
          <div className="flex items-center bg-white/60 rounded-full px-2 py-1 gap-1 text-sm font-medium">
            <Heart className="w-4 h-4" />
            12
          </div>
          <button className="p-2 rounded-full hover:bg-white/40 transition">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>


     <section className="flex flex-col items-center justify-center flex-1 pb-24">
  {isLoading ? (
    <div className="flex flex-col gap-6 items-center">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-16 rounded-full bg-white/20" />
      ))}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-6">
      {(() => {
        // ✅ Xác định 4 level bắt đầu từ level unlock cao nhất
        const startIndex = Math.max(0, highestLevelUnlocked - 1);
        const visibleLevels = levels.slice(startIndex, startIndex + 4).reverse();

        return visibleLevels.map((level, index) => {
          const isUnlocked = level.order <= highestLevelUnlocked;
          const appleSrc = isUnlocked ? '/apple_unlock.png' : '/apple_locked.png';
          return (
            <div
              key={level.id}
              className="flex flex-col items-center transition-transform hover:scale-105"
            >
              {/* Ảnh quả táo — clickable nếu unlocked */}
              <button
                onClick={() => isUnlocked && handlePlay(level.id)}
                disabled={!isUnlocked}
                className={`focus:outline-none transition-all ${
                  isUnlocked
                    ? 'hover:brightness-110 active:scale-95'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <Image
                  src={appleSrc}
                  alt={`Level ${level.order}`}
                  width={70}
                  height={70}
                  style={{ transform: `scale(${1 + index * 0.1})` }}
                />
              </button>

              {/* Số level */}
              <span className="text-gray-700 font-semibold mt-1 text-lg">
                {level.order}
              </span>
            </div>
          );
        });
      })()}

      {/* Nút Play */}
      <Button
        onClick={() => handlePlay(levels[highestLevelUnlocked - 1]?.id)}
        className="mt-4 bg-green-600 text-white px-10 py-6 text-lg rounded-xl hover:bg-green-700 transition-all"
      >
        Play
      </Button>
    </div>
  )}
</section>

        
        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 flex justify-around bg-green-900/90 text-white py-3 rounded-t-2xl">
          <Link href="/create" className="flex flex-col items-center text-sm opacity-80 hover:opacity-100 transition">
            <Store className="w-6 h-6" />
            <span>Store</span>
          </Link>

          <Link href="/" className="flex flex-col items-center text-sm opacity-100">
            <div className="bg-green-700 p-2 rounded-full shadow-lg">
              <HomeIcon className="w-6 h-6" />
            </div>
            <span className="mt-1 font-semibold">Home</span>
          </Link>

          <Link href="/create" className="flex flex-col items-center text-sm opacity-80 hover:opacity-100 transition">
            <Store className="w-6 h-6" />
            <span>Shop</span>
          </Link>
        </nav>


      </div>
      
    </main>
  );
}
