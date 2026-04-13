"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../lib/supabase"

export default function Home() {

const [user,setUser] = useState(null)
const [text,setText] = useState("")
const [commitments,setCommitments] = useState([])
const [history,setHistory] = useState([])
const [progress,setProgress] = useState(0)
const [streak,setStreak] = useState(0)
const [showOnboarding,setShowOnboarding] = useState(false)
const [focusArea,setFocusArea] = useState("")
const [onboardingStep,setOnboardingStep] = useState(1)
const [interactionMode,setInteractionMode] = useState("")
const [completed, setCompleted] = useState(null)
const [answer, setAnswer] = useState("")
const [showAll, setShowAll] = useState(false)
const [whatsappInput, setWhatsappInput] = useState("")
const [showWhatsappInput, setShowWhatsappInput] = useState(false)
const [whatsappLinked, setWhatsappLinked] = useState(false)
const [showSettings, setShowSettings] = useState(false)
const router = useRouter()
const FORCE_ONBOARDING = false
const handleSubmit = async () => {
  // 👉 NIEUW (validatie)
  if (!answer) {
    alert("Please add a reflection")
    return
  }

  // 👉 bestaand
  console.log("Saving reflection...", completed, answer)

  const { data, error } = await supabase
    .from("reflections")
    .insert([
      {
        user_id: user.id,
        completed: completed,
        answer: answer
      }
    ])

  if (error) {
    console.error("ERROR:", error)
    alert("Error saving")
  } else {
    console.log("Saved:", data)
    alert("Saved ✅")

    // 👉 NIEUW (reset)
    setAnswer("")
    setCompleted(null)
  }
}


// USER OPHALEN
useEffect(() => {
  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const currentUser = session?.user ?? null
    setUser(currentUser)
    if (!currentUser) router.replace("/login")
  }

  init()

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    const currentUser = session?.user ?? null
    setUser(currentUser)
    if (!currentUser) router.replace("/login")
  })

  return () => {
    listener.subscription.unsubscribe()
  }
}, [])


// DATA LADEN

useEffect(()=>{

  if(!user) return

  const init = async () => {
    await checkFirstUse()
    await loadCommitments()
    await loadHistory()
  }

  init()

},[user])



async function loadCommitments(){

const today = new Date().toISOString().split("T")[0]

const { data } = await supabase
.from("commitments")
.select("*")
.eq("user_id",user.id)
.eq("date",today)
.order("created_at",{ascending:false})

if(data){
setCommitments(data)
calculateProgress(data)
}

}

async function checkFirstUse(){

const { data } = await supabase
.from("commitments")
.select("id")
.eq("user_id", user.id)
.limit(1)

if(FORCE_ONBOARDING || !data || data.length === 0){
setShowOnboarding(true)
}

}

async function loadHistory(){

const { data } = await supabase
.from("daily_results")
.select("date,score")
.eq("user_id",user.id)
.order("date",{ascending:false})

if (!data) return
console.log(data.map(d => d.date))

if(!data) return

// duplicates verwijderen
const uniqueDays = Object.values(
  data.reduce((acc, item) => {
const day = item.date.split("T")[0]

acc[day] = {
  ...item,
  date: day // 🔥 overschrijft timestamp
}
    return acc
  }, {})
)

const sortedDays = uniqueDays.sort((a, b) => 
  new Date(b.date) - new Date(a.date)
)

setHistory(sortedDays.slice(0,7))
calculateStreak(sortedDays)

}

function calculateProgress(list){

if(list.length === 0){
setProgress(0)
saveDailyScore(0)
return
}

const done = list.filter(c => c.done).length
const total = list.length

const pct = Math.round((done/total)*100)

setProgress(pct)

saveDailyScore(pct)

}

function calculateStreak(data){

if(!data || data.length === 0){
setStreak(0)
return
}

let count = 0

for(let i=0;i<data.length;i++){

// als vandaag 0% is → overslaan
if(i === 0 && Number(data[i].score) === 0){
continue
}

if(Number(data[i].score) > 0){
count++
}else{
break
}


}

setStreak(count)

}

async function saveDailyScore(score){

if(!user) return

const today = new Date().toISOString().split("T")[0]

await supabase
.from("daily_results")
.upsert({
user_id:user.id,
date:today,
score:score
})

}



async function addCommitment(){

if(!text || !user) return

const today = new Date().toISOString().split("T")[0]

await supabase
.from("commitments")
.insert({
text:text,
user_id:user.id,
date:today,
done:false
})

setText("")
loadCommitments()

}



