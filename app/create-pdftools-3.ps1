$base = "e:\PYTHON PROJECT UNI\Ncwu Int. Community\Kimi_Agent_Build+Class+Schedule\Site\app\src"

# PdfUploader.tsx
Set-Content -Path "$base\components\pdfTools\PdfUploader.tsx" -Value @'
import { useState, useCallback, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useTranslation } from "react-i18next";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getPdfPageCount, formatFileSize } from "@/utils/pdfConverter";
import type { PdfFile } from "@/types/pdfTools";

interface Props { onFilesSelected: (f:PdfFile[])=>void; currentFiles: PdfFile[]; maxFileSize?:number; }
export function PdfUploader({onFilesSelected,currentFiles,maxFileSize=50*1024*1024}:Props){
  const{resolvedTheme}=useTheme();const isDark=resolvedTheme==="dark";const{t}=useTranslation();
  const[isDragOver,setIsDragOver]=useState(false);const[isProcessing,setIsProcessing]=useState(false);
  const inputRef=useRef<HTMLInputElement>(null);

  const handleFiles=useCallback(async(fileList:FileList|File[])=>{
    const files=Array.from(fileList);const newFiles:PdfFile[]=[];const errs:string[]=[];
    for(const f of files){
      if(f.type!=="application/pdf"&&!f.name.endsWith(".pdf")){errs.push(`${f.name}:Not a PDF`);continue;}
      if(f.size>maxFileSize){errs.push(`${f.name}:Too large`);continue;}
      newFiles.push({id:crypto.randomUUID(),file:f,name:f.name,size:f.size,pageCount:null,status:"uploading"});
    }
    if(errs.length)toast.error(errs.join("\n"));
    if(!newFiles.length)return;
    setIsProcessing(true);onFilesSelected([...currentFiles,...newFiles]);
    for(const nf of newFiles){try{const pc=await getPdfPageCount(nf.file);onFilesSelected(currentFiles.map(f=>f.id===nf.id?({...f,pageCount:pc,status:"ready"}:f));}catch{onFilesSelected(currentFiles.map(f=>f.id===nf.id?({...f,status:"error",error:"Failed"}:f));}}
    setIsProcessing(false);toast.success("PDF uploaded");
  },[currentFiles,maxFileSize,onFilesSelected]);

  return(<div className="space-y-3">
    <div onDragOver={e=>{e.preventDefault();setIsDragOver(true)}} onDragLeave={()=>setIsDragOver(false)} onDrop={e=>{e.preventDefault();setIsDragOver(false);handleFiles(e.dataTransfer.files)}}
      onClick={()=>!isProcessing&&inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragOver?(isDark?"border-blue-400 bg-blue-500/10":"border-blue-500 bg-blue-50"):(isDark?"border-slate-600 bg-slate-800/50 hover:border-slate-500":"border-slate-300 bg-slate-50 hover:border-slate-400")}`}>
      <input ref={inputRef} type="file" accept=".pdf,application/pdf" multiple onChange={e=>e.target.files&&handleFiles(e.target.files)} className="hidden"/>
      {isProcessing?<div className="flex flex-col items-center gap-3"><Loader2 className="w-10 h-10 animate-spin text-blue-500"/><p className={`text-sm ${isDark?"text-slate-300":"text-slate-600"}`}>Parsing...</p></div>:
      <div className="flex flex-col items-center gap-3"><div className={`p-4 rounded-full ${isDragOver?"bg-blue-500/20":(isDark?"bg-slate-700":"bg-slate-200")}`}><Upload className={`w-8 h-8 ${isDragOver?"text-blue-400":(isDark?"text-slate-400":"text-slate-500")}`}/></div>
        <p className={`text-base font-semibold ${isDark?"text-white":"text-slate-900"}`}>Drop PDF here or click</p><p className={`text-sm mt-1 ${isDark?"text-slate-400":"text-slate-500"}`}>Max {formatFileSize(maxFileSize)}</p></div>}
    </div>
    {currentFiles.length>0&&<div className="space-y-2">{currentFiles.map(pf=>(<div key={pf.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isDark?"bg-slate-800/50 border-slate-700":"bg-white border-slate-200"}`}>
      <FileText className={`w-5 h-5 ${pf.status==="error"?"text-red-500":"text-red-500"}`}/>
      <div className="flex-1 min-w-0"><p className={`text-sm font-medium truncate ${isDark?"text-white":"text-slate-900"}`}>{pf.name}</p><p className={`text-xs ${isDark?"text-slate-400":"text-slate-500"}`}>{formatFileSize(pf.size)}{pf.pageCount&&` | ${pf.pageCount} pages`}{pf.error&&` | ${pf.error}`}</p></div>
      {pf.status==="uploading"&&<Loader2 className="w-4 h-4 animate-spin text-blue-500"/>}
      <button onClick={()=>onFilesSelected(currentFiles.filter(f=>f.id!==pf.id))} className={`p-1 rounded-md ${isDark?"hover:bg-slate-700 text-slate-400":"hover:bg-slate-100 text-slate-500"}`}><X className="w-4 h-4"/></button>
    </div>))}</div>}
  </div>);
}
'@

