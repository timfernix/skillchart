const TITLE            = "League Skill Chart";
const PAGE_WALLPAPER   = "assets/wallpaper.avif";
const EXPORT_WALLPAPER = "assets/wallpaper.avif";

const CREDIT_URL  = "timfernix.github.io/skillchart";
const CREDIT_TEXT = `Create your own on ${CREDIT_URL}`;

const CANVAS_W = 1920;
const CANVAS_H = 1080;

const ROW_W_RATIO        = 0.78;   // column's width used by each row 
const ROW_ICON_PAD       = 12;     // right padding inside row for icon
const ROW_ICON_SCALE_H   = 1.10;   // rank icon vs row height
const GAP_SCALE          = 0.90;   // row gaps
const HEADER_TITLE_SCALE = 0.030;
const HEADER_NAME_SCALE  = 0.016;
const TOP_BLOCK_H_FRAC   = 0.17;   // header block height
const FOOTER_RESERVE_H   = 0.07;   // height reserved for footer
const CONTENT_W_RATIO    = 0.86;   // portion of the card width (both combined)

/* ----- Data ----- */
const LANES = [
  { key:"top",     name:"Toplane" },
  { key:"jungle",  name:"Jungle" },
  { key:"Middle",  name:"Midlane" },
  { key:"bottom",  name:"Botlane" },
  { key:"support", name:"Support" },
  { key:"every",   name:"Fill/All" },
];

const CLASSES = [
  { key:"controller", name:"Controller" },
  { key:"fighter",    name:"Fighter" },
  { key:"mage",       name:"Mage" },
  { key:"marksman",   name:"Marksman" },
  { key:"slayer",     name:"Slayer" },
  { key:"tank",       name:"Tank" },
  { key:"specialist", name:"Specialist" },
];

const CLASS_TIPS = {
  controller: { d:"Controllers are defensive casters that oversee the battlefield by protecting and opening up opportunities for their allies. Controllers fall into one of the following subclasses: Catcher & Enchanter", href:"https://wiki.leagueoflegends.com/en-us/Controller", champs:[{id:"bard",name:"Bard"},{id:"rakan",name:"Rakan"},{id:"soraka",name:"Soraka"}]},
  fighter:    { d:"Fighters are durable and damage-focused melee champions that look to be in the thick of combat. Fighters fall into one of the following subclasses: Juggernaut & Diver", href:"https://wiki.leagueoflegends.com/en-us/Fighter", champs:[{id:"aatrox",name:"Aatrox"},{id:"irelia",name:"Irelia"},{id:"elise",name:"Elise"}]},
  mage:       { d:"Mages are offensive casters that seek to cripple and burn down the opposition through their potent spells. Mages fall into one of the following subclasses: Artillery, Battlemage (aka Warlock) & Burst", href:"https://wiki.leagueoflegends.com/en-us/Mage", champs:[{id:"hwei",name:"Hwei"},{id:"syndra",name:"Syndra"},{id:"viktor",name:"Viktor"}]},
  marksman:   { d:"Marksmen (formerly Carries) excel at dealing reliable sustained damage at range while constantly skirting the edge of danger. Marksmen are very fragile and are extremely reliant on powerful item purchases to become true damage threats.", href:"https://wiki.leagueoflegends.com/en-us/Marksman", champs:[{id:"caitlyn",name:"Caitlyn"},{id:"jinx",name:"Jinx"},{id:"ezreal",name:"Ezreal"}]},
  slayer:     { d:"Slayers (formerly Assassins) are fragile but agile damage-focused melee champions that look to swiftly take down their targets. Slayers fall into one of the following subclasses: Assassin & Skirmisher (aka Duelist)", href:"https://wiki.leagueoflegends.com/en-us/Slayer", champs:[{id:"zed",name:"Zed"},{id:"katarina",name:"Katarina"},{id:"akali",name:"Akali"}]},
  tank:       { d:"Tanks excel in shrugging off incoming damage and focus on disrupting their enemies more than being significant damage threats themselves. Tanks fall into one of the following subclasses: Vanguard & Wardens", href:"https://wiki.leagueoflegends.com/en-us/Tank", champs:[{id:"poppy",name:"Poppy"},{id:"sion",name:"Sion"},{id:"ornn",name:"Ornn"}]},
  specialist: { d:"Specialists are champions that do not fit into the neat little boxes of the other classes, and represent Riot's ideal of having a champion roster with a lot of distinctiveness and diversity.", href:"https://wiki.leagueoflegends.com/en-us/Specialist", champs:[{id:"azir",name:"Azir"},{id:"teemo",name:"Teemo"},{id:"singed",name:"Singed"}]},
};