async function toggleDone(id,current){

await supabase
.from("commitments")
.update({done:!current})
.eq("id",id)

loadCommitments()

}



async function linkWhatsapp(number) {
  if (!number || !user) return false

  const formatted = number.startsWith("whatsapp:") ? number : `whatsapp:${number}`

  const { error } = await supabase
    .from("users")
    .upsert(
      { whatsapp_number: formatted, auth_user_id: user.id },
      { onConflict: "whatsapp_number" }
    )

  if (error) {
    alert("Fout bij koppelen: " + error.message)
    return false
  }

  setWhatsappLinked(true)
  return true
}

async function logout(){
await supabase.auth.signOut()
location.reload()
}

if(showOnboarding){

return(

<div style={{
minHeight:"100vh",
display:"flex",
alignItems:"center",
justifyContent:"center",
background:"#0f0f0f"
}}>

<div style={{
width:"100%",
maxWidth:420,
background:"#1a1a1a",
padding:40,
borderRadius:12
}}>

<p style={{
color:"#555",
fontSize:12,
letterSpacing:2,
textTransform:"uppercase",
marginBottom:32
}}>
Stap {onboardingStep} van 2
</p>

{onboardingStep === 1 && (

<>

<h2 style={{marginBottom:8, fontSize:22}}>
Waar ga jij vandaag voor?
</h2>

<p style={{color:"#888", fontSize:14, marginBottom:24}}>
Eén commitment. Maak het concreet.
</p>

<input
autoFocus
value={text}
onChange={(e)=>setText(e.target.value)}
onKeyDown={(e)=> e.key === "Enter" && text && (addCommitment().then(()=> setOnboardingStep(2)))}
placeholder="bijv. 30 minuten sporten"
style={{
width:"100%",
padding:"14px",
marginBottom:16,
borderRadius:8,
border:"1px solid #333",
background:"#111",
color:"#fff",
fontSize:15
}}
/>

<button
onClick={async()=>{
if(!text) return
await addCommitment()
setOnboardingStep(2)
}}
style={{
width:"100%",
padding:"14px",
background:"#22c55e",
border:"none",
borderRadius:8,
fontWeight:"bold",
cursor:"pointer",
fontSize:15,
color:"#000"
}}
>
Dit is mijn commitment →
</button>

</>

)}

{onboardingStep === 2 && (

<>

<h2 style={{marginBottom:8, fontSize:22}}>
Blijf op koers via WhatsApp
</h2>

<p style={{color:"#888", fontSize:14, marginBottom:24}}>
AXIS stuurt je dagelijks een check-in.<br/>
Geen app nodig — gewoon reageren.
</p>

<input
autoFocus
value={whatsappInput}
onChange={(e)=>setWhatsappInput(e.target.value)}
placeholder="+31612345678"
style={{
width:"100%",
padding:"14px",
marginBottom:16,
borderRadius:8,
border:"1px solid #333",
background:"#111",
color:"#fff",
fontSize:15
}}
/>

<button
onClick={async()=>{
if(!whatsappInput) return
const ok = await linkWhatsapp(whatsappInput)
if(ok){
setInteractionMode("whatsapp")
setShowOnboarding(false)
}
}}
style={{
width:"100%",
padding:"14px",
background:"#22c55e",
border:"none",
borderRadius:8,
fontWeight:"bold",
cursor:"pointer",
fontSize:15,
color:"#000",
marginBottom:10
}}
>
Koppel WhatsApp (aanbevolen)
</button>

<button
onClick={()=>{
setInteractionMode("app")
setShowOnboarding(false)
}}
style={{
width:"100%",
padding:"12px",
background:"transparent",
border:"none",
color:"#555",
cursor:"pointer",
fontSize:13
}}
>
Sla over, ik gebruik de app
</button>

</>

)}

</div>

</div>

)

}

const done = commitments.filter(c => c.done).length
const total = commitments.length
const circumference = 2 * Math.PI * 36

