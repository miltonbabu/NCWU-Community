$base = "e:\PYTHON PROJECT UNI\Ncwu Int. Community\Kimi_Agent_Build+Class+Schedule\Site\app\src"

# ConversionOptions.tsx
Set-Content -Path "$base\components\pdfTools\ConversionOptions.tsx" -Value @'
import{useTheme}from"@/components/ThemeProvider";import{useTranslation}from"react-i18next";import{FileText,Image,Settings,CheckSquare,Palette,Monitor}from"lucide-react";import type{ConversionOptions,OutputFormat,ImageQuality,ImageColorMode}from"@/types/pdfTools";

interface Props{options:ConversionOptions;onOptionsChange:(o:ConversionOptions)=>void;totalPages:number}
export function ConversionOptions({options,onOptionsChange,totalPages}:Props){
  const{resolvedTheme}=useTheme();const isDark=resolvedTheme==="dark";const{t}=useTranslation();
  const inputCls=`w-full px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/50 ${isDark?"bg-slate-800 border-slate-600 text-white":"bg-white border-slate-300 text-slate-900"}`;
  return(<div className={`rounded-xl border p-5 space-y-5 ${isDark?"bg-slate-800/50 border-slate-700":"bg-white border-slate-200"}`}>
    <h3 className={`text-base font-semibold flex items-center gap-2 ${isDark?"text-white":"text-slate-900"}`}><Settings className="w-5 h-5 text-red-500"/>Settings</h3>
    <div className="flex gap-2">{(["docx","png","jpg"]as OutputFormat[]).map(fmt=>(<button key={fmt} onClick={()=>onOptionsChange({...options,outputFormat:fmt})} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${options.outputFormat===fmt?"bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg":(isDark?"bg-slate-700 text-slate-300 hover:bg-slate-600":"bg-slate-100 text-slate-600 hover:bg-slate-200")}`}>{fmt==="docx"?<FileText className="w-4 h-4"/>:<Image className="w-4 h-4"/>}{fmt.toUpperCase()}</button>))}</div>
  </div>);
}

# ConversionProgress.tsx
Set-Content -Path "$base\components\pdfTools\ConversionProgress.tsx" -Value @'
import{useTheme}from"@/components/ThemeProvider";import{X,Loader2,CheckCircle2}from"lucide-react";import type{ConversionProgress}from"@/types/pdfTools";
interface Props{progress:ConversionProgress;onCancel?:()=>void}
export function ConversionProgress({progress,onCancel}:Props){const{resolvedTheme}=useTheme();const isDark=resolvedTheme==="dark";if(!progress.isProcessing&&progress.percentage===0)return null;
  return(<div className={`rounded-xl border p-5 space-y-4 ${isDark?"bg-slate-800/50 border-slate-700":"bg-white border-slate-200"}${progress.percentage===100?" ring-2 ring-green-500/20":""}`}>
    <div className="flex items-center justify-between"><div className="flex items-center gap-3">{progress.percentage===100?<CheckCircle2 className="w-5 h-5 text-green-500"/>:<Loader2 className="w-5 h-5 text-blue-500 animate-spin/>}<div><p className={`text-sm font-semibold ${isDark?"text-white":"text-slate-900"}`}>{progress.currentStep}</p>{progress.totalPages>0&&<p className={`text-xs ${isDark?"text-slate-400":"text-slate-500"}`}>Page {progress.currentPage}/{progress.totalPages}</p>}</div></div>
      <div className="flex items-center gap-3"><span className={`text-sm font-bold tabular-nums ${progress.percentage===100?"text-green-500":(isDark?"text-blue-400":"text-blue-600")}`}>{progress.percentage}%</span>{progress.isProcessing&&onCancel&&<button onClick={onCancel} className={`p-1.5 rounded-lg ${isDark?"hover:bg-slate-700 text-slate-400":"hover:bg-slate-100 text-slate-500"}`}><X className="w-4 h-4"/></button>}</div></div>
    <div className={`h-2.5 rounded-full overflow-hidden ${isDark?"bg-slate-700":"bg-slate-200"}`}><div className={`h-full rounded-full transition-all duration-500 ${progress.percentage===100?"bg-gradient-to-r from-green-500 to-emerald-400":"bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400"}`} style={{width:`${progress.percentage}%`}}/></div>
  </div>);
}

# DownloadManager.tsx
Set-Content -Path "$base\components\pdfTools\DownloadManager.tsx" -Value @'
import{useTheme}from"@/components/ThemeProvider";import{Download,Trash2,FileImage,FileText,Package}from"lucide-react";import{downloadFile}from"@/utils/pdfConverter";import type{ConvertedFile}from"@/types/pdfTools";
interface Props{files:ConvertedFile[];onClear?:()=>void}
export function DownloadManager({files,onClear}:Props){const{resolvedTheme}=useTheme();const isDark=resolvedTheme==="dark";if(!files.length)return null;
  return(<div className={`rounded-xl border p-5 space-y-4 ${isDark?"bg-slate-800/50 border-slate-700":"bg-white border-slate-200"}`}>
    <div className="flex items-center justify-between"><h3 className={`text-base font-semibold flex items-center gap-2 ${isDark?"text-white":"text-slate-900"}`}><Package className="w-5 h-5 text-green-500"/>Converted Files ({files.length})</h3><div className="flex items-center gap-2">{files.length>1&&<button onClick={()=>files.forEach(f=>setTimeout(()=>downloadFile(f.blob,f.name),100))} className="px-3 py-1.5 rounded-lg text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white"><Download className="w-3.5 h-3.5 mr-1"/>All</button>}{onClear&&<button onClick={onClear} className={`px-3 py-1.5 rounded-lg text-xs ${isDark?"bg-slate-700 text-slate-300":"bg-slate-100 text-slate-600"}`}><Trash2 className="w-3.5 h-3.5 mr-1"/>Clear</button>}</div></div>
    <div className="space-y-2">{files.map(f=>(<div key={f.id} className={`flex items-center gap-3 p-3 rounded-lg border group ${isDark?"bg-slate-900/50 border-slate-700":"bg-slate-50 border-slate-200"}`}>{f.format==="docx"?<FileText className="w-5 h-5 text-blue-500"/>:<FileImage className="w-5 h-5 text-green-500"/><div className="flex-1 min-w-0"><p className={`text-sm font-medium truncate ${isDark?"text-white":"text-slate-900"}`}>{f.name}</p><p className={`text-xs ${isDark?"text-slate-500":"text-slate-400"}`}>{(f.size/1024).toFixed(1)} KB | {f.format.toUpperCase()}</p></div><button onClick={()=>downloadFile(f.blob,f.name)} className="opacity-0 group-hover:opacity-100 px-3 py-1.5 rounded-lg text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white"><Download className="w-3.5 h-3.5 mr-1"/>DL</button></div>))}</div>
  </div>);
}

Write-Host "Remaining components created"
