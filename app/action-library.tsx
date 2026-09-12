"use client";
import { useState } from "react";
import {Star} from "@phosphor-icons/react";
import type { ActionPreset } from "./motion-authoring";

const frequent=["action-look-behind","action-raise-hand","action-reach-return","action-sit","action-stand-chair","action-walk-stop","action-run-stop","action-walk","action-jog","action-wave","action-point","action-bow"];
const propNames:Record<string,string>={chair:"椅子",box:"箱子",phone:"手机",cup:"杯子",table:"桌子",door:"门"};
export function ActionLibrary({kind,actions,selected,covers,ratio,favorites,recent,playing,time,onPreview,onFavorite,onApply,onCancel,onPlay,onScrub,onSaveImage,onSavePose,onFit}: {
  kind:"motion"|"interaction"; actions:ActionPreset[]; selected:string|null;
  ratio:string;
  covers:Record<string,string[]>; favorites:string[]; recent:string[]; playing:boolean; time:number;
  onPreview:(action:ActionPreset)=>void|Promise<void>; onFavorite:(id:string)=>void; onApply:(newShot:boolean)=>void;
  onCancel:()=>void; onPlay:()=>void; onScrub:(time:number)=>void; onSaveImage:()=>void; onSavePose:()=>void; onFit:()=>void;
}) {
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("常用");
  const [loading,setLoading]=useState<string|null>(null);
  const current=actions.find(action=>action.id===selected);
  const ready=actions.filter(action=>action.release==="ready"&&action.kind===kind);
  const keyword=query.trim().toLocaleLowerCase();
  const matching=ready.filter(action=>`${action.name} ${action.group}`.toLocaleLowerCase().includes(keyword)&& (keyword||filter==="全部"||filter==="常用"||(filter==="收藏"?favorites.includes(action.id):filter==="最近"?recent.includes(action.id):action.group===filter)));
  const rank=(id:string)=>frequent.includes(id)?frequent.indexOf(id):frequent.length;
  const ordered=filter==="最近"?[...matching].sort((a,b)=>recent.indexOf(a.id)-recent.indexOf(b.id)):filter==="常用"?[...matching].sort((a,b)=>rank(a.id)-rank(b.id)):matching;
  return <div className="action-library">
    <header><h2>{kind==="motion"?"动态动作":"双人互动"}</h2><span>{ready.length} 个可用</span></header>
    <small>只显示已完成的预设，点击即可在舞台预览。</small>
    <input aria-label="搜索动作" placeholder="搜索动作或用途" value={query} onChange={event=>setQuery(event.target.value)}/>
    <div className="action-filters">{["常用","收藏","最近","全部",...new Set(ready.map(action=>action.group))].map(value=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{value}</button>)}</div>
    <div className="action-cards">{ordered.slice(0,filter==="常用"&&!query?12:undefined).map(action=><article key={action.id} className={selected===action.id?"selected":""}>
      <button className="action-card-main" disabled={loading!==null} onClick={async()=>{setLoading(action.id);try{await onPreview(action);}finally{setLoading(null);}}} aria-pressed={selected===action.id} aria-busy={loading===action.id}>
        <span className="action-cover" style={{aspectRatio:ratio==="16:9"?"16 / 9":"9 / 16"}}>{covers[action.id]?.map((url,i)=><img key={url} src={url} alt={i===0?`${action.name}实际动作预览`:""} loading="lazy" style={{animationDelay:`${i*.2}s`}}/>)??<span>点击查看舞台动作</span>}</span>
        <strong>{action.name}</strong><small>{action.kind==="interaction"?"2 人互动":"动态 · 1 人"} · {action.loop?"循环":"一次性"} · {Number(action.duration.toFixed(1))} 秒</small>
        {action.props.length>0&&<small>含 {action.props.map(prop=>propNames[prop]??prop).join("、")}</small>}
      </button>
      <button className="action-star" onClick={()=>onFavorite(action.id)} aria-label={`${favorites.includes(action.id)?"取消收藏":"收藏"}${action.name}`} aria-pressed={favorites.includes(action.id)}><Star size={18} weight={favorites.includes(action.id)?"fill":"regular"}/></button>
    </article>)}</div>
    {!ordered.length&&<div className="action-empty">{ready.length?"没有匹配动作，试试其他筛选。":"接触关系仍在制作和检查，完成后会显示可用互动。"}</div>}
    {loading&&<p role="status">正在准备人物动作…</p>}
    {current&&<section className="action-preview-controls" aria-label="动作预览">
      <strong>{current.name}</strong><small>仅预览，尚未修改镜头</small>
      {current.limitation&&<p role="note">{current.limitation}</p>}
      <div className="action-transport"><button onClick={onPlay}>{playing?"暂停":"播放"}</button><input type="range" aria-label="动作预览进度" min={0} max={current.duration} step={1/24} value={time} onChange={event=>onScrub(Number(event.target.value))}/><span>{time.toFixed(1)}s</span></div>
      <button className="primary" onClick={()=>onApply(false)}>当前镜头另存新版本</button><button onClick={()=>onApply(true)}>新建动作镜头</button>
      <div><button onClick={onSavePose}>保存当前姿态</button><button onClick={onSaveImage}>保存镜头图片</button><button onClick={onFit}>适配取景</button><button onClick={onCancel}>取消预览</button></div>
    </section>}
  </div>;
}