return(

<div style={{
  maxWidth: 420,
  margin: "auto",
  paddingBottom: 100,
  fontFamily: "sans-serif",
  background: "#0f0f0f",
  minHeight: "100vh",
  color: "#fff"
}}>

  {/* HEADER */}
  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 20px 12px"
  }}>
    <div>
      <img src="/logo.png" alt="Axis logo" style={{ width: 100, height: 38 }} />
      <p style={{ color: "#555", fontSize: 10, letterSpacing: 1.5, marginTop: 4, textTransform: "uppercase" }}>
        Commit. Execute. Reflect. Recover.
      </p>
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {streak > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ color: "#22c55e", fontSize: 12 }}>{streak} {streak === 1 ? "dag" : "dagen"}</span>
        </div>
      )}

      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 20, padding: "4px 8px" }}
        >
          ···
        </button>

        {showSettings && (
          <div style={{
            position: "absolute", right: 0, top: 32,
            background: "#1a1a1a", border: "1px solid #333",
            borderRadius: 10, padding: "8px 0", minWidth: 180, zIndex: 100
          }}>
            <div style={{ padding: "6px 16px 6px", color: "#555", fontSize: 11 }}>{user?.email}</div>
            <hr style={{ border: "none", borderTop: "1px solid #2a2a2a", margin: "4px 0" }} />
            <button onClick={async () => {
              setShowSettings(false)
              const pw = prompt("Nieuw wachtwoord (min. 6 tekens):")
              if (!pw || pw.length < 6) return
              const { error } = await supabase.auth.updateUser({ password: pw })
              if (error) alert("Fout: " + error.message)
              else alert("Wachtwoord opgeslagen!")
            }} style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", color: "#ccc", textAlign: "left", cursor: "pointer", fontSize: 14 }}>
              Wachtwoord instellen
            </button>
            <button onClick={async () => {
              setShowSettings(false)
              const number = prompt("Jouw WhatsApp nummer (+31...):")
              if (!number) return
              const ok = await linkWhatsapp(number)
              if (ok) alert("WhatsApp gekoppeld!")
            }} style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", color: "#ccc", textAlign: "left", cursor: "pointer", fontSize: 14 }}>
              Koppel WhatsApp
            </button>
            <hr style={{ border: "none", borderTop: "1px solid #2a2a2a", margin: "4px 0" }} />
            <button onClick={logout} style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", color: "#ef4444", textAlign: "left", cursor: "pointer", fontSize: 14 }}>
              Uitloggen
            </button>
          </div>
        )}
      </div>
    </div>
  </div>

  <div style={{ padding: "0 20px" }}>

    {/* VOORTGANG */}
    <div style={{ marginTop: 24, marginBottom: 32 }}>
      <p style={{ fontSize: 10, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 16 }}>Vandaag</p>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>

        <svg width={88} height={88} style={{ flexShrink: 0 }}>
          <circle cx={44} cy={44} r={36} fill="none" stroke="#1e1e1e" strokeWidth={6} />
          <circle
            cx={44} cy={44} r={36} fill="none"
            stroke="#22c55e" strokeWidth={6}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * progress / 100)}
            strokeLinecap="round"
            transform="rotate(-90 44 44)"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
          <text x={44} y={44} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={14} fontWeight="bold">
            {progress}%
          </text>
        </svg>

        <div>
          <p style={{ fontSize: 28, fontWeight: "bold", margin: 0 }}>
            {done} <span style={{ color: "#444", fontSize: 18 }}>/ {total}</span>
          </p>
          <p style={{ color: "#555", fontSize: 13, marginTop: 4 }}>
            {progress === 100 ? "Perfecte dag 🎯" : progress > 0 ? "Bezig..." : "Nog niets afgevinkt"}
          </p>
        </div>
      </div>
    </div>

    {/* COMMITMENTS */}
    <div style={{ marginBottom: 32 }}>
      <p style={{ fontSize: 10, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 16 }}>Commitments</p>

      {commitments.length === 0 && (
        <p style={{ color: "#444", fontSize: 14 }}>Nog geen commitments voor vandaag.</p>
      )}

      {commitments.slice(0, showAll ? commitments.length : 5).map(c => (
        <div
          key={c.id}
          onClick={() => toggleDone(c.id, c.done)}
          style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 0", borderBottom: "1px solid #1a1a1a", cursor: "pointer"
          }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
            border: c.done ? "none" : "2px solid #333",
            background: c.done ? "#22c55e" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {c.done && <span style={{ color: "#000", fontSize: 13, fontWeight: "bold" }}>✓</span>}
          </div>
          <span style={{
            fontSize: 15, color: c.done ? "#555" : "#fff",
            textDecoration: c.done ? "line-through" : "none"
          }}>
            {c.text}
          </span>
        </div>
      ))}

      {commitments.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{ background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", marginTop: 8, padding: 0 }}
        >
          {showAll ? "Minder tonen" : `+${commitments.length - 5} meer`}
        </button>
      )}
    </div>

    {/* REFLECTIE */}
    <div style={{ marginBottom: 32 }}>
      <p style={{ fontSize: 10, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 16 }}>Reflectie</p>

      <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 20 }}>
        <p style={{ fontSize: 15, marginBottom: 16, color: "#ccc" }}>
          Heb je je commitments gehaald?
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setCompleted(true)}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer",
              background: completed === true ? "#166534" : "#222",
              color: completed === true ? "#22c55e" : "#666",
              fontWeight: completed === true ? "bold" : "normal",
              fontSize: 14
            }}
          >
            Ja
          </button>
          <button
            onClick={() => setCompleted(false)}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer",
              background: completed === false ? "#2a1a1a" : "#222",
              color: completed === false ? "#ef4444" : "#666",
              fontWeight: completed === false ? "bold" : "normal",
              fontSize: 14
            }}
          >
            Nee
          </button>
        </div>

        {completed !== null && (
          <div style={{ marginTop: 16 }}>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>
              {completed ? "Wat hielp je om consistent te blijven?" : "Wat stond je in de weg?"}
            </p>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Schrijf je reflectie..."
              rows={3}
              style={{
                width: "100%", padding: 12, borderRadius: 8,
                background: "#111", color: "#fff", border: "1px solid #333",
                fontSize: 14, resize: "none", boxSizing: "border-box"
              }}
            />
            <button
              onClick={handleSubmit}
              style={{
                marginTop: 10, background: "#22c55e", color: "#000",
                padding: "10px 20px", borderRadius: 8, border: "none",
                fontWeight: "bold", cursor: "pointer", fontSize: 14
              }}
            >
              Opslaan
            </button>
          </div>
        )}
      </div>
    </div>

    {/* WEEKGRID */}
    <div style={{ marginBottom: 32 }}>
      <p style={{ fontSize: 10, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 16 }}>Deze week</p>

      {(() => {
        const dagNamen = ["ma", "di", "wo", "do", "vr", "za", "zo"]
        const today = new Date()
        const dayOfWeek = today.getDay()
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

        const weekDagen = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today)
          d.setHours(0, 0, 0, 0)
          d.setDate(today.getDate() + mondayOffset + i)
          return d.toISOString().split("T")[0]
        })

        const scoreMap = {}
        history.forEach(d => { scoreMap[d.date] = Number(d.score) })

        const actiefDagen = weekDagen.filter(d => {
          const score = scoreMap[d]
          return score !== undefined && score > 0
        }).length

        return (
          <>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
              {weekDagen.map((datum, i) => {
                const score = scoreMap[datum]
                const heeftData = score !== undefined
                const isToekomst = datum > today.toISOString().split("T")[0]

                let bg = "#1a1a1a"
                let icon = ""
                let textColor = "#333"

                if (!isToekomst && heeftData) {
                  if (score >= 80)      { bg = "#14532d"; icon = "✓";         textColor = "#22c55e" }
                  else if (score >= 40) { bg = "#431407"; icon = `${score}%`; textColor = "#f97316" }
                  else                  { bg = "#450a0a"; icon = "×";         textColor = "#ef4444" }
                }

                return (
                  <div key={datum} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: icon.length > 1 ? 9 : 14,
                      color: textColor,
                      fontWeight: "bold"
                    }}>
                      {icon}
                    </div>
                    <span style={{ fontSize: 10, color: "#444" }}>{dagNamen[i]}</span>
                  </div>
                )
              })}
            </div>
            <p style={{ color: "#444", fontSize: 12, marginTop: 14 }}>
              {actiefDagen} van 7 dagen actief deze week
            </p>
          </>
        )
      })()}
    </div>

  </div>

  {/* FLOATING INPUT */}
  <div style={{
    position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
    width: "100%", maxWidth: 420,
    padding: "12px 16px", background: "#0f0f0f",
    borderTop: "1px solid #1a1a1a",
    display: "flex", gap: 10, alignItems: "center"
  }}>
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && text && addCommitment()}
      placeholder="Voeg een commitment toe..."
      style={{
        flex: 1, padding: "12px 16px", borderRadius: 24,
        border: "1px solid #2a2a2a", background: "#1a1a1a",
        color: "#fff", fontSize: 14, outline: "none"
      }}
    />
    <button
      onClick={addCommitment}
      style={{
        width: 44, height: 44, borderRadius: "50%", border: "none",
        background: text ? "#22c55e" : "#1e1e1e", cursor: "pointer",
        fontSize: 22, color: text ? "#000" : "#333",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "background 0.2s"
      }}
    >
      +
    </button>
  </div>

</div>

)

}