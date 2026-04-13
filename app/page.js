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

<h1>Welcome to Axis</h1>

<p style={{marginBottom:30}}>
Commit. Execute. Reflect. Recover.
</p>

{onboardingStep === 1 && (

<>

<h3 style={{marginBottom:10}}>
Where do you want more discipline?
</h3>

<select
value={focusArea}
onChange={(e)=>setFocusArea(e.target.value)}
style={{
width:"100%",
padding:"12px",
marginBottom:20,
borderRadius:8
}}
>

<option value="">Select</option>
<option value="health">Health</option>
<option value="work">Work</option>
<option value="learning">Learning</option>
<option value="life">Life</option>

</select>

<button
onClick={()=>setOnboardingStep(2)}
style={{
width:"100%",
padding:"14px",
background:"#22c55e",
border:"none",
borderRadius:8,
fontWeight:"bold",
cursor:"pointer"
}}
>

Next

</button>

</>

)}

{onboardingStep === 2 && (

<>

<h3 style={{marginBottom:10}}>
What will you commit to today?
</h3>

<input
autoFocus
value={text}
onChange={(e)=>setText(e.target.value)}
placeholder="Example: Workout 30 min"
style={{
width:"100%",
padding:"14px",
marginBottom:20,
borderRadius:8,
border:"1px solid #444"
}}
/>

<button
onClick={async()=>{

await addCommitment()
setOnboardingStep(3)

}}
style={{
width:"100%",
padding:"14px",
background:"#22c55e",
border:"none",
borderRadius:8,
fontWeight:"bold",
cursor:"pointer"
}}
>

Start

</button>

</>

)}

{onboardingStep === 3 && (

<>

<h3 style={{marginBottom:10}}>
How should Axis interact with you?
</h3>

<button
onClick={()=>{

setInteractionMode("app")
setShowOnboarding(false)

}}
style={{
width:"100%",
padding:"14px",
marginBottom:10,
background:"#22c55e",
border:"none",
borderRadius:8,
fontWeight:"bold",
cursor:"pointer"
}}
>

Use the App

</button>

<button
style={{
width:"100%",
padding:"14px",
background:"#333",
border:"none",
borderRadius:8,
color:"#999"
}}
>

WhatsApp (coming soon)

</button>

</>

)}

</div>

</div>

)

}

return(

<div style={{
maxWidth:420,
margin:"auto",
marginTop:60,
fontFamily:"sans-serif"
}}>

<div style={{ textAlign: "center", marginBottom: 24 }}>

  <img
    src="/logo.png"
    alt="Axis logo"
    style={{
      width: 130,
      height: 50,
      marginBottom: 12
    }}
  />

  <p style={{
    color: "#888",
    fontSize: 11
    ,
    letterSpacing: 1
  }}>
    Commit. Execute. Reflect. Recover.
  </p>

</div>

<div style={{
marginBottom:20,
fontWeight:"bold"
}}>
🔥 {streak} day streak
</div>


{user && (

<div style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:20
}}>

<div>{user.email}</div>

<div style={{ display:"flex", gap:12 }}>
<button
onClick={async () => {
  const pw = prompt("Nieuw wachtwoord (min. 6 tekens):")
  if (!pw || pw.length < 6) return
  const { error } = await supabase.auth.updateUser({ password: pw })
  if (error) alert("Fout: " + error.message)
  else alert("Wachtwoord opgeslagen!")
}}
style={{
border:"none",
background:"transparent",
cursor:"pointer",
color:"#555",
fontSize:12
}}
>
Wachtwoord instellen
</button>

<button
onClick={logout}
style={{
border:"none",
background:"transparent",
cursor:"pointer",
color:"#999"
}}
>
Logout
</button>
</div>

</div>

)}

<h3 style={{ marginTop: 32 }}>Today's Progress</h3>

<div
  style={{
    marginTop: 12,
    background: "#111",
    border: "1px solid #333",
    borderRadius: 8,
    padding: 8
  }}
>
  <div
    style={{
      height: 8,
      width: progress + "%",
      background: "#22c55e",
      borderRadius: 6,
      transition: "width 0.4s ease"
    }}
  />
