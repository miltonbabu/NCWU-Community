$base = "e:\PYTHON PROJECT UNI\Ncwu Int. Community\Kimi_Agent_Build+Class+Schedule\Site\app\src"

Set-Content -Path "$base\pages\PdfToolsPage.tsx" -Value @'
import{useState,useCallback}from"react";import{useTheme}from"@/components/ThemeProvider";import{ArrowRightLeft,Sparkles,Zap,Shield,Monitor}from"lucide-react";import{toast}from"sonner";
import{PdfUploader}from"@/components/pdfTools/PdfUploader";import{PdfViewer}from"@/components/pdfTools/PdfViewer";import{ConversionOptions}from"@/components/pdfTools/ConversionOptions";import{ConversionProgress}from"@/components/pdfTools/ConversionProgress";import{DownloadManager}from"@/components/pdfTools/DownloadManager";
import{convertPdf}from"@/utils/pdfConverter";
import type{PdfFile,ConversionOptions as COpt,ConvertedFile}from"@/types/pdfTools";import{DEFAULT_CONVERSION_OPTIONS}from"@/types/pdfTools";

export default function PdfToolsPage(){
  const{resolvedTheme}=useTheme();const isDark=resolvedTheme==="dark";
  const[pdfFiles,setPdfFiles]=useState<PdfFile[]>([]);
  const[options,setOptions]=useState<COpt>(DEFAULT_CONVERSION_OPTIONS);
  const[progress,setProgress]=useState({currentStep:"",currentPage:0,totalPages:0,percentage:0,isProcessing:false,isCancelled:false});
  const[convertedFiles,setConvertedFiles]=useState<ConvertedFile[]>([]);
  const[selectedId,setSelectedId]=useState<string|null>(null);

  const selected=pdfFiles.find(f=>f.id===selectedId)||pdfFiles[0];
  const totalP=selected?.pageCount||0;

  const handleFilesSelected=useCallback((files:PdfFile[])=>{setPdfFiles(files);if(files.length>0&&!selectedId)setSelectedId(files[0].id)},[selectedId]);
  const handleConvert=async()=>{
    if(!selected||selected.status!=="return"){toast.error("Select a PDF");return;}
    setProgress({currentStep:"Starting...",currentPage:0,totalPages:0,percentage:0,isProcessing:true,isCancelled:false});
    try{
      const result=await convertPdf(selected.file,options,p=>setProgress(p));
      setConvertedFiles(prev=>[...prev,{id:crypto.randomUUID(),pdfId:selected.id,name:result.fileName,format:options.outputFormat,size:result.blob.size,blob:result.blob,createdAt:new Date()}]);
      toast.success("Conversion complete!");
    }catch(e){console.error(e);toast.error("Conversion failed");}
    finally{setProgress(p=>({...p,isProcessing:false}));}
  };
  return(<div className={`min-h-screen ${isDark?"":"bg-slate-50"}`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-10 text-center"><div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${isDark?"bg-gradient-to-br from-red-500/20 to-orange-500/20":"bg-gradient-to-br from-red-50 to-orange-50"}`}><ArrowRightLeft className={`w-8 h-8 ${isDark?"text-red-400":"text-red-600"}`}/></div>
        <h1 className={`text-3xl sm:text-4xl font-bold mb-3 ${isDark?"text-white":"text-slate-900"}`}>PDF Converter Tools</h1>
        <p className={`text-lg max-w-2xl mx-auto ${isDark?"text-slate-400":"text-slate-600"}`}>Convert PDF to DOCX or Images. All processing in your browser.</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-5"><PdfUploader onFilesSelected={handleFilesSelected} currentFiles={pdfFiles}/>
          {pdfFiles.length>1&&<div className={`rounded-xl border p-4 ${isDark?"bg-slate-800/50 border-slate-700":"bg-white border-slate-200"}`}><select value={selectedId||""} onChange={e=>setSelectedId(e.target.value)} className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark?"bg-slate-700 border-slate-600 text-white":"bg-white border-slate-300"}`}>{pdfFiles.map(f=>(<option key={f.id} value={f.id}>{f.name}{f.pageCount&&` (${f.pageCount}p)`}</option>))}</select></div>}
          <ConversionOptions options={options}onOptionsChange={setOptions}totalPages={totalP}/>
          <button onClick={handleConvert} disabled={!selected||selected.status!=="return"||progress.isProcessing}
            className={`w-full py-3.5 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 ${progress.isProcessing?"bg-gradient-to-r from-slate-600 to-slate-700 text-white cursor-wait":"bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 hover:shadow-xl text-white"}`}>
            {progress.isProcessing?<><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Converting...</>:<><Sparkles className="w-5 h-5"/>Convert Now</>}</button>
          <ConversionProgress progress={progress} onCancel={()=>{setProgress(p=>({...p,isCancelled:true,isProcessing:false}));toast.info("Cancelled");}}/></div>
        <div className="lg:col-span-8"><PdfViewer pdfFile={selected}/></div></div>
      <DownloadManager files={convertedFiles} onClear()=>setConvertedFiles([])}/>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">{[{icon:Zap,title:"Lightning Fast",desc:"All conversion happens locally"},{icon:Shield,title:"100% Private",desc:"Files never leave your device"},{icon:Monitor,title:"High Quality",desc:"Up to 600 DPI output"}].map(({icon:Ic,title,desc})=>(<div key={title} className={`rounded-xl border p-6 transition-all hover:shadow-lg ${isDark?"bg-slate-800/50 border-slate-700":"bg-white border-slate-200 shadow-sm"}`}><div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-gradient-to-r from-green-500 to-emerald-500`}><Ic className="w-6 h-6 text-white"/></div><h3 className={`text-lg font-semibold mb-2 ${isDark?"text-white":"text-slate-900"}`}>{title}</h3><p className={`text-sm leading-relaxed ${isDark?"text-slate-400":"text-slate-600"}`}>{desc}</p></div>))}</div>
    </div>
  </div>);
}
'@

Write-Host "PdfToolsPage created"
