import React, { useState, useEffect } from "react";

const DEFAULT_MASTER = {
  "胸": ["ダンベルベンチプレス", "ダンベルフライ", "インクラインベンチプレス", "インクラインフライ", "ダンベルプルオーバー"],
  "肩": ["ダンベルショルダープレス", "ダンベルサイドレイズ", "ダンベルフロントレイズ", "ダンベルリアレイズ", "アーノルドプレス"],
  "背中": ["ダンベルベントオーバーロウ", "ダンベルワンハンドロウ", "ダンベルデッドリフト", "ダンベルシュラッグ"],
  "二頭筋": ["ダンベルカール", "ハンマーカール", "インクラインカール", "コンセントレーションカール"],
  "三頭筋": ["ダンベルトライセプスエクステンション", "キックバック", "オーバーヘッドエクステンション"],
  "脚": ["ダンベルスクワット", "ダンベルランジ", "ダンベルルーマニアンデッドリフト", "ダンベルステップアップ", "カーフレイズ", "ブルガリアンスクワット"],
  "体幹": ["プランク", "サイドプランク", "クランチ", "レッグレイズ"],
};

const ACCENT = "#FF8C00";
const GOLD = "#FFD700";
const MASTER_KEY = "master:exercises";
const prKey = (ex) => `pr:${ex.replace(/\s/g, "_")}`;
const todayStr = () => new Date().toISOString().split("T")[0];
const dayExercisesKey = (date) => `exercises:${date}`;
const setsKey = (date, ex) => `sets:${date}:${ex.replace(/\s/g, "_")}`;



// ── SetRow ──────────────────────────────────────────────
function SetRow({ set, onChange, onRemove, isNewPR }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
      <input type="number" placeholder="kg" value={set.weight}
        onChange={e => onChange({ ...set, weight: e.target.value })}
        style={{ ...inputStyle, border: isNewPR ? `1px solid ${GOLD}` : "1px solid #2a2a45" }} />
      <span style={{ color: "#666", fontSize: 13 }}>kg ×</span>
      <input type="number" placeholder="回" value={set.reps}
        onChange={e => onChange({ ...set, reps: e.target.value })} style={inputStyle} />
      <span style={{ color: "#666", fontSize: 13 }}>回</span>
      {isNewPR && <span style={{ fontSize: 14 }}>🏆</span>}
      <button onClick={onRemove} style={removeBtn}>✕</button>
    </div>
  );
}

