"use client";
import { useEffect, useMemo, useState } from "react";
type Attempt = {id:string;name:string;phone:string;status:string;score:number;max_score:number;violation_reason:string|null;started_at:string;completed_at:string|null};
type Question = {id:string;topic:string;prompt:string;choices:string[];answer_index:number;points:number;active:boolean};
const empty={topic:"Python",prompt:"",choices:["","","",""],answer_index:0,points:5};

export default function Admin() {
  const [authed,setAuthed]=useState<boolean|null>(null);
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [attempts,setAttempts]=useState<Attempt[]>([]);
  const [questions,setQuestions]=useState<Question[]>([]);
  const [form,setForm]=useState({...empty,choices:[...empty.choices]});
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [tab,setTab]=useState<"results"|"questions">("results");
  const [sort,setSort]=useState<"high"|"low">("high");

  async function refresh(){
    const res=await fetch("/api/admin/overview",{cache:"no-store"});
    if(res.status===401){setAuthed(false);return;}
    const data=await res.json();
    if(!res.ok) throw new Error(data.error||"Failed to load data.");
    setAttempts(data.attempts??[]);setQuestions(data.questions??[]);setAuthed(true);
  }
  useEffect(()=>{void refresh().catch(e=>{setError(e.message);setAuthed(false);});},[]);
  async function login(e:React.FormEvent){
    e.preventDefault();setError("");setBusy(true);
    try{
      const res=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
      const body=await res.json();
      if(!res.ok) throw new Error(body.error||"Sign in failed.");
      setPassword("");await refresh();
    }catch(e){setError(e instanceof Error?e.message:"Sign in failed.");}
    setBusy(false);
  }
  async function add(e:React.FormEvent) {
    e.preventDefault();setError("");setBusy(true);
    try{
      const res=await fetch("/api/admin/questions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const body=await res.json();
      if(!res.ok) throw new Error(body.error||"Save failed.");
      setForm({...empty,choices:[...empty.choices]});await refresh();
    }catch(e){setError(e instanceof Error?e.message:"Save failed.");}
    setBusy(false);
  }
  async function archive(id:string) {
    if(!confirm("Archive this question? Existing active attempts will retain it.")) return;
    const res=await fetch("/api/admin/questions",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    if(!res.ok){setError("Unable to archive the question.");return;}
    await refresh();
  }
  async function logout(){await fetch("/api/admin/logout",{method:"POST"});setAuthed(false);setPassword("");}
  const rows=useMemo(()=>[...attempts].sort((a,b)=>(sort==="high"?b.score-a.score:a.score-b.score) || (new Date(a.completed_at||a.started_at).getTime()-new Date(b.completed_at||b.started_at).getTime())),[attempts,sort]);
  const ranking=useMemo(()=>[...attempts].sort((a,b)=>b.score-a.score || new Date(a.completed_at||a.started_at).getTime()-new Date(b.completed_at||b.started_at).getTime()),[attempts]);
  function exportCsv(){
    const escape=(v:unknown)=>{
      let s=String(v??"");
      if(/^[=+\-@\t\r]/.test(s)) s="'"+s;
      return '"'+s.replace(/"/g,'""')+'"';
    };
    const columns=["Rank","Name","Phone","Score","Maximum","Status","Reason","Started","Finished"];
    const data=ranking.map((r,i)=>[i+1,r.name,r.phone,r.score,r.max_score,r.status,r.violation_reason,r.started_at,r.completed_at]);
    const csv=[columns,...data].map(row=>row.map(escape).join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));
    const a=document.createElement("a");a.href=url;a.download="dataverse-private-results.csv";a.click();URL.revokeObjectURL(url);
  }
  return <main className="shell">
    <header className="topbar"><a href="/" className="wordmark"><span className="brandmark">D<span className="accent">/</span>S</span><span>DATAVERSE<span className="muted"> / CONTROL ROOM</span></span></a><span className="topright">AUTHORIZED ORGANIZERS ONLY</span></header>
    <div className="content">
    {authed===null && <section className="panel center">Checking organizer session...</section>}
    {authed===false && <form className="panel login" onSubmit={login}>
      <div className="eyebrow">PRIVATE ACCESS</div><h1>Organizer login.</h1><p>Only the configured administrator can view candidate details, manage questions and see rankings.</p>
      <label>ADMIN EMAIL<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Your admin email"/></label>
      <label>PASSWORD<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your Supabase Auth password"/></label>
      {error&&<p className="error">{error}</p>}<button className="primary" disabled={busy}>SECURE SIGN IN ↗</button>
    </form>}
    {authed===true && <section className="admin">
      <div className="adminHead"><div><div className="eyebrow">ASSESSMENT / PRIVATE DASHBOARD</div><h1>Control room<span className="accent">.</span></h1><p>Results are never shown to candidates.</p></div><button className="secondary" onClick={logout}>LOG OUT</button></div>
      <div className="stats">
        <div className="statCard"><strong>{attempts.length}</strong><small>TOTAL CANDIDATES</small></div>
        <div className="statCard"><strong>{attempts.filter(a=>a.status==="submitted").length}</strong><small>SUBMITTED</small></div>
        <div className="statCard"><strong>{attempts.filter(a=>a.status==="disqualified").length}</strong><small>FLAGGED · ZERO</small></div>
        <div className="statCard"><strong>{questions.filter(q=>q.active).length}</strong><small>ACTIVE QUESTIONS</small></div>
      </div>
      <div className="tabs"><button className={tab==="results"?"active":""} onClick={()=>setTab("results")}>RANKINGS & RESULTS</button><button className={tab==="questions"?"active":""} onClick={()=>setTab("questions")}>QUESTION BANK</button></div>
      {error&&<p className="error">{error}</p>}
      {tab==="results" && <section className="panel dataPanel">
        <div className="panelHead"><div><h2>Candidate leaderboard</h2><p>Ranked by total score; ties use earlier completion time.</p></div><div className="actions"><select aria-label="Sort order" value={sort} onChange={e=>setSort(e.target.value as "high"|"low")}><option value="high">Highest first</option><option value="low">Lowest first</option></select><button className="secondary" onClick={exportCsv}>EXPORT CSV ↓</button><button className="secondary" onClick={()=>void refresh()}>↻</button></div></div>
        <div className="tableScroll"><table className="leaderboard"><thead><tr><th>RANK</th><th>CANDIDATE</th><th>PHONE</th><th>SCORE</th><th>STATUS</th><th>FINISHED</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>#{ranking.findIndex(x=>x.id===r.id)+1}</td><td><b>{r.name}</b></td><td>{r.phone}</td><td><b>{r.score}</b><span className="muted"> / {r.max_score}</span></td><td><span title={r.violation_reason??""} className={"status "+r.status}>{r.status.replace("_"," ").toUpperCase()}</span></td><td>{r.completed_at?new Date(r.completed_at).toLocaleString():"In progress"}</td></tr>)}{rows.length===0&&<tr><td colSpan={6}>No candidate attempts yet.</td></tr>}</tbody></table></div>
        <p className="micro">Score zero from a focus switch is automatic, but review disqualifications if a device interruption may have occurred. Do not publish private phone numbers.</p>
      </section>}
      {tab==="questions" && <div className="questionAdminGrid"><form className="panel addForm" onSubmit={add}><div className="step">QUESTION BUILDER</div><h2>Add an assessment question</h2><p>Answers stay in Supabase and are never included in the public test response.</p><label>TOPIC<select value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})}><option>Python</option><option>Data Science</option><option>Data Analytics</option><option>Statistics</option><option>Logical Reasoning</option><option>SQL</option></select></label><label>QUESTION<textarea required minLength={12} rows={4} placeholder="Write a clear, challenging fundamentals question..." value={form.prompt} onChange={e=>setForm({...form,prompt:e.target.value})}/></label>{form.choices.map((c,i)=><label key={i}>OPTION {String.fromCharCode(65+i)}<input required value={c} placeholder={"Answer option "+String.fromCharCode(65+i)} onChange={e=>setForm({...form,choices:form.choices.map((v,j)=>j===i?e.target.value:v)})}/></label>)}<div className="formTwo"><label>CORRECT ANSWER<select value={form.answer_index} onChange={e=>setForm({...form,answer_index:Number(e.target.value)})}>{[0,1,2,3].map(i=><option key={i} value={i}>Option {String.fromCharCode(65+i)}</option>)}</select></label><label>POINTS<input type="number" min={1} max={20} required value={form.points} onChange={e=>setForm({...form,points:Number(e.target.value)})}/></label></div><button className="primary" disabled={busy}>SAVE QUESTION +</button></form>
        <section className="panel bank"><h2>Question bank</h2><p>At least 5 active questions are needed before registration opens. Archived questions are excluded from new attempts.</p>{questions.length===0&&<div className="empty">No questions yet. Add the first one.</div>}{questions.map((q,i)=><div className={"bankItem "+(!q.active?"archived":"")} key={q.id}><div className="bankTop"><span>#{i+1} · {q.topic.toUpperCase()} · {q.points} PTS</span>{q.active?<button className="dangerButton" onClick={()=>void archive(q.id)}>ARCHIVE</button>:<span>ARCHIVED</span>}</div><strong>{q.prompt}</strong><small>Correct option: {String.fromCharCode(65+q.answer_index)} · {q.choices[q.answer_index]}</small></div>)}</section></div>}
    </section>}
    </div>
    <footer className="footer"><span>DATAVERSE · ORGANIZER ACCESS ONLY</span><a href="/">BACK TO TEST ↗</a></footer>
  </main>;
}
