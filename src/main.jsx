import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Sparkles,
  Heart,
  Grid2X2,
  Gift,
  Volume2,
  VolumeX,
  ChevronRight,
  ArrowUpRight,
  X,
  Star,
  Mail,
  Check,
  Search,
  ArrowLeft,
  Download,
  Settings,
  Info,
  RotateCcw,
  Coffee,
  Diamond,
} from "lucide-react";
import { CHARACTERS, BY_ID, RARITIES } from "./data.js";
import {
  SAVE_KEY,
  COST,
  freshSave,
  validateSave,
  draw,
  affection,
  localDate,
} from "./game.js";
import Portrait from "./Portrait.jsx";
import "@fontsource-variable/noto-sans-jp";
import "@fontsource-variable/noto-serif-jp";
import "./styles.css";

let audioContext;
function chime(rare = false) {
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();
    const now = audioContext.currentTime;
    [523.25, 659.25, 783.99, ...(rare ? [1046.5, 1318.5] : [])].forEach(
      (f, i) => {
        const o = audioContext.createOscillator(),
          g = audioContext.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0, now + i * 0.09);
        g.gain.linearRampToValueAtTime(0.07, now + i * 0.09 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.75);
        o.connect(g);
        g.connect(audioContext.destination);
        o.start(now + i * 0.09);
        o.stop(now + i * 0.09 + 0.8);
      },
    );
  } catch {}
}
function App() {
  const [loadWarning] = useState(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) validateSave(JSON.parse(raw));
      return "";
    } catch {
      return "保存データを読み込めなかったため、新しく始めます。";
    }
  });
  const [save, setSave] = useState(() => {
    try {
      return validateSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
    } catch {
      return freshSave();
    }
  });
  const [page, setPage] = useState("gacha"),
    [modal, setModal] = useState(null),
    [detail, setDetail] = useState(null),
    [toast, setToast] = useState(loadWarning),
    [rarity, setRarity] = useState("ALL"),
    [query, setQuery] = useState(""),
    [onlyOwned, setOnlyOwned] = useState(false),
    [onlyFav, setOnlyFav] = useState(false),
    [sort, setSort] = useState("default"),
    [session, setSession] = useState(null),
    [stage, setStage] = useState("letter"),
    [revealed, setRevealed] = useState(0),
    [now, setNow] = useState(Date.now()),
    [resetConfirm, setResetConfirm] = useState(false),
    [storageError, setStorageError] = useState(false);
  const busy = useRef(false),
    state = useRef(save),
    gachaRef = useRef(null);
  state.current = save;
  const update = (fn) =>
    setSave((prev) => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      state.current = next;
      return next;
    });
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [save]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!session) return;
    const previous = document.activeElement,
      old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    gachaRef.current?.focus();
    return () => {
      document.body.style.overflow = old;
      previous?.focus?.();
    };
  }, [!!session]);
  useEffect(() => {
    const listener = (e) => {
      if (e.key === "Escape" && !session) {
        setModal(null);
        setDetail(null);
        setResetConfirm(false);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [session]);
  const owned = Object.keys(save.collection).length;
  function pull(count) {
    if (busy.current) return;
    if (state.current.gems < COST[count]) {
      setModal("rest");
      return;
    }
    busy.current = true;
    const result = draw(state.current, count);
    update(result.next);
    setSession(result.results);
    setStage("letter");
    setRevealed(0);
    setModal(null);
  }
  function openLetter() {
    if (stage !== "letter") return;
    setStage("opening");
    if (save.sound) chime(session.some((r) => r.character.rarity === "SSR"));
    setTimeout(
      () => {
        setStage("reveal");
        setRevealed(1);
      },
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 1400,
    );
  }
  function nextReveal() {
    if (revealed < session.length) {
      setRevealed((v) => v + 1);
      if (save.sound) chime(session[revealed].character.rarity === "SSR");
    } else setStage("summary");
  }
  function closeSession() {
    setSession(null);
    busy.current = false;
  }
  function daily() {
    if (state.current.daily === localDate()) return;
    update((s) => ({ ...s, gems: s.gems + 1500, daily: localDate() }));
    setToast("今日の贈りもの · 1,500 きらめきを受け取りました");
    if (save.sound) chime();
  }
  function rest() {
    if (Date.now() - state.current.restAt < 30000) return;
    update((s) => ({ ...s, gems: s.gems + 3000, restAt: Date.now() }));
    setToast("ひとやすみ完了！ 3,000 きらめきをチャージ");
    setModal(null);
  }
  function favorite(id) {
    update((s) => ({
      ...s,
      favorites: s.favorites.includes(id)
        ? s.favorites.filter((x) => x !== id)
        : [...s.favorites, id],
    }));
  }
  function exportSave() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(save, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "kirameki-post-save.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast("セーブデータを書き出しました");
  }
  async function importSave(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1000000) throw Error();
      const next = validateSave(JSON.parse(await file.text()));
      update(next);
      setToast("セーブデータを読み込みました");
      setModal(null);
    } catch {
      setToast(
        "このファイルは読み込めません。セーブデータを確認してください。",
      );
    }
    e.target.value = "";
  }
  const filtered = CHARACTERS.filter(
    (c) =>
      (rarity === "ALL" || c.rarity === rarity) &&
      (!onlyOwned || save.collection[c.id]) &&
      (!onlyFav || save.favorites.includes(c.id)) &&
      `${c.name}${c.job}${c.trait}`.includes(query),
  ).sort((a, b) =>
    sort === "affection"
      ? (save.collection[b.id]?.count || 0) -
        (save.collection[a.id]?.count || 0)
      : sort === "name"
        ? a.name.localeCompare(b.name, "ja")
        : a.index - b.index,
  );
  const restSeconds = Math.max(
    0,
    Math.ceil((save.restAt + 30000 - now) / 1000),
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("gacha");
          }}
        >
          <span className="brand-icon">
            <Mail size={25} />
            <Sparkles size={15} />
          </span>
          <span>
            きらめきポスト<small>KIRAMEKI POST</small>
          </span>
        </a>
        <div className="side-caption">あなたに届く、特別な出会い。</div>
        <nav aria-label="メインメニュー">
          <button
            className={page === "gacha" ? "active" : ""}
            onClick={() => setPage("gacha")}
          >
            <Sparkles size={19} />
            ガチャ
            <ChevronRight size={15} />
          </button>
          <button
            className={page === "collection" ? "active" : ""}
            onClick={() => setPage("collection")}
          >
            <Grid2X2 size={19} />
            コレクション<span className="nav-count">{owned}</span>
          </button>
          <button onClick={() => setModal("gift")}>
            <Gift size={19} />
            贈りもの
            {save.daily !== localDate() && <i className="notification-dot" />}
          </button>
        </nav>
        <div className="side-note">
          <span className="note-spark">✧</span>
          <p>
            ひとつの出会いが、
            <br />
            今日をちょっと特別に。
          </p>
          <span className="tiny">A LITTLE SPARKLE, EVERY DAY.</span>
        </div>
        <div className="sidebar-bottom">
          <button onClick={() => update((s) => ({ ...s, sound: !s.sound }))}>
            {save.sound ? <Volume2 size={17} /> : <VolumeX size={17} />}サウンド{" "}
            {save.sound ? "ON" : "OFF"}
          </button>
          <button onClick={() => setModal("settings")}>
            <Settings size={17} />
            設定・セーブ
          </button>
          <span>
            Made with a little magic. <Heart size={10} />
          </span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            HOME <ChevronRight size={12} />{" "}
            <span>{page === "gacha" ? "ガチャ" : "コレクション"}</span>
          </div>
          <div className="top-actions">
            <span className="free-label">
              <span />
              ずっと無料であそべる
            </span>
            <button
              className="currency"
              onClick={() => setModal("rest")}
              aria-label={`所持きらめき ${save.gems}、チャージする`}
            >
              <Diamond size={17} />
              <b>{save.gems.toLocaleString()}</b>
              <span>＋</span>
            </button>
            <button
              className="avatar"
              onClick={() => setModal("settings")}
              aria-label="設定を開く"
            >
              K
            </button>
          </div>
        </header>
        <main>
          {storageError && (
            <div className="storage-warning" role="alert">
              自動保存ができません。設定からセーブを書き出して進行を保管してください。
            </div>
          )}
          {page === "gacha" ? (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow">A LETTER JUST FOR YOU</div>
                  <h1>今日も、素敵な出会いを。</h1>
                  <p>まだ知らない誰かが、あなたを待っています。</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setModal("guide")}
                >
                  <Info size={15} />
                  あそびかた
                </button>
              </section>
              <section className="hero">
                <div className="hero-grain" />
                <span className="hero-orbit orbit-one" />
                <span className="hero-orbit orbit-two" />
                <div className="hero-copy">
                  <div className="hero-tag">
                    <span /> PICK UP LETTER <span className="tag-line" /> VOL.
                    01
                  </div>
                  <h2>
                    出会いは、
                    <br />
                    きらめきの先に<span>。</span>
                  </h2>
                  <p>
                    何気ない毎日に、運命みたいな瞬間を。
                    <br />
                    あなただけの物語が、ここからはじまる。
                  </p>
                  <div className="hero-chips">
                    <span>✦ SSR 出現率 3%</span>
                    <span>星宮ひかり PICK UP</span>
                  </div>
                  <button
                    className="hero-link"
                    onClick={() => setDetail(CHARACTERS[0])}
                  >
                    彼女のことをもっと知る <ArrowUpRight size={16} />
                  </button>
                </div>
                <div
                  className="hero-art"
                  aria-label="ピックアップキャラクター 星宮ひかりと月城怜"
                >
                  <span className="art-star star-one">✦</span>
                  <span className="art-star star-two">✧</span>
                  <span className="art-star star-three">✦</span>
                  <div className="hero-card back-card">
                    <div className="card-pattern" />
                    <span className="card-top">SPECIAL LETTER</span>
                    <Portrait character={CHARACTERS[1]} />
                    <div className="hero-card-name">
                      <span>SSR</span>
                      <strong>月城 怜</strong>
                      <small>REI TSUKISHIRO</small>
                    </div>
                  </div>
                  <div className="hero-card front-card">
                    <div className="card-pattern" />
                    <span className="card-top">A MOMENT TO SHINE</span>
                    <Portrait character={CHARACTERS[0]} />
                    <div className="hero-card-name">
                      <span>
                        SSR <Star size={11} fill="currentColor" />
                      </span>
                      <strong>星宮 ひかり</strong>
                      <small>HIKARI HOSHIMIYA</small>
                    </div>
                    <div className="pickup-ribbon">PICK UP</div>
                  </div>
                  <div className="hero-sticker">
                    いつかじゃなくて、
                    <br />
                    <b>今日、出会いたい。</b>
                    <Heart size={13} />
                  </div>
                </div>
                <div className="hero-foot">
                  <span>✧ &nbsp; 20人それぞれの、とっておきの個性。</span>
                  <span>VOL. 01 · ALWAYS OPEN</span>
                </div>
              </section>
              <section className="pull-panel">
                <div className="pull-info">
                  <div className="small-title">
                    <Mail size={18} />
                    きらめきレター
                  </div>
                  <p>
                    {save.firstTen ? (
                      <>
                        <span className="coral">初回10連は SSR 1人確定！</span>
                        <br />
                        あなたの最初の出会いに、とびきりの輝きを。
                      </>
                    ) : (
                      <>
                        10連は <strong>SR以上1人確定</strong>
                        <br />
                        重なった出会いは、親密度と60きらめきに。
                      </>
                    )}
                  </p>
                  <button
                    className="rates-link"
                    onClick={() => setModal("rates")}
                  >
                    提供割合・ガチャのルール <ChevronRight size={12} />
                  </button>
                </div>
                <div className="pull-actions">
                  <div className="pity-text">
                    <span>
                      SSR確定まで <b>あと {50 - save.pity} 回</b>
                    </span>
                    <span>{save.pity} / 50</span>
                  </div>
                  <div className="pity-track">
                    <span style={{ width: `${save.pity * 2}%` }} />
                  </div>
                  <div className="pull-buttons">
                    <button className="single-pull" onClick={() => pull(1)}>
                      <span>1回ひく</span>
                      <small>
                        <Diamond size={13} />
                        300
                      </small>
                    </button>
                    <button className="ten-pull" onClick={() => pull(10)}>
                      <span>
                        <Sparkles size={19} />
                        10回ひく
                        <ArrowUpRight size={18} />
                      </span>
                      <small>
                        <Diamond size={13} />
                        2,700 <span className="discount">300 おトク</span>
                      </small>
                    </button>
                  </div>
                </div>
              </section>
              <section className="discovery">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">MEET YOUR NEXT FAVORITE</span>
                    <h2>どんな彼女に、出会える？</h2>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setPage("collection")}
                  >
                    すべてのキャラクター <ArrowUpRight size={15} />
                  </button>
                </div>
                <div className="preview-grid">
                  {[
                    CHARACTERS[0],
                    CHARACTERS[1],
                    CHARACTERS[4],
                    CHARACTERS[5],
                  ].map((c) => (
                    <button
                      className="preview-card"
                      key={c.id}
                      onClick={() => setDetail(c)}
                    >
                      <div
                        className="preview-art"
                        style={{ background: `${c.color}35` }}
                      >
                        <Portrait character={c} />
                        <span className={`rarity ${c.rarity}`}>{c.rarity}</span>
                      </div>
                      <div className="preview-text">
                        <strong>{c.name}</strong>
                        <span>
                          {c.job} <i>·</i> {c.trait}
                        </span>
                      </div>
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </div>
              </section>
              <section className="bottom-note">
                <span>
                  <Heart size={14} /> 出会いはいつでも、この場所で。
                </span>
                <button onClick={() => setModal("rest")}>
                  <Coffee size={14} />
                  きらめきが足りなくなったら <ChevronRight size={13} />
                </button>
              </section>
            </>
          ) : (
            <>
              <section className="page-heading">
                <div>
                  <div className="eyebrow">YOUR LITTLE UNIVERSE</div>
                  <h1>
                    わたしのコレクション
                    <span className="heading-count">
                      {owned}
                      <small> / 20</small>
                    </span>
                  </h1>
                  <p>出会いを重ねて、少しずつ近づいて。</p>
                </div>
                <button
                  className="text-button"
                  onClick={() => setPage("gacha")}
                >
                  <Sparkles size={15} />
                  新しい出会いへ
                </button>
              </section>
              <div className="collection-progress">
                <div>
                  <Sparkles size={23} />
                  <span>
                    出会いのアルバム
                    <b>
                      {owned === 20
                        ? "コンプリート！ 20人の物語があなたのもとへ。"
                        : `あと ${20 - owned} 人の物語が、あなたを待っています。`}
                    </b>
                  </span>
                </div>
                <div className="album-progress">
                  <span>{Math.round((owned / 20) * 100)}%</span>
                  <div>
                    <i style={{ width: `${owned * 5}%` }} />
                  </div>
                </div>
              </div>
              <div className="collection-toolbar">
                <div className="filter-tabs">
                  {["ALL", "SSR", "SR", "R"].map((r) => (
                    <button
                      key={r}
                      className={rarity === r ? "selected" : ""}
                      onClick={() => setRarity(r)}
                    >
                      {r === "ALL" ? "すべて" : r}
                    </button>
                  ))}
                </div>
                <label className="search">
                  <Search size={16} />
                  <input
                    aria-label="キャラクターを検索"
                    placeholder="名前・個性でさがす"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              </div>
              <div className="collection-options">
                <label>
                  <input
                    type="checkbox"
                    checked={onlyOwned}
                    onChange={(e) => setOnlyOwned(e.target.checked)}
                  />
                  出会った彼女だけ
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={onlyFav}
                    onChange={(e) => setOnlyFav(e.target.checked)}
                  />
                  <Heart size={13} />
                  お気に入り
                </label>
                <select
                  aria-label="並び順"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="default">レアリティ順</option>
                  <option value="affection">親密度順</option>
                  <option value="name">名前順</option>
                </select>
              </div>
              <div className="collection-grid">
                {filtered.map((c) => {
                  const entry = save.collection[c.id];
                  return (
                    <button
                      className={`collection-card ${entry ? "owned" : "unowned"} ${entry?.holo ? "holo" : ""}`}
                      key={c.id}
                      onClick={() => setDetail(c)}
                    >
                      <div
                        className="collection-art"
                        style={{ background: `${c.color}40` }}
                      >
                        <Portrait character={c} />
                        <span className={`rarity ${c.rarity}`}>{c.rarity}</span>
                        {entry?.holo && (
                          <span className="holo-tag">✧ HOLOGRAM</span>
                        )}
                        {save.favorites.includes(c.id) && (
                          <Heart
                            className="favorite-marker"
                            size={17}
                            fill="currentColor"
                          />
                        )}
                        {!entry && (
                          <span className="not-met">まだ見ぬ出会い</span>
                        )}
                      </div>
                      <div className="collection-card-info">
                        <small>
                          {c.job} · {c.trait}
                        </small>
                        <strong>{c.name}</strong>
                        <div className="card-affection">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Heart
                              key={i}
                              size={11}
                              fill={
                                entry && i <= affection(entry.count)
                                  ? "currentColor"
                                  : "none"
                              }
                              className={
                                entry && i <= affection(entry.count)
                                  ? "filled"
                                  : ""
                              }
                            />
                          ))}
                          <span>{entry ? `×${entry.count}` : "未入手"}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {!filtered.length && (
                <div className="empty-state">
                  <Search size={32} />
                  <h3>まだ、見つかりませんでした。</h3>
                  <p>検索や絞り込みを変えてみてください。</p>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setQuery("");
                      setRarity("ALL");
                      setOnlyOwned(false);
                      setOnlyFav(false);
                    }}
                  >
                    すべて表示
                  </button>
                </div>
              )}
            </>
          )}
          <footer>
            <span className="footer-brand">✧ KIRAMEKI POST</span>
            <span>あなたの日常に、ひとさじのきらめきを。</span>
            <span>ORIGINAL CHARACTERS · v1.0</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
      {detail && (
        <Dialog title="CHARACTER LETTER" onClose={() => setDetail(null)} wide>
          <div className="detail-layout">
            <div
              className={`detail-art ${save.collection[detail.id]?.holo ? "holo" : ""}`}
              style={{ background: `${detail.color}45` }}
            >
              <Portrait character={detail} />
              <span className={`rarity ${detail.rarity}`}>{detail.rarity}</span>
              {save.collection[detail.id]?.holo && (
                <span className="holo-tag">✧ HOLOGRAM EDITION</span>
              )}
            </div>
            <div className="detail-info">
              <div className="eyebrow">{detail.en}</div>
              <h2>{detail.name}</h2>
              <div className="detail-tags">
                <span>{detail.job}</span>
                <span>{detail.trait}</span>
                <span>{detail.age}歳</span>
              </div>
              <blockquote>「{detail.quote}」</blockquote>
              <p>{detail.bio}</p>
              {save.collection[detail.id] ? (
                <>
                  <div className="affection-panel">
                    <span>
                      親密度 {affection(save.collection[detail.id].count)}{" "}
                      <small>出会い ×{save.collection[detail.id].count}</small>
                    </span>
                    <div>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Heart
                          size={20}
                          key={i}
                          fill={
                            i <= affection(save.collection[detail.id].count)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      ))}
                    </div>
                    <p>
                      {affection(save.collection[detail.id].count) >= 3
                        ? `「${detail.closeQuote}」`
                        : "出会いを重ねると、彼女との距離が近づきます。"}
                    </p>
                  </div>
                  <button
                    className={`secondary-button favorite-button ${save.favorites.includes(detail.id) ? "is-favorite" : ""}`}
                    onClick={() => favorite(detail.id)}
                  >
                    <Heart
                      size={16}
                      fill={
                        save.favorites.includes(detail.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                    {save.favorites.includes(detail.id)
                      ? "お気に入りに登録済み"
                      : "お気に入りにする"}
                  </button>
                </>
              ) : (
                <div className="unowned-note">
                  <Mail size={18} />
                  この物語は、まだ届いていません。
                  <button
                    onClick={() => {
                      setDetail(null);
                      setPage("gacha");
                    }}
                  >
                    ガチャで出会いをさがす <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </Dialog>
      )}
      {modal && (
        <Dialog
          title={
            modal === "rates"
              ? "提供割合とガチャのルール"
              : modal === "gift"
                ? "今日の贈りもの"
                : modal === "rest"
                  ? "ひとやすみ、しませんか。"
                  : modal === "guide"
                    ? "きらめきポストへ、ようこそ。"
                    : "設定・セーブ"
          }
          onClose={() => {
            setModal(null);
            setResetConfirm(false);
          }}
        >
          {modal === "rates" && (
            <div className="rates-content">
              <p>きらめきレター / 常設ピックアップ VOL.01</p>
              <div className="rate-rows">
                {Object.entries(RARITIES).map(([r, v]) => (
                  <div key={r}>
                    <span className={`rarity ${r}`}>{r}</span>
                    <span>{v.label}</span>
                    <b>{v.rate}%</b>
                  </div>
                ))}
              </div>
              <ul>
                <li>
                  SSR内の50%が星宮ひかり（通常時1.5%）。他のSSRは各0.5%、SRは各約2.833%、Rは各8%。
                </li>
                <li>
                  10連はSR以上1人確定。9人目まで全員Rの場合、最後の1人はSSR
                  3%・SR 97%。
                </li>
                <li>
                  初めての10連はSSR1人確定。9人目までSSRが出なければ、最後の1人がSSRになります。
                </li>
                <li>
                  SSRが49回連続で出なかった場合、次の1回はSSR確定。SSR入手でカウントは0に戻ります。単発・10連共通です。
                </li>
                <li>
                  確定時もSSR内の割合は同じ。初回確定・天井・10連保証はこの順に優先し、追加のキャラクターは付与されません。
                </li>
                <li>
                  同じキャラクターとの再会は、親密度アップ＋60きらめき。2・3・5・10回の出会いで親密度が上がります。
                </li>
                <li>
                  各キャラクターには独立した4%の確率でホログラム加工が付きます。入手後は図鑑のカードも輝きます。
                </li>
              </ul>
              <p className="muted">
                ゲーム内通貨は無料で補充できます。課金要素はありません。
              </p>
            </div>
          )}
          {modal === "gift" && (
            <div className="reward-content">
              <div className="reward-icon">
                <Gift size={42} />
              </div>
              <div className="eyebrow">A SMALL GIFT FOR TODAY</div>
              <h2>今日も会いに来てくれて、ありがとう。</h2>
              <p>毎日の小さな贈りものを、新しい出会いに。</p>
              <div className="reward-value">
                <Diamond size={23} />
                1,500<small>きらめき</small>
              </div>
              <button
                className="primary-button"
                disabled={save.daily === localDate()}
                onClick={daily}
              >
                {save.daily === localDate() ? (
                  <>
                    <Check size={17} />
                    受け取り済み · また明日
                  </>
                ) : (
                  "今日の贈りものを受け取る"
                )}
              </button>
              <small className="muted">
                端末の時刻で毎日0時に更新されます。
              </small>
            </div>
          )}
          {modal === "rest" && (
            <div className="reward-content">
              <div className="reward-icon">
                <Coffee size={42} />
              </div>
              <div className="eyebrow">TAKE A LITTLE BREAK</div>
              <h2>次の出会いの、その前に。</h2>
              <p>
                お茶を飲むくらいの気軽さで、きらめきを補充。
                <br />
                何度でも無料。30秒ごとに受け取れます。
              </p>
              <div className="reward-value">
                <Diamond size={23} />
                3,000<small>きらめき</small>
              </div>
              <button
                className="primary-button"
                disabled={restSeconds > 0}
                onClick={rest}
              >
                {restSeconds > 0
                  ? `次のチャージまで ${restSeconds} 秒`
                  : "ひとやすみして受け取る"}
              </button>
            </div>
          )}
          {modal === "guide" && (
            <div className="guide-content">
              <p>
                ここは、素敵な出会いを届ける小さな郵便局。
                <br />
                あなた宛ての手紙を、そっと開いてみてください。
              </p>
              {[
                [
                  "01",
                  "手紙をひらく",
                  "きらめきを使ってガチャへ。封筒の輝きはレアな出会いの予感。タップで一人ずつ、スキップですぐに全員を確認できます。",
                ],
                [
                  "02",
                  "彼女のことを知る",
                  "20人全員に、仕事や性格、好きなものがあります。コレクションからプロフィールをのぞいて、お気に入りを見つけて。",
                ],
                [
                  "03",
                  "もう一度、会いたくなる",
                  "再会で親密度がアップ。親密度3から特別なひとことも。ときどき届くホログラムの手紙も、お楽しみに。",
                ],
              ].map(([n, t, p]) => (
                <div className="guide-step" key={n}>
                  <span>{n}</span>
                  <div>
                    <h3>{t}</h3>
                    <p>{p}</p>
                  </div>
                </div>
              ))}
              <p className="muted">
                進行はこのブラウザに自動保存。設定からデータの書き出し・読み込みもできます。登場人物は全員20歳以上のオリジナルキャラクターです。
              </p>
              <button className="primary-button" onClick={() => setModal(null)}>
                最初の出会いへ <ArrowUpRight size={16} />
              </button>
            </div>
          )}
          {modal === "settings" && (
            <div className="settings-content">
              <div className="setting-row">
                <span>
                  演出のサウンド<small>やさしいチャイムで出会いを演出</small>
                </span>
                <button
                  className={`toggle ${save.sound ? "on" : ""}`}
                  role="switch"
                  aria-checked={save.sound}
                  aria-label="サウンド"
                  onClick={() => update((s) => ({ ...s, sound: !s.sound }))}
                >
                  <i />
                </button>
              </div>
              <div className="save-status">
                <Check size={17} />
                {storageError
                  ? "自動保存できません"
                  : "このブラウザに自動保存しています"}
                <small>
                  出会い {save.total} 回 · コレクション {owned} / 20
                </small>
              </div>
              <button
                className="secondary-button full-width"
                onClick={exportSave}
              >
                <Download size={16} />
                セーブデータを書き出す
              </button>
              <label className="secondary-button full-width import-button">
                セーブデータを読み込む
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={importSave}
                />
              </label>
              <p className="muted">
                読み込みは現在の進行を置き換えます。先に書き出してバックアップできます。別のブラウザへも引き継げます。
              </p>
              <div className="reset-area">
                {resetConfirm ? (
                  <>
                    <p>
                      すべての出会いときらめきを初期状態に戻します。よろしいですか？
                    </p>
                    <button
                      className="danger-button"
                      onClick={() => {
                        update(freshSave());
                        setResetConfirm(false);
                        setModal(null);
                        setToast("新しい物語をはじめました");
                      }}
                    >
                      データを削除してはじめから
                    </button>
                    <button
                      className="text-button"
                      onClick={() => setResetConfirm(false)}
                    >
                      キャンセル
                    </button>
                  </>
                ) : (
                  <button
                    className="text-button"
                    onClick={() => setResetConfirm(true)}
                  >
                    <RotateCcw size={14} />
                    はじめから遊ぶ
                  </button>
                )}
              </div>
            </div>
          )}
        </Dialog>
      )}
      {session && (
        <div
          className={`gacha-overlay ${session.some((r) => r.character.rarity === "SSR") ? "gold-session" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="ガチャ結果"
          ref={gachaRef}
          tabIndex={-1}
          onKeyDown={trapFocus}
        >
          <div className="gacha-sky">
            {Array.from({ length: 24 }, (_, i) => (
              <i
                key={i}
                style={{
                  "--i": i,
                  left: `${(i * 37) % 100}%`,
                  top: `${(i * 23) % 100}%`,
                }}
              >
                ✦
              </i>
            ))}
          </div>
          {stage !== "summary" && (
            <button
              className="skip-button"
              disabled={stage === "opening"}
              onClick={() => setStage("summary")}
            >
              演出をスキップ <ChevronRight size={16} />
            </button>
          )}
          {(stage === "letter" || stage === "opening") && (
            <div
              className={`letter-scene ${stage === "opening" ? "opening" : ""}`}
            >
              <div className="eyebrow">SOMEONE SPECIAL IS WAITING</div>
              <h2>あなた宛てに、手紙が届きました。</h2>
              <button
                className="envelope"
                onClick={openLetter}
                disabled={stage === "opening"}
                aria-label="手紙を開く"
              >
                <span className="envelope-visual">
                  <div className="letter-glow" />
                  <div className="envelope-paper">
                    <Sparkles size={45} />
                  </div>
                  <div className="envelope-body" />
                  <div className="envelope-flap" />
                  <div className="wax-seal">
                    <Sparkles size={27} />
                  </div>
                </span>
              </button>
              <p>
                {stage === "opening"
                  ? "きらめきが、あふれだす。"
                  : "タップして、出会いをひらく"}
              </p>
              <small>
                {session.length === 10
                  ? "10 LETTERS FOR YOU"
                  : "A LETTER FOR YOU"}
              </small>
            </div>
          )}
          {stage === "reveal" &&
            (() => {
              const r = session[revealed - 1],
                c = r.character;
              return (
                <div className={`reveal-scene ${c.rarity}`} key={revealed}>
                  <div className="reveal-label">
                    {r.isNew
                      ? "はじめまして。新しい出会いです。"
                      : "おかえりなさい。うれしい再会です。"}
                  </div>
                  <div
                    className={`reveal-card ${r.holo ? "holo" : ""}`}
                    style={{ "--character-color": c.color }}
                  >
                    <div className="reveal-card-bg" />
                    <Portrait character={c} />
                    <span className={`rarity ${c.rarity}`}>{c.rarity}</span>
                    {r.isNew && <span className="new-tag">NEW</span>}
                    {r.holo && <span className="holo-tag">✧ HOLOGRAM</span>}
                    <div className="reveal-name">
                      <span>
                        {c.job} · {c.trait}
                      </span>
                      <h2>{c.name}</h2>
                      <small>{c.en}</small>
                    </div>
                  </div>
                  <p className="reveal-quote">「{c.quote}」</p>
                  <button className="reveal-next" onClick={nextReveal}>
                    {revealed === session.length
                      ? "出会いを振り返る"
                      : "次の手紙をひらく"}
                    <ChevronRight size={17} />
                    <small>
                      {revealed} / {session.length}
                    </small>
                  </button>
                  {r.duplicate && (
                    <div className="duplicate-reward">
                      <Heart size={13} />
                      親密度アップ ＆ 60きらめき
                    </div>
                  )}
                </div>
              );
            })()}
          {stage === "summary" && (
            <div className="summary-scene">
              <span className="eyebrow">LETTERS THAT FOUND YOU</span>
              <h2>この出会いが、特別になりますように。</h2>
              <p>
                NEW {session.filter((r) => r.isNew).length} 人 <span>·</span>{" "}
                再会ボーナス {session.filter((r) => r.duplicate).length * 60}{" "}
                きらめき
              </p>
              <div
                className={`results-grid ${session.length === 1 ? "single-result" : ""}`}
              >
                {session.map((r, i) => (
                  <button
                    className={`result-card ${r.character.rarity} ${r.holo ? "holo" : ""}`}
                    key={i}
                    onClick={() => {
                      closeSession();
                      setDetail(r.character);
                    }}
                    style={{ "--character-color": r.character.color }}
                  >
                    <Portrait character={r.character} />
                    <span className={`rarity ${r.character.rarity}`}>
                      {r.character.rarity}
                    </span>
                    {r.isNew && <span className="new-tag">NEW</span>}
                    {r.holo && <span className="result-holo">✧</span>}
                    <div>
                      <strong>{r.character.name}</strong>
                      <small>{r.isNew ? "新しい出会い" : "+60 きらめき"}</small>
                    </div>
                  </button>
                ))}
              </div>
              <div className="summary-actions">
                <button className="summary-close" onClick={closeSession}>
                  <ArrowLeft size={16} />
                  ガチャに戻る
                </button>
                <button
                  className="primary-button"
                  onClick={() => {
                    closeSession();
                    setPage("collection");
                  }}
                >
                  <Grid2X2 size={16} />
                  コレクションを見る
                </button>
              </div>
              <small className="summary-saved">
                <Check size={12} />
                {storageError
                  ? "保存できません。設定から書き出してください。"
                  : "出会いは自動で保存されました"}
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function trapFocus(e) {
  if (e.key !== "Tab") return;
  const nodes = e.currentTarget.querySelectorAll(
    'button:not(:disabled),a[href],input,select,[tabindex="0"]',
  );
  const first = nodes[0],
    last = nodes[nodes.length - 1];
  if (
    e.shiftKey &&
    (document.activeElement === first ||
      document.activeElement === e.currentTarget)
  ) {
    e.preventDefault();
    last?.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first?.focus();
  }
}
function Dialog({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.body.style.overflow = old;
      previous?.focus?.();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={`dialog ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        tabIndex={-1}
        onKeyDown={trapFocus}
      >
        <div className="dialog-header">
          <span>{title}</span>
          <button className="icon-button" onClick={onClose} aria-label="閉じる">
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