</div>
<p style={{ marginTop: 6, color: "#888", fontSize: 13 }}>
  {progress === 100 ? "Perfect day" : progress > 0 ? "In progress" : "No activity"}
</p>
<p style={{ marginTop: 8, color: "#aaa" }}>
  {progress + "% completed"}
</p>

<input
value={text}
onChange={(e)=>setText(e.target.value)}
placeholder="What will you commit to today?"
style={{
width:"100%",
padding:12,
borderRadius:6,
border:"1px solid #444",
marginBottom:10,
background:"#111",
color:"#fff"
}}
/>



<button
onClick={addCommitment}
style={{
width:"100%",
padding:14,
borderRadius:6,
border:"none",
fontWeight:"bold",
cursor:"pointer",
background:"#22c55e",
color:"black"
}}
> 
Add Commitment
</button>


<h3 style={{marginTop:40}}>Today's Commitments</h3>

{commitments
  .slice(0, showAll ? commitments.length : 5)
  .map(c => (
  <div key={c.id} style={{marginTop:10}}>
    <label style={{cursor:"pointer"}}>
      <input
        type="checkbox"
        checked={c.done}
        onChange={() => toggleDone(c.id, c.done)}
          style={{ accentColor: "#22c55e" }}
      />
      <span style={{marginLeft:8}}>
        {c.text}
      </span>
    </label>
  </div>
))}

{commitments.length > 5 && (
  <p style={{ color:"#666", fontSize:12, marginTop:8 }}>
    +{commitments.length - 5} more
  </p>
)}

<h3 style={{ marginTop: 32 }}>Today's Reflection</h3>

<p style={{ color:"#aaa", fontSize:14 }}>
  Did you complete your commitments today?
</p>

<div style={{ display: "flex", gap: 12, marginTop: 12 }}>
  <button
    onClick={() => setCompleted(true)}
    style={{
      background: completed === true ? "#22c55e" : "#222",
      color: "white",
      padding: "8px 16px",
      borderRadius: 6,
      border: "none"
    }}
  >
    Yes
  </button>

  <button
    onClick={() => setCompleted(false)}
    style={{
      background: completed === false ? "#ef4444" : "#222",
      color: "white",
      padding: "8px 16px",
      borderRadius: 6,
      border: "none"
    }}
  >
    No
  </button>
</div>

{/* 👉 Alleen tonen als keuze gemaakt is */}
{completed !== null && (
  <>
    <p style={{ marginTop: 16 }}>
      {completed
        ? "What helped you stay consistent?"
        : "What got in the way?"}
    </p>

    <textarea
      value={answer}
      onChange={(e) => setAnswer(e.target.value)}
      placeholder="Write your reflection..."
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 6,
        marginTop: 8,
        background: "#111",
        color: "white",
        border: "1px solid #333"
      }}
    />

    <button
      onClick={handleSubmit}
      style={{
        marginTop: 12,
        background: "#22c55e",
        color: "black",
        padding: "10px 16px",
        borderRadius: 6,
        border: "none"
      }}
    >
      Save Reflection
    </button>
  </>
)}

<h3 style={{marginTop:40}}>Discipline History</h3>

{history.map(day=>{

const today = new Date()
today.setHours(0,0,0,0)

const date = new Date(day.date)
date.setHours(0,0,0,0)

const diff = Math.floor((today-date)/(1000*60*60*24))

let label = day.date

if (diff === 0) label = "Today"
else if (diff === 1) label = "Yesterday"
else label = date.toLocaleDateString("en-US", {
  weekday: "short",
  day: "numeric"
})

return(

<div key={day.date} style={{marginTop:6}}>

<div style={{
display:"flex",
justifyContent:"space-between",
marginBottom:3
}}>

<span style={{ fontSize: 13, color: "#aaa" }}>{label}</span>
<span style={{ fontSize: 12, color: "#aaa" }}>
  {day.score}%
</span>

</div>

<div style={{
width:"100%",
height:3,
background:"#2a2a2a",
borderRadius:6,
overflow:"hidden"
}}>

<div style={{
width:day.score+"%",
height:"100%",
background:"#22c55e"
}}/>

</div>

</div>

)

})}

</div>

)

}