function buildClassTipHTML(key, name){
  const t = CLASS_TIPS[key] || {};
  const desc = t.d || "Class description coming soon.";
  const href = t.href || "https://leagueoflegends.fandom.com/wiki/Champion_classes";
  let html = `<strong>${name}</strong><br>${desc} <a href="${href}" target="_blank" rel="noopener">Learn more ↗</a>`;
  if (t.champs && t.champs.length){
    html += `<div class="champs">` +
      t.champs.map(c => `
        <figure class="champ">
          <img src="assets/champs/${c.id}.png" alt="${c.name}" loading="lazy" decoding="async"
               onerror="this.closest('.champ').style.display='none'"/>
          <figcaption>${c.name}</figcaption>
        </figure>
      `).join("") + `</div>`;
  }
  return html;
}

const RANKS = ["iron","bronze","silver","gold","platinum","emerald","diamond","master","grandmaster","challenger"];
const SRC = {
  rank: (k)=>`assets/ranks/${k}.png`,
  lane: (k)=>`assets/lanes/${k}.png`,
  cls:  (k)=>`assets/classes/${k}.png`,
};

const els = {
  lanesGrid: document.getElementById("lanesGrid"),
  classesGrid: document.getElementById("classesGrid"),
  nameInput: document.getElementById("nameInput"),
  exportBtn: document.getElementById("exportBtn"),
  copyBtn: document.getElementById("copyBtn"),
  randomizeBtn: document.getElementById("randomizeBtn"),
  resetBtn: document.getElementById("resetBtn"),
  canvas: document.getElementById("exportCanvas"),
  wallpaperDiv: document.querySelector(".wallpaper"),
};
els.wallpaperDiv.style.backgroundImage = `url("${PAGE_WALLPAPER}")`;

const state = {
  lanesRanks: Object.fromEntries(LANES.map(l=>[l.key,"gold"])),
  classRanks: Object.fromEntries(CLASSES.map(c=>[c.key,"gold"])),
  displayName: "",
};

function createGrid(container, items, groupKey){
  container.innerHTML = "";
  for(const it of items){
    const row = document.createElement("div"); row.className = "role-row";

    const label = document.createElement("div"); label.className = "role-label";
    const icon = document.createElement("img"); icon.alt = `${it.name} icon`;
    icon.src = groupKey==="lanes" ? SRC.lane(it.key) : SRC.cls(it.key);
    const name = document.createElement("span"); name.textContent = it.name;

    if(groupKey === "classes"){
      label.classList.add("has-tip");
      const infoBtn = Object.assign(document.createElement("button"), {className:"info-btn", type:"button"});
      infoBtn.textContent = "i"; infoBtn.setAttribute("aria-label", `What is ${it.name}?`);
      const tip = document.createElement("div"); tip.className = "tip";
      tip.innerHTML = buildClassTipHTML(it.key, it.name);
      infoBtn.addEventListener("click", (e)=>{ e.stopPropagation(); label.classList.toggle("tip-open"); });
      label.append(icon, name, infoBtn, tip);
    } else {
      label.append(icon, name);
    }

    const selectWrap = document.createElement("div"); selectWrap.className = "role-select";
    const select = document.createElement("select");
    for(const r of RANKS){
      const o = document.createElement("option"); o.value = r; o.textContent = r[0].toUpperCase()+r.slice(1);
      const current = groupKey==="lanes" ? state.lanesRanks[it.key] : state.classRanks[it.key];
      if(current===r) o.selected = true; select.appendChild(o);
    }
    select.addEventListener("change", ()=>{
      if(groupKey==="lanes") state.lanesRanks[it.key] = select.value;
      else state.classRanks[it.key] = select.value;
      rankImg.src = SRC.rank(select.value);
    });
    selectWrap.appendChild(select);

    const preview = document.createElement("div"); preview.className = "rank-preview";
    const rankImg = document.createElement("img");
    rankImg.alt = `${it.name} rank`;
    rankImg.src = SRC.rank(groupKey==="lanes" ? state.lanesRanks[it.key] : state.classRanks[it.key]);
    preview.appendChild(rankImg);

    row.append(label, selectWrap, preview);
    container.appendChild(row);
  }
}
createGrid(els.lanesGrid, LANES, "lanes");
createGrid(els.classesGrid, CLASSES, "classes");