# PdfViewer.tsx
Set-Content -Path "$base\components\pdfTools\PdfViewer.tsx" -Value @'
import {useState,useEffect,useRef,useCallback}from "react";import{useTheme}from"@/components/ThemeProvider";import{useTranslation}from"react-i18next";import{ChevronLeft,ChevronRight,ZoomIn,ZoomOut}from"lucide-react";import type{PdfFile}from"@/types/pdfTools";

export function PdfViewer({pdfFile}:{pdfFile:PdfFile|undefined}){
  const{resolvedTheme}=useTheme();const isDark=resolvedTheme==="dark";const{t}=useTranslation();
  const canvasRef=useRef<HTMLCanvasElement>(null);const[currentPage,setCurrentPage]=useState(1);
  const[totalPages,setTotalPages]=useState(0);const[scale,setScale]=useState(1.5);
  const[isLoading,setIsLoading]=useState(true);const[pdfDoc,setPdfDoc]=useState<unknown>(null);

  useEffect(()=>{let cancelled=false;(async()=>{
    if(!pdfFile||pdfFile.status!=="return")return;setIsLoading(true);
    try{
      const pdfjsLib=await import("pdfjs-dist");pdfjsLib.GlobalWorkerOptions.workerSrc="/pdf.worker.min.mjs";
      const ab=await pdfFile.file.arrayBuffer();const doc=await pdfjsLib.getDocument({data:ab}).promise;
      if(!cancelled){setPdfDoc(doc);setTotalPages(doc.numPages);setCurrentPage(1);}
    }catch(e){console.error(e);}finally{if(!cancelled)setIsLoading(false);}
  })();return()=>{cancelled=true};},[pdfFile]);

  const renderPage=useCallback(async()=>{if(!pdfDoc||!canvasRef.current||currentPage<=0)return;const canvas=canvasRef.current;const ctx=canvas.getContext("2d");if(!ctx)return;
    try{
      const page=await(pdfDoc as{getPage:(n:number)=>Promise<unknown>}).getPage(currentPage);
      const vp=(page as unknown as{getViewport:(o:{scale:number})=>{width:number;height:number}}).getViewport({scale});
      canvas.width=vp.width;canvas.height=vp.height;ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
      await(page as unknown as{render:(o:{canvasContext:CanvasRenderingContext2D;viewport:unknown})=>{promise:Promise<void>}}).render({canvasContext:ctx,viewport:vp,canvas}).promise;
    }catch(e){console.error(e);}
  },[pdfDoc,currentPage,scale]);
  useEffect(()=>{renderPage()},[renderPage]);

  if(!pdfFile||pdfFile.status!=="return")return(<div className={`flex items-center justify-center h-full min-h-[400px] rounded-xl border-2 border-dashed ${isDark?"border-slate-700 bg-slate-800/30 text-slate-500":"border-slate-200 bg-slate-50 text-slate-400"}`}><p className="text-sm">Upload a PDF to preview</p></div>);
  return(<div className={`rounded-xl overflow-hidden border ${isDark?"bg-slate-900 border-slate-700":"bg-white border-slate-200"}`}>
    <div className={`flex items-center justify-between px-4 py-2 border-b ${isDark?"bg-slate-800 border-slate-700":"bg-slate-50 border-slate-200"}`}>
      <div className="flex items-center gap-2"><button onClick={()=>setCurrentPage(Math.max(1,currentPage-1))} disabled={currentPage<=1} className={`p-1.5 rounded-lg disabled:opacity-30 ${isDark?"hover:bg-slate-700 text-slate-300":"hover:bg-slate-200 text-slate-600"}`}><ChevronLeft className="w-4 h-4"/></button>
        <span className={`text-sm font-medium min-w-[80px] text-center ${isDark?"text-slate-300":"text-slate-700"}`}>{currentPage}/{totalPages}</span>
        <button onClick={()=>setCurrentPage(Math.min(totalPages,currentPage+1))} disabled={currentPage>=totalPages} className={`p-1.5 rounded-lg disabled:opacity-30 ${isDark?"hover:bg-slate-700 text-slate-300":"hover:bg-slate-200 text-slate-600"}`}><ChevronRight className="w-4 h-4"/></button></div>
      <div className="flex items-center gap-1"><button onClick={()=>setScale(s=>Math.min(s+0.25,4))} className={`p-1.5 rounded-lg ${isDark?"hover:bg-slate-700 text-slate-300":"hover:bg-slate-200 text-slate-600"}`}><ZoomIn className="w-4 h-4"/></button><span className={`text-xs min-w-[45px] text-center ${isDark?"text-slate-400":"text-slate-500"}`}>{Math.round(scale*100)}%</span>
        <button onClick={()=>setScale(s=>Math.max(s-0.25,0.5))} className={`p-1.5 rounded-lg ${isDark?"hover:bg-slate-700 text-slate-300":"hover:bg-slate-200 text-slate-600"}`}><ZoomOut className="w-4 h-4"/></button></div></div>
    <div className="overflow-auto max-h-[600px] flex items-start justify-center p-4 bg-slate-100 dark:bg-slate-950">{isLoading?<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"/></div>:<canvas ref={canvasRef} className="shadow-lg rounded" style={{maxWidth:"100%",height:"auto"}}/>}</div>
  </div>);
}
'@

Write-Host "Components created"
