"use client";
import { useEffect, useRef, useState } from "react";

type Question = {id:string; topic:string; prompt:string; choices:string[]; points:number};
type Mode = "loading" | "unavailable" | "ready" | "active" | "pending" | "sending" | "error";
const pendingTitle = "Submission received";

function timeLeft(end:string, now:number) {
  return Math.max(0,Math.ceil((new Date(end).getTime()-now)/1000));
}
function displayTimer(seconds:number) {
  return Math.floor(seconds/60).toString().padStart(2,"0") + ":" + (seconds%60).toString().padStart(2,"0");
}

export default function Home() {
  const [mode,setMode] = useState<Mode>("loading");
  const [name,setName] = useState("");
  const [phone,setPhone] = useState("");
  const [agreed,setAgreed] = useState(false);
  const [questions,setQuestions] = useState<Question[]>([]);
  const [answers,setAnswers] = useState<Record<string,number>>({});
  const [endsAt,setEndsAt] = useState("");
  const [now,setNow] = useState(Date.now());
  const [error,setError] = useState("");
  const [current,setCurrent] = useState(0);
  const armed = useRef(false);
  const answersRef = useRef<Record<string,number>>({});
  const modeRef = useRef<Mode>("loading");

  function transition(next:Mode) { modeRef.current=next; setMode(next); }

  async function load() {
    try {
      const res=await fetch("/api/state",{cache:"no-store"});
      const data=await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load the test.");
      if(data.state==="active") {
        setQuestions(data.questions);
        setEndsAt(data.endsAt);
        transition("active");
      } else transition(data.state==="ready" ? "ready" : data.state==="pending" ? "pending" : "unavailable");
    } catch(e) { setError(e instanceof Error?e.message:"Connection error.");transition("error"); }
  }
  useEffect(()=>{void load();},[]);
  useEffect(()=>{
    if(mode!=="active") return;
    armed.current=true;
    const violate=()=>{
      if(!armed.current || modeRef.current!=="active") return;
      armed.current=false;
      transition("pending");
      try {
        const ok=navigator.sendBeacon?.("/api/violation",new Blob(["{}"],{type:"application/json"}));
        if(!ok) void fetch("/api/violation",{method:"POST",keepalive:true,headers:{"Content-Type":"application/json"},body:"{}"});
      } catch {void fetch("/api/violation",{method:"POST",keepalive:true}).catch(()=>{});}
    };
    const hidden=()=>{if(document.visibilityState==="hidden") violate();};
    document.addEventListener("visibilitychange",hidden);
    window.addEventListener("blur",violate);
    window.addEventListener("pagehide",violate);
    return ()=>{
      document.removeEventListener("visibilitychange",hidden);
      window.removeEventListener("blur",violate);
      window.removeEventListener("pagehide",violate);
      armed.current=false;
    };
  },[mode]);

  useEffect(()=>{
    if(mode!=="active" || !endsAt) return;
    const timer=setInterval(()=>setNow(Date.now()),1000);
    return ()=>clearInterval(timer);
  },[mode,endsAt]);

  async function start(e:React.FormEvent) {
    e.preventDefault(); setError("");
    if(!agreed) {setError("You must accept the test rules before starting.");return;}
    transition("sending");
    try {
      const res=await fetch("/api/start",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({name,phone,agreed})
      });
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Could not register.");
      await load();
    } catch(e) {
      setError(e instanceof Error?e.message:"Could not register.");
      transition("ready");
    }
  }

  async function submit() {
    if(modeRef.current!=="active") return;
    armed.current=false;
    transition("sending");
    setError("");
    try {
      const res=await fetch("/api/submit",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({answers:answersRef.current})
      });
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Submission failed.");
      transition("pending");
    } catch(e) {
      setError(e instanceof Error?e.message:"Submission failed.");
      transition("active");
    }
  }
  function answer(id:string,value:number) {
    const updated={...answersRef.current,[id]:value};
    answersRef.current=updated;
    setAnswers(updated);
  }

  const seconds=timeLeft(endsAt,now);
  useEffect(()=>{
    if(mode==="active" && endsAt && seconds<=0) void submit();
  },[seconds,mode,endsAt]);

  const q=questions[current];
  const answered=Object.keys(answers).length;
  return <main className="shell">
    <header className="topbar">
      <a href="/" className="wordmark"><span className="brandmark">D<span className="accent">/</span>S</span><span>DATAVERSE<span className="muted"> / RECRUITMENT</span></span></a>
      <span className="topright"><span className="liveDot"/> FOUNDING MEMBERS · 2026</span>
    </header>
    <div className="content">
      {mode==="loading" && <section className="panel center"><div className="spinner"/><p>Loading assessment...</p></section>}
      {mode==="error" && <section className="panel center"><h2>Connection unavailable</h2><p>{error}</p><button onClick={()=>location.reload()}>Retry</button></section>}
      {mode==="unavailable" && <section className="panel hero"><div className="eyebrow">RECRUITMENT / COMING SOON</div><h1>Think in <em>data.</em><br/>Build what&apos;s next.</h1><p>Recruitment is not open yet. The founding-team assessment will become available when organizers announce the official test window.</p><div className="pill">CHECK BACK FOR THE ANNOUNCEMENT</div></section>}
      {mode==="ready" && <section className="heroGrid">
        <div className="hero">
          <div className="eyebrow"><span className="eyeline"/> THE FOUNDING FIVE · OFFICIAL ENTRY</div>
          <h1>Think in <em>data.</em><br/>Lead the <em>future.</em></h1>
          <p>Python fundamentals. Data analytics. Sharp logic. One chance to earn a place in the founding team.</p>
          <div className="metrics"><div><strong>05</strong><small>FOUNDING POSITIONS</small></div><div><strong>35<span>m</span></strong><small>TIME LIMIT</small></div><div><strong>01</strong><small>ATTEMPT ONLY</small></div></div>
          <div className="notice"><b>STRICT EXAM MODE</b><p>Leaving this tab, switching applications, minimizing the browser, or losing window focus triggers automatic disqualification and a score of zero. Normal phone interruptions may also trigger this. Use a quiet device with a stable connection.</p></div>
        </div>
        <form className="panel register" onSubmit={start}>
          <div className="step">01 / CANDIDATE REGISTRATION</div>
          <h2>Enter the assessment.</h2>
          <p>Your details and score will only be visible to authorized organizers.</p>
          <label>FULL NAME<input required minLength={2} maxLength={80} autoComplete="name" placeholder="Your full name" value={name} onChange={e=>setName(e.target.value)}/></label>
          <label>PHONE NUMBER<input required type="tel" autoComplete="tel" placeholder="10-digit number" value={phone} onChange={e=>setPhone(e.target.value)}/></label>
          <label className="checkline"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/><span>I understand the 35-minute limit, one-attempt policy, strict focus monitoring, and that my contact details will be used for recruitment.</span></label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="primary">BEGIN ASSESSMENT <span>↗</span></button>
          <p className="micro">Once you begin, keep this page open. Do not switch windows.</p>
        </form>
      </section>}
      {mode==="active" && q && <section className="exam">
        <div className="examHead">
          <div><div className="eyebrow">LIVE ASSESSMENT / STRICT MODE</div><h2>Founding Five Challenge</h2></div>
          <div className={"clock "+(seconds<300?"danger":"")}>◷ {displayTimer(seconds)}</div>
        </div>
        <div className="progressRow"><span>QUESTION {current+1} OF {questions.length}</span><span>{answered} ANSWERED</span></div>
        <div className="progress"><div style={{width:((current+1)/questions.length*100)+"%"}}/></div>
        <article className="questionCard">
          <div className="tags"><span>{q.topic.toUpperCase()}</span><span>{q.points} POINTS</span></div>
          <h3>{q.prompt}</h3>
          <div className="choices">{q.choices.map((c,i)=><button key={i} type="button" className={"choice "+(answers[q.id]===i?"selected":"")} onClick={()=>answer(q.id,i)}><span className="choiceLetter">{String.fromCharCode(65+i)}</span><span>{c}</span><span className="choiceCircle">{answers[q.id]===i?"●":"○"}</span></button>)}</div>
        </article>
        <div className="examFoot"><button className="secondary" disabled={current===0} onClick={()=>setCurrent(current-1)}>← PREVIOUS</button><div className="navDots">{questions.map((item,i)=><button key={item.id} title={"Question "+(i+1)} aria-label={"Question "+(i+1)} className={(i===current?"on ":"")+(answers[item.id]!==undefined?"done":"")} onClick={()=>setCurrent(i)}/>)}</div>{current<questions.length-1?<button className="primary small" onClick={()=>setCurrent(current+1)}>NEXT →</button>:<button className="primary small" onClick={()=>void submit()}>SUBMIT TEST →</button>}</div>
        <div className="footnote">Do not switch tabs or apps. Detection immediately invalidates this attempt.</div>
        {error && <p className="error">{error}</p>}
      </section>}
      {mode==="sending" && <section className="panel center"><div className="spinner"/><h2>Processing...</h2><p>Please keep this page open.</p></section>}
      {mode==="pending" && <section className="panel done center"><div className="doneIcon">✓</div><div className="eyebrow">FOUNDING FIVE · RECRUITMENT</div><h1>{pendingTitle}<span className="accent">.</span></h1><p>Please wait for the official results announcement by the club organizers.</p><div className="pill">RESULTS ARE PRIVATE UNTIL ANNOUNCED</div></section>}
    </div>
    <footer className="footer"><span>© 2026 DATAVERSE · FOUNDING TEAM SELECTION</span><a href="/admin">ORGANIZER ACCESS ↗</a></footer>
  </main>;
}