document.addEventListener("click", () => {
  document.querySelectorAll(".has-tip.tip-open").forEach(el => el.classList.remove("tip-open"));
});
els.nameInput.addEventListener("input", ()=>{ state.displayName = els.nameInput.value.trim(); });

els.randomizeBtn.addEventListener("click", ()=>{
  for(const l of LANES)   state.lanesRanks[l.key]   = RANKS[(Math.random()*RANKS.length)|0];
  for(const c of CLASSES) state.classRanks[c.key]   = RANKS[(Math.random()*RANKS.length)|0];
  createGrid(els.lanesGrid, LANES, "lanes"); createGrid(els.classesGrid, CLASSES, "classes");
});
els.resetBtn.addEventListener("click", ()=>{
  for(const l of LANES) state.lanesRanks[l.key] = "gold";
  for(const c of CLASSES) state.classRanks[c.key] = "gold";
  state.displayName = ""; els.nameInput.value = "";
  createGrid(els.lanesGrid, LANES, "lanes"); createGrid(els.classesGrid, CLASSES, "classes");
});

els.exportBtn.addEventListener("click", ()=>exportPNG({copy:false}));
els.copyBtn.addEventListener("click", ()=>exportPNG({copy:true}));

async function exportPNG({copy=false}={}){
  const canvas = els.canvas; canvas.width=CANVAS_W; canvas.height=CANVAS_H;
  const ctx = canvas.getContext("2d");

  const bg = await loadImage(EXPORT_WALLPAPER).catch(()=>null);
  drawCover(ctx, bg, 0,0,CANVAS_W,CANVAS_H);

  let g = ctx.createLinearGradient(0,0,0,CANVAS_H);
  g.addColorStop(0,"rgba(0,0,0,.42)");
  g.addColorStop(1,"rgba(0,0,0,.68)");
  ctx.fillStyle = g; ctx.fillRect(0,0,CANVAS_W,CANVAS_H);

  const margin = Math.round(CANVAS_W*0.045);
  const card = {x:margin, y:margin, w:CANVAS_W-2*margin, h:CANVAS_H-2*margin, r:32};
  glassBox(ctx, card.x, card.y, card.w, card.h, card.r, {
    fill:"rgba(8,12,24,.80)", border:"rgba(212,175,55,.55)", inner:true, glow:true
  });

  await document.fonts.ready;

  const padX   = Math.round(CANVAS_W*0.028);
  const titleX = card.x + padX;

  ctx.save();
  ctx.textAlign = "left";
  ctx.fillStyle = "#f2e7c4";
  ctx.shadowColor = "rgba(0,0,0,.55)";
  ctx.shadowBlur = 12;
  ctx.font = `700 ${Math.round(CANVAS_W*HEADER_TITLE_SCALE)}px Cinzel, serif`;
  let yTitle = card.y + Math.round(CANVAS_H*0.09);
  ctx.fillText(TITLE, titleX, yTitle);
  ctx.restore();

  let yAfterTitle = yTitle + Math.round(CANVAS_H*0.038);
  if(state.displayName){
    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.font = `800 ${Math.round(CANVAS_W*HEADER_NAME_SCALE)}px Cinzel, serif`;
    ctx.fillText(state.displayName, titleX, yAfterTitle);
    yAfterTitle += Math.round(CANVAS_H*0.016);
  }
  goldRule(ctx, titleX, yAfterTitle, card.x + card.w - padX, 2);

  // Centered two-column layout
  const topPad        = Math.round(CANVAS_H*TOP_BLOCK_H_FRAC);
  const gutter        = Math.round(CANVAS_W*0.025);
  const contentY      = card.y + topPad;
  const footerReserve = Math.round(CANVAS_H*FOOTER_RESERVE_H);
  const contentH      = card.h - (contentY - card.y) - footerReserve;

  const contentW = Math.round(card.w * CONTENT_W_RATIO);
  const startX   = card.x + Math.round((card.w - contentW) / 2);
  const colW     = Math.floor((contentW - gutter) / 2);

  await drawColumn(ctx, {
    x: startX, y: contentY, w: colW, h: contentH, title: "LANES",
    items: LANES.map(l=>({label:l.name, leftIcon: SRC.lane(l.key), rankKey: state.lanesRanks[l.key]}))
  });
  await drawColumn(ctx, {
    x: startX + colW + gutter, y: contentY, w: colW, h: contentH, title: "CLASSES",
    items: CLASSES.map(c=>({label:c.name, leftIcon: SRC.cls(c.key), rankKey: state.classRanks[c.key]}))
  });

  ctx.fillStyle = "rgba(255, 255, 255, 0.34)";
  ctx.font = `600 ${Math.round(CANVAS_W*0.012)}px Cinzel, serif`;
  ctx.textAlign = "center";
  ctx.fillText(CREDIT_TEXT, card.x + card.w/2, card.y + card.h - Math.round(CANVAS_H*0.018));

  const blob = await new Promise(res=>canvas.toBlob(res,"image/png",0.95));
  if(!blob){ console.log("I don’t know why: canvas.toBlob returned null."); return; }
  if(copy && navigator.clipboard && window.ClipboardItem){
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    flash("Copied PNG to clipboard."); return;
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {href:url, download:"skillchart.png"});
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

async function drawColumn(ctx, {x,y,w,h,title,items}){
  const innerW = Math.round(w * ROW_W_RATIO);
  const rowX   = x + Math.round((w - innerW) / 2);

  const headingH = Math.round(innerW * 0.10);
  ctx.fillStyle = "rgba(212,175,55,.92)";
  ctx.font = `700 ${Math.round(headingH*0.48)}px Cinzel, serif`;
  ctx.textAlign = "center";
  ctx.fillText(title, rowX + innerW/2, y + Math.round(headingH*0.82));

  const baseGap = Math.max(8, Math.round(innerW*0.016));
  const gap     = Math.round(baseGap * GAP_SCALE);
  const rowsH   = h - headingH - gap;
  const rowH    = Math.floor((rowsH - gap*(items.length-1)) / items.length);
  let cy        = y + headingH + gap;

  for(const r of items){
    glassBox(ctx, rowX, cy, innerW, rowH, 18, {
      fill:"rgba(0,0,0,.30)", border:"rgba(255,255,255,.10)", inner:true
    });

    const iconImg = await loadImage(r.leftIcon).catch(()=>null);
    const size = Math.round(rowH*0.50);
    const ix = rowX + 16;
    const iy = cy + Math.round((rowH-size)/2) - 2;
    if(iconImg) ctx.drawImage(iconImg, ix, iy, size, size);

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,.96)";
    ctx.font = `800 ${Math.round(rowH*0.36)}px Inter, system-ui`;
    ctx.fillText(r.label, ix + size + 14, cy + Math.round(rowH*0.66));

    const rankImg = await loadImage(SRC.rank(r.rankKey)).catch(()=>null);
    const rSize = Math.min(Math.round(rowH*ROW_ICON_SCALE_H), Math.round(innerW*0.42));
    const rx = rowX + innerW - rSize - ROW_ICON_PAD;
    const ry = cy + Math.round((rowH - rSize)/2);
    if(rankImg) ctx.drawImage(rankImg, rx, ry, rSize, rSize);

    cy += rowH + gap;
  }
}