// ── ExerciseCard ─────────────────────────────────────────
function ExerciseCard({ exercise, date, onRemove, master }) {
  const [sets, setSets] = useState([]);
  const [pr, setPr] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [showingNewPR, setShowingNewPR] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [setsRes, prRes] = await Promise.allSettled([
          window.storage.get(setsKey(date, exercise)),
          window.storage.get(prKey(exercise)),
        ]);
        setSets(setsRes.status === "fulfilled" && setsRes.value ? JSON.parse(setsRes.value.value) : []);
        setPr(prRes.status === "fulfilled" && prRes.value ? JSON.parse(prRes.value.value) : null);
      } catch { setSets([]); }
      setLoaded(true);
    })();
  }, [date, exercise]);

  const saveSets = async (s) => {
    try { await window.storage.set(setsKey(date, exercise), JSON.stringify(s)); } catch {}
  };

  const updatePR = async (newSets) => {
    const maxWeight = Math.max(0, ...newSets.map(s => parseFloat(s.weight) || 0));
    const totalVol = newSets.reduce((acc, s) => acc + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0);
    if (maxWeight === 0) return;
    const isWeightPR = maxWeight > (pr?.maxWeight || 0);
    const isVolumePR = totalVol > (pr?.maxVolume || 0);
    const newPR = {
      maxWeight: Math.max(maxWeight, pr?.maxWeight || 0),
      maxVolume: Math.max(totalVol, pr?.maxVolume || 0),
      date,
    };
    if (isWeightPR || isVolumePR) {
      setShowingNewPR(true);
      setTimeout(() => setShowingNewPR(false), 3000);
    }
    setPr(newPR);
    try { await window.storage.set(prKey(exercise), JSON.stringify(newPR)); } catch {}
  };

  const addSet = () => { const s = [...sets, { weight: "", reps: "" }]; setSets(s); saveSets(s); };
  const updateSet = (i, v) => { const s = sets.map((x, j) => j === i ? v : x); setSets(s); saveSets(s); updatePR(s); };
  const removeSet = (i) => { const s = sets.filter((_, j) => j !== i); setSets(s); saveSets(s); };

  const vol = sets.reduce((acc, s) => acc + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0);
  const cat = Object.entries(master).find(([, exs]) => exs.includes(exercise))?.[0] || "";
  const prWeight = pr?.maxWeight || 0;

  if (!loaded) return null;

  return (
    <>
      <div style={{
        background: "#141414",
        border: showingNewPR ? `1px solid ${GOLD}` : "1px solid #2a2a45",
        borderRadius: 16, padding: "14px 16px", marginBottom: 12,
        transition: "border-color 0.4s, box-shadow 0.4s",
        boxShadow: showingNewPR ? `0 0 20px ${GOLD}44` : "none",
      }}>
        {showingNewPR && (
          <div style={{
            background: `linear-gradient(90deg, ${GOLD}33, ${GOLD}11)`,
            border: `1px solid ${GOLD}55`, borderRadius: 8,
            padding: "6px 12px", marginBottom: 10,
            fontSize: 13, color: GOLD, fontWeight: 700,
          }}>🏆 新記録達成！おめでとう！</div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#f0f0f0" }}>{exercise}</div>
            </div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{cat}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {vol > 0 && (
              <div style={{ fontSize: 11, color: ACCENT, fontWeight: 700, background: "#FF8C0022", padding: "2px 8px", borderRadius: 20 }}>
                {vol.toLocaleString()} kg
              </div>
            )}
            <button onClick={onRemove} style={{ ...removeBtn, fontSize: 16 }}>🗑</button>
          </div>
        </div>

        {pr && (pr.maxWeight > 0 || pr.maxVolume > 0) && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, background: `${GOLD}11`, border: `1px solid ${GOLD}33`, borderRadius: 10, padding: "6px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>🏆 最高重量</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: GOLD }}>{pr.maxWeight} kg</div>
            </div>
            <div style={{ flex: 1, background: "#ffffff08", border: "1px solid #2a2a45", borderRadius: 10, padding: "6px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>📊 最高ボリューム</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#aaa" }}>{pr.maxVolume.toLocaleString()} kg</div>
            </div>
          </div>
        )}

        {sets.map((s, i) => {
          const w = parseFloat(s.weight) || 0;
          const isNewPR = w > 0 && prWeight > 0 && w === prWeight;
          return <SetRow key={i} set={s} onChange={v => updateSet(i, v)} onRemove={() => removeSet(i)} isNewPR={isNewPR} />;
        })}

        <button onClick={addSet} style={{
          background: "#FF8C0018", color: ACCENT, border: "1px dashed #FF8C0055",
          borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer",
          fontWeight: 600, width: "100%", marginTop: 4,
        }}>＋ セット追加</button>
      </div>
    </>
  );
}

