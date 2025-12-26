
import React, { useState, useCallback, useEffect } from 'react';
import { AspectRatio, ImageStyle, GeneratedImage, ModelType, ImageSize } from './types';
import { generateImage } from './services/geminiService';

const LoadingOverlay = ({ modelType }: { modelType: ModelType }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-2xl z-20 backdrop-blur-md">
    <div className="relative">
      <div className="w-20 h-20 border-4 border-indigo-500/20 rounded-full"></div>
      <div className="absolute top-0 w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
    <p className="text-2xl font-bold text-white mt-6 animate-pulse">
      {modelType === ModelType.PRO ? 'جاري التوليد الاحترافي...' : 'جاري الرسم...'}
    </p>
  </div>
);

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>(ImageStyle.NONE);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.FLASH);
  const [selectedSize, setSelectedSize] = useState<ImageSize>(ImageSize.K1);
  const [viewMode, setViewMode] = useState<'ui' | 'api'>('ui');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('image_gen_history_v4');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('image_gen_history_v4', JSON.stringify(history));
  }, [history]);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('يرجى وصف الصورة أولاً');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const imageUrl = await generateImage(prompt, selectedRatio, selectedStyle, selectedModel, selectedSize);
      setCurrentImage(imageUrl);
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt: prompt,
        timestamp: Date.now(),
        config: { aspectRatio: selectedRatio, style: selectedStyle, modelType: selectedModel, imageSize: selectedSize }
      };
      setHistory(prev => [newImage, ...prev].slice(0, 15));
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedRatio, selectedStyle, selectedModel, selectedSize]);

  // تجهيز بيانات n8n
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-site.vercel.app';
  const apiEndpoint = `${currentUrl}/api/generate`;
  
  const n8nCurl = `curl -X POST ${apiEndpoint} \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "${prompt || 'منظر طبيعي خلاب'}",
    "apiKey": "مفتاح_API_الخاص_بك",
    "aspectRatio": "${selectedRatio}",
    "style": "${selectedStyle}",
    "model": "${selectedModel}"
  }'`;

  return (
    <div className="min-h-screen bg-[#020408] text-gray-100 font-sans">
      {/* Header */}
      <nav className="border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase">Vision API Hub</h1>
              <p className="text-[10px] text-gray-500 font-medium">IMAGE GENERATION ENGINE</p>
            </div>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-full border border-white/10">
            <button 
              onClick={() => setViewMode('ui')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${viewMode === 'ui' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              استخدام الموقع
            </button>
            <button 
              onClick={() => setViewMode('api')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${viewMode === 'api' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              بوابة المطورين (n8n)
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-6 max-w-7xl">
        {viewMode === 'ui' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* UI Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] p-8 shadow-2xl backdrop-blur-sm">
                <div className="mb-6">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-4">وصف الصورة</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="رائد فضاء يسبح في محيط من الزهور بأسلوب سيريالي..."
                    className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-5 text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-700"
                  />
                </div>

                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-3">نسبة العرض</span>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.values(AspectRatio).map(r => (
                        <button key={r} onClick={() => setSelectedRatio(r)} className={`py-2 rounded-xl text-[10px] border transition-all ${selectedRatio === r ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}>{r}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-3">النمط</span>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {Object.values(ImageStyle).map(s => (
                        <button key={s} onClick={() => setSelectedStyle(s)} className={`py-2 px-3 rounded-xl text-xs border transition-all text-right ${selectedStyle === s ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full mt-8 py-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-white shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-tighter"
                >
                  {isGenerating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : 'إطلاق العملية'}
                </button>
              </div>
            </div>

            {/* UI Preview */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="relative aspect-[16/9] lg:aspect-auto lg:h-[600px] bg-white/[0.01] border border-white/5 rounded-[3rem] overflow-hidden flex items-center justify-center shadow-inner group">
                {isGenerating && <LoadingOverlay modelType={selectedModel} />}
                {!currentImage ? (
                  <div className="text-center p-12">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 opacity-20">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <p className="text-gray-600 text-sm font-medium">بانتظار تعليماتك لتبدأ العملية</p>
                  </div>
                ) : (
                  <img src={currentImage} className="w-full h-full object-contain p-6 group-hover:scale-[1.02] transition-transform duration-700" alt="Generated" />
                )}
              </div>

              {/* History */}
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {history.map(h => (
                  <div key={h.id} onClick={() => setCurrentImage(h.url)} className="aspect-square bg-white/5 rounded-2xl overflow-hidden cursor-pointer hover:ring-2 ring-indigo-500/50 transition-all">
                    <img src={h.url} className="w-full h-full object-cover" alt="History" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in space-y-8 max-w-4xl mx-auto">
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem] p-10">
              <h2 className="text-3xl font-black mb-6 flex items-center gap-4">
                <span className="bg-indigo-600 p-2 rounded-xl text-white">API</span>
                دليل ربط n8n بالموقع
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                هذا الموقع ليس مجرد واجهة، بل هو محرك API متكامل. يمكنك استدعاء الخدمة من خلال n8n أو أي تطبيق برمجي باستخدام طلب POST بسيط. الخدمة مجانية تماماً عند استخدام مفتاح API الخاص بك.
              </p>

              <div className="space-y-6">
                <div className="bg-black/60 rounded-3xl p-6 border border-white/5">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase block mb-3">Endpoint URL</span>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 bg-white/5 p-3 rounded-xl text-xs text-green-400 font-mono select-all">
                      {apiEndpoint}
                    </code>
                  </div>
                </div>

                <div className="bg-black/60 rounded-3xl p-6 border border-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase block">HTTP Body (JSON)</span>
                    <button onClick={() => navigator.clipboard.writeText(JSON.stringify({ prompt, apiKey: "KEY", aspectRatio: selectedRatio }, null, 2))} className="text-[10px] text-gray-500 hover:text-white underline">نسخ الكود</button>
                  </div>
                  <pre className="text-[11px] text-gray-400 font-mono leading-6">
                    {`{
  "prompt": "${prompt || 'وصف الصورة هنا'}",
  "apiKey": "مفتاح_الجيمناي_الخاص_بك",
  "aspectRatio": "${selectedRatio}",
  "style": "${selectedStyle}",
  "model": "${selectedModel}"
}`}
                  </pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <h4 className="font-bold text-sm mb-2 text-white">كيفية الإرسال من n8n</h4>
                    <ul className="text-xs text-gray-500 space-y-2 list-disc pr-4">
                      <li>استخدم عقدة <span className="text-white">HTTP Request</span>.</li>
                      <li>الطريقة: <span className="text-indigo-400 font-bold">POST</span>.</li>
                      <li>ضع الرابط أعلاه في خانة الـ URL.</li>
                      <li>اختر <span className="text-white">JSON</span> في الـ Body Content.</li>
                      <li>أضف الحقول المذكورة في كود الـ JSON.</li>
                    </ul>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <h4 className="font-bold text-sm mb-2 text-white">ماذا سيعيد لك الموقع؟</h4>
                    <ul className="text-xs text-gray-500 space-y-2 list-disc pr-4">
                      <li>حقل <span className="text-white">image_url</span> يحتوي على الصورة كـ Data URI.</li>
                      <li>حقل <span className="text-white">base64</span> يحتوي على كود الصورة الخام.</li>
                      <li>الاستجابة سريعة جداً بفضل استخدام Edge Runtime.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 border border-white/5 rounded-[2rem] text-center">
              <p className="text-xs text-gray-600 italic">
                بمجرد رفعك لهذا الموقع على Vercel، سيتم تفعيل الـ API تلقائياً على الرابط الخاص بموقعك.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="py-10 border-t border-white/5 text-center">
        <div className="flex justify-center gap-6 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
          <span>Google Gemini AI</span>
          <span>•</span>
          <span>Vercel Edge API</span>
          <span>•</span>
          <span>n8n Ready</span>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default App;
