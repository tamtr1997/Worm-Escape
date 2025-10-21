'use client';
import { Suspense } from 'react';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import LevelSelect from '@/components/game/LevelSelect';

function HomePageContent() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handlePasswordSubmit = () => {
    if (password === 'luna') {
      router.push('/create');
      setIsDialogOpen(false);
      setPassword('');
      setError('');
    } else {
      setError('Mật khẩu không đúng. Vui lòng thử lại.');
    }
  };
  
  return (
     <main className="flex min-h-screen flex-col items-center bg-black font-body pt-6">
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
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className='bg-blue-500/80 border-2 border-white/50 text-white rounded-full w-10 h-10'>
                <Settings />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Truy cập Khu vực Editor</DialogTitle>
                <DialogDescription>
                  Vui lòng nhập mật khẩu để vào trình chỉnh sửa level.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password-input" className="text-right">
                    Mật khẩu
                  </Label>
                  <Input
                    id="password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="col-span-3"
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  />
                </div>
                {error && <p className="text-sm text-destructive text-center col-span-4">{error}</p>}
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handlePasswordSubmit}>Xác nhận</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <LevelSelect />
        
        <div className="absolute bottom-0 left-0 w-full flex justify-center">
          <img
            src="/footer.png"
            alt="Game Footer"
            className="w-[390px] h-[110px] object-contain"
          />
        </div>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
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
               <div className="grid grid-cols-4 gap-4 p-4">
                  {[...Array(12)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-16 rounded-lg bg-white/20" />
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
    }>
      <HomePageContent />
    </Suspense>
  );
}