// ── ExercisePicker ───────────────────────────────────────
function ExercisePicker({ onAdd, existingExercises, master }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");

  const grouped = Object.entries(master).map(([cat, exs]) => ({
    cat, exs: exs.filter(ex => ex.includes(search) && !existingExercises.includes(ex)),
  })).filter(g => g.exs.length > 0);

  const handleAdd = (name) => { onAdd(name); setOpen(false); setSearch(""); };
  const handleCustomAdd = () => {
    if (customName.trim()) { handleAdd(customName.trim()); setCustomName(""); }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        width: "100%", padding: "14px", borderRadius: 14,
        border: "2px dashed #2a2a45", background: "transparent",
        color: "#555", fontSize: 14, cursor: "pointer", fontWeight: 600, marginBottom: 8,
      }}>＋ 種目を追加</button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 100, display: "flex", alignItems: "flex-end" }}
          onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#0a0a0a", borderRadius: "20px 20px 0 0", width: "100%",
            maxHeight: "80vh", display: "flex", flexDirection: "column",
            padding: "20px 16px", boxSizing: "border-box",
          }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#fff", marginBottom: 14 }}>種目を選ぶ</div>
            <input placeholder="種目名で検索..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box", marginBottom: 12, padding: "10px 14px", textAlign: "left", fontSize: 14 }} autoFocus />
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input placeholder="種目名を直接入力..." value={customName}
                onChange={e => setCustomName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCustomAdd()}
                style={{ ...inputStyle, flex: 1, padding: "8px 12px", textAlign: "left", fontSize: 13 }} />
              <button onClick={handleCustomAdd} style={{
                background: ACCENT, color: "#000", border: "none", borderRadius: 8,
                padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>追加</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {grouped.map(({ cat, exs }) => (
                <div key={cat} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: "#555", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>{cat}</div>
                  {exs.map(ex => (
                    <button key={ex} onClick={() => handleAdd(ex)} style={{
                      display: "block", width: "100%", textAlign: "left",
                      padding: "10px 12px", marginBottom: 4,
                      background: "#1a1a1a", border: "none", borderRadius: 10,
                      color: "#ddd", fontSize: 14, cursor: "pointer", fontWeight: 500,
                    }}>{ex}</button>
                  ))}
                </div>
              ))}
              {grouped.length === 0 && (
                <div style={{ color: "#444", fontSize: 13, textAlign: "center", padding: 20 }}>該当する種目がありません</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── MasterEditor ─────────────────────────────────────────
function MasterEditor({ master, onSave, onClose }) {
  const [draft, setDraft] = useState(JSON.parse(JSON.stringify(master)));
  const [newCat, setNewCat] = useState("");
  const [newEx, setNewEx] = useState({});
  const [expandedCat, setExpandedCat] = useState(null);

  const addCategory = () => {
    const t = newCat.trim();
    if (!t || draft[t]) return;
    setDraft({ ...draft, [t]: [] }); setNewCat(""); setExpandedCat(t);
  };
  const deleteCategory = (cat) => {
    const d = { ...draft }; delete d[cat]; setDraft(d);
    if (expandedCat === cat) setExpandedCat(null);
  };
  const addExercise = (cat) => {
    const t = (newEx[cat] || "").trim();
    if (!t || draft[cat].includes(t)) return;
    setDraft({ ...draft, [cat]: [...draft[cat], t] });
    setNewEx({ ...newEx, [cat]: "" });
  };
  const deleteExercise = (cat, ex) => {
    setDraft({ ...draft, [cat]: draft[cat].filter(e => e !== ex) });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#0a0a0a", zIndex: 200,
      overflowY: "auto", padding: "24px 16px 100px", boxSizing: "border-box",
      fontFamily: "'Hiragino Sans', 'Noto Sans JP', sans-serif",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 3, color: ACCENT, fontWeight: 700, marginBottom: 2 }}>SETTINGS</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>種目リスト管理</div>
        </div>
        <button onClick={onClose} style={{ background: "#1a1a1a", border: "1px solid #2a2a45", color: "#888", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>✕ 閉じる</button>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "#555", fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>新しいカテゴリを追加</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="例：有酸素" value={newCat} onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCategory()}
            style={{ ...inputStyle, flex: 1, padding: "10px 14px", textAlign: "left", fontSize: 14 }} />
          <button onClick={addCategory} style={{ background: ACCENT, color: "#000", border: "none", borderRadius: 8, padding: "10px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>追加</button>
        </div>
      </div>
      {Object.entries(draft).map(([cat, exs]) => (
        <div key={cat} style={{ background: "#141414", border: "1px solid #2a2a45", borderRadius: 16, marginBottom: 12, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
            <button onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "#f0f0f0" }}>{cat}</span>
              <span style={{ fontSize: 11, color: "#555" }}>{exs.length}種目</span>
              <span style={{ color: "#444", fontSize: 12 }}>{expandedCat === cat ? "▲" : "▼"}</span>
            </button>
            <button onClick={() => deleteCategory(cat)} style={{ background: "#FF8C0018", border: "1px solid #FF8C0033", color: ACCENT, borderRadius: 8, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>削除</button>
          </div>
          {expandedCat === cat && (
            <div style={{ padding: "0 16px 14px" }}>
              {exs.map(ex => (
                <div key={ex} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#0a0a0a", borderRadius: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: "#ccc" }}>{ex}</span>
                  <button onClick={() => deleteExercise(cat, ex)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 15, padding: "0 4px" }}>✕</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input placeholder="種目名を入力..." value={newEx[cat] || ""}
                  onChange={e => setNewEx({ ...newEx, [cat]: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && addExercise(cat)}
                  style={{ ...inputStyle, flex: 1, padding: "8px 12px", textAlign: "left", fontSize: 13 }} />
                <button onClick={() => addExercise(cat)} style={{ background: "#ffffff11", color: "#aaa", border: "1px solid #2a2a45", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>＋</button>
              </div>
            </div>
          )}
        </div>
      ))}
      <button onClick={() => onSave(draft)} style={{
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
        background: ACCENT, color: "#000", border: "none", borderRadius: 16,
        padding: "14px 48px", fontWeight: 800, fontSize: 15, cursor: "pointer",
        boxShadow: "0 4px 24px #FF8C0055", whiteSpace: "nowrap",
      }}>保存する</button>
    </div>
  );
}

// ── CalendarStrip ────────────────────────────────────────
function CalendarStrip({ selectedDate, onSelect }) {
  const dates = [];
  const today = new Date();
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 24, scrollbarWidth: "none" }}>
      {dates.map(d => {
        const str = d.toISOString().split("T")[0];
        const isSelected = str === selectedDate;
        const isToday = str === todayStr();
        return (
          <button key={str} onClick={() => onSelect(str)} style={{
            flex: "0 0 auto", width: 48, height: 60, borderRadius: 12,
            border: isSelected ? `2px solid ${ACCENT}` : "2px solid transparent",
            background: isSelected ? "#FF8C0022" : isToday ? "#ffffff08" : "transparent",
            color: isSelected ? ACCENT : "#888", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
          }}>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{dayNames[d.getDay()]}</span>
            <span style={{ fontSize: 18, fontWeight: 800 }}>{d.getDate()}</span>
            {isToday && <div style={{ width: 4, height: 4, borderRadius: 2, background: ACCENT }} />}
          </button>
        );
      })}
    </div>
  );
}

// ── App ──────────────────────────────────────────────────
export default function App() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [exercises, setExercises] = useState([]);
  const [master, setMaster] = useState(DEFAULT_MASTER);
  const [loaded, setLoaded] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(MASTER_KEY);
        if (r) setMaster(JSON.parse(r.value));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    setLoaded(false);
    (async () => {
      try {
        const r = await window.storage.get(dayExercisesKey(selectedDate));
        setExercises(r ? JSON.parse(r.value) : []);
      } catch { setExercises([]); }
      setLoaded(true);
    })();
  }, [selectedDate]);

  const saveExercises = async (exs) => {
    try { await window.storage.set(dayExercisesKey(selectedDate), JSON.stringify(exs)); } catch {}
  };

  const addExercise = (name) => {
    if (exercises.includes(name)) return;
    const exs = [...exercises, name]; setExercises(exs); saveExercises(exs);
  };

  const removeExercise = async (name) => {
    const exs = exercises.filter(e => e !== name);
    setExercises(exs); saveExercises(exs);
    try { await window.storage.delete(setsKey(selectedDate, name)); } catch {}
  };

  const saveMaster = async (newMaster) => {
    setMaster(newMaster);
    try { await window.storage.set(MASTER_KEY, JSON.stringify(newMaster)); } catch {}
    setShowEditor(false);
  };

  const dateLabel = (() => {
    const d = new Date(selectedDate);
    const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getMonth() + 1}/${d.getDate()}（${dayNames[d.getDay()]}）`;
  })();

  return (
    <>
      {showEditor && <MasterEditor master={master} onSave={saveMaster} onClose={() => setShowEditor(false)} />}
      <div style={{
        minHeight: "100vh", background: "#0a0a0a", color: "#f0f0f0",
        fontFamily: "'Hiragino Sans', 'Noto Sans JP', sans-serif",
        maxWidth: 480, margin: "0 auto", padding: "24px 16px 60px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: ACCENT, fontWeight: 700, marginBottom: 4 }}>LIFT NOTE</div>
            
          </div>
          <button onClick={() => setShowEditor(true)} style={{
            background: "#1a1a1a", border: "1px solid #2a2a45", color: "#888",
            borderRadius: 12, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}>⚙️ 種目管理</button>
        </div>

        <CalendarStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
        <div style={{ fontSize: 15, fontWeight: 700, color: "#aaa", marginBottom: 16 }}>{dateLabel}</div>

        {loaded ? (
          <>
            {exercises.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#333" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>💪</div>
                <div style={{ fontSize: 14 }}>種目を追加してトレーニングを記録しよう</div>
              </div>
            )}
            {exercises.map(ex => (
              <ExerciseCard key={ex} exercise={ex} date={selectedDate} onRemove={() => removeExercise(ex)} master={master} />
            ))}
            <ExercisePicker onAdd={addExercise} existingExercises={exercises} master={master} />
          </>
        ) : (
          <div style={{ textAlign: "center", padding: 40, color: "#333" }}>読み込み中...</div>
        )}
      </div>
    </>
  );
}

const inputStyle = {
  width: 64, padding: "6px 8px",
  background: "#0a0a0a", border: "1px solid #2a2a45",
  borderRadius: 8, color: "#fff", fontSize: 14,
  textAlign: "center", outline: "none",
};

const removeBtn = {
  background: "transparent", border: "none",
  color: "#444", cursor: "pointer", fontSize: 13,
  padding: "4px 6px", borderRadius: 6,
};