function glassBox(ctx, x, y, w, h, r, opts={}){
  const { fill="rgba(255,255,255,.04)", border="rgba(255,255,255,.08)", inner=false, glow=false } = opts;
  const g = ctx.createLinearGradient(0, y, 0, y+h);
  g.addColorStop(0, withAlpha(fill, 0.90));
  g.addColorStop(1, withAlpha(fill, 0.84));
  ctx.save();
  if(glow){ ctx.shadowColor="rgba(0,0,0,.45)"; ctx.shadowBlur=20; ctx.shadowOffsetY=8; }
  pathRounded(ctx, x,y,w,h,r); ctx.fillStyle = g; ctx.fill(); ctx.restore();
  ctx.save(); ctx.lineWidth = 1.5; ctx.strokeStyle = border; pathRounded(ctx,x,y,w,h,r); ctx.stroke(); ctx.restore();
  if(inner){
    ctx.save();
    const inset = 1;
    const hi = ctx.createLinearGradient(0,y,0,y+Math.min(24,h));
    hi.addColorStop(0,"rgba(255,255,255,.12)"); hi.addColorStop(1,"rgba(255,255,255,0)");
    pathRounded(ctx, x+inset, y+inset, w-2*inset, Math.min(28,h-2*inset), r-2);
    ctx.clip(); ctx.fillStyle = hi; ctx.fillRect(x+inset, y+inset, w-2*inset, Math.min(28,h-2*inset));
    ctx.restore();
    ctx.save();
    const sh = ctx.createLinearGradient(0,y+h-28,0,y+h);
    sh.addColorStop(0,"rgba(0,0,0,0)"); sh.addColorStop(1,"rgba(0,0,0,.25)");
    pathRounded(ctx, x+inset, y+h-28, w-2*inset, 28, r-2);
    ctx.clip(); ctx.fillStyle = sh; ctx.fillRect(x+inset, y+h-28, w-2*inset, 28);
    ctx.restore();
  }
}
function withAlpha(color, a){
  const s = String(color).trim().toLowerCase().replace(/\s+/g,'');
  const m = s.match(/^rgba?\((\d{1,3}),(\d{1,3}),(\d{1,3})(?:,([\d.]+))?\)$/i);
  if(m){ const r=+m[1], g=+m[2], b=+m[3]; return `rgba(${r},${g},${b},${a})`; }
  const h = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if(h){ let hex=h[1]; if(hex.length===3) hex=hex.split('').map(c=>c+c).join('');
    const r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`; }
  return color;
}
function goldRule(ctx, x1, y, x2, thickness=2){
  const grd = ctx.createLinearGradient(x1,y,x2,y);
  grd.addColorStop(0,"rgba(212,175,55,0)");
  grd.addColorStop(0.2,"rgba(212,175,55,.55)");
  grd.addColorStop(0.8,"rgba(212,175,55,.55)");
  grd.addColorStop(1,"rgba(212,175,55,0)");
  ctx.save(); ctx.strokeStyle = grd; ctx.lineWidth = thickness;
  ctx.beginPath(); ctx.moveTo(x1,y); ctx.lineTo(x2,y); ctx.stroke(); ctx.restore();
}
function roundRect(ctx,x,y,w,h,r,fill){ ctx.save(); pathRounded(ctx,x,y,w,h,r); ctx.fillStyle=fill; ctx.fill(); ctx.restore(); }
function roundedStroke(ctx,x,y,w,h,r){ ctx.save(); pathRounded(ctx,x,y,w,h,r); ctx.strokeStyle="rgba(212,175,55,.55)"; ctx.lineWidth=2; ctx.stroke(); ctx.restore(); }
function pathRounded(ctx,x,y,w,h,r){ const rr=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr); ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath(); }
function drawCover(ctx,img,x,y,w,h){ if(!img){ ctx.fillStyle="#0b1020"; ctx.fillRect(x,y,w,h); return; } const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height; const s=Math.max(w/iw,h/ih); const dw=iw*s, dh=ih*s; const dx=x+(w-dw)/2, dy=y+(h-dh)/2; ctx.drawImage(img,dx,dy,dw,dh); }
function loadImage(src){ return new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src; }); }
function flash(msg){ if(!msg) return; const n=document.createElement("div"); n.textContent=msg; n.style.cssText="position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:rgba(14,18,34,.9);color:#fff;padding:10px 14px;border:1px solid rgba(255,255,255,.08);border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.4);z-index:9999"; document.body.appendChild(n); setTimeout(()=>n.remove(),1800); }
