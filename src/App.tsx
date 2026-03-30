import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  RefreshCw, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Palette,
  Maximize,
  Eraser,
  Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { restorePhoto, RestorationOptions, RestorationType } from './services/aiService';
import { cn } from './lib/utils';

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<RestorationOptions>({
    type: 'full',
    enhanceFace: true,
    upscale: false
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string);
        setRestoredImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  } as any);

  const handleRestore = async () => {
    if (!originalImage) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // 1. Get original dimensions and calculate aspect ratio
      const img = new Image();
      img.src = originalImage;
      await new Promise((resolve, reject) => { 
        img.onload = resolve; 
        img.onerror = reject;
      });
      
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;
      const ratio = originalWidth / originalHeight;
      
      // 2. Find best matching aspect ratio for Gemini API
      const ratios = [
        { name: "1:1", value: 1 },
        { name: "3:4", value: 3/4 },
        { name: "4:3", value: 4/3 },
        { name: "9:16", value: 9/16 },
        { name: "16:9", value: 16/9 }
      ] as const;

      let selectedRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1";
      let minDiff = Infinity;
      for (const r of ratios) {
        const diff = Math.abs(ratio - r.value);
        if (diff < minDiff) {
          minDiff = diff;
          selectedRatio = r.name as any;
        }
      }
      
      // 3. Call AI restoration
      const aiResult = await restorePhoto(originalImage, options, selectedRatio);
      
      // 4. Resize AI output back to original dimensions to "keep original size"
      const restoredImg = new Image();
      restoredImg.src = aiResult;
      await new Promise((resolve, reject) => {
        restoredImg.onload = resolve;
        restoredImg.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = originalWidth;
      canvas.height = originalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Calculate scaling to fill the original dimensions without stretching (center-crop/cover)
        const scale = Math.max(originalWidth / restoredImg.width, originalHeight / restoredImg.height);
        const x = (originalWidth / 2) - (restoredImg.width / 2) * scale;
        const y = (originalHeight / 2) - (restoredImg.height / 2) * scale;
        
        ctx.drawImage(restoredImg, x, y, restoredImg.width * scale, restoredImg.height * scale);
        setRestoredImage(canvas.toDataURL('image/png'));
      } else {
        setRestoredImage(aiResult);
      }
      
    } catch (err) {
      console.error(err);
      setError("Có lỗi xảy ra trong quá trình phục chế. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!restoredImage) return;
    const link = document.createElement('a');
    link.href = restoredImage;
    link.download = `restored-photo-${Date.now()}.png`;
    link.click();
  };

  const reset = () => {
    setOriginalImage(null);
    setRestoredImage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1D21] font-sans selection:bg-neutral-200">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-100 bg-white/70 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-neutral-900 rounded-xl flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-neutral-900">Enhance.AI</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">Công cụ</button>
            <button className="px-4 py-2 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-800 transition-all">Đăng nhập</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left: Upload & Settings */}
          <div className="w-full lg:w-[400px] shrink-0 space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight">Trình nâng cấp ảnh AI</h2>
              <p className="text-sm text-neutral-500">Tăng chất lượng, làm nét và phục chế ảnh chuyên nghiệp.</p>
            </div>

            {!originalImage ? (
              <div 
                {...getRootProps()} 
                className={cn(
                  "relative group cursor-pointer aspect-[4/5] rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-5 p-8",
                  isDragActive ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 hover:border-neutral-400 bg-white shadow-sm"
                )}
              >
                <input {...getInputProps()} />
                <div className="w-20 h-20 rounded-2xl bg-neutral-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                  <Upload className="w-10 h-10 text-neutral-400" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-bold text-neutral-900">Tải ảnh lên để bắt đầu</p>
                  <p className="text-xs text-neutral-400">Kéo thả hoặc nhấn để chọn tệp</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-sm group">
                  <img 
                    src={originalImage} 
                    alt="Original preview" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={reset}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-neutral-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Chế độ xử lý</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'full', label: 'Nâng cấp', icon: Wand2 },
                        { id: 'colorize', label: 'Tô màu', icon: Palette },
                        { id: 'sharpen', label: 'Làm nét', icon: Maximize },
                        { id: 'repair', label: 'Vá lỗi', icon: Eraser },
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setOptions({ ...options, type: type.id as RestorationType })}
                          className={cn(
                            "flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all",
                            options.type === type.id 
                              ? "bg-neutral-900 border-neutral-900 text-white" 
                              : "bg-white border-neutral-100 text-neutral-600 hover:border-neutral-300"
                          )}
                        >
                          <type.icon className="w-3.5 h-3.5" />
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Cài đặt nâng cao</label>
                    <div className="space-y-2">
                      <button 
                        onClick={() => setOptions({ ...options, enhanceFace: !options.enhanceFace })}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-xs font-bold",
                          options.enhanceFace ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-white border-neutral-100 text-neutral-400"
                        )}
                      >
                        <span>Làm nét khuôn mặt chuyên sâu</span>
                        <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", options.enhanceFace ? "border-neutral-900 bg-neutral-900" : "border-neutral-200")}>
                          {options.enhanceFace && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                      <button 
                        onClick={() => setOptions({ ...options, upscale: !options.upscale })}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-xs font-bold",
                          options.upscale ? "bg-neutral-50 border-neutral-200 text-neutral-900" : "bg-white border-neutral-100 text-neutral-400"
                        )}
                      >
                        <span>Tăng độ phân giải 4K</span>
                        <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", options.upscale ? "border-neutral-900 bg-neutral-900" : "border-neutral-200")}>
                          {options.upscale && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleRestore}
                    disabled={isProcessing}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg",
                      isProcessing 
                        ? "bg-neutral-300 cursor-not-allowed" 
                        : "bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] shadow-neutral-200"
                    )}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Đang nâng cấp...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Nâng cấp ngay
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Result Display */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {!restoredImage && !isProcessing ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[600px] rounded-3xl border border-neutral-200 bg-white flex flex-col items-center justify-center text-neutral-400 p-12 text-center shadow-sm"
                >
                  <div className="w-24 h-24 rounded-full bg-neutral-50 flex items-center justify-center mb-6">
                    <ImageIcon className="w-10 h-10 opacity-20" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2">Chưa có ảnh xử lý</h3>
                  <p className="text-sm max-w-sm">Tải ảnh lên và nhấn "Nâng cấp ngay" để trải nghiệm công nghệ phục chế AI đỉnh cao.</p>
                </motion.div>
              ) : isProcessing ? (
                <motion.div 
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[600px] rounded-3xl bg-white border border-neutral-200 flex flex-col items-center justify-center p-12 text-center space-y-8 shadow-sm"
                >
                  <div className="relative">
                    <div className="w-32 h-32 border-[6px] border-neutral-50 border-t-neutral-900 rounded-full animate-spin" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                      <Sparkles className="w-8 h-8 text-neutral-900" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-2xl font-bold tracking-tight">Đang xử lý chi tiết...</p>
                    <p className="text-sm text-neutral-500 max-w-xs mx-auto leading-relaxed">
                      AI đang phân tích từng pixel để vá lỗi và tái tạo chi tiết ảnh của bạn.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white p-2 rounded-[32px] border border-neutral-200 shadow-xl">
                    <BeforeAfterSlider 
                      before={originalImage!} 
                      after={restoredImage!} 
                      className="aspect-square lg:aspect-auto lg:h-[650px] rounded-[24px]"
                    />
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-between gap-4 px-2">
                    <div className="flex items-center gap-2 text-neutral-900 bg-white border border-neutral-200 px-4 py-2 rounded-full text-xs font-bold shadow-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Đã hoàn tất nâng cấp
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handleRestore}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl border border-neutral-200 text-sm font-bold hover:bg-neutral-50 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Xử lý lại
                      </button>
                      <button 
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-neutral-900 text-white text-sm font-bold hover:bg-neutral-800 transition-all shadow-lg shadow-neutral-200"
                      >
                        <Download className="w-4 h-4" />
                        Tải xuống (HD)
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 shadow-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-bold">{error}</p>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-12 bg-white mt-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-40">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold tracking-widest uppercase">Enhance.AI</span>
          </div>
          <p className="text-neutral-400 text-xs font-medium">© 2026 Enhance.AI. Công nghệ phục chế ảnh hàng đầu.</p>
          <div className="flex items-center gap-6 text-xs font-bold text-neutral-400">
            <a href="#" className="hover:text-neutral-900">Điều khoản</a>
            <a href="#" className="hover:text-neutral-900">Bảo mật</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